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
import { update } from "@/Skinning/Legacy/LegacySliderTick";

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

		this.skinEventCallback = this.skinManager?.addSkinChangeListener((skin) => {
			const sliderTick = skin.getTexture("sliderscorepoint", this.context.consume<Skin>("beatmapSkin"));

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
