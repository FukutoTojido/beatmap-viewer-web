import { type SamplePoint, Vector2 } from "osu-classes";
import type { StandardHitObject } from "osu-standard-stable";
import { type ColorSource, Container, Sprite } from "pixi.js";
import HitSample from "@/Audio/HitSample";
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
import type Beatmap from "..";
import TimelineHitCircle from "../Timeline/TimelineHitCircle";
import DrawableApproachCircle from "./DrawableApproachCircle";
import DrawableDefaults from "./DrawableDefaults";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";

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

		this.container.addChild(this.wrapper);

		if (this.hasNumber) {
			this.defaults = new DrawableDefaults(object);
			this.wrapper.addChild(this.defaults.container);
		}

		this.hitSound = new HitSample(object.samples).hook(this.context);

		this.refreshSprite();
		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);

		this.timelineObject = new TimelineHitCircle(object).hook(this.context);
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
		if (!(this.object.startTime - this.object.timePreempt < time && time < this.object.startTime + 240)) return false;

		const radius = 54.4 * this.object.scale;
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
		this.updateFn(this, time);
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
