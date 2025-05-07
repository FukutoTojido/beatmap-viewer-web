import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type SliderTick,
} from "osu-standard-stable";
import { Graphics } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "../../../Context";
import type { HitSample as Sample } from "osu-classes";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";

export default class DrawableSliderTick extends DrawableHitObject {
	container = new Graphics();
	hitSound?: HitSample;

	constructor(
		public object: SliderTick,
		sample: Sample,
	) {
		super(object);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.circle(0, 0, 2).stroke({
			alignment: 0.5,
			color: 0xcdd6f4,
			width: 2,
		});

		const clonedSample = sample.clone()
		clonedSample.hitSound = "slidertick";
		this.hitSound = new HitSample([clonedSample]).hook(this.context);
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime &&
				this.object.startTime < time
			)
		)
			return;

		const currentSamplePoint = beatmap.data.controlPoints.samplePointAt(
			Math.round(this.object.startTime),
		);
		this.hitSound?.play(currentSamplePoint);
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - this.object.timePreempt,
			end: this.object.startTime + 800,
		};
	}

	update(time: number) {
		this.playHitSound(time);
		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeOutDuration = 200;

		this.container.x = this.object.startX + this.object.stackedOffset.x;
		this.container.y = this.object.startY + this.object.stackedOffset.y;

		if (
			time < startFadeInTime ||
			time > this.object.startTime + fadeOutDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;
		this.container.scale.set(1);

		if (time < this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.object.timeFadeIn),
			);
			this.container.alpha = opacity;

			return;
		}

		if (time >= this.object.startTime) {
			const opacity =
				1 -
				Math.min(
					1,
					Math.max(0, (time - this.object.startTime) / fadeOutDuration),
				);
			const scale = Math.min(
				2,
				1 + Math.max(0, (time - this.object.startTime) / fadeOutDuration),
			);

			this.container.alpha = opacity;
			this.container.scale.set(scale);

			return;
		}
	}
}
