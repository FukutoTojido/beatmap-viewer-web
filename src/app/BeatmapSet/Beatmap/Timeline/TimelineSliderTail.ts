import type { SliderTail } from "osu-standard-stable";
import type Skin from "@/Skinning/Skin";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
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

		const hitCircle = skin.config.General.Argon
			? BLANK_TEXTURE
			: (skin.getTexture(
					"sliderendcircle",
					this.context.consume<Skin>("beatmapSkin"),
				) ??
				skin.getTexture(
					"hitcircle",
					this.context.consume<Skin>("beatmapSkin"),
				));
		const hitCircleOverlay = skin.config.General.Argon
			? BLANK_TEXTURE
			: skin.getTexture(
						"sliderendcircle",
						this.context.consume<Skin>("beatmapSkin"),
					)
				? (skin.getTexture(
						"sliderendcircleoverlay",
						this.context.consume<Skin>("beatmapSkin"),
					) ?? BLANK_TEXTURE)
				: skin.getTexture(
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

		const baseColor = this.context.consume<DrawableSlider>("object")?.color;
		const color = baseColor?.includes("rgb")
			? (baseColor ?? "rgb(0, 0, 0)")
			: `rgb(${baseColor ?? "0,0,0"})`;
		this.hitCircle.tint = color;
	}
}
