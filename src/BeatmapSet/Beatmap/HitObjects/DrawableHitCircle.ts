import { Container, Sprite, type ColorSource } from "pixi.js";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";
import DrawableApproachCircle from "./DrawableApproachCircle";
import HitSample from "@/Audio/HitSample";
import type { SamplePoint } from "osu-classes";
import type Beatmap from "..";
import DrawableDefaults from "./DrawableDefaults";
import { update } from "@/Skinning/Legacy/LegacyHitCircle";
import type { Context } from "@/Context";
import TimelineHitCircle from "../Timeline/TimelineHitCircle";
import type { StandardHitObject } from "osu-standard-stable";

export default class DrawableHitCircle
	extends DrawableHitObject
	implements IHasApproachCircle
{
	container = new Container();

	hitCircleSprite: Sprite;
	hitCircleOverlay: Sprite;

	sprite = new Container();

	approachCircle: DrawableApproachCircle;
	defaults?: DrawableDefaults;

	hitSound?: HitSample;

	samplePoint?: SamplePoint;

	timelineObject?: TimelineHitCircle;

	constructor(
		public object: StandardHitObject,
		protected hasNumber = true,
	) {
		super(object);
		this.container.visible = false;
		this.container.x = object.startX + object.stackedOffset.x;
		this.container.y = object.startY + object.stackedOffset.y;

		this.hitCircleSprite = new Sprite();
		this.hitCircleOverlay = new Sprite();

		this.hitCircleSprite.anchor.set(0.5);
		this.hitCircleSprite.alpha = 0.9;

		this.hitCircleOverlay.anchor.set(0.5);
		this.sprite.addChild(this.hitCircleSprite, this.hitCircleOverlay);

		this.approachCircle = new DrawableApproachCircle(object).hook(this.context);

		this.container.addChild(this.sprite);

		if (this.hasNumber) {
			this.defaults = new DrawableDefaults(object);
			this.container.addChild(this.defaults.container);
		}

		this.container.scale.set(object.scale);
		this.hitSound = new HitSample(object.samples).hook(this.context);

		this.refreshSprite();
		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);

		this.timelineObject = new TimelineHitCircle(object).hook(this.context);
	}

	hook(context: Context) {
		super.hook(context);

		this.refreshSprite();
		this.approachCircle.refreshSprite();

		return this;
	}

	color: ColorSource = "rgb(0, 0, 0)";
	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const hitCircle = skin.getTexture("hitcircle");
		const hitCircleOverlay = skin.getTexture("hitcircleoverlay");

		if (hitCircle) this.hitCircleSprite.texture = hitCircle;
		if (hitCircleOverlay) this.hitCircleOverlay.texture = hitCircleOverlay;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (beatmap?.data?.colors.comboColors.length) {
			const colors = beatmap.data.colors.comboColors;
			const comboIndex = this.object.comboIndex % colors.length;

			this.hitCircleSprite.tint = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;

			this.color = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
			this.timelineObject?.refreshSprite();

			return;
		}

		const comboIndex = this.object.comboIndex % skin.colorsLength;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const color = (skin.config.Colours as any)[
			`Combo${comboIndex + 1}`
		] as string;

		this.color = `rgb(${color})`;
		this.hitCircleSprite.tint = `rgb(${color})`;

		this.timelineObject?.refreshSprite();
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
		this.approachCircle.update(time);
		this.defaults?.update(time);
		update(this, time);
	}

	destroy() {
		this.hitCircleOverlay.destroy();
		this.hitCircleSprite.destroy();
		this.defaults?.destroy();
		this.approachCircle.destroy();

		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
