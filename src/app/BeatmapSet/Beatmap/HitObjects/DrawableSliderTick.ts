import type { HitSample as Sample } from "osu-classes";
import type { Slider, SliderTick } from "osu-standard-stable";
import { Sprite } from "pixi.js";
import { update } from "@/Skinning/Legacy/LegacySliderTick";
import type Skin from "@/Skinning/Skin";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableHitObject from "./DrawableHitObject";
import type DrawableSlider from "./DrawableSlider";

export default class DrawableSliderTick extends DrawableHitObject {
	container: Sprite;
	hitSound?: HitSample;

	constructor(
		public object: SliderTick,
		parent: Slider,
		sample: Sample,
	) {
		super(object);
		this.object = object;

		this.container = new Sprite(
			this.skinManager?.getCurrentSkin().getTexture("sliderscorepoint"),
		);
		this.container.x = object.startX + object.stackedOffset.x;
		this.container.y = object.startY + object.stackedOffset.x;

		this.container.anchor.set(0.5);

		this.container.interactive = false;
		this.container.interactiveChildren = false;

		const distFromStart = object.startPosition.distance(parent.startPosition);
		const distFromEnd = object.endPosition.distance(parent.endPosition);

		if (distFromStart < parent.radius || distFromEnd < parent.radius)
			this.container.visible = false;

		const clonedSample = sample.clone();
		clonedSample.hitSound = "slidertick";
		this.hitSound = new HitSample([clonedSample]).hook(this.context);

		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);
	}

	updateObjects(object: SliderTick, parent: Slider, sample: Sample) {
		this.object = object;

		if (this.container) {
			this.container.x = object.startX + object.stackedOffset.x;
			this.container.y = object.startY + object.stackedOffset.x;

			const distFromStart = object.startPosition.distance(parent.startPosition);
			const distFromEnd = object.endPosition.distance(parent.endPosition);

			if (distFromStart < parent.radius || distFromEnd < parent.radius)
				this.container.visible = false;
		}

		if (this.hitSound) {
			const clonedSample = sample.clone();
			clonedSample.hitSound = "slidertick";
			this.hitSound.hitSamples = [clonedSample];
		}
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const sliderTick = skin.getTexture(
			"sliderscorepoint",
			!skin.config.General.Argon
				? this.context.consume<Skin>("beatmapSkin")
				: undefined,
		);

		this.container.tint = skin.config.General.Argon
			? (this.context.consume<DrawableSlider>("slider")?.getColor(skin) ??
				0xffffff)
			: 0xffffff;

		if (!sliderTick) return;
		this.container.texture = sliderTick;
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime &&
				this.object.startTime < time &&
				time - beatmap.previousTime < 30
			)
		)
			return;

		const currentSamplePoint = beatmap.getNearestSamplePoint(
			this.object.startTime,
		);
		this.hitSound?.play(currentSamplePoint);
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - this.object.timePreempt,
			end: this.object.startTime + 800,
		};
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
