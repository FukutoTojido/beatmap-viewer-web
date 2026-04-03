import { Container, Graphics, Rectangle } from "pixi.js";
import type Beatmap from "@/BeatmapSet/Beatmap";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import type GameplayConfig from "@/Config/GameplayConfig";
import { inject } from "@/Context";
import Gameplay from "../Shared/Gameplay";

export default class StandardGameplay extends Gameplay {
	grid: Graphics;
	cursorLayer: Container;

	constructor(public beatmap: Beatmap) {
		super(beatmap);
		
		this.cursorLayer = new Container({
			label: "cursorContainer",
			boundsArea: new Rectangle(0, 0, 512, 384),
		});

		this.grid = new Graphics({
			interactive: false,
			eventMode: "none",
			visible: inject<GameplayConfig>("config/gameplay")?.showGrid ?? true,
			alpha: 0.5
		});
		this.drawGrid(512);

		this.wrapper.addChild(
			this.background,
			this.grid,
			this.objectsContainer,
			this.selectContainer,
			this.selector,
			this.cursorLayer,
		);

		inject<GameplayConfig>("config/gameplay")?.onChange(
			"showGrid",
			(val: boolean) => {
				this.grid.visible = val;
			},
		);
	}

	reLayout() {
		const isFullscreen =
			inject<FullscreenConfig>("config/fullscreen")?.fullscreen;

		const shouldKeepScale =
			isFullscreen ||
			(this.context.consume<number>("clients") !== 1 &&
				!inject<ExperimentalConfig>("config/experimental")?.overlapGameplays);

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

		this.wrapper.scale.set(shouldKeepScale ? 1 : 0.98 / 0.8);
	}

	drawGrid(width = 512) {
		const scale = width / 512;
		const height = 384 * scale;
		const unit = 32 * scale;
		const halfUnit = unit / 2;
		const cornerRadius = 8 * scale;

		this.grid.clear().roundRect(0, 0, width, height, cornerRadius).stroke({
			color: 0xffffff,
			alpha: 0.8,
			width: 2,
			alignment: 0.5,
		});

		for (let i = unit; i < width - 1; i += unit) {
			this.grid.moveTo(i, 0).lineTo(i, height).stroke({
				color: 0xffffff,
				alpha: 0.4,
				pixelLine: true,
			});
		}

		for (let i = unit; i < height - 1; i += unit) {
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

		this.grid
			.moveTo(width / 2, 0)
			.lineTo(width / 2, height)
			.stroke({
				color: 0xffffff,
				alpha: 1,
				width: 1,
				alignment: 0.5,
				pixelLine: false,
			});

		this.grid
			.moveTo(0, height / 2)
			.lineTo(width, height / 2)
			.stroke({
				color: 0xffffff,
				alpha: 1,
				width: 1,
				alignment: 0.5,
				pixelLine: false,
			});
	}
}
