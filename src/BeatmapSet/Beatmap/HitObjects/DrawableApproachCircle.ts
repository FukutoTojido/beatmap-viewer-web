import type { Circle } from "osu-standard-stable";
import { Graphics } from "pixi.js";

export default class DrawableApproachCircle {
	container = new Graphics();

	constructor(private object: Circle) {
		this.container.visible = false;
		this.container.x = object.startX + object.stackedOffset.x;
		this.container.y = object.startY + object.stackedOffset.y;
		this.container.circle(0, 0, object.radius * 0.8 * (236 / 256)).stroke({
			alignment: 0,
			color: 0xcdd6f4,
			width: 2,
		});
	}

	update(time: number) {
		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeInDuration = Math.min(this.object.timeFadeIn * 2, this.object.timePreempt)
        const fadeOutDuration = 50;

		if (
			time < startFadeInTime ||
			time >= this.object.startTime + fadeOutDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

        if (time < this.object.startTime) {
            const opacity = Math.min(1, Math.max(0, (time - startFadeInTime) / fadeInDuration));
            const scale = Math.min(1, Math.max(0, (time - startFadeInTime) / this.object.timePreempt)) * 3;
            
            this.container.alpha = opacity;
            this.container.scale.set(4 - scale);
            return;
        }

        if (time >= this.object.startTime) {
            const opacity = Math.min(1, Math.max(0, (time - this.object.startTime) / fadeOutDuration));

            this.container.alpha = 1 - opacity;
            this.container.scale.set(1);
            return;
        }
	}
}
