import { Tween } from "@tweenjs/tween.js";
import { Container } from "pixi.js";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { defaultEasing, tweenGroup } from "@/UI/animation/AnimationController";
import FPS from "../FPS";
import type Gameplay from ".";

export default class Gameplays {
	container = new Container({
		label: "gameplays",
		layout: {
			width: "100%",
			flex: 1,
		},
		interactive: true,
	});

	gameplays: Set<Gameplay> = new Set();

	addGameplay(gameplay: Gameplay, index?: number) {
		if (index === undefined) this.gameplays.add(gameplay);
		else {
			const deserialized = [...this.gameplays];
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
		const deserialized = [...this.gameplays];
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

		inject<ExperimentalConfig>("config/experimental")?.onChange(
			"overlapGameplays",
			() => this.reLayoutChildren(),
		);
	}

	tweenMap: Map<Gameplay, Tween> = new Map();

	reLayoutChildren(target?: Gameplay) {
		const overlapGameplays = inject<ExperimentalConfig>(
			"config/experimental",
		)?.overlapGameplays;

		const deserialized = [...this.gameplays];

		const columnsCount = Math.ceil(Math.sqrt(this.gameplays.size));
		const rowsCount = Math.ceil(deserialized.length / columnsCount);
		const missingLast =
			deserialized.length % columnsCount === 0
				? 0
				: columnsCount - (deserialized.length % columnsCount);
		const heightDenominator = Math.ceil(this.gameplays.size / columnsCount);

		const w = overlapGameplays ? 100 : 100 / columnsCount;
		const h = overlapGameplays ? 100 : 100 / heightDenominator;

		for (let i = 0; i < deserialized.length; i++) {
			const gameplay = deserialized[i];
			const col = overlapGameplays ? 0 : i % columnsCount;
			const row = overlapGameplays ? 0 : Math.floor(i / columnsCount);

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
				borderRadius: gameplay.background.layout?.style.borderRadius ?? 20,
			};

			const newLayout = {
				top: overlapGameplays ? 0 : Math.floor(i / columnsCount) * h,
				left: overlapGameplays
					? 0
					: (i % columnsCount) * w +
						(row === rowsCount - 1 ? (w * missingLast) / 2 : 0),
				width: w,
				height: h,
				paddingTop: w !== 100 ? (row === 0 ? 10 : 5) : 0,
				paddingBottom:
					w !== 100
						? row === Math.floor((deserialized.length - 1) / columnsCount)
							? 10
							: 5
						: 0,
				paddingLeft: w !== 100 ? (col === 0 ? 10 : 5) : 0,
				paddingRight:
					w !== 100
						? col === columnsCount - 1 || i === deserialized.length - 1
							? 10
							: 5
						: 0,
				scale: 1,
				borderRadius: w !== 100 ? 20 : 0,
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
							borderRadius,
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

						gameplay.background.layout = {
							borderRadius: borderRadius,
						};
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

			if (i !== 0 && !overlapGameplays) {
				gameplay.showCloseButton();
			} else {
				gameplay.hideCloseButton();
			}

			gameplay.background.visible =
				!overlapGameplays || i === deserialized.length - 1;

			if (w !== 100) {
				gameplay.showDiffName();

				const scale = Math.min(1, 1 / columnsCount * 1.5);

				gameplay.statsContainer.scale.set(scale);
				gameplay.closeButton.scale.set(scale);
			} else {
				gameplay.hideDiffName();
				gameplay.statsContainer.scale.set(1);
				gameplay.closeButton.scale.set(1);
			}
		}
	}
}
