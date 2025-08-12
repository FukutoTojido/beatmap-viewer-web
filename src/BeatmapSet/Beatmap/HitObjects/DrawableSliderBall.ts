import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type Slider,
} from "osu-standard-stable";
import { Assets, Graphics, Sprite, type Texture } from "pixi.js";
import type Skin from "@/Skinning/Skin";
import { inject } from "@/Context";
import type SkinManager from "@/Skinning/SkinManager";
import SkinnableElement from "./SkinnableElement";
import { update } from "@/Skinning/Legacy/LegacySliderBall";

export default class DrawableSliderBall extends SkinnableElement {
	container: Sprite;

	constructor(public object: Slider) {
		super();
		const currentSkin = this.skinManager?.getCurrentSkin();
		this.container = new Sprite(
			currentSkin?.getTexture(
				"sliderb",
				this.context.consume<Skin>("beatmapSkin"),
			) ??
				currentSkin?.getTexture(
					"sliderb0",
					this.context.consume<Skin>("beatmapSkin"),
				),
		);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.anchor.set(0.5);
		this.container.scale.set(this.object.scale);
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.skinEventCallback = this.skinManager?.addSkinChangeListener((skin) => {
			const sliderb =
				skin.getTexture("sliderb", this.context.consume<Skin>("beatmapSkin")) ??
				skin.getTexture("sliderb0", this.context.consume<Skin>("beatmapSkin"));

			if (!sliderb) return;
			this.container.texture = sliderb;
		});
	}

	update(time: number) {
		update(this, time);
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
