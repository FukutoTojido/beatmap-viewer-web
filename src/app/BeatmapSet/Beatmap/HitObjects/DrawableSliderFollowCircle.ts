import type { Slider } from "osu-standard-stable";
import { Sprite } from "pixi.js";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonSliderFollowCircle";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacySliderFollowCircle";
import type Skin from "@/Skinning/Skin";
import type DrawableSlider from "./DrawableSlider";
import SkinnableElement from "./SkinnableElement";

export default class DrawableSliderFollowCircle extends SkinnableElement {
	container;
	updateFn = legacyUpdate;

	constructor(object: Slider) {
		super();
		this.object = object;

		this.container = new Sprite(
			this.skinManager?.getCurrentSkin().getTexture("sliderfollowcircle"),
		);
		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.anchor.set(0.5);
		this.container.scale.set(this.object.scale);
		this.container.eventMode = "none";

		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);
	}

	private _object!: Slider;
	get object() {
		return this._object;
	}

	set object(val: Slider) {
		this._object = val;

		if (this.container) {
			this.container.x = val.startX;
			this.container.y = val.startY;
			this.container.scale.set(val.scale);
		}
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		this.updateFn = skin.config.General.Argon ? argonUpdate : legacyUpdate;

		const sliderFollowCircle = skin.getTexture(
			"sliderfollowcircle",
			skin.config.General.Argon
				? this.context.consume<Skin>("beatmapSkin")
				: undefined,
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
