import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type SliderHead,
	type Slider,
} from "osu-standard-stable";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import { Container, Graphics } from "pixi.js";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";
import { inject, type Context } from "../../../Context";
import DrawableApproachCircle from "./DrawableApproachCircle";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableDefaults from "./DrawableDefaults";
import DrawableHitCircle from "./DrawableHitCircle";
import type Skin from "@/Skinning/Skin";
import type TimelineHitCircle from "../Timeline/TimelineHitCircle";
import type SkinningConfig from "@/Config/SkinningConfig";

export default class DrawableSliderHead extends DrawableHitCircle {
	hitSound?: HitSample;

	constructor(
		public object: SliderHead,
		protected parent: Slider,
		samples: Sample[],
		hasNumber = true,
	) {
		super(object, false);

		if (hasNumber) {
			this.defaults = new DrawableDefaults(parent);
			this.approachCircle = new DrawableApproachCircle(parent).hook(
				this.context,
			);
			this.container.addChild(this.defaults.container);
		}

		this.hitSound = new HitSample(samples).hook(this.context);

		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.timelineObject = undefined;

		this.refreshSprite();
	}

	refreshSprite() {
		super.refreshSprite();
		this.approachCircle.refreshSprite();

		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const hitCircle = skin.getTexture("sliderstartcircle", this.context.consume<Skin>("beatmapSkin")) ?? skin.getTexture("hitcircle", this.context.consume<Skin>("beatmapSkin"));
		const hitCircleOverlay = skin.getTexture("sliderstartcircleoverlay") ?? skin.getTexture("hitcircleoverlay", this.context.consume<Skin>("beatmapSkin"));

		if (hitCircle) this.hitCircleSprite.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (beatmap?.data?.colors.comboColors.length && !inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin) {
			const colors = beatmap.data.colors.comboColors;
			const comboIndex =
				(this.parent ?? this.object).comboIndexWithOffsets % colors.length;

			this.hitCircleSprite.tint = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
			this.color = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
			this.timelineObject?.refreshSprite();
			return;
		}

		const comboIndex =
			(this.parent ?? this.object).comboIndexWithOffsets % skin.colorsLength;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const color = (skin.config.Colours as any)[
			`Combo${comboIndex + 1}`
		] as string;
		this.hitCircleSprite.tint = `rgb(${color})`;
		this.color = `rgb(${color})`;

		this.timelineObject?.refreshSprite();
	}
}
