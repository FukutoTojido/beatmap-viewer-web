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

	addGameplay(gameplay: Gameplay) {
		this.gameplays.add(gameplay);
		this.container.addChildAt(gameplay.container, 0);

		this.reLayoutChildren();
	}

	removeGameplay(gameplay: Gameplay) {
		this.gameplays.delete(gameplay);
		this.container.removeChild(gameplay.container);

		this.reLayoutChildren();
	}

	switchGameplay(a: Gameplay, b: Gameplay) {
		const deserialized = Array(...this.gameplays);
		const idxA = deserialized.findIndex((beatmap) => beatmap === a);
		const idxB = deserialized.findIndex((beatmap) => beatmap === b);

		if (idxA === -1 || idxB === -1) return;
		deserialized[idxA] = b;
		deserialized[idxB] = a;

		this.gameplays = new Set(deserialized);
		this.reLayoutChildren();
	}

	constructor() {
		const fps = new FPS();

		this.container.addChild(fps.container);
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
		const columnsCount = Math.ceil(Math.sqrt(this.gameplays.size));
		const heightDenominator = Math.ceil(this.gameplays.size / columnsCount);

		const w = 100 / columnsCount;
		const h = 100 / heightDenominator;

		const deserialized = Array(...this.gameplays);
		for (let i = 0; i < deserialized.length; i++) {
			const gameplay = deserialized[i];
			gameplay.container.layout = {
				top: `${Math.floor(i / columnsCount) * h}%`,
				left: `${(i % columnsCount) * w}%`,
				width: `${w}%`,
				height: `${h}%`,
			};

			if (i !== 0) {
				gameplay.showCloseButton();
			} else {
				gameplay.hideCloseButton();
			}

			if (deserialized.length > 1) {
				gameplay.showDiffName();
			} else {
				gameplay.hideDiffName();
			}

			const col = i % columnsCount;
			const row = Math.floor(i / columnsCount);

			if (deserialized.length > 1) {
				gameplay.container.layout = {
					padding: 5,
					paddingTop: row === 0 ? 10 : undefined,
					paddingBottom:
						row === Math.floor((deserialized.length - 1) / columnsCount)
							? 10
							: undefined,
					paddingLeft: col === 0 ? 10 : undefined,
					paddingRight: col === columnsCount - 1 ? 10 : undefined,
				};
			} else {
				gameplay.container.layout = {
					padding: undefined,
					paddingTop: undefined,
					paddingLeft: undefined,
					paddingBottom: undefined,
					paddingRight: undefined,
				};
			}
		}
	}
}
