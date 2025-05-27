import { LayoutContainer } from "@pixi/layout/components";
import { Container, Graphics, Rectangle } from "pixi.js";
import { inject, provide } from "@/Context";
import type Gameplay from ".";
import FPS from "../FPS";
import type ResponsiveHandler from "@/ResponsiveHandler";

export default class Gameplays {
	container = new Container({
		label: "gameplays",
		layout: {
			width: "100%",
			flex: 1,
			borderWidth: 1,
			borderColor: {
				r: 0,
				g: 0,
				b: 0,
				a: 0,
			},
		},
	});

	gameplays: Set<Gameplay> = new Set();
	separator: Graphics = new Graphics();

	addGameplay(gameplay: Gameplay) {
		this.gameplays.add(gameplay);
		this.container.addChildAt(gameplay.container, 0);

		this.reLayoutChildren();
	}

	removeGameplay(gameplay: Gameplay) {
		this.gameplays.delete(gameplay);
		this.container.removeChild(gameplay.container);

		this.reLayoutChildren();
		this.container.addChild(this.separator);
	}

	constructor() {
		const fps = new FPS();

		this.separator.x = 0;
		this.separator.y = 0;
		this.separator.interactive = false;

		this.container.addChild(this.separator, fps.container);
		this.container.on("layout", () => this.reLayoutChildren());

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							flex: 1,
							aspectRatio: undefined,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							flex: undefined,
							aspectRatio: 4 / 3,
						};
						break;
					}
				}
			},
		);
	}

	reLayoutChildren() {
		this.separator.clear();

		const columnsCount = Math.ceil(Math.sqrt(this.gameplays.size));
		const heightDenominator = Math.ceil(this.gameplays.size / columnsCount);

		const w = 100 / columnsCount;
		const h = 100 / heightDenominator;

		const containerWidth = this.container.layout?.computedLayout.width ?? 0;
		const containerHeight = this.container.layout?.computedLayout.height ?? 0;

		const deserialized = Array(...this.gameplays);
		for (let i = 0; i < deserialized.length; i++) {
			const gameplay = deserialized[i];
			gameplay.container.layout = {
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
