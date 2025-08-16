import type { Slider } from "osu-standard-stable";
import { Container, Sprite } from "pixi.js";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonSliderBall";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacySliderBall";
import type Skin from "@/Skinning/Skin";
import type DrawableSlider from "./DrawableSlider";
import SkinnableElement from "./SkinnableElement";

export default class DrawableSliderBall extends SkinnableElement {
	container: Container;
	sliderb: Sprite;
	slidernd: Sprite;
	updateFn = legacyUpdate;

	constructor(object: Slider) {
		super();
		this.object = object;

		const currentSkin = this.skinManager?.getCurrentSkin();
		this.container = new Container();

		this.sliderb = new Sprite(
			currentSkin?.getTexture(
				"sliderb",
				this.context.consume<Skin>("beatmapSkin"),
			) ??
				currentSkin?.getTexture(
					"sliderb0",
					this.context.consume<Skin>("beatmapSkin"),
				),
		);
		this.sliderb.anchor.set(0.5);

		this.slidernd = new Sprite(
			currentSkin?.getTexture(
				"slidernd",
				this.context.consume<Skin>("beatmapSkin"),
			),
		);
		this.slidernd.anchor.set(0.5);

		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.scale.set(this.object.scale);
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.container.addChild(this.slidernd, this.sliderb);

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

		const sliderb =
			skin.getTexture(
				"sliderb",
				!skin.config.General.Argon
					? this.context.consume<Skin>("beatmapSkin")
					: undefined,
			) ??
			skin.getTexture(
				"sliderb0",
				!skin.config.General.Argon
					? this.context.consume<Skin>("beatmapSkin")
					: undefined,
			);
		const sliderg = skin.getTexture(
			"slidernd",
			!skin.config.General.Argon
				? this.context.consume<Skin>("beatmapSkin")
				: undefined,
		);

		this.container.alpha = 1;

		if (sliderb) this.sliderb.texture = sliderb;
		if (sliderg) this.slidernd.texture = sliderg;

		this.slidernd.visible = skin.config.General.Argon ?? false;
		this.container.scale.set(
			this.object.scale * (skin.config.General.Argon ? 0.95 : 1),
		);
		this.updateFn = skin.config.General.Argon ? argonUpdate : legacyUpdate;
		this.slidernd.tint =
			this.context.consume<DrawableSlider>("slider")?.getColor(skin) ??
			0xffffff;
	}

	update(time: number) {
		this.updateFn(this, time);

		const slider = this.object;
		const completionProgress = (time - slider.startTime) / slider.duration;

		const checkDistance = 0.1 / slider.path.distance;
		const start = slider.path.curvePositionAt(
			Math.min(1 - checkDistance, completionProgress),
			slider.spans,
		);
		const end = slider.path.curvePositionAt(
			Math.min(1, completionProgress + checkDistance),
			slider.spans,
		);
		const diff = start.subtract(end);

		if (diff.flength() < 0.01) return;

		const angle = -90 + (-Math.atan2(diff.x, diff.y) * 180) / Math.PI;
		this.container.angle = angle;
		this.slidernd.angle = -angle;
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
