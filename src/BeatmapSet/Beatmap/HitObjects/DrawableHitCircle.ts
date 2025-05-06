import { StandardBeatmap, type Circle } from "osu-standard-stable";
import { Graphics } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "/src/Context";

export default class DrawableHitCircle extends DrawableHitObject {
	container = new Graphics();

	constructor(private hitCircle: Circle) {
		super();
		this.container.visible = false;
		this.container.x = hitCircle.startX;
		this.container.y = hitCircle.startY;
		this.container.circle(0, 0, hitCircle.radius * 0.8).fill(0x585b70).stroke({
			alignment: 0,
			color: 0xcdd6f4,
			width: 2,
		});
	}

	update(time: number) {
		const startFadeInTime =
			this.hitCircle.startTime - this.hitCircle.timePreempt;
		const fadeOutDuration = 200;

		this.container.x = this.hitCircle.startX + this.hitCircle.stackedOffset.x;
		this.container.y = this.hitCircle.startY + this.hitCircle.stackedOffset.y;

		if (
			time < startFadeInTime ||
			time > this.hitCircle.startTime + fadeOutDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;
		this.container.scale.set(1);

		if (time < this.hitCircle.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.hitCircle.timeFadeIn),
			);
			this.container.alpha = opacity;

			return;
		}

		if (time >= this.hitCircle.startTime) {
			const opacity =
				1 -
				Math.min(
					1,
					Math.max(0, (time - this.hitCircle.startTime) / fadeOutDuration),
				);
			const scale = Math.min(
				2,
				1 + Math.max(0, (time - this.hitCircle.startTime) / fadeOutDuration),
			);

			this.container.alpha = opacity;
			this.container.scale.set(scale);

			return;
		}
	}
}
