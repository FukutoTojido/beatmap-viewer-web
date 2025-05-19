import {
	SliderHead,
	SliderRepeat,
	SliderTail,
	SliderTick,
	StandardHitObject,
	type Slider,
} from "osu-standard-stable";
import { AlphaFilter, Mesh, Geometry, Shader, Container } from "pixi.js";
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
import type { Context } from "@/Context";

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
	private _shader = Shader.from({
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
			},
		},
	});
	private _alphaFilter = new AlphaFilter();
	private _backdropBlurFilter = new BackdropBlurFilter({
		strength: 10,
		quality: 7,
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

	constructor(public object: Slider) {
		super(object);

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

		this.container.visible = false;
		this.container.addChild(
			this.body,
			...this.drawableCircles.toReversed().map((circle) => circle.container),
			this.followCircle.container,
			this.ball.container,
		);

		const whistleSample = new Sample();
		whistleSample.hitSound = "sliderwhistle";
		this.sliderWhistleSample = new HitSample([whistleSample]).hook(
			this.context,
		);

		const slideSample = new Sample();
		slideSample.hitSound = "sliderslide";
		this.sliderSlideSample = new HitSample([slideSample]).hook(this.context);

		this.refreshSprite();
		this.skinManager?.addSkinChangeListener(() => this.refreshSprite());

		this._shader.resources.customUniforms.uniforms.scale =
			(object.radius / 54.4) * (236 / 256);
	}

	hook(context: Context) {
		super.hook(context);

		for (const object of this.drawableCircles.filter(
			(object) =>
				object instanceof DrawableSliderHead ||
				object instanceof DrawableSliderTail,
		)) {
			object.refreshSprite();
		}
		this.refreshSprite();

		return this;
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");

		const comboIndex =
			this.object.comboIndex %
			(beatmap?.data.colors.comboColors.length ?? skin.colorsLength);
		const colors = beatmap?.data.colors.comboColors;
		const comboColor = colors
			? `${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue}`
			: // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				((skin.config.Colours as any)[`Combo${comboIndex + 1}`] as string);

		const trackColor = beatmap?.data.colors.sliderTrackColor;
		const trackOverride = trackColor
			? `${trackColor.red},${trackColor.green},${trackColor.blue}`
			: skin.config.Colours.SliderTrackOverride;

		const color = (trackOverride ?? comboColor)
			.split(",")
			.map((value) => +value / 255);

		const border = beatmap?.data.colors.sliderBorderColor
			? Object.values(beatmap?.data.colors.sliderBorderColor)
					.map((val) => val / 255)
					.slice(0, 3)
			: null;
		const borderColor =
			border ??
			skin.config.Colours.SliderBorder.split(",").map((value) => +value / 255);

		this._shader.resources.customUniforms.uniforms.borderColor = borderColor;
		this._shader.resources.customUniforms.uniforms.innerColor = lighten(
			[color[0], color[1], color[2]],
			0.5,
		);
		this._shader.resources.customUniforms.uniforms.outerColor = darken(
			[color[0], color[1], color[2]],
			0.1,
		);
		// this._shader.resources.customUniforms.uniforms.innerColor = darken(
		// 	[color[0], color[1], color[2]],
		// 	0.1,
		// );
		// this._shader.resources.customUniforms.uniforms.outerColor = darken(
		// 	[color[0], color[1], color[2]],
		// 	0.1,
		// );
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

	updateGeometry(progressHead = 0, progressTail = 1) {
		const path = calculateSliderProgress(
			this.object.path,
			progressHead,
			progressTail,
		);
		const { aPosition, indexBuffer } = createGeometry(
			path,
			this.object.radius * (236 / 256),
		);
		this._geometry.attributes.aPosition.buffer.data = new Float32Array(
			aPosition,
		);
		this._geometry.indexBuffer.data = new Uint32Array(indexBuffer);
	}

	private spanAt(progress: number) {
		return Math.floor(progress * this.object.spans);
	}

	private progressAt(progress: number) {
		const p = (progress * this.object.spans) % 1;
		if (this.spanAt(progress) % 2 === 1) return 1 - p;
		return p;
	}

	update(time: number) {
		this.ball.update(time);
		this.followCircle.update(time);
		for (const circle of this.drawableCircles) circle.update(time);

		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeOutDuration = 200;

		if (
			time < startFadeInTime ||
			time > this.object.endTime + fadeOutDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

		const completionProgress = Math.min(
			1,
			Math.max(0, (time - this.object.startTime) / this.object.duration),
		);
		const span = this.spanAt(completionProgress);
		const spanProgress = this.progressAt(completionProgress);

		let start = 0;
		let end = Math.min(
			1,
			Math.max(
				0,
				(time - (this.object.startTime - this.object.timePreempt)) /
					(this.object.timePreempt / 3),
			),
		);

		if (span >= this.object.spans - 1) {
			if (Math.min(span, this.object.spans - 1) % 2 === 1) {
				start = 0;
				end = spanProgress;
			} else {
				start = spanProgress;
			}
		}

		(async () => this.updateGeometry(start, end))();

		// const position = this.object.path.curvePositionAt(
		// 	completionProgress,
		// 	this.object.spans,
		// );

		// this.circle.x = position.x + this.object.stackedOffset.x;
		// this.circle.y = position.y + this.object.stackedOffset.y;

		if (time < this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.object.timeFadeIn),
			);
			this._alphaFilter.alpha = opacity;
			return;
		}

		if (time >= this.object.startTime && time < this.object.endTime) {
			this._alphaFilter.alpha = 1;
			return;
		}

		if (time >= this.object.endTime) {
			const opacity =
				1 -
				Math.min(
					1,
					Math.max(0, (time - this.object.endTime) / fadeOutDuration),
				);
			this._alphaFilter.alpha = opacity;
			return;
		}
	}
}
