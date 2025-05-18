import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
} from "osu-standard-stable";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import { Graphics } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "../../../Context";
import type DrawableApproachCircle from "./DrawableApproachCircle";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";

export default class DrawableSliderRepeat extends DrawableHitObject {
	container = new Graphics();
	hitSound?: HitSample;

	constructor(
		public object: StandardHitObject,
		samples: Sample[],
	) {
		super(object);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.circle(0, 0, 10).fill(0xcdd6f4);
        this.container.interactive = false;
        this.container.interactiveChildren = false;
		
		this.hitSound = new HitSample(samples).hook(this.context);
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime &&
				this.object.startTime < time &&
				time - beatmap.previousTime < 30
			)
		)
			return;

			const currentSamplePoint = beatmap.getNearestSamplePoint(
				this.object.startTime,
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
