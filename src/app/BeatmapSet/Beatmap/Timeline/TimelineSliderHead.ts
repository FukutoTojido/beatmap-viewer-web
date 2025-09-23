import * as d3 from "d3";
import type { Slider, SliderHead } from "osu-standard-stable";
import type Skin from "@/Skinning/Skin";
import DrawableDefaults from "../HitObjects/DrawableDefaults";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import TimelineHitCircle from "./TimelineHitCircle";
import { BLANK_TEXTURE } from "@/Skinning/Skin";

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

		const hitCircle = skin.getTexture(
			"hitcircle",
			this.context.consume<Skin>("beatmapSkin"),
		);
		const hitCircleOverlay = skin.getTexture(
			"hitcircleoverlay",
			this.context.consume<Skin>("beatmapSkin"),
		);
		const select = skin.getTexture(
			"hitcircleselect",
			this.context.consume<Skin>("beatmapSkin"),
		);

		if (hitCircle) this.hitCircle.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;
		this.select.texture =
			(skin.config.General.Argon ? BLANK_TEXTURE : select) ?? BLANK_TEXTURE;

		this.hitCircle.visible = !skin.config.General.Argon;
		this.hitCircleOverlay.visible = !skin.config.General.Argon;

		const baseColor = this.context.consume<DrawableSlider>("object")?.color;
		const color = baseColor?.includes("rgb")
			? (baseColor ?? "rgb(0, 0, 0)")
			: `rgb(${baseColor ?? "0,0,0"})`;
		this.hitCircle.tint = color;
		this.defaults.container.tint = 0xffffff;
		this.defaults.sprites.map((sprite) => {
			sprite.tint = 0xffffff;
		});

		if (!skin.config.General.Argon) return;

		const col = d3.color(color as string);
		if (!col) return;

		const lumi =
			0.299 * (col?.rgb().r / 255) +
			0.587 * (col?.rgb().g / 255) +
			0.114 * (col?.rgb().b / 255);
		this.defaults.container.tint = lumi > 0.5 ? color : 0xffffff;
		this.defaults.sprites.map((sprite) => {
			sprite.tint = lumi > 0.5 ? 0x333333 : 0xe5e5e5;
		});
	}
}
