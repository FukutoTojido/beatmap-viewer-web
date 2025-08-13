import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type SliderTail,
	type Slider,
} from "osu-standard-stable";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import { Graphics, Texture } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import { inject, type Context } from "../../../Context";
import type Beatmap from "..";
import HitSample from "../../../Audio/HitSample";
import DrawableHitCircle from "./DrawableHitCircle";
import type Skin from "@/Skinning/Skin";
import type SkinningConfig from "@/Config/SkinningConfig";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import { update } from "@/Skinning/Argon/ArgonSliderTail";

const TAIL_LENIENCY = 36;
export default class DrawableSliderTail extends DrawableHitCircle {
	hitSound?: HitSample;

	constructor(
		public object: SliderTail,
		private parent: Slider,
		samples: Sample[],
	) {
		super(object, false);
		this.hitSound = new HitSample(samples).hook(this.context);
		this.refreshSprite();
	}

	tailUpdateFn: null | typeof update = null;

	refreshSprite() {
		super.refreshSprite();
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const skinMetadata =
			this.skinManager?.skins[
				inject<SkinningConfig>("config/skinning")?.skinningIdx ?? 0
			];
		if (!skinMetadata) return;

		if (skinMetadata.type === "ARGON") {
			this.tailUpdateFn = update;
		} else {
			this.tailUpdateFn = null;
		}

		const hitCircle =
			skin.getTexture(
				"sliderendcircle",
				this.context.consume<Skin>("beatmapSkin"),
			) ??
			skin.getTexture("hitcircle", this.context.consume<Skin>("beatmapSkin"));
		const hitCircleOverlay = skin.getTexture(
			"sliderendcircle",
			this.context.consume<Skin>("beatmapSkin"),
		)
			? (skin.getTexture(
					"sliderendcircleoverlay",
					this.context.consume<Skin>("beatmapSkin"),
				) ?? BLANK_TEXTURE)
			: skin.getTexture(
					"hitcircleoverlay",
					this.context.consume<Skin>("beatmapSkin"),
				);

		if (hitCircle) this.hitCircleSprite.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (
			beatmap?.data?.colors.comboColors.length &&
			!inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
		) {
			const colors = beatmap.data.colors.comboColors;
			const comboIndex =
				(this.parent ?? this.object).comboIndexWithOffsets % colors.length;

			this.hitCircleSprite.tint = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
			return;
		}

		const comboIndex =
			(this.parent ?? this.object).comboIndexWithOffsets % skin.colorsLength;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const color = (skin.config.Colours as any)[
			`Combo${comboIndex + 1}`
		] as string;
		this.hitCircleSprite.tint = `rgb(${color})`;
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime + TAIL_LENIENCY &&
				this.object.startTime + TAIL_LENIENCY < time &&
				time - beatmap.previousTime < 30
			)
		)
			return;

		const currentSamplePoint = beatmap.getNearestSamplePoint(
			this.object.startTime + TAIL_LENIENCY,
		);
		this.hitSound?.play(currentSamplePoint);
	}

	update(time: number): void {
		super.update(time - TAIL_LENIENCY);
		this.tailUpdateFn?.(this, time - TAIL_LENIENCY);
	}
}
