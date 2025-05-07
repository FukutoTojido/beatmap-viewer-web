import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
} from "osu-standard-stable";
import { Graphics } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "../../../Context";
import type Beatmap from "..";
import HitSample from "../../../Audio/HitSample";

export default class DrawableSliderTail extends DrawableHitObject {
	container = new Graphics();
	hitSound?: HitSample;

	constructor(public object: StandardHitObject) {
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
		this.hitSound = new HitSample().hook(this.context);
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - this.object.timePreempt,
			end: this.object.startTime + 800,
		};
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

		this.hitSound?.play();
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
			this.container.alpha = opacity * 0.5;

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

			this.container.alpha = opacity * 0.5;
			this.container.scale.set(scale);

			return;
		}
	}
}
