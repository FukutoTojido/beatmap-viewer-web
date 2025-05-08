import type { Vector2 } from "osu-classes";
import type { Slider, StandardHitObject } from "osu-standard-stable";
import { Container, Graphics } from "pixi.js";
import Easings from "/src/UI/Easings";

export default class DrawableFollowPoints {
	container: Container = new Container();
	sprites: Graphics[] = [];

	startTime: number;
	endTime: number;

	startPosition: Vector2;
	endPosition: Vector2;

	distance: number;
	timePreempt: number;

	get duration() {
		return this.endTime - this.startTime;
	}

	constructor(
		private startObject: StandardHitObject,
		private endObject: StandardHitObject,
	) {
		this.timePreempt = startObject.timePreempt;
		this.startTime =
			(this.startObject as unknown as Slider).endTime ??
			this.startObject.startTime;
		this.endTime = this.endObject.startTime;

		this.startPosition = this.startObject.endPosition.add(
			this.startObject.stackedOffset,
		);
		this.endPosition = this.endObject.startPosition.add(
			this.endObject.stackedOffset,
		);

		this.distance = this.endPosition.distance(this.startPosition);

		const vector = this.endPosition.subtract(this.startPosition).normalize();
		const angle = Math.atan2(vector.y, vector.x);

		this.container.x = this.startPosition.x;
		this.container.y = this.startPosition.y;
		this.container.rotation = angle;

		const numberOfSprites = Math.floor((this.distance - 48) / (512 / 16));
		for (let i = 0; i < numberOfSprites; i++) {
			const sprite = new Graphics().circle(0, 0, 5).fill(0xffffff);
			sprite.x = (1.5 + i) * (512 / 16);

			this.sprites.push(sprite);
		}

		this.container.addChild(...this.sprites);
	}

	update(time: number) {
		const timeFadeIn = this.startObject.timeFadeIn;
		const preempt = this.startObject.timePreempt;

		if (time < this.startTime - preempt) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

		for (const [idx, sprite] of Object.entries(this.sprites)) {
			const d = 32 * 1.5 + 32 * +idx;
			const f = d / this.distance;

			const fadeOutTime = this.startTime + f * this.duration;
			const fadeInTime = fadeOutTime - preempt;

			if (time < fadeInTime + timeFadeIn) {
				const opacity = Easings.OutQuad(
					Math.min(1, Math.max(0, (time - fadeInTime) / timeFadeIn)),
				);

				sprite.alpha = opacity;
				sprite.scale.set(1.5 - 0.5 * opacity);
				sprite.x = (f - 0.1 * (1 - opacity)) * this.distance;
				continue;
			}

			if (time >= fadeInTime + timeFadeIn && time < fadeOutTime) {
				sprite.alpha = 1;
				sprite.scale.set(1);
				sprite.x = f * this.distance;
				continue;
			}

			if (time > fadeOutTime) {
				const opacity =
					1 -
					Easings.OutQuad(
						Math.min(1, Math.max(0, (time - fadeOutTime) / timeFadeIn)),
					);
                sprite.alpha = opacity;
                sprite.scale.set(1);
				sprite.x = f * this.distance;
			}
		}
	}
}
