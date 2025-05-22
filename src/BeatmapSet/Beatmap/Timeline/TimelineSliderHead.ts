import type { Slider, SliderHead } from "osu-standard-stable";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import TimelineHitCircle from "./TimelineHitCircle";
import DrawableDefaults from "../HitObjects/DrawableDefaults";

export default class TimelineSliderHead extends TimelineHitCircle {
	constructor(object: SliderHead, parent: Slider) {
		super(object);

		this.container.removeChild(this.defaults.container);
		this.defaults.destroy();

		this.defaults = new DrawableDefaults(parent);
		this.container.addChild(this.defaults.container);
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const hitCircle = skin.getTexture("hitcircle");
		const hitCircleOverlay = skin.getTexture("hitcircleoverlay");

		if (hitCircle) this.hitCircle.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		const color = `rgb(${this.context.consume<DrawableSlider>("object")?.color ?? "0,0,0"})`;
		this.hitCircle.tint = color;
	}
}
