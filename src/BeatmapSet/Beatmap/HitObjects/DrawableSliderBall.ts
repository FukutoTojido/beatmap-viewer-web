import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type Slider,
} from "osu-standard-stable";
import { Assets, Graphics, Sprite, type Texture } from "pixi.js";

const texture = await Assets.load<Texture>({
	src: "/skinning/sliderb0@2x.png",
	loadParser: "loadTextures"
});

export default class DrawableSliderBall {
	container = new Sprite(texture);

	constructor(public object: Slider) {
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.anchor.set(0.5);
		this.container.scale.set(this.object.scale);
		// this.container.circle(0, 0, object.radius * (236 / 256) ** 2).stroke({
		// 	alignment: 0.5,
		// 	color: 0xcdd6f4,
		// 	width: object.radius * (236 / 256) ** 2 * 0.128,
		// });
		this.container.interactive = false;
		this.container.interactiveChildren = false;
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

		if (time < this.object.startTime || time > this.object.endTime) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;
	}
}
