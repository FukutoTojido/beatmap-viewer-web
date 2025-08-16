import { Group, Tween } from "@tweenjs/tween.js";
import bezier from "bezier-easing";

export const tweenGroup = new Group();

export const defaultEasing = bezier(0, 0.4, 0, 1.0);

export type AnimationOptions = {
	easing?: (t: number) => number;
	duration: number;
};

export default class AnimationController {
	animations: Map<string, Tween> = new Map();

	addAnimation(
		key: string,
		from: number,
		to: number,
		callback: (value: number) => void,
		duration = 200,
		easing?: (t: number) => number,
		onComplete?: () => void,
		onStop?: () => void,
	) {
		this.animations.get(key)?.stop();

		const tween = new Tween({
			value: from,
		})
			.easing(easing ?? defaultEasing)
			.to(
				{
					value: to,
				},
				duration,
			)
			.onUpdate(({ value }) => {
				callback(value);
			})
			.onComplete(() => {
				this.animations.delete(key);
				tweenGroup.remove(tween);
				onComplete?.();
			})
			.onStop(() => {
				this.animations.delete(key);
				tweenGroup.remove(tween);
				onStop?.();
			})
			.start();

		this.animations.set(key, tween);
		tweenGroup.add(tween);

		return tween;
	}
}
