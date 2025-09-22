import { HitSample as Sample, Vector2 } from "osu-classes";
import {
	type Slider,
	SliderHead,
	SliderRepeat,
	SliderTail,
	SliderTick,
	StandardHitObject,
} from "osu-standard-stable";
import {
	AlphaFilter,
	Container,
	Geometry,
	Graphics,
	Mesh,
	RenderLayer,
	Shader,
} from "pixi.js";
import { BackdropBlurFilter } from "pixi-filters";
import type SkinningConfig from "@/Config/SkinningConfig";
import { type Context, inject } from "@/Context";
import {
	refreshSprite as argonRefreshSprite,
	update as argonUpdate,
} from "@/Skinning/Argon/ArgonSlider";
import {
	refreshSprite as legacyRefreshSprite,
	update as legacyUpdate,
} from "@/Skinning/Legacy/LegacySlider";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import HitSample from "../../../Audio/HitSample";
import { closestPointTo, darken, lighten } from "../../../utils";
import type Beatmap from "..";
import TimelineSlider from "../Timeline/TimelineSlider";
import calculateSliderProgress from "./CalculateSliderProgress";
import createGeometry from "./CreateSliderGeometry";
import DrawableHitCircle from "./DrawableHitCircle";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";
import DrawableSliderBall from "./DrawableSliderBall";
import DrawableSliderFollowCircle from "./DrawableSliderFollowCircle";
import DrawableSliderHead from "./DrawableSliderHead";
import DrawableSliderRepeat from "./DrawableSliderRepeat";
import DrawableSliderTail, { TAIL_LENIENCY } from "./DrawableSliderTail";
import DrawableSliderTick from "./DrawableSliderTick";
import fragment from "./Shaders/sliderShader.frag?raw";
import vertex from "./Shaders/sliderShader.vert?raw";

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
	public _selectShader = Shader.from({
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
				bodyAlpha: { value: 0.0, type: "f32" },
			},
		},
	});
	_alphaFilter = new AlphaFilter();
	private _backdropBlurFilter = new BackdropBlurFilter({
		strength: 20,
		quality: 10,
	});

	private drawableCircles: DrawableHitObject[] = [];
	public body: Mesh<Geometry, Shader> = new Mesh({
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

	public select = new Container();

	public _baseGeometry: Geometry = new Geometry({
		attributes: {
			aPosition: new Float32Array([]),
		},
		indexBuffer: [],
	});
	public selectBody: Mesh<Geometry, Shader> = new Mesh({
		geometry: this._baseGeometry,
		shader: this._selectShader,
		filters: [new AlphaFilter({ alpha: 1 })],
		x: 0,
		y: 0,
		blendMode: "none",
	});

	path: Vector2[] = [];

	ball: DrawableSliderBall;
	followCircle: DrawableSliderFollowCircle;

	nodes: Graphics = new Graphics({ visible: false });

	private sliderWhistleSample: HitSample;
	private sliderSlideSample: HitSample;

	container = new Container();

	timelineObject: TimelineSlider;

	private layer = new RenderLayer();
	private layer2 = new RenderLayer();
	private layer3 = new RenderLayer();

	wrapper = new Container();

	constructor(object: Slider) {
		super(object);
		this.object = object;
		this.context.provide<DrawableSlider>("drawable", this);

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
							// biome-ignore lint/style/noNonNullAssertion: Always Available
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
		this.selectBody.state.depthTest = true;

		this.context.provide("slider", this);

		this.ball = new DrawableSliderBall(this.object).hook(this.context);
		this.followCircle = new DrawableSliderFollowCircle(this.object).hook(
			this.context,
		);

		this.wrapper.addChild(
			this.body,
			...this.drawableCircles
				.slice(1)
				.toReversed()
				.map((circle) => circle.container),
			this.followCircle.container,
			this.layer,
			this.ball.container,
			this.drawableCircles[0].container,
			this.layer2,
		);

		// this.container.visible = false;
		this.container.addChild(this.wrapper, this.nodes);
		this.select.addChild(this.selectBody);

		for (const drawable of this.drawableCircles.toReversed()) {
			const d = drawable as DrawableHitCircle;

			if (d instanceof DrawableSliderRepeat) {
				this.layer.attach(d.reverseArrow);
			}

			if (d instanceof DrawableSliderHead && d.defaults) {
				this.layer2.attach(d.defaults.container);
			}

			if (d.select) this.select.addChild(d.select);
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

	private _isHover = false;
	get isHover() {
		return this._isHover;
	}
	set isHover(val: boolean) {
		this._isHover = val;
		this.nodes.visible = val || this.isSelected;
	}

	private _isSelected = false;
	get isSelected() {
		return this._isSelected;
	}
	set isSelected(val: boolean) {
		this._isSelected = val;
		this.select.visible = val;
		this.nodes.visible = val;
		for (const circle of this.drawableCircles) {
			if (
				circle instanceof DrawableSliderHead ||
				circle instanceof DrawableSliderTail ||
				circle instanceof DrawableSliderRepeat
			)
				circle.select.visible = val;
		}
	}

	private _object!: Slider;
	get object() {
		return this._object;
	}

	set object(val: Slider) {
		this._object = val;

		this.nodes.clear();
		for (let i = 0; i < val.path.controlPoints.length; i++) {
			const point = val.path.controlPoints[i];
			if (i === 0) {
				this.nodes.lineTo(point.position.x, point.position.y);
			} else {
				this.nodes
					.lineTo(point.position.x, point.position.y)
					.stroke({ width: 1, alignment: 0.5, color: 0xefefef });
			}
		}

		for (let i = 0; i < val.path.controlPoints.length; i++) {
			const point = val.path.controlPoints[i];

			this.nodes
				.circle(point.position.x, point.position.y, 2)
				.fill(i === 0 || point.type === null ? 0xefefef : 0xff0000);
		}

		this.body.x = val.startPosition.x + val.stackedOffset.x;
		this.body.y = val.startPosition.y + val.stackedOffset.x;
		this.selectBody.x = val.startPosition.x + val.stackedOffset.x;
		this.selectBody.y = val.startPosition.y + val.stackedOffset.x;

		this.nodes.x = val.startPosition.x + val.stackedOffset.x;
		this.nodes.y = val.startPosition.y + val.stackedOffset.x;

		const nodes = val.nestedHitObjects.filter(
			(object) => object instanceof StandardHitObject,
		);

		let idx = -1;
		for (let i = 0; i < this.drawableCircles.length; i++) {
			const circle = this.drawableCircles[i];
			circle.object = val;

			if (circle instanceof DrawableSliderTick) {
				circle.updateObjects(
					nodes[i] as SliderTick,
					val,
					// biome-ignore lint/style/noNonNullAssertion: Always Available
					val.samples.find((sample) => sample.hitSound === "Normal")!,
				);
				continue;
			}

			idx++;
			if (circle instanceof DrawableSliderHead) {
				circle.updateObjects?.(nodes[i], val, val.nodeSamples[idx]);
			}
		}
		if (this.ball) this.ball.object = val;
		if (this.followCircle) this.followCircle.object = val;
		if (this.timelineObject) this.timelineObject.object = val;

		const path = calculateSliderProgress(this.object.path, 0, 1);
		if (!path.length) return;

		const { aPosition, indexBuffer } = createGeometry(
			path,
			val.radius *
				(236 / 256) *
				(inject<SkinManager>("skinManager")?.getCurrentSkin()?.config.General
					.Argon
					? 0.95
					: 1),
		);
		this._baseGeometry.attributes.aPosition.buffer.data = new Float32Array(
			aPosition,
		);
		this._baseGeometry.indexBuffer.data = new Uint32Array(indexBuffer);
	}

	checkCollide(x: number, y: number) {
		const radius = 54.4 * this.object.scale;
		const point = new Vector2(x, y);
		const objectPosition = new Vector2(
			this.object.startX + this.object.stackedOffset.x,
			this.object.startY + this.object.stackedOffset.y,
		);

		let min = Infinity;
		for (let i = 0; i < this.path.length - 1; i++) {
			const start = this.path[i].add(objectPosition);
			const end = this.path[i + 1].add(objectPosition);

			const closestPoint = closestPointTo(point, start, end);
			const dist = closestPoint.distance(point);

			if (dist < min) min = dist;
		}

		return min < radius;
	}

	hook(context: Context) {
		super.hook(context);

		for (const object of this.drawableCircles.filter(
			(object) =>
				object instanceof DrawableSliderHead ||
				object instanceof DrawableSliderTail ||
				object instanceof DrawableSliderRepeat ||
				object instanceof DrawableSliderTick,
		)) {
			object.refreshSprite();
		}
		this.ball.refreshSprite();
		this.followCircle.refreshSprite();
		this.refreshSprite();
		this.timelineObject.updateVelocity();

		return this;
	}

	trackColor: number[] = [0, 0, 0];
	borderColor: number[] = [0, 0, 0];
	color = "0,0,0";

	updateFn = legacyUpdate;

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		if (skin.config.General.Argon) {
			argonRefreshSprite(this);
			this.updateFn = argonUpdate;
		} else {
			legacyRefreshSprite(this);
			this.updateFn = legacyUpdate;
		}
	}

	getColor(skin: Skin) {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (
			beatmap?.data?.colors.comboColors.length &&
			!inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
		) {
			const colors = beatmap.data.colors.comboColors;
			const comboIndex = this.object.comboIndexWithOffsets % colors.length;

			return `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
		}

		const comboIndex = this.object.comboIndexWithOffsets % skin.colorsLength;
		// biome-ignore lint/suspicious/noExplicitAny: It is complicated
		const color = (skin.config.Colours as any)[
			`Combo${comboIndex + 1}`
		] as string;
		return `rgb(${color})`;
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
			const offset =
				object instanceof DrawableSliderTail &&
				!(object instanceof DrawableSliderRepeat)
					? TAIL_LENIENCY
					: 0;
			object.playHitSound(time, offset);
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
		let head = progressHead;
		let tail = progressTail;

		if (progressHead === progressTail) {
			const checkDistance = 0.1 / this.object.path.distance;
			head = Math.min(1 - checkDistance, progressHead);
			tail = Math.min(1, progressHead + checkDistance);
		}

		const path = calculateSliderProgress(this.object.path, head, tail);
		this.path = path;

		if (!path.length) return;

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
		for (const circle of this.drawableCircles) {
			const offset =
				circle instanceof DrawableSliderTail &&
				!(circle instanceof DrawableSliderRepeat)
					? TAIL_LENIENCY
					: 0;
			circle.update(time - offset);
		}

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
