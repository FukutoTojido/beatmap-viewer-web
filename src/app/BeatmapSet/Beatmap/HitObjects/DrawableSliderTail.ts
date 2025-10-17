import {
	HitResult,
	Vector2,
	type LegacyReplayFrame,
	type HitSample as Sample,
} from "osu-classes";
import type { Slider, SliderTail } from "osu-standard-stable";
import type BeatmapSet from "@/BeatmapSet";
import { inject } from "@/Context";
import { update } from "@/Skinning/Argon/ArgonSliderTail";
import type Skin from "@/Skinning/Skin";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableSliderHead from "./DrawableSliderHead";
import { Clamp } from "@/utils";

export const TAIL_LENIENCY = 36;
export default class DrawableSliderTail extends DrawableSliderHead {
	hitSound?: HitSample;

	constructor(
		object: SliderTail,
		public parent: Slider,
		samples: Sample[],
	) {
		super(object, parent, samples, false);
		this.hitSound = new HitSample(samples).hook(this.context);
		this.refreshSprite();
	}

	tailUpdateFn: null | typeof update = null;

	refreshSprite() {
		super.refreshSprite();
		this.flashPiece.texture = BLANK_TEXTURE;

		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		if (skin.config.General.Argon) {
			this.tailUpdateFn = update;
		} else {
			this.tailUpdateFn = null;
		}

		const hitCircle =
			skin.getTexture(
				"sliderendcircle",
				!skin.config.General.Argon
					? this.context.consume<Skin>("beatmapSkin")
					: undefined,
			) ??
			skin.getTexture(
				"hitcircle",
				!skin.config.General.Argon
					? this.context.consume<Skin>("beatmapSkin")
					: undefined,
			);
		const hitCircleOverlay = skin.getTexture(
			"sliderendcircle",
			!skin.config.General.Argon
				? this.context.consume<Skin>("beatmapSkin")
				: undefined,
		)
			? (skin.getTexture(
					"sliderendcircleoverlay",
					!skin.config.General.Argon
						? this.context.consume<Skin>("beatmapSkin")
						: undefined,
				) ?? BLANK_TEXTURE)
			: skin.getTexture(
					"hitcircleoverlay",
					!skin.config.General.Argon
						? this.context.consume<Skin>("beatmapSkin")
						: undefined,
				);

		if (hitCircle) this.hitCircleSprite.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;
	}

	playHitSound(time: number, offset: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		const isSeeking =
			inject<ProgressBar>("ui/main/controls/progress")?.isSeeking ||
			inject<BeatmapSet>("beatmapset")?.isSeeking;
		if (!beatmap || isSeeking) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime + offset &&
				this.object.startTime + offset < time &&
				time - beatmap.previousTime < 30
			)
		)
			return;

		const currentSamplePoint = beatmap.getNearestSamplePoint(
			this.object.startTime + offset,
		);

		this.hitSound?.play(currentSamplePoint);
	}

	override eval(frames: LegacyReplayFrame[]) {
		const frame = frames.findLast(
			(frames) => frames.startTime <= this.object.startTime,
		);

		if (!frame || !(frame.mouseLeft || frame.mouseRight))
			return {
				value: HitResult.LargeTickMiss,
				hitTime: Infinity,
			};

		const completionProgress = Clamp(
			(this.object.startTime - this.parent.startTime) / this.parent.duration,
		);

		const position = this.parent.path.curvePositionAt(
			completionProgress,
			this.parent.spans,
		);

		const x = frame.position.x;
		const y = frame.position.y;
		const pointer = new Vector2(x, y);

		const radius = 64 * this.object.scale * 2.4;
		const dist = pointer.distance(
			position.add(this.parent.stackedOffset).add(this.parent.startPosition),
		);

		if (dist > radius)
			return {
				value: HitResult.LargeTickMiss,
				hitTime: Infinity,
			};

		return {
			value: HitResult.LargeTickHit,
			hitTime: this.object.startTime,
		};
	}

	update(time: number): void {
		super.update(time);
		this.tailUpdateFn?.(this, time);
	}
}
