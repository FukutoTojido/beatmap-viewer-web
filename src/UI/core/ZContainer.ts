import { LayoutContainer, type LayoutContainerOptions } from "@pixi/layout/components";
import type {
	FillInput,
	StrokeInput,
} from "pixi.js";
import AnimationController from "../animation/AnimationController";

export interface ZContainerStyle {
	backgroundColor?: FillInput;
	border?: StrokeInput;
    radius?: number
}

export default class ZContainer extends LayoutContainer {
	animationControler = new AnimationController();

	triggerAnimation(key: string, from: number, to: number, callback: (currentValue: number) => void, duration?: number, easing?: (t: number) => number) {
		this.animationControler.addAnimation(key, from, to, callback, duration, easing);
	}
}
