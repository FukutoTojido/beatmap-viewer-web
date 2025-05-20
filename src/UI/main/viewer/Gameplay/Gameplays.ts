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
		interactive: false,
		interactiveChildren: false,
	});

	containers: Set<Gameplay> = new Set();
	separator: Graphics = new Graphics();

	addGameplay(container: Gameplay) {
		this.containers.add(container);
		this.container.addChildAt(container.container, 0);

		this.reLayoutChildren();
	}

	constructor() {
		this.separator.x = 0;
		this.separator.y = 0;

		this.container.addChild(this.separator);
		this.container.on("layout", () => this.reLayoutChildren());
	}

	reLayoutChildren() {
		this.separator.clear();

		const columnsCount = Math.ceil(Math.sqrt(this.containers.size));
		const heightDenominator = Math.ceil(this.containers.size / columnsCount);

		const w = 100 / columnsCount;
		const h = 100 / heightDenominator;

		// console.log(columnsCount, heightDenominator, w, h);

		const containerWidth = this.container.layout?.computedLayout.width ?? 0;
		const containerHeight = this.container.layout?.computedLayout.height ?? 0;

		const deserialized = Array(...this.containers);
		for (let i = 0; i < deserialized.length; i++) {
			const container = deserialized[i];
			container.container.layout = {
				top: `${Math.floor(i / columnsCount) * h}%`,
				left: `${(i % columnsCount) * w}%`,
				width: `${w}%`,
				height: `${h}%`,
			};

			if (i % columnsCount < columnsCount - 1) {
				this.separator.moveTo(
					(((i % columnsCount) + 1) * containerWidth * w) / 100,
					(Math.floor(i / columnsCount) * h * containerHeight) / 100,
				);
				this.separator.lineTo(
					(((i % columnsCount) + 1) * containerWidth * w) / 100,
					((Math.floor(i / columnsCount) + 1) * h * containerHeight) / 100,
				);
			}

			if (Math.floor(i / columnsCount) < heightDenominator - 1) {
				this.separator.moveTo(
					((i % columnsCount) * containerWidth * w) / 100,
					((Math.floor(i / columnsCount) + 1) * h * containerHeight) / 100,
				);
				this.separator.lineTo(
					(((i % columnsCount) + 1) * containerWidth * w) / 100,
					((Math.floor(i / columnsCount) + 1) * h * containerHeight) / 100,
				);
			}

			this.separator.stroke({
				color: 0x585b70,
				pixelLine: true,
			});
		}
	}
}
