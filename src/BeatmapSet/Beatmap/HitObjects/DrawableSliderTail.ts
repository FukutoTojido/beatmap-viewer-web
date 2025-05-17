import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type SliderTail,
	type Slider,
} from "osu-standard-stable";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import { Graphics } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "../../../Context";
import type Beatmap from "..";
import HitSample from "../../../Audio/HitSample";
import DrawableHitCircle from "./DrawableHitCircle";
import type Skin from "@/Skinning/Skin";

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

	refreshSprite() {
		super.refreshSprite();
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (beatmap?.data?.colors.comboColors.length) {
			const colors = beatmap.data.colors.comboColors;
			const comboIndex =
				(this.parent ?? this.object).comboIndex % colors.length;

			this.hitCircleSprite.tint = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
			return;
		}

		const comboIndex =
			(this.parent ?? this.object).comboIndex % skin.colorsLength;
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
				this.object.startTime + TAIL_LENIENCY < time
			)
		)
			return;

		const currentSamplePoint = beatmap.getNearestSamplePoint(
			this.object.startTime + TAIL_LENIENCY,
		);
		this.hitSound?.play(currentSamplePoint);
	}

	update(time: number): void {
		super.update(time + TAIL_LENIENCY);
	}
}
