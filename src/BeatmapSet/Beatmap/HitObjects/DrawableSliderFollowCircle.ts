import type { Slider } from "osu-standard-stable";
import { Assets, Graphics, Sprite, type Texture } from "pixi.js";
import Easings from "../../../UI/Easings";
import { inject } from "@/Context";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import SkinnableElement from "./SkinnableElement";

export default class DrawableSliderFollowCircle extends SkinnableElement {
	container;

	constructor(public object: Slider) {
		super();

		this.container = new Sprite(
			this.skinManager?.getCurrentSkin().getTexture(
				"sliderfollowcircle",
			),
		);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.anchor.set(0.5);
		this.container.scale.set(this.object.scale);

		this.skinEventCallback = this.skinManager?.addSkinChangeListener((skin) => {
			const sliderFollowCircle = skin.getTexture("sliderfollowcircle");

			if (!sliderFollowCircle) return;
			this.container.texture = sliderFollowCircle;
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

		if (
			time < this.object.startTime ||
			time > this.object.endTime + outDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

		if (
			time >= this.object.startTime &&
			time < this.object.startTime + scaleInDuration
		) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - this.object.startTime) / fadeInDuration),
			);
			const scale = Math.min(
				1,
				Math.max(0, (time - this.object.startTime) / scaleInDuration),
			);

			this.container.scale.set(
				(0.5 + 0.5 * Easings.Out(scale)) * this.object.scale,
			);
			this.container.alpha = opacity;

			return;
		}

		if (
			time >= this.object.startTime + scaleInDuration &&
			time <= this.object.endTime
		) {
			this.container.scale.set(1 * this.object.scale);
			this.container.alpha = 1;

			return;
		}

		if (time > this.object.endTime) {
			const opacity =
				1 -
				Math.min(1, Math.max(0, (time - this.object.endTime) / outDuration));
			const scale = Math.min(
				1,
				Math.max(0, (time - this.object.endTime) / outDuration),
			);

			this.container.scale.set(
				(1 - 0.2 * Easings.Out(scale)) * this.object.scale,
			);
			this.container.alpha = Easings.In(opacity);

			return;
		}
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback) this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
