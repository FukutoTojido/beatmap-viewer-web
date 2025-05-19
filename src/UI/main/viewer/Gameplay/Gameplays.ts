import { LayoutContainer } from "@pixi/layout/components";
import { type Container, Graphics, Rectangle } from "pixi.js";
import { provide } from "@/Context";
import type Gameplay from ".";

export default class Gameplays {
	container = new LayoutContainer({
		label: "gameplays",
		layout: {
			width: "100%",
			flex: 1,
		},
	});

	containers: Set<Gameplay> = new Set();

	addGameplay(container: Gameplay) {
		this.containers.add(container);
		this.container.addChildAt(container.container, 0);

		this.reLayoutChildren();
	}

	constructor() {
		this.container.on("layout", () => this.reLayoutChildren());
	}

	reLayoutChildren() {
		const widthDenominator = Math.min(this.containers.size, 2);
		const heightDenominator = Math.ceil(this.containers.size / 2);

		const w = 100 / widthDenominator;
		const h = 100 / heightDenominator;

		console.log(widthDenominator, heightDenominator, w, h);

		const deserialized = Array(...this.containers);
		for (let i = 0; i < deserialized.length; i++) {
			const container = deserialized[i];
			container.container.layout = {
				top: `${Math.floor(i / 2) * h}%`,
				left: i % 2 === 0 ? "0%" : "50%",
				width: `${w}%`,
				height: `${h}%`,
			};
		}
	}
}
