import type { SliderTail } from "osu-standard-stable";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import TimelineHitCircle from "./TimelineHitCircle";

export default class TimelineSliderTail extends TimelineHitCircle {
	constructor(object: SliderTail) {
		super(object);

		this.container.removeChild(this.defaults.container);
		this.defaults.destroy();
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const hitCircle = skin.getTexture("sliderendcircle") ?? skin.getTexture("hitcircle");
		const hitCircleOverlay = skin.getTexture("sliderendcircleoverlay") ?? skin.getTexture("hitcircleoverlay");

		if (hitCircle) this.hitCircle.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		const color = `rgb(${this.context.consume<DrawableSlider>("object")?.color ?? "0,0,0"})`;
		this.hitCircle.tint = color;
	}
}
