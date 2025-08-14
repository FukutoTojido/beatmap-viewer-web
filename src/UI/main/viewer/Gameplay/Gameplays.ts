import { LayoutContainer } from "@pixi/layout/components";
import { Container, Graphics, Rectangle } from "pixi.js";
import { inject, provide } from "@/Context";
import type Gameplay from ".";
import FPS from "../FPS";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { Tween } from "@tweenjs/tween.js";
import { defaultEasing, tweenGroup } from "@/UI/animation/AnimationController";

export default class Gameplays {
	container = new Container({
		label: "gameplays",
		layout: {
			width: "100%",
			flex: 1,
		},
	});

	gameplays: Set<Gameplay> = new Set();

	addGameplay(gameplay: Gameplay, index?: number) {
		if (index === undefined) this.gameplays.add(gameplay);
		else {
			const deserialized = Array(...this.gameplays);
			const newArr = [
				...deserialized.slice(0, index),
				gameplay,
				...deserialized.slice(index),
			];
			this.gameplays = new Set(newArr);
		}
		this.container.addChildAt(gameplay.container, 0);

		this.reLayoutChildren(gameplay);
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

	w = 0;
	h = 0;

	constructor() {
		const fps = new FPS();

		this.container.addChild(fps.container);
		this.container.on("layout", (layout) => {
			const width = layout.computedLayout.width;
			const height = layout.computedLayout.height;

			if (width !== this.w || height !== this.h) {
				this.w = width;
				this.h = height;

				this.reLayoutChildren();
			}
		});

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

	tweenMap: Map<Gameplay, Tween> = new Map();

	reLayoutChildren(target?: Gameplay) {
		const deserialized = Array(...this.gameplays);

		const columnsCount = Math.ceil(Math.sqrt(this.gameplays.size));
		const rowsCount = Math.ceil(deserialized.length / columnsCount);
		const missingLast =
			deserialized.length % columnsCount === 0
				? 0
				: columnsCount - (deserialized.length % columnsCount);
		const heightDenominator = Math.ceil(this.gameplays.size / columnsCount);

		const w = 100 / columnsCount;
		const h = 100 / heightDenominator;

		for (let i = 0; i < deserialized.length; i++) {
			const gameplay = deserialized[i];
			const col = i % columnsCount;
			const row = Math.floor(i / columnsCount);

			const currentTween = this.tweenMap.get(gameplay);
			currentTween?.stop();
			if (currentTween) tweenGroup.remove(currentTween);

			const oldLayout = {
				top: gameplay.container.layout?.yoga.getPosition(1).value,
				left: gameplay.container.layout?.yoga.getPosition(0).value,
				width: gameplay.container.layout?.yoga.getWidth().value,
				height: gameplay.container.layout?.yoga.getHeight().value,
				paddingTop: gameplay.container.layout?.yoga.getPadding(1).value,
				paddingLeft: gameplay.container.layout?.yoga.getPadding(0).value,
				paddingBottom: gameplay.container.layout?.yoga.getPadding(3).value,
				paddingRight: gameplay.container.layout?.yoga.getPadding(2).value,
				scale: 0,
			};

			const newLayout = {
				top: Math.floor(i / columnsCount) * h,
				left:
					(i % columnsCount) * w +
					(row === rowsCount - 1 ? (w * missingLast) / 2 : 0),
				width: w,
				height: h,
				paddingTop: deserialized.length > 1 ? (row === 0 ? 10 : 5) : 0,
				paddingBottom:
					deserialized.length > 1
						? row === Math.floor((deserialized.length - 1) / columnsCount)
							? 10
							: 5
						: 0,
				paddingLeft: deserialized.length > 1 ? (col === 0 ? 10 : 5) : 0,
				paddingRight:
					deserialized.length > 1
						? col === columnsCount - 1 || i === deserialized.length - 1
							? 10
							: 5
						: 0,
				scale: 1,
			};

			const tween = new Tween({
				value: oldLayout,
			})
				.easing(defaultEasing)
				.to(
					{
						value: newLayout,
					},
					500,
				)
				.onUpdate(
					({
						value: {
							top,
							left,
							width,
							height,
							paddingTop,
							paddingBottom,
							paddingLeft,
							paddingRight,
							scale,
						},
					}) => {
						gameplay.container.layout = {
							top: gameplay === target ? `${newLayout.top}%` : `${top ?? 0}%`,
							left:
								gameplay === target ? `${newLayout.left}%` : `${left ?? 0}%`,
							width:
								gameplay === target ? `${newLayout.width}%` : `${width ?? 0}%`,
							height:
								gameplay === target
									? `${newLayout.height}%`
									: `${height ?? 0}%`,
							paddingTop,
							paddingLeft,
							paddingBottom,
							paddingRight,
						};

						if (gameplay === target) {
							gameplay.container.scale = 0.5 + 0.5 * scale;
							gameplay.container.alpha = scale;
						}
					},
				)
				.onComplete(() => {
					this.tweenMap.delete(gameplay);
					tweenGroup.remove(tween);
				})
				.onStop(() => {
					this.tweenMap.delete(gameplay);
					tweenGroup.remove(tween);
				})
				.start();

			tweenGroup.add(tween);

			if (i !== 0) {
				gameplay.showCloseButton();
			} else {
				gameplay.hideCloseButton();
			}

			if (deserialized.length > 1) {
				gameplay.showDiffName();
				gameplay.background.layout = {
					borderRadius: 20,
				};
				gameplay.statsContainer.scale.set(
					1 / Math.max(1, (columnsCount - 1) / 2),
				);
			} else {
				gameplay.hideDiffName();
				gameplay.background.layout = {
					borderRadius: 0,
				};
				gameplay.statsContainer.scale.set(1);
			}
		}
	}
}
