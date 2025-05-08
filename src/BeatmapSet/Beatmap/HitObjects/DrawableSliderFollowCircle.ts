import type { Slider } from "osu-standard-stable";
import { Graphics } from "pixi.js";
import Easings from "/src/UI/Easings";

export default class DrawableSliderFollowCircle {
	container = new Graphics();

	constructor(public object: Slider) {
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.circle(0, 0, object.radius * 2).stroke({
			alignment: 0.5,
			color: 0xf9e2af,
			width: 8,
		});
	}

	update(time: number) {
		const completionProgress = Math.min(
			1,
			Math.max(0, (time - this.object.startTime) / this.object.duration),
		);

		const position = this.object.path.curvePositionAt(
			completionProgress,
			this.object.spans,
		);

		this.container.x =
			this.object.startX + position.x + this.object.stackedOffset.x;
		this.container.y =
			this.object.startY + position.y + this.object.stackedOffset.y;

        const scaleInDuration = Math.min(180, this.object.duration);
        const fadeInDuration = Math.min(60, this.object.duration);
        const outDuration = 200;

		if (time < this.object.startTime || time > this.object.endTime + outDuration) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

        if (time >= this.object.startTime && time < this.object.startTime + scaleInDuration) {
            const opacity = Math.min(1, Math.max(0, (time - this.object.startTime) / fadeInDuration));
            const scale = Math.min(1, Math.max(0, (time - this.object.startTime) / scaleInDuration));

            this.container.scale.set(0.5 + 0.5 * (Easings.Out(scale)));
            this.container.alpha = opacity;

            return;
        }

        if (time >= this.object.startTime + scaleInDuration && time <= this.object.endTime) {
            this.container.scale.set(1);
            this.container.alpha = 1;

            return;
        }

        if (time > this.object.endTime) {
            const opacity = 1 - Math.min(1, Math.max(0, (time - this.object.endTime) / outDuration));
            const scale = Math.min(1, Math.max(0, (time - this.object.endTime) / outDuration));

            this.container.scale.set(1 - 0.2 * (Easings.Out(scale)));
            this.container.alpha = Easings.In(opacity);

            return;
        }
	}
}
