import type { StandardHitObject } from "osu-standard-stable";
import type { Container } from "pixi.js";
import type DrawableApproachCircle from "./DrawableApproachCircle";
import SkinnableElement from "./SkinnableElement";

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

	abstract destroy(): void;
}
