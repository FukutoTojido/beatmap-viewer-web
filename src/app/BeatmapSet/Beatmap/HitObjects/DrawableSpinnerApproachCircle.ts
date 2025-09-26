import type { Spinner } from "osu-standard-stable";
import DrawableApproachCircle from "./DrawableApproachCircle";
import { BLANK_TEXTURE } from "@/Skinning/Skin";

export default class DrawableSpinnerApproachCircle extends DrawableApproachCircle {
	constructor(object: Spinner) {
		super(object);
		this.container.visible = true;
		this.container.scale.set(1);
	}

	refreshSprite(): void {
		super.refreshSprite();
		this.container.texture =
			this.skinManager?.getCurrentSkin().getTexture("spinner-approachcircle") ??
			BLANK_TEXTURE;
		this.container.scale.set(1);
		this.container.tint = 0xffffff;
	}

	update(time: number) {
		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeInDuration = Math.min(
			this.object.timeFadeIn,
			this.object.timePreempt,
		);
		const fadeOutDuration = 50;
		const endTime = (this.object as Spinner).endTime;
		const duration = (this.object as Spinner).duration;

		if (time < startFadeInTime || time >= endTime + fadeOutDuration) {
			this.container.visible = false;
			this.container.scale.set(1);
			return;
		}

		this.container.visible = true;

		if (time < this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / fadeInDuration),
			);

			this.container.alpha = opacity;
			return;
		}

		if (time >= this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - endTime) / fadeOutDuration),
			);
			const scale = Math.min(
				1,
				Math.max(0, (time - this.object.startTime) / duration),
			);

			this.container.alpha = (1 - opacity) * 0.9;

			this.container.scale.set(
				(384 - (384 - 32 * this.object.scale) * scale) / 384,
			);
			return;
		}

		this.container.scale.set(1);
	}
}
