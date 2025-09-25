import type { HitSample as Sample } from "osu-classes";
import type { Slider, SliderTail } from "osu-standard-stable";
import { inject } from "@/Context";
import { update } from "@/Skinning/Argon/ArgonSliderTail";
import type Skin from "@/Skinning/Skin";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableSliderHead from "./DrawableSliderHead";

export const TAIL_LENIENCY = 36;
export default class DrawableSliderTail extends DrawableSliderHead {
	hitSound?: HitSample;

	constructor(object: SliderTail, parent: Slider, samples: Sample[]) {
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
		const isSeeking = inject<ProgressBar>("ui/main/controls/progress")?.isSeeking;
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

	update(time: number): void {
		super.update(time);
		this.tailUpdateFn?.(this, time);
	}
}
