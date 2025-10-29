import {
	HitResult,
	type LegacyReplayFrame,
	type SamplePoint,
	Vector2,
} from "osu-classes";
import type { StandardHitObject } from "osu-standard-stable";
import { type ColorSource, Container, RenderLayer, Sprite } from "pixi.js";
import HitSample from "@/Audio/HitSample";
import type BeatmapSet from "@/BeatmapSet";
import type GameplayConfig from "@/Config/GameplayConfig";
import { type Context, inject } from "@/Context";
import {
	refreshSprite as argonRefreshSprite,
	update as argonUpdate,
} from "@/Skinning/Argon/ArgonHitCircle";
import {
	refreshSprite as legacyRefreshSprite,
	update as legacyUpdate,
} from "@/Skinning/Legacy/LegacyHitCircle";
import type SkinManager from "@/Skinning/SkinManager";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type Beatmap from "..";
import type { BaseObjectEvaluation } from "../Replay";
import TimelineHitCircle from "../Timeline/TimelineHitCircle";
import DrawableApproachCircle from "./DrawableApproachCircle";
import DrawableDefaults from "./DrawableDefaults";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";
import DrawableJudgement from "./DrawableJudgement";

export default class DrawableHitCircle
	extends DrawableHitObject
	implements IHasApproachCircle
{
	container = new Container();

	hitCircleSprite: Sprite;
	hitCircleOverlay: Sprite;
	flashPiece: Sprite;
	select: Sprite = new Sprite({ visible: false, anchor: 0.5 });

	sprite = new Container();
	wrapper = new Container();

	approachCircle: DrawableApproachCircle;
	defaults?: DrawableDefaults;

	hitSound?: HitSample;

	samplePoint?: SamplePoint;

	timelineObject?: TimelineHitCircle;

	updateFn = legacyUpdate;

	judgement: DrawableJudgement;

	constructor(
		object: StandardHitObject,
		protected hasNumber = true,
	) {
		super(object);
		this.context.provide<DrawableHitCircle>("drawable", this);

		this.wrapper.visible = false;

		this.hitCircleSprite = new Sprite();
		this.hitCircleOverlay = new Sprite();
		this.flashPiece = new Sprite();

		this.flashPiece.anchor.set(0.5);
		this.flashPiece.blendMode = "add";

		this.hitCircleSprite.anchor.set(0.5);
		this.hitCircleSprite.alpha = 0.9;

		this.hitCircleOverlay.anchor.set(0.5);
		this.sprite.addChild(this.hitCircleSprite, this.hitCircleOverlay);

		this.approachCircle = new DrawableApproachCircle(object).hook(this.context);
		this.object = object;

		this.wrapper.addChild(this.sprite, this.flashPiece);

		const judgementLayer = new RenderLayer();
		this.container.addChild(judgementLayer, this.wrapper);

		if (this.hasNumber) {
			this.defaults = new DrawableDefaults(object).hook(this.context);
			this.wrapper.addChild(this.defaults.container);
		}

		this.hitSound = new HitSample(object.samples).hook(this.context);

		this.refreshSprite();
		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);

		this.timelineObject = new TimelineHitCircle(object).hook(this.context);

		this.judgement = new DrawableJudgement(this);
		judgementLayer.attach(this.judgement.container);
		this.container.addChild(this.judgement.container);

		inject<GameplayConfig>("config/gameplay")?.onChange(
			"hitAnimation",
			(val) => {
				if (!val) return;

			this.hitCircleSprite.tint = this.color;
			},
		);
	}

	private _isSelected = false;
	get isSelected() {
		return this._isSelected;
	}
	set isSelected(val: boolean) {
		this._isSelected = val;
		this.select.visible = val;
	}

	checkCollide(x: number, y: number, time: number) {
		if (
			!(
				this.object.startTime - this.object.timePreempt < time &&
				time < this.object.startTime + 240
			)
		)
			return false;

		const radius = 64 * this.object.scale * (256 / 236);
		const objectPosition = new Vector2(
			this.object.startX + this.object.stackedOffset.x,
			this.object.startY + this.object.stackedOffset.y,
		);
		const pointer = new Vector2(x, y);

		const dist = pointer.distance(objectPosition);
		return dist < radius && this.wrapper.visible;
	}

	protected _object!: StandardHitObject;
	get object() {
		return this._object;
	}

	set object(val: StandardHitObject) {
		this._object = val;
		this.container.x = val.startX + val.stackedOffset.x;
		this.container.y = val.startY + val.stackedOffset.y;
		this.container.scale.set(
			val.scale *
				(inject<SkinManager>("skinManager")?.getCurrentSkin()?.config.General
					.Argon
					? 0.95
					: 1),
		);
		this.select.x = val.startX + val.stackedOffset.x;
		this.select.y = val.startY + val.stackedOffset.y;
		this.select.scale.set(
			val.scale *
				(inject<SkinManager>("skinManager")?.getCurrentSkin()?.config.General
					.Argon
					? 0.95
					: 1),
		);

		if (this.approachCircle) this.approachCircle.object = val;
		if (this.defaults) this.defaults.object = val;
		if (this.hitSound) this.hitSound.hitSamples = val.samples;
		if (this.timelineObject) this.timelineObject.object = val;
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

		if (skin.config.General.Argon) {
			argonRefreshSprite(this);
			this.updateFn = argonUpdate;
		} else {
			legacyRefreshSprite(this);
			this.updateFn = legacyUpdate;
		}
	}

	playHitSound(time: number, _?: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		const isSeeking =
			inject<ProgressBar>("ui/main/controls/progress")?.isSeeking ||
			inject<BeatmapSet>("beatmapset")?.isSeeking;
		if (!beatmap || isSeeking) return;

		const startTime = this.evaluation?.hitTime ?? this.object.startTime;
		if (
			!(
				beatmap.previousTime <= startTime &&
				startTime < time &&
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
		this.updateFn(this, time);

		this.judgement.frame(time);
	}

	get evaluation(): BaseObjectEvaluation | undefined {
		return this._evaluation;
	}

	set evaluation(value: BaseObjectEvaluation | undefined) {
		this._evaluation = value;
		this.judgement.evaluation = value;
	}

	override eval(frames: LegacyReplayFrame[]) {
		const hitInstance = frames.find((frame, idx, arr) => {
			if (
				Math.abs(frame.startTime - this.object.startTime) >
				this.object.hitWindows.windowFor(HitResult.Meh)
			)
				return false;

			const previousFrame = arr[idx - 1];
			if (!previousFrame) return false;

			const leftOn = !previousFrame.mouseLeft && frame.mouseLeft;
			const rightOn = !previousFrame.mouseRight && frame.mouseRight;
			if (!(leftOn || rightOn)) return false;

			const x = frame.position.x;
			const y = frame.position.y;

			const radius = 64 * this.object.scale;
			const objectPosition = new Vector2(
				this.object.startX + this.object.stackedOffset.x,
				this.object.startY + this.object.stackedOffset.y,
			);
			const pointer = new Vector2(x, y);

			const dist = pointer.distance(objectPosition);

			return dist <= radius;
		});

		if (!hitInstance)
			return {
				value: HitResult.Miss,
				hitTime: Infinity,
			};

		const resultFor = (timeOffset: number): HitResult => {
			timeOffset = Math.abs(timeOffset);

			for (let result = HitResult.Perfect; result >= HitResult.Miss; --result) {
				if (
					this.object.hitWindows.isHitResultAllowed(result) &&
					timeOffset < Math.round(this.object.hitWindows.windowFor(result))
				) {
					return result;
				}
			}

			return HitResult.None;
		};

		const hitResult = resultFor(hitInstance.startTime - this.object.startTime);

		return {
			value: hitResult,
			hitTime: hitInstance.startTime,
		};
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
