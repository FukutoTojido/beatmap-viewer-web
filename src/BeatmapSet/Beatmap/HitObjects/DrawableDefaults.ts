import { BitmapText, Container, Sprite, Text } from "pixi.js";
import { ScopedClass } from "/src/Context";
import type { StandardHitObject } from "osu-standard-stable";

const SPACING = 10;
export default class DrawableDefaults extends ScopedClass {
	container: Container = new Container();
	sprites: BitmapText[] = [];

	constructor(private object: StandardHitObject) {
		super();
		const number = object.currentComboIndex + 1;
		const digits = number.toString().split("");
		const middle = (digits.length - 1) / 2;

		this.sprites = digits.map<BitmapText>((digit, idx) => {
			const offset = (idx - middle) * SPACING;
			const text = new BitmapText({
				text: digit,
				style: {
					fontSize: 24,
					fontFamily: "Rubik",
					fill: 0xcdd6f4,
				},
				x: offset,
			});

			text.anchor.set(0.5);
			return text;
		});

		this.container.addChild(...this.sprites);
		this.container.interactive = false;
        this.container.interactiveChildren = false;
	}

	update(time: number) {
		const fadeOutDuration = 50;

        if (time <= this.object.startTime) {
            this.container.alpha = 1;
            return;
        }

		if (time > this.object.startTime && time <= this.object.startTime + fadeOutDuration) {
            const opacity = 1 - Math.min(1, Math.max(0, (time - this.object.startTime) / fadeOutDuration));
			this.container.alpha = opacity;

            return;
        }

        this.container.alpha = 0;
	}
}
