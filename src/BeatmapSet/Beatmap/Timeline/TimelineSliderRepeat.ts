import type { SliderRepeat } from "osu-standard-stable";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import TimelineHitCircle from "./TimelineHitCircle";
import { Sprite } from "pixi.js";
import type Skin from "@/Skinning/Skin";

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
			skin.getTexture("sliderendcircle", this.context.consume<Skin>("beatmapSkin")) ??
			skin.getTexture("hitcircle", this.context.consume<Skin>("beatmapSkin"));
		const hitCircleOverlay =
			skin.getTexture(
				"sliderendcircleoverlay",
				this.context.consume<Skin>("beatmapSkin"),
			) ??
			skin.getTexture("hitcircleoverlay", this.context.consume<Skin>("beatmapSkin"));
		const reverseArrow = skin.getTexture(
			"reversearrow",
			this.context.consume<Skin>("beatmapSkin"),
		);

		if (hitCircle) this.hitCircle.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;
		if (reverseArrow && this.reverseArrow)
			this.reverseArrow.texture = reverseArrow;

		const color = `rgb(${this.context.consume<DrawableSlider>("object")?.color ?? "0,0,0"})`;
		this.hitCircle.tint = color;
	}
}
