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
import type { Context } from "../../../Context";
import DrawableApproachCircle from "./DrawableApproachCircle";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableDefaults from "./DrawableDefaults";
import DrawableHitCircle from "./DrawableHitCircle";
import type Skin from "@/Skinning/Skin";

export default class DrawableSliderHead extends DrawableHitCircle {
	hitSound?: HitSample;

	constructor(
		public object: SliderHead,
		private parent: Slider,
		samples: Sample[],
	) {
		super(object, false);

		this.defaults = new DrawableDefaults(parent);
		this.approachCircle = new DrawableApproachCircle(parent);
		this.container.addChild(this.defaults.container);

		this.hitSound = new HitSample(samples).hook(this.context);

		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.refreshSprite();
	}

	refreshSprite() {
		super.refreshSprite();
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;


		const comboIndex = (this.parent ?? this.object).comboIndex % skin.colorsLength;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const color = (skin.config.Colours as any)[`Combo${comboIndex + 1}`] as string;
		this.hitCircleSprite.tint = `rgb(${color})`;
	}
}
