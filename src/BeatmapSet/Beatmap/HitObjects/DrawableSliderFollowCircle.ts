import type { Slider } from "osu-standard-stable";
import { Assets, Graphics, Sprite, type Texture } from "pixi.js";
import Easings from "../../../UI/Easings";
import { inject } from "@/Context";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import SkinnableElement from "./SkinnableElement";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonSliderFollowCircle";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacySliderFollowCircle";
import type DrawableSlider from "./DrawableSlider";

export default class DrawableSliderFollowCircle extends SkinnableElement {
	container;
	updateFn = legacyUpdate;

	constructor(public object: Slider) {
		super();

		this.container = new Sprite(
			this.skinManager?.getCurrentSkin().getTexture("sliderfollowcircle"),
		);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.anchor.set(0.5);
		this.container.scale.set(this.object.scale);

		this.skinEventCallback = this.skinManager?.addSkinChangeListener((skin) =>
			this.refreshSprite(),
		);
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		this.updateFn = skin.config.General.Argon ? argonUpdate : legacyUpdate;

		const sliderFollowCircle = skin.getTexture(
			"sliderfollowcircle",
			skin.config.General.Argon ? this.context.consume<Skin>("beatmapSkin") : undefined
		);

		if (!sliderFollowCircle) return;
		this.container.texture = sliderFollowCircle;
		this.container.tint = skin.config.General.Argon
			? (this.context.consume<DrawableSlider>("slider")?.getColor(skin) ??
				0xffffff)
			: 0xffffff;

		this.container.blendMode = skin.config.General.Argon ? "add" : "normal";
	}

	update(time: number) {
		this.updateFn(this, time);
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
