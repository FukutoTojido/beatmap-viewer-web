import {
	SliderHead,
	SliderRepeat,
	SliderTail,
	SliderTick,
	StandardHitObject,
	type Slider,
} from "osu-standard-stable";
import {
	AlphaFilter,
	Mesh,
	Geometry,
	Shader,
	Container,
	RenderLayer,
} from "pixi.js";
import { BackdropBlurFilter } from "pixi-filters";

import vertex from "./Shaders/sliderShader.vert?raw";
import fragment from "./Shaders/sliderShader.frag?raw";

import { darken, lighten } from "../../../utils";
import calculateSliderProgress from "./CalculateSliderProgress";
import createGeometry, { type Vector3 } from "./CreateSliderGeometry";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";
import type DrawableHitCircle from "./DrawableHitCircle";
import DrawableSliderTick from "./DrawableSliderTick";
import DrawableSliderRepeat from "./DrawableSliderRepeat";
import DrawableSliderTail from "./DrawableSliderTail";
import DrawableSliderBall from "./DrawableSliderBall";
import DrawableSliderHead from "./DrawableSliderHead";
import DrawableSliderFollowCircle from "./DrawableSliderFollowCircle";
import { HitSample as Sample } from "osu-classes";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import { inject, type Context } from "@/Context";
import TimelineSlider from "../Timeline/TimelineSlider";
import {
	refreshSprite as argonRefreshSprite,
	update as argonUpdate,
} from "@/Skinning/Argon/ArgonSlider";
import {
	refreshSprite as legacyRefreshSprite,
	update as legacyUpdate,
} from "@/Skinning/Legacy/LegacySlider";
import type SkinningConfig from "@/Config/SkinningConfig";

// import init, { calculate_slider_geometry, vector2 } from "../../../../lib/calculate_slider_geometry";
// await init();

const GL = { vertex, fragment };
// const COLOR: [number, number, number, number] = [
// 	0.21176470588, 0.52156862745, 0.72549019607, 0,
// ];
const COLOR: [number, number, number, number] = [
	69 / 255,
	71 / 255,
	90 / 255,
	0,
];

const blur = new URLSearchParams(window.location.search).get("blur");

export default class DrawableSlider
	extends DrawableHitObject
	implements IHasApproachCircle
{
	private _geometry: Geometry = new Geometry({
		attributes: {
			aPosition: new Float32Array([]),
		},
		indexBuffer: [],
	});
	public _shader = Shader.from({
		gl: GL,
		resources: {
			customUniforms: {
				borderColor: {
					value: [205 / 255, 214 / 255, 244 / 255, 1.0],
					type: "vec4<f32>",
				},
				innerColor: { value: lighten(COLOR, 0.5), type: "vec4<f32>" },
				// innerColor: { value: darken(COLOR, 0.1), type: "vec4<f32>" },
				outerColor: { value: darken(COLOR, 0.1), type: "vec4<f32>" },
				borderWidth: { value: 0.128, type: "f32" },
				bodyAlpha: { value: 0.7, type: "f32" },
			},
		},
	});
	_alphaFilter = new AlphaFilter();
	private _backdropBlurFilter = new BackdropBlurFilter({
		strength: 20,
		quality: 10,
	});

	private drawableCircles: DrawableHitObject[] = [];
	private body: Mesh<Geometry, Shader> = new Mesh({
		geometry: this._geometry,
		shader: this._shader,
		filters: [
			this._alphaFilter,
			// this._backdropBlurFilter
		],
		x: 0,
		y: 0,
		blendMode: "none",
	});

	ball: DrawableSliderBall;
	followCircle: DrawableSliderFollowCircle;

	private sliderWhistleSample: HitSample;
	private sliderSlideSample: HitSample;

	container = new Container();

	timelineObject: TimelineSlider;

	private layer = new RenderLayer();

	constructor(public object: Slider) {
		super(object);

		if (blur) {
			this.body.filters = [this._alphaFilter, this._backdropBlurFilter];
		}

		let idx = -1;
		this.drawableCircles.push(
			...object.nestedHitObjects
				.filter((object) => object instanceof StandardHitObject)
				.map((object) => {
					if (object instanceof SliderTick)
						return new DrawableSliderTick(
							object,
							this.object,
							// biome-ignore lint/style/noNonNullAssertion: <explanation>
							this.object.samples.find(
								(sample) => sample.hitSound === "Normal",
							)!,
						).hook(this.context);

					idx++;

					if (object instanceof SliderRepeat)
						return new DrawableSliderRepeat(
							object,
							this.object,
							this.object.nodeSamples[idx],
						).hook(this.context);

					if (object instanceof SliderTail)
						return new DrawableSliderTail(
							object,
							this.object,
							this.object.nodeSamples[idx],
						).hook(this.context);

					if (object instanceof SliderHead)
						return new DrawableSliderHead(
							object,
							this.object,
							this.object.nodeSamples[idx],
						).hook(this.context);

					return null;
				})
				.filter((object) => object !== null),
		);

		this.body.state.depthTest = true;
		this.body.x = object.startPosition.x + object.stackedOffset.x;
		this.body.y = object.startPosition.y + object.stackedOffset.x;

		this.ball = new DrawableSliderBall(this.object);
		this.followCircle = new DrawableSliderFollowCircle(this.object);

		// this.container.visible = false;
		this.container.addChild(
			this.body,
			...this.drawableCircles.toReversed().map((circle) => circle.container),
			this.followCircle.container,
			this.ball.container,
			this.layer,
		);

		for (const drawable of this.drawableCircles.toReversed()) {
			const d = drawable as DrawableHitCircle;

			if (d instanceof DrawableSliderRepeat) {
				this.layer.attach(d.reverseArrow);
			}

			if (d instanceof DrawableSliderHead && d.defaults) {
				this.layer.attach(d.defaults.container);
			}
		}

		const whistleSample = new Sample();
		whistleSample.hitSound = "sliderwhistle";
		this.sliderWhistleSample = new HitSample([whistleSample]).hook(
			this.context,
		);

		const slideSample = new Sample();
		slideSample.hitSound = "sliderslide";
		this.sliderSlideSample = new HitSample([slideSample]).hook(this.context);

		this.refreshSprite();
		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);

		this._shader.resources.customUniforms.uniforms.scale =
			(object.radius / 54.4) * (236 / 256);

		this.timelineObject = new TimelineSlider(object).hook(this.context);
	}

	hook(context: Context) {
		super.hook(context);

		for (const object of this.drawableCircles.filter(
			(object) =>
				object instanceof DrawableSliderHead ||
				object instanceof DrawableSliderTail ||
				object instanceof DrawableSliderRepeat,
		)) {
			object.refreshSprite();
		}
		this.refreshSprite();
		this.timelineObject.updateVelocity();

		return this;
	}

	trackColor: number[] = [0, 0, 0];
	borderColor: number[] = [0, 0, 0];
	color = "0,0,0";

	updateFn = legacyUpdate;

	refreshSprite() {
		const skin =
			this.skinManager?.skins[
				inject<SkinningConfig>("config/skinning")?.skinningIdx ?? 0
			];
		if (!skin) return;

		if (skin.type === "ARGON") {
			argonRefreshSprite(this);
			this.updateFn = argonUpdate;
		} else {
			legacyRefreshSprite(this);
			this.updateFn = legacyUpdate;
		}
	}

	get approachCircle() {
		return (this.drawableCircles[0] as DrawableHitCircle).approachCircle;
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - this.object.timePreempt,
			end: this.object.endTime + 800,
		};
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;

		for (const object of this.drawableCircles) {
			object.playHitSound(time);
		}

		const currentSamplePoint = beatmap.getNearestSamplePoint(
			this.object.startTime,
		);

		if (this.object.hitSound !== 0) {
			this.sliderWhistleSample.playLoop(
				currentSamplePoint,
				time >= this.object.startTime && time <= this.object.endTime,
				this.object.endTime - time,
			);
		}

		this.sliderSlideSample.playLoop(
			currentSamplePoint,
			time >= this.object.startTime && time <= this.object.endTime,
			this.object.endTime - time,
		);
	}

	updateGeometry(progressHead = 0, progressTail = 0, scale = 1) {
		const path = calculateSliderProgress(
			this.object.path,
			progressHead,
			progressTail,
		);
		const { aPosition, indexBuffer } = createGeometry(
			path,
			this.object.radius * (236 / 256) * scale,
		);
		this._geometry.attributes.aPosition.buffer.data = new Float32Array(
			aPosition,
		);
		this._geometry.indexBuffer.data = new Uint32Array(indexBuffer);
	}

	spanAt(progress: number) {
		return Math.floor(progress * this.object.spans);
	}

	progressAt(progress: number) {
		const p = (progress * this.object.spans) % 1;
		if (this.spanAt(progress) % 2 === 1) return 1 - p;
		return p;
	}

	update(time: number) {
		this.ball.update(time);
		this.followCircle.update(time);
		for (const circle of this.drawableCircles) circle.update(time);

		this.updateFn(this, time);
	}

	destroy() {
		for (const object of this.drawableCircles) {
			object.destroy();
		}

		this.ball.destroy();
		this.followCircle.destroy();
		this.body.destroy();
		this.container.destroy();

		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
