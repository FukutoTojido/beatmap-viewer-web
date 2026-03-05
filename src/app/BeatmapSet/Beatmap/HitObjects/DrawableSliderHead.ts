import {
	HitResult,
	type LegacyReplayFrame,
	type HitSample as Sample,
} from "osu-classes";
import type { Slider, SliderHead } from "osu-standard-stable";
import type BeatmapSet from "@/BeatmapSet";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import { inject } from "@/Context";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonSliderHead";
import type Skin from "@/Skinning/Skin";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableApproachCircle from "./DrawableApproachCircle";
import DrawableDefaults from "./DrawableDefaults";
import DrawableHitCircle from "./DrawableHitCircle";
import type DrawableSlider from "./DrawableSlider";
import type Gameplays from "@/UI/main/viewer/Gameplay/Gameplays";

export default class DrawableSliderHead extends DrawableHitCircle {
	hitSound?: HitSample;

	headUpdateFn: ((_: DrawableSliderHead, __: number) => void) | null = null;

	constructor(
		object: SliderHead,
		public parent: Slider,
		samples: Sample[],
		hasNumber = true,
	) {
		super(object, false);

		if (hasNumber) {
			this.defaults = new DrawableDefaults(parent).hook(this.context);
			this.approachCircle = new DrawableApproachCircle(parent).hook(
				this.context,
			);
			this.wrapper.addChild(this.defaults.container);
		}

		this.hitSound = new HitSample(samples).hook(this.context);

		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.timelineObject = undefined;

		this.refreshSprite();
		this.container.eventMode = "none";
	}

	updateObjects(object: SliderHead, parent: Slider, samples: Sample[]) {
		super.object = object;
		this._object = object;
		this.parent = parent;
		if (this.defaults) this.defaults.object = parent;
		if (this.approachCircle) this.approachCircle.object = parent;
		if (this.hitSound) this.hitSound.hitSamples = samples;
	}

	refreshSprite() {
		super.refreshSprite();
		this.approachCircle.refreshSprite();
		this.defaults?.refreshSprites();

		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const sliderStartCircle = skin.getTexture(
			"sliderstartcircle",
			this.context.consume<Skin>("beatmapSkin"),
		);

		const sliderStartCircleOverlay = skin.getTexture(
			"sliderstartcircleoverlay",
			this.context.consume<Skin>("beatmapSkin"),
		);

		const hitCircle =
			sliderStartCircle ??
			skin.getTexture("hitcircle", this.context.consume<Skin>("beatmapSkin"));
		const hitCircleOverlay = sliderStartCircle
			? (sliderStartCircleOverlay ??
				skin.getTexture(
					"hitcircleoverlay",
					this.context.consume<Skin>("beatmapSkin"),
				))
			: skin.getTexture(
					"hitcircleoverlay",
					this.context.consume<Skin>("beatmapSkin"),
				);

		if (hitCircle) this.hitCircleSprite.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		this.headUpdateFn = skin.config.General.Argon ? argonUpdate : null;

		this.refreshColor();

		this.timelineObject?.refreshSprite();
	}

	refreshColor() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		const tintByDiff =
			(inject<Gameplays>("ui/main/viewer/gameplays")?.gameplays.size ?? 1) - 1 &&
			inject<ExperimentalConfig>("config/experimental")?.overlapGameplays &&
			beatmap?.randomColor;

		const color = tintByDiff
			? beatmap.randomColor
			: (this.context.consume<DrawableSlider>("slider")?.getColor(skin) ??
				0xffffff);
		this.hitCircleSprite.tint = color;
		this.flashPiece.tint = color;
		this.color = color;
	}

	update(time: number) {
		super.update(time);
		this.headUpdateFn?.(this, time);
	}

	override eval(frames: LegacyReplayFrame[]) {
		const e = super.eval(frames);

		if (e.value === HitResult.None || e.value === HitResult.Miss) {
			return {
				...e,
				value: HitResult.LargeTickMiss,
			};
		}

		return {
			...e,
			value: HitResult.LargeTickHit,
		};
	}
}
