import type { Circle } from "osu-standard-stable";
import TimelineHitObject from "./TimelineHitObject";
import { Container, Graphics, Sprite } from "pixi.js";
import { DEFAULT_SCALE } from "@/UI/main/viewer/Timeline";
import { type Context, inject } from "@/Context";
import type TimelineConfig from "@/Config/TimelineConfig";
import type DrawableHitCircle from "../HitObjects/DrawableHitCircle";
import DrawableDefaults from "../HitObjects/DrawableDefaults";
import type Skin from "@/Skinning/Skin";

export default class TimelineHitCircle extends TimelineHitObject {
	hitCircle: Sprite;
	hitCircleOverlay: Sprite;
	defaults: DrawableDefaults;

	constructor(object: Circle) {
		super(object);

		this.defaults = new DrawableDefaults(object);

		this.hitCircle = new Sprite();
		this.hitCircleOverlay = new Sprite();

		this.hitCircle.anchor.set(0.5);
		this.hitCircleOverlay.anchor.set(0.5);

		this.container.scale.set(50 / 128);

		this.container.addChild(
			this.hitCircle,
			this.defaults.container,
			this.hitCircleOverlay,
		);

		this.refreshSprite();
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

		if (hitCircle) this.hitCircle.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		const color =
			this.context.consume<DrawableHitCircle>("object")?.color ?? "rgb(0,0,0)";
		this.hitCircle.tint = color;
	}

	hook(context: Context) {
		super.hook(context);

		this.refreshSprite();

		return this;
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - 30 * 5,
			end: this.object.startTime + 30 * 5,
		};
	}
}
