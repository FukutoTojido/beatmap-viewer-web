import type { SliderRepeat } from "osu-standard-stable";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import TimelineHitCircle from "./TimelineHitCircle";
import { Graphics, Sprite } from "pixi.js";
import type Skin from "@/Skinning/Skin";
import TimelineSliderTail from "./TimelineSliderTail";

export default class TimelineSliderRepeat extends TimelineSliderTail {
	sprite = new Sprite({
		anchor: 0.5,
	});
	graphics = new Graphics().circle(0, 0, 15).fill(0xb6b6b6);

	constructor(object: SliderRepeat) {
		super(object);

		this.container.addChild(this.sprite, this.graphics);
		this.refreshSprite();
	}

	refreshSprite() {
		if (!this.sprite || !this.graphics) return;
		super.refreshSprite();

		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const reverseArrow = skin.getTexture(
			"reversearrow",
			this.context.consume<Skin>("beatmapSkin"),
		);

		if (reverseArrow && this.sprite) this.sprite.texture = reverseArrow;

		if (skin.config.General.Argon) {
			this.container.removeChild(this.sprite);
			if (!this.graphics) return;

			this.container.addChild(this.graphics);
			const color = `rgb(${this.context.consume<DrawableSlider>("object")?.color ?? "0,0,0"})`;
			this.graphics.tint = color;
		} else {
			if (this.graphics) this.container.removeChild(this.graphics);
			this.container.addChild(this.sprite);
		}
	}
}
