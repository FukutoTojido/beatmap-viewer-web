import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type SliderTick,
	type Slider,
} from "osu-standard-stable";
import { Assets, Graphics, Sprite } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import { inject, type Context } from "../../../Context";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";

export default class DrawableSliderTick extends DrawableHitObject {
	container: Sprite;
	hitSound?: HitSample;

	constructor(
		public object: SliderTick,
		private parent: Slider,
		sample: Sample,
	) {
		super(object);
		this.container = new Sprite(
			this.skinManager?.getCurrentSkin().getTexture(
				"sliderscorepoint",
			),
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

		this.skinManager?.addSkinChangeListener((skin) => {
			const sliderTick = skin.getTexture("sliderscorepoint");

			if (!sliderTick) return;
			this.container.texture = sliderTick;
		});
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime &&
				this.object.startTime < time
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
		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeOutDuration = 200;

		this.container.x = this.object.startX + this.object.stackedOffset.x;
		this.container.y = this.object.startY + this.object.stackedOffset.y;

		this.container.scale.set(1 * this.object.scale);

		if (time < this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.object.timeFadeIn),
			);
			this.container.alpha = opacity;

			return;
		}

		if (time >= this.object.startTime) {
			const opacity =
				1 -
				Math.min(
					1,
					Math.max(0, (time - this.object.startTime) / fadeOutDuration),
				);
			const scale = Math.min(
				2,
				1 + Math.max(0, (time - this.object.startTime) / fadeOutDuration),
			);

			this.container.alpha = opacity;
			this.container.scale.set(scale * this.object.scale);

			return;
		}
	}
}
