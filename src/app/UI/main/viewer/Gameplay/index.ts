import type { LayoutOptions } from "@pixi/layout";
import { LayoutContainer } from "@pixi/layout/components";
import { Tween } from "@tweenjs/tween.js";
import { Vector2 } from "osu-classes";
import {
	// Application,
	Assets,
	Container,
	Graphics,
	Rectangle,
	Sprite,
	Text,
	type TextStyleOptions,
} from "pixi.js";
import type Audio from "@/Audio";
import type BeatmapSet from "@/BeatmapSet";
import type Beatmap from "@/BeatmapSet/Beatmap";
import DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type BackgroundConfig from "@/Config/BackgroundConfig";
import type ColorConfig from "@/Config/ColorConfig";
import type GameplayConfig from "@/Config/GameplayConfig";
import { inject } from "@/Context";
import { tweenGroup } from "@/UI/animation/AnimationController";
import Easings from "@/UI/Easings";
import Spinner from "./Spinner";

const defaultStyle: TextStyleOptions = {
	fontFamily: "Rubik",
	fill: 0xbac2de,
	align: "left",
	fontSize: 14,
	fontWeight: "400",
};

const defaultLayout: Omit<LayoutOptions, "target"> = {
	objectPosition: "top left",
	objectFit: "none",
};

export default class Gameplay {
	container: Container;
	wrapper: Container;
	grid: Graphics;
	background: LayoutContainer;
	objectsContainer: Container;
	selector: Graphics;
	selectContainer: Container;
	diffName!: Text;
	statsContainer!: LayoutContainer;
	closeButton!: LayoutContainer;
	spinner: Spinner;
	cursorLayer: Container;

	csText!: Text;
	arText!: Text;
	odText!: Text;
	hpText!: Text;

	selected: Set<number> = new Set();

	constructor(public beatmap: Beatmap) {
		this.container = new Container({
			label: "gameplay",
			layout: {
				position: "absolute",
				width: 0,
				height: 0,
				alignItems: "flex-start",
			},
			isRenderGroup: true,
			interactive: true,
		});
		this.wrapper = new Container({
			label: "wrapper",
			layout: {
				width: "100%",
				height: "100%",
			},
			interactive: true,
		});
		this.background = new LayoutContainer({
			label: "dim",
			layout: {
				width: "100%",
				height: "100%",
				backgroundColor: [
					0,
					0,
					0,
					Math.min(
						1,
						(inject<BackgroundConfig>("config/background")?.backgroundDim ??
							70) / 100,
					),
				],
				borderRadius: 20,
			},
		});
		this.selector = new Graphics()
			.rect(0, 0, 1, 1)
			.fill({ color: 0xffffff, alpha: 0.3 })
			.stroke({ width: 1, color: 0xffffff, pixelLine: true });

		this.objectsContainer = new Container({
			label: "objectsContainer",
			boundsArea: new Rectangle(0, 0, 512, 384),
		});

		this.cursorLayer = new Container({
			label: "cursorContainer",
			boundsArea: new Rectangle(0, 0, 512, 384),
		});

		this.selectContainer = new Container({
			label: "selectContainer",
			boundsArea: new Rectangle(0, 0, 512, 384),
		});

		this.spinner = new Spinner(this);
		this.spinner.spin = true;

		this.grid = new Graphics({
			interactive: false,
			eventMode: "none",
			visible: inject<GameplayConfig>("config/gameplay")?.showGrid ?? true,
		});
		this.drawGrid(512);

		this.createStats();
		this.createCloseButton();

		this.container.addChild(this.wrapper, this.spinner.graphics);
		this.wrapper.addChild(
			this.background,
			this.grid,
			this.objectsContainer,
			this.selectContainer,
			this.selector,
			this.cursorLayer,
		);
		this.wrapper.on("layout", () => {
			const width = this.wrapper.layout?.computedLayout.width ?? 0;
			const height = this.wrapper.layout?.computedLayout.height ?? 0;

			const scale = Math.min(width / 640, height / 480);
			const _w = 512 * scale;
			const _h = 384 * scale;

			this.objectsContainer.scale.set(scale);

			this.objectsContainer.x = (width - _w) / 2;
			this.objectsContainer.y = (height - _h) / 2;

			this.cursorLayer.scale.set(scale);
			this.cursorLayer.x = (width - _w) / 2;
			this.cursorLayer.y = (height - _h) / 2;

			this.grid.x = (width - _w) / 2;
			this.grid.y = (height - _h) / 2;

			this.drawGrid(_w);

			this.selectContainer.scale.set(scale);

			this.selectContainer.x = (width - _w) / 2;
			this.selectContainer.y = (height - _h) / 2;

			this.spinner.graphics.x = width / 2;
			this.spinner.graphics.y = height / 2;
		});

		this.loadEventListeners();

		inject<ColorConfig>("config/color")?.onChange("color", ({ base, text }) => {
			this.closeButton.layout = { backgroundColor: base };
			this.statsContainer.layout = { backgroundColor: base };
			this.diffName.style.fill = text;
		});

		inject<BackgroundConfig>("config/background")?.onChange(
			"backgroundDim",
			(value: number) => {
				this.background.layout = {
					backgroundColor: [0, 0, 0, Math.max(0.01, value / 100)],
				};
			},
		);

		inject<BackgroundConfig>("config/background")?.onChange(
			"breakSection",
			(isBreak: boolean) => {
				this._currentTween?.stop();

				const tween = new Tween({
					value: this.background.alpha,
				})
					.easing(Easings.Out)
					.to(
						{
							value: isBreak ? 0.6 : 1,
						},
						1000,
					)
					.onUpdate(({ value }) => {
						this.background.alpha = value;
					})
					.onComplete(() => {
						tweenGroup.remove(tween);
					})
					.onStop(() => {
						tweenGroup.remove(tween);
					})
					.start();

				tweenGroup.add(tween);
				this._currentTween = tween;
			},
		);

		inject<GameplayConfig>("config/gameplay")?.onChange(
			"showGrid",
			(val: boolean) => {
				this.grid.visible = val;
			},
		);
	}

	private _currentTween?: Tween;

	drawGrid(width = 512) {
		const scale = width / 512;
		const height = 384 * scale;
		const unit = 32 * scale;
		const halfUnit = unit / 2;
		const cornerRadius = 10 * scale;

		this.grid.clear().roundRect(0, 0, width, height, cornerRadius).stroke({
			color: 0xffffff,
			alpha: 0.8,
			width: 2,
			alignment: 0.5,
		});

		for (let i = unit; i < width; i += unit) {
			if (i === width / 2) {
				this.grid.moveTo(i, 0).lineTo(i, height).stroke({
					color: 0xffffff,
					alpha: 0.6,
					width: 2,
					alignment: 0.5,
				});
				continue;
			}
			this.grid.moveTo(i, 0).lineTo(i, height).stroke({
				color: 0xffffff,
				alpha: 0.4,
				pixelLine: true,
			});
		}

		for (let i = unit; i < height; i += unit) {
			if (i === height / 2) {
				this.grid.moveTo(0, i).lineTo(width, i).stroke({
					color: 0xffffff,
					alpha: 0.6,
					width: 2,
					alignment: 0.5,
				});
				continue;
			}
			this.grid.moveTo(0, i).lineTo(width, i).stroke({
				color: 0xffffff,
				alpha: 0.4,
				pixelLine: true,
			});
		}

		this.grid
			.moveTo(0, halfUnit)
			.lineTo(0, cornerRadius)
			.arc(cornerRadius, cornerRadius, cornerRadius, Math.PI, -Math.PI / 2)
			.lineTo(halfUnit, 0)
			.stroke({
				color: 0xffffff,
				alpha: 1,
				width: 4,
				alignment: 0.5,
				cap: "round",
				join: "round",
			})
			.moveTo(width - halfUnit, 0)
			.lineTo(width - cornerRadius, 0)
			.arc(width - cornerRadius, cornerRadius, cornerRadius, -Math.PI / 2, 0)
			.lineTo(width, halfUnit)
			.stroke({
				color: 0xffffff,
				alpha: 1,
				width: 4,
				alignment: 0.5,
				cap: "round",
				join: "round",
			})
			.moveTo(width, height - halfUnit)
			.lineTo(width, height - cornerRadius)
			.arc(
				width - cornerRadius,
				height - cornerRadius,
				cornerRadius,
				0,
				Math.PI / 2,
			)
			.lineTo(width - halfUnit, height)
			.stroke({
				color: 0xffffff,
				alpha: 1,
				width: 4,
				alignment: 0.5,
				cap: "round",
				join: "round",
			})
			.moveTo(halfUnit, height)
			.lineTo(cornerRadius, height)
			.arc(
				cornerRadius,
				height - cornerRadius,
				cornerRadius,
				Math.PI / 2,
				Math.PI,
			)
			.lineTo(0, height - halfUnit)
			.stroke({
				color: 0xffffff,
				alpha: 1,
				width: 4,
				alignment: 0.5,
				cap: "round",
				join: "round",
			});
	}

	dragWindow: [Vector2, Vector2] = [new Vector2(0, 0), new Vector2(0, 0)];

	loadEventListeners() {
		const beatmap = this.beatmap;
		// const canvas = inject<Application>("ui/app")?.canvas;

		let clicked = false;

		this.wrapper.on("pointerup", () => {
			clicked = false;
			this.dragWindow = [new Vector2(0, 0), new Vector2(0, 0)];

			// if (canvas) {
			// 	canvas.style.touchAction = "auto";
			// }
		});

		this.wrapper.on("pointerupoutside", () => {
			clicked = false;
			this.dragWindow = [new Vector2(0, 0), new Vector2(0, 0)];

			// if (canvas) {
			// 	canvas.style.touchAction = "auto";
			// }
		});

		this.wrapper.on("globalpointermove", (event) => {
			const pos = this.objectsContainer.toLocal(event.global);

			if (clicked) {
				this.dragWindow[1] = new Vector2(event.global.x, event.global.y);
			}

			for (const idx of beatmap.previousObjects) {
				const obj = beatmap.objects[idx];
				if (obj instanceof DrawableHitCircle || obj instanceof DrawableSlider) {
					const collided = obj.checkCollide(
						pos.x,
						pos.y,
						inject<BeatmapSet>("beatmapset")?.context.consume<Audio>("audio")
							?.currentTime ?? 0,
					);

					if (obj instanceof DrawableSlider) {
						obj.isHover = collided;
					}
				}
			}
		});

		this.wrapper.on("pointerdown", (event) => {
			// if (canvas) {
			// 	canvas.style.touchAction = "none";
			// }

			clicked = true;
			this.dragWindow[0] = new Vector2(event.global.x, event.global.y);
			this.dragWindow[1] = new Vector2(event.global.x, event.global.y);

			const pos = this.objectsContainer.toLocal(event.global);
			const selected = [];

			for (const idx of beatmap.previousObjects) {
				const obj = beatmap.objects[idx];
				if (obj instanceof DrawableHitCircle || obj instanceof DrawableSlider) {
					const collided = obj.checkCollide(
						pos.x,
						pos.y,
						inject<BeatmapSet>("beatmapset")?.context.consume<Audio>("audio")
							?.currentTime ?? 0,
					);
					if (collided) selected.push(idx);
				}
			}

			selected.sort(
				(a, b) =>
					beatmap.objects[a].object.startTime -
					beatmap.objects[b].object.startTime,
			);

			if (!event.ctrlKey || selected.length === 0) {
				for (const select of this.selected) {
					this.removeSelected(select);
				}
			}
			if (selected.length !== 0) this.selected.add(selected[0]);

			for (const select of this.selected) {
				this.addSelected(select);
			}
		});
	}

	addSelected(idx: number) {
		this.selected.add(idx);
		const obj = this.beatmap.objects[idx] as DrawableHitCircle | DrawableSlider;
		obj.isSelected = true;
		if (obj.timelineObject) obj.timelineObject.isSelected = true;
		this.selectContainer.addChild(obj.select);
	}

	removeSelected(idx: number) {
		this.selected.delete(idx);
		const obj = this.beatmap.objects[idx] as DrawableHitCircle | DrawableSlider;
		obj.isSelected = false;
		if (obj.timelineObject) obj.timelineObject.isSelected = false;
		this.selectContainer.removeChild(obj.select);
	}

	checkInBound(point: Vector2) {
		const start = this.objectsContainer.toLocal(this.dragWindow[0]);
		const end = this.objectsContainer.toLocal(this.dragWindow[1]);

		const minX = Math.min(start.x, end.x);
		const maxX = Math.max(start.x, end.x);
		const minY = Math.min(start.y, end.y);
		const maxY = Math.max(start.y, end.y);

		return (
			minX <= point.x && point.x <= maxX && minY <= point.y && point.y <= maxY
		);
	}

	showCloseButton() {
		this.container.addChild(this.closeButton);
	}

	hideCloseButton() {
		this.container.removeChild(this.closeButton);
	}

	showDiffName() {
		this.container.addChild(this.statsContainer);
	}

	hideDiffName() {
		this.container.removeChild(this.statsContainer);
	}

	createCloseButton() {
		const closeButtonContainer = new LayoutContainer({
			layout: {
				width: 30,
				height: 30,
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: inject<ColorConfig>("config/color")?.color.base,
				borderRadius: 15,
				position: "absolute",
				top: 20,
				right: 20,
				transformOrigin: "top right",
			},
		});

		const closeButton = new Sprite({
			width: 20,
			height: 20,
			layout: {
				width: 20,
				height: 20,
			},
		});

		closeButton.tint =
			inject<ColorConfig>("config/color")?.color.text ?? 0xffffff;

		inject<ColorConfig>("config/color")?.onChange("color", ({ text }) => {
			closeButton.tint = text;
		});

		(async () => {
			closeButton.texture = await Assets.load({
				src: "./assets/x.png",
				parser: "texture",
			});
		})();

		closeButtonContainer.cursor = "pointer";
		const unloadSelf = () => {
			const bms = this.beatmap.context.consume<BeatmapSet>("beatmapset");
			if (!bms) return;

			const idx = bms.difficulties.findIndex((b) => b === this.beatmap);
			bms.unloadSlave(idx);
		};
		closeButtonContainer.addEventListener("click", () => unloadSelf());
		closeButtonContainer.addEventListener("tap", () => unloadSelf());

		closeButtonContainer.addChild(closeButton);
		this.closeButton = closeButtonContainer;
	}

	createStats() {
		this.statsContainer = new LayoutContainer({
			label: "stats",
			layout: {
				display: "flex",
				alignItems: "center",
				flexDirection: "row",
				gap: 10,
				backgroundColor: inject<ColorConfig>("config/color")?.color.base,
				borderRadius: 20,
				padding: 10,
				paddingInline: 20,
				flex: 0,
				height: "auto",
				position: "absolute",
				top: 20,
				left: 20,
				transformOrigin: "top left",
			},
		});

		this.diffName = new Text({
			text: this.beatmap.data.metadata.version,
			style: {
				...defaultStyle,
				fill: inject<ColorConfig>("config/color")?.color.text,
			},
			layout: defaultLayout,
		});

		this.statsContainer.addChild(this.diffName);
	}
}
