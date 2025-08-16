import { tweenGroup } from "@/UI/animation/AnimationController";
import Easings from "@/UI/Easings";
import { Tween } from "@tweenjs/tween.js";
import { type Container, Graphics } from "pixi.js";
import type Gameplay from ".";

export default class Spinner {
	graphics: Graphics;

	private _spin = false;

	constructor(private parent: Gameplay) {
		this.graphics = new Graphics();
		this.graphics.arc(0, 0, 30, 0, (5 * Math.PI) / 6).stroke({
			color: "white",
			width: 10,
			cap: "round",
		});
	}

	private _lastTime = 0;
	spinFn(t: number) {
		this.graphics.angle += 1 * (t - this._lastTime);
		this._lastTime = t;

		if (!this.spin) return;
		requestAnimationFrame((time) => this.spinFn(time));
	}

	get spin() {
		return this._spin;
	}

	set spin(val: boolean) {
		if (val) {
			this._spin = val;
			this.graphics.alpha = 1;
			this.parent.container.addChild(this.graphics);
			this.parent.objectsContainer.alpha = 0;
			requestAnimationFrame((time) => this.spinFn(time));
		} else {
			const tween = new Tween({ value: 100 })
				.easing(Easings.Out)
				.to({ value: 0 }, 500)
				.onUpdate(({ value }) => {
					this.graphics.alpha = value / 100;
					this.parent.objectsContainer.alpha = 1 - value / 100;
				})
				.onComplete(() => {
					this.parent.container.removeChild(this.graphics);
					tweenGroup.remove(tween);
					this.parent.objectsContainer.alpha = 1;
					this._spin = val;
				})
				.onStop(() => {
					this.parent.container.removeChild(this.graphics);
					tweenGroup.remove(tween);
					this.parent.objectsContainer.alpha = 1;
					this._spin = val;
				})
				.start();

			tweenGroup.add(tween);
		}
	}
}
