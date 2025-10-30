import type { Slider } from "osu-standard-stable";
import { Container, Sprite } from "pixi.js";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonSliderBall";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacySliderBall";
import type Skin from "@/Skinning/Skin";
import AnimatedSkinnableElement from "./AnimatedSkinnableElement";
import type DrawableSlider from "./DrawableSlider";

export default class DrawableSliderBall extends AnimatedSkinnableElement {
	container: Container;
	sliderb: Sprite;
	slidernd: Sprite;
	sliderspec: Sprite;
	updateFn = legacyUpdate;

	constructor(object: Slider) {
		super();
		this.object = object;

		this.container = new Container();

		this.sliderb = new Sprite();
		this.sliderb.anchor.set(0.5);

		this.slidernd = new Sprite();
		this.slidernd.anchor.set(0.5);

		this.sliderspec = new Sprite();
		this.sliderspec.anchor.set(0.5);
		this.sliderspec.blendMode = "add";

		this.container.visible = false;
		this.container.x = object.startX;
		this.container.y = object.startY;
		this.container.scale.set(this.object.scale);
		this.container.interactive = false;
		this.container.interactiveChildren = false;
		this.container.eventMode = "none";

		this.container.addChild(this.slidernd, this.sliderb, this.sliderspec);

		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);

		this.refreshSprite();
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

		const sliderbs = skin.getAnimatedTexture(
			"sliderb",
			!skin.config.General.Argon
				? this.context.consume<Skin>("beatmapSkin")
				: undefined,
		);
		const sliderg = skin.getTexture(
			"sliderb-nd",
			!skin.config.General.Argon
				? this.context.consume<Skin>("beatmapSkin")
				: undefined,
		);
		const sliderspec = skin.getTexture(
			"sliderb-spec",
			!skin.config.General.Argon
				? this.context.consume<Skin>("beatmapSkin")
				: undefined,
		);

		this.container.alpha = 1;

		if (sliderg) this.slidernd.texture = sliderg;
		if (sliderspec) this.sliderspec.texture = sliderspec;
		this.texturesList = sliderbs;

		this.container.scale.set(
			this.object.scale * (skin.config.General.Argon ? 0.95 : 1),
		);
		this.updateFn = skin.config.General.Argon ? argonUpdate : legacyUpdate;

		if (skin.config.General.Argon) {
			this.slidernd.tint =
				this.context.consume<DrawableSlider>("slider")?.getColor(skin) ??
				0xffffff;
			this.sliderb.tint = 0xffffff;
			this.slidernd.visible = true;
			this.sliderspec.visible = false;
		}

		if (!skin.config.General.Argon) {
			const hasSliderB =
				this.context
					.consume<Skin>("beatmapSkin")
					?.animatedTextures.has("sliderb") ||
				skin.animatedTextures.has("sliderb") ||
				skin.textures.has("sliderb") ||
				this.context.consume<Skin>("beatmapSkin")?.textures.has("sliderb");

			this.slidernd.visible = !(
				hasSliderB && skin !== this.skinManager?.defaultSkin
			);
			this.sliderspec.visible = !(
				hasSliderB && skin !== this.skinManager?.defaultSkin
			);

			this.sliderb.tint = skin.config.General.AllowSliderBallTint
				? (this.context.consume<DrawableSlider>("slider")?.getColor(skin) ??
					0xffffff)
				: 0xffffff;
			this.slidernd.tint = 0x0;
		}
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

		const frameDelay = Math.max(
			0.15 / this.object.velocity * (1000 / 60),
			1000 / 60,
		);

		const frameIndex =
			Math.floor((time - slider.startTime) / frameDelay) %
			this.texturesList.length;
		this.sliderb.texture = this.texturesList[frameIndex];

		if (diff.flength() < 0.01) return;

		const angle = -90 + (-Math.atan2(diff.x, diff.y) * 180) / Math.PI;
		this.container.angle = angle;
		this.slidernd.angle = -angle;
		this.sliderspec.angle = -angle;
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
