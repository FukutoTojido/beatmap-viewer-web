import type { SliderRepeat } from "osu-standard-stable";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import TimelineHitCircle from "./TimelineHitCircle";
import { Sprite } from "pixi.js";

export default class TimelineSliderRepeat extends TimelineHitCircle {
	reverseArrow: Sprite;

	constructor(object: SliderRepeat) {
		super(object);

		this.reverseArrow = new Sprite({
			anchor: 0.5,
		});

		this.container.removeChild(this.defaults.container);
		this.container.addChild(this.reverseArrow);

		this.defaults.destroy();
		this.refreshSprite();
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const hitCircle =
			skin.getTexture("sliderendcircle") ?? skin.getTexture("hitcircle");
		const hitCircleOverlay =
			skin.getTexture("sliderendcircleoverlay") ??
			skin.getTexture("hitcircleoverlay");
		const reverseArrow = skin.getTexture("reversearrow");

		if (hitCircle) this.hitCircle.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;
		if (reverseArrow && this.reverseArrow)
			this.reverseArrow.texture = reverseArrow;

		const color = `rgb(${this.context.consume<DrawableSlider>("object")?.color ?? "0,0,0"})`;
		this.hitCircle.tint = color;
	}
}
