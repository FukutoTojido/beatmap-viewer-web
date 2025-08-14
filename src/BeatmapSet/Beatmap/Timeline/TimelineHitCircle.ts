import type { Circle } from "osu-standard-stable";
import TimelineHitObject from "./TimelineHitObject";
import { Container, Graphics, Sprite } from "pixi.js";
import { DEFAULT_SCALE } from "@/UI/main/viewer/Timeline";
import { type Context, inject } from "@/Context";
import type TimelineConfig from "@/Config/TimelineConfig";
import type DrawableHitCircle from "../HitObjects/DrawableHitCircle";
import DrawableDefaults from "../HitObjects/DrawableDefaults";
import type Skin from "@/Skinning/Skin";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import * as d3 from "d3";

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

		const timelineHitCircle = skin.getTexture(
			"timelinehitcircle",
			this.context.consume<Skin>("beatmapSkin"),
		);
		const hitCircle = skin.getTexture(
			"hitcircle",
			this.context.consume<Skin>("beatmapSkin"),
		);
		const hitCircleOverlay = skin.getTexture(
			"hitcircleoverlay",
			this.context.consume<Skin>("beatmapSkin"),
		);

		this.hitCircle.texture =
			(skin.config.General.Argon
				? (timelineHitCircle ?? hitCircle)
				: hitCircle) ?? BLANK_TEXTURE;
		this.hitCircleOverlay.texture =
			(skin.config.General.Argon ? BLANK_TEXTURE : hitCircleOverlay) ??
			BLANK_TEXTURE;

		const color =
			this.context.consume<DrawableHitCircle>("object")?.color ?? "rgb(0,0,0)";
		this.hitCircle.tint = color;
		this.defaults.container.tint = 0xffffff;

		if (!skin.config.General.Argon) return;

		const defaultColor = d3.color(color as string)?.darker(2);
		if (!defaultColor) return;
		this.defaults.container.tint = defaultColor;
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
