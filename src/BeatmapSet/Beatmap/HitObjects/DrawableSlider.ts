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

// @ts-ignore
import vertex from "./Shaders/sliderShader.vert?raw";
// @ts-ignore
import fragment from "./Shaders/sliderShader.frag?raw";

import { darken, lighten } from "../../../utils";
import calculateSliderProgress from "./CalculateSliderProgress";
import createGeometry from "./CreateSliderGeometry";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";
import type DrawableHitCircle from "./DrawableHitCircle";
import DrawableSliderTick from "./DrawableSliderTick";
import DrawableSliderRepeat from "./DrawableSliderRepeat";
import DrawableSliderTail from "./DrawableSliderTail";
import DrawableSliderBall from "./DrawableSliderBall";
import DrawableSliderHead from "./DrawableSliderHead";

const GL = { vertex, fragment };
// const COLOR: [number, number, number, number] = [
// 	0.21176470588, 0.52156862745, 0.72549019607, 0,
// ];
const COLOR: [number, number, number, number] = [
	17 / 255,
	17 / 255,
	27 / 255,
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
	private ball: DrawableSliderBall;

	container = new Container();

	constructor(public object: Slider) {
		super(object);

		this.drawableCircles.push(
			...object.nestedHitObjects
				.filter((object) => object instanceof StandardHitObject)
				.map((object) => {
					if (object instanceof SliderTick)
						return new DrawableSliderTick(object).hook(this.context);

					if (object instanceof SliderRepeat)
						return new DrawableSliderRepeat(object).hook(this.context);

					if (object instanceof SliderTail)
						return new DrawableSliderTail(object).hook(this.context);

					if (object instanceof SliderHead)
						return new DrawableSliderHead(object).hook(this.context);

					return null;
				})
				.filter((object) => object !== null),
		);

		this.body.state.depthTest = true;
		this.body.x = object.startPosition.x + object.stackedOffset.x;
		this.body.y = object.startPosition.y + object.stackedOffset.x;

		this.ball = new DrawableSliderBall(this.object);

		this.container.visible = false;
		this.container.addChild(
			this.body,
			...this.drawableCircles.toReversed().map((circle) => circle.container),
			this.ball.container,
		);
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

	updateGeometry(progressHead = 0, progressTail = 1) {
		const path = calculateSliderProgress(
			this.object.path,
			progressHead,
			progressTail,
		);
		const { aPosition, indexBuffer } = createGeometry(
			path,
			this.object.radius * 0.8,
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
		this.updateGeometry(start, end);

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
