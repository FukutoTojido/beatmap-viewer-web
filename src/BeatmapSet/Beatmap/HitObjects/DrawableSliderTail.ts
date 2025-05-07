import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type SliderTail,
} from "osu-standard-stable";
import type { HitSample as Sample } from "osu-classes";
import { Graphics } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "../../../Context";
import type Beatmap from "..";
import HitSample from "../../../Audio/HitSample";

const TAIL_LENIENCY = 36;
export default class DrawableSliderTail extends DrawableHitObject {
	container = new Graphics();
	hitSound?: HitSample;

	constructor(public object: SliderTail, samples: Sample[]) {
		super(object);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container
			.circle(0, 0, object.radius * 0.8 * (236 / 256))
			.fill(0x585b70)
			.stroke({
				alignment: 0.5,
				color: 0xcdd6f4,
				width: object.radius * 0.8 * (236 / 256) * 0.128,
			});
		this.hitSound = new HitSample(samples).hook(this.context);
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime + TAIL_LENIENCY - this.object.timePreempt,
			end: this.object.startTime + TAIL_LENIENCY + 800,
		};
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime + TAIL_LENIENCY &&
				this.object.startTime + TAIL_LENIENCY < time
			)
		)
			return;

		const currentSamplePoint = beatmap.data.controlPoints.samplePointAt(Math.round(this.object.startTime + TAIL_LENIENCY));
		this.hitSound?.play(currentSamplePoint);
	}

	update(time: number) {
		this.playHitSound(time);

		const startFadeInTime = this.object.startTime + TAIL_LENIENCY - this.object.timePreempt;
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

		if (time < this.object.startTime + TAIL_LENIENCY) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.object.timeFadeIn),
			);
			this.container.alpha = opacity * 0.5;

			return;
		}

		if (time >= this.object.startTime + TAIL_LENIENCY) {
			const opacity =
				1 -
				Math.min(
					1,
					Math.max(0, (time - this.object.startTime - TAIL_LENIENCY) / fadeOutDuration),
				);
			const scale = Math.min(
				2,
				1 + Math.max(0, (time - this.object.startTime - TAIL_LENIENCY) / fadeOutDuration),
			);

			this.container.alpha = opacity * 0.5;
			this.container.scale.set(scale);

			return;
		}
	}
}
