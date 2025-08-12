import type { SliderTail } from "osu-standard-stable";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import TimelineHitCircle from "./TimelineHitCircle";
import type Skin from "@/Skinning/Skin";

export default class TimelineSliderTail extends TimelineHitCircle {
	constructor(object: SliderTail) {
		super(object);

		this.container.removeChild(this.defaults.container);
		this.defaults.destroy();
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const hitCircle =
			skin.getTexture("sliderendcircle", this.context.consume<Skin>("beatmapSkin")) ??
			skin.getTexture("hitcircle", this.context.consume<Skin>("beatmapSkin"));
		const hitCircleOverlay =
			skin.getTexture(
				"sliderendcircleoverlay",
				this.context.consume<Skin>("beatmapSkin"),
			) ??
			skin.getTexture("hitcircleoverlay", this.context.consume<Skin>("beatmapSkin"));

		if (hitCircle) this.hitCircle.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		const color = `rgb(${this.context.consume<DrawableSlider>("object")?.color ?? "0,0,0"})`;
		this.hitCircle.tint = color;
	}
}
