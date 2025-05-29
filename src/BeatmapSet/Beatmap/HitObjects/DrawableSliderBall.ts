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
		this.container = new Sprite(
			this.skinManager?.getCurrentSkin().getTexture("sliderb0"),
		);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.anchor.set(0.5);
		this.container.scale.set(this.object.scale);
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.skinEventCallback = this.skinManager?.addSkinChangeListener((skin) => {
			const sliderb = skin.getTexture("sliderb0");

			if (!sliderb) return;
			this.container.texture = sliderb;
		});
	}

	update(time: number) {
		update(this, time);
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback) this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
