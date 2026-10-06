import { type HitObject, HitResult, type LegacyReplayFrame } from "osu-classes";
import type { Container } from "pixi.js";
import type { BaseObjectEvaluation } from "../../../Replay";
import type TimelineHitObject from "../../../Timeline/TimelineHitObject";
import type DrawableApproachCircle from "../../Standard/HitObjects/DrawableApproachCircle";
import SkinnableElement from "./SkinnableElement";

export interface IHasApproachCircle {
	approachCircle: DrawableApproachCircle;
}

export default abstract class DrawableHitObject extends SkinnableElement {
	abstract container: Container;
	abstract object: HitObject;
	abstract update(time: number): void;
	abstract getTimeRange(): { start: number; end: number };
	abstract playHitSound(time?: number, offset?: number): void;
	timelineObject?: TimelineHitObject;

	constructor(_: HitObject) {
		super();
		this.context.provide("object", this);
	}

	protected _isSelected = false;
	get isSelected() {
		return this._isSelected;
	}
	set isSelected(val: boolean) {
		this._isSelected = val;
	}
	
	protected _isHover = false;
	get isHover() {
		return this._isHover;
	}
	set isHover(val: boolean) {
		this._isHover = val;
	}

	select?: Container;
	checkCollide(_: number, __: number, ___: number) {
		return false;
	}

	disable() {
		this.container.visible = false;
	}

	_evaluation?: BaseObjectEvaluation;
	get evaluation(): BaseObjectEvaluation | undefined {
		return this._evaluation;
	}

	set evaluation(value: BaseObjectEvaluation | undefined) {
		this._evaluation = value;
	}

	eval(_: LegacyReplayFrame[]) {
		return {
			value: HitResult.Great,
			hitTime: this.object.startTime,
		};
	}

	abstract destroy(): void;
}
