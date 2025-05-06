import type { Slider } from "osu-standard-stable";
import { AlphaFilter, Mesh, Geometry, Shader } from "pixi.js";
import { BackdropBlurFilter } from "pixi-filters";

// @ts-ignore
import vertex from "./Shaders/sliderShader.vert?raw";
// @ts-ignore
import fragment from "./Shaders/sliderShader.frag?raw";

import { darken, lighten } from "/src/utils";
import calculateSliderProgress from "./CalculateSliderProgress";
import createGeometry from "./CreateSliderGeometry";
import DrawableHitObject from "./DrawableHitObject";

const GL = { vertex, fragment };
const COLOR: [number, number, number, number] = [
	0.21176470588, 0.52156862745, 0.72549019607, 0,
];

export default class DrawableSlider extends DrawableHitObject {
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
				borderColor: { value: [1.0, 1.0, 1.0, 1.0], type: "vec4<f32>" },
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

	container: Mesh<Geometry, Shader> = new Mesh({
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

	constructor(private slider: Slider) {
		super();
		this.container.state.depthTest = true;
		this.container.x = slider.startPosition.x;
		this.container.y = slider.startPosition.y;
		this.container.visible = false;
	}

	updateGeometry(progressHead = 0, progressTail = 1) {
		const path = calculateSliderProgress(
			this.slider.path,
			progressHead,
			progressTail,
		);
		const { aPosition, indexBuffer } = createGeometry(path, this.slider.radius * 0.8);

		this._geometry.attributes.aPosition.buffer.data = new Float32Array(
			aPosition,
		);
		this._geometry.indexBuffer.data = new Uint32Array(indexBuffer);
	}

	update(time: number) {
		const startFadeInTime = this.slider.startTime - this.slider.timePreempt;
		const fadeOutDuration = 200;

		if (
			time < startFadeInTime ||
			time > this.slider.endTime + fadeOutDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

		if (time < this.slider.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.slider.timeFadeIn),
			);

			this.updateGeometry(0, opacity);
			this._alphaFilter.alpha = opacity;
			return;
		}

		if (time >= this.slider.startTime && time < this.slider.endTime) {
			this._alphaFilter.alpha = 1;
			this.updateGeometry(
				Math.min(
					1,
					Math.max(0, (time - this.slider.startTime) / this.slider.duration),
				),
				1,
			);
			return;
		}

		if (time >= this.slider.endTime) {
			const opacity =
				1 -
				Math.min(
					1,
					Math.max(0, (time - this.slider.endTime) / fadeOutDuration),
				);
			this._alphaFilter.alpha = opacity;
			return;
		}
	}
}
