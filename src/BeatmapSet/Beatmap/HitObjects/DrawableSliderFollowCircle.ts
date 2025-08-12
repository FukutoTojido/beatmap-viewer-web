import type { Slider } from "osu-standard-stable";
import { Assets, Graphics, Sprite, type Texture } from "pixi.js";
import Easings from "../../../UI/Easings";
import { inject } from "@/Context";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import SkinnableElement from "./SkinnableElement";
import { update } from "@/Skinning/Legacy/LegacySliderFollowCircle";

export default class DrawableSliderFollowCircle extends SkinnableElement {
	container;

	constructor(public object: Slider) {
		super();

		this.container = new Sprite(
			this.skinManager?.getCurrentSkin().getTexture(
				"sliderfollowcircle",
			),
		);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.anchor.set(0.5);
		this.container.scale.set(this.object.scale);

		this.skinEventCallback = this.skinManager?.addSkinChangeListener((skin) => {
			const sliderFollowCircle = skin.getTexture("sliderfollowcircle", this.context.consume<Skin>("beatmapSkin"));

			if (!sliderFollowCircle) return;
			this.container.texture = sliderFollowCircle;
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
