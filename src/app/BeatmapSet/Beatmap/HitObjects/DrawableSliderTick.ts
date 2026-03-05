import {
	HitResult,
	type LegacyReplayFrame,
	type HitSample as Sample,
	Vector2,
} from "osu-classes";
import type { Slider, SliderTick } from "osu-standard-stable";
import { Sprite } from "pixi.js";
import type BeatmapSet from "@/BeatmapSet";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import { inject } from "@/Context";
import { update } from "@/Skinning/Legacy/LegacySliderTick";
import type Skin from "@/Skinning/Skin";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type Gameplays from "@/UI/main/viewer/Gameplay/Gameplays";
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
		this.container.eventMode = "none";

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
		this.gameplaysEventCallback = inject<Gameplays>(
			"ui/main/viewer/gameplays",
		)?.on("change", () => this.refreshColor());
		inject<ExperimentalConfig>("config/experimental")?.onChange(
			"overlapGameplays",
			() => this.refreshColor(),
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

		if (!sliderTick) return;
		this.container.texture = sliderTick;

		this.refreshColor();
	}

	refreshColor() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");

		const tintByDiff =
			(inject<Gameplays>("ui/main/viewer/gameplays")?.gameplays.size ?? 1) - 1 &&
			inject<ExperimentalConfig>("config/experimental")?.overlapGameplays &&
			beatmap?.color;

		this.container.tint = tintByDiff
			? beatmap.color
			: skin.config.General.Argon
				? (this.context.consume<DrawableSlider>("slider")?.getColor(skin) ??
					0xffffff)
				: 0xffffff;
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		const isSeeking =
			inject<ProgressBar>("ui/main/controls/progress")?.isSeeking ||
			inject<BeatmapSet>("beatmapset")?.isSeeking;
		if (!beatmap || isSeeking) return;
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

	override eval(frames: LegacyReplayFrame[]) {
		const frame = frames.findLast(
			(frames) => frames.startTime <= this.object.startTime,
		);

		if (!frame || !(frame.mouseLeft || frame.mouseRight))
			return {
				value: HitResult.SmallTickMiss,
				hitTime: Infinity,
			};

		const position = new Vector2(
			this.object.startX + this.object.stackedOffset.x,
			this.object.startY + this.object.stackedOffset.y,
		);

		const x = frame.position.x;
		const y = frame.position.y;
		const pointer = new Vector2(x, y);

		const radius = 64 * this.object.scale * 2.4;
		const dist = pointer.distance(position);

		if (dist > radius)
			return {
				value: HitResult.SmallTickMiss,
				hitTime: Infinity,
			};

		return {
			value: HitResult.SmallTickHit,
			hitTime: this.object.startTime,
		};
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
		if (this.gameplaysEventCallback)
			inject<Gameplays>("ui/main/viewer/gameplays")?.remove(
				"change",
				this.gameplaysEventCallback,
			);
	}
}
