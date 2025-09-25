import {
	LayoutContainer,
	type LayoutContainerOptions,
} from "@pixi/layout/components";
import { AlphaFilter, type FillInput, type StrokeInput } from "pixi.js";
import AnimationController from "../animation/AnimationController";

export interface ZContainerStyle {
	backgroundColor?: FillInput;
	border?: StrokeInput;
	radius?: number;
}

export default class ZContainer extends LayoutContainer {
	animationControler = new AnimationController();
	alphaFilter = new AlphaFilter({ alpha: 1 });
	
	constructor(options?: LayoutContainerOptions) {
		super(options);
		this.filters = [this.alphaFilter];
	}

	triggerAnimation(
		key: string,
		from: number,
		to: number,
		callback: (currentValue: number) => void,
		duration?: number,
		easing?: (t: number) => number,
		onComplete?: () => void,
		onStop?: () => void
	) {
		return this.animationControler.addAnimation(
			key,
			from,
			to,
			callback,
			duration,
			easing,
			onComplete,
			onStop
		);
	}
}
