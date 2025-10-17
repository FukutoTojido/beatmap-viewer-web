import type { StandardHitObject } from "osu-standard-stable";
import type { Container } from "pixi.js";
import type DrawableApproachCircle from "./DrawableApproachCircle";
import SkinnableElement from "./SkinnableElement";
import { HitResult, type LegacyReplayFrame } from "osu-classes";
import type { BaseObjectEvaluation } from "../Replay";

export interface IHasApproachCircle {
	approachCircle: DrawableApproachCircle;
}

export default abstract class DrawableHitObject extends SkinnableElement {
	abstract container: Container;
	abstract object: StandardHitObject;
	abstract update(time: number): void;
	abstract getTimeRange(): { start: number; end: number };
	playHitSound(_?: number, __?: number) {}

	constructor(_: StandardHitObject) {
		super();
		this.context.provide("object", this);
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
