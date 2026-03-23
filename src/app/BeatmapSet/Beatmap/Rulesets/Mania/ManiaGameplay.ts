import { Container, Graphics, Sprite } from "pixi.js";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import { inject } from "@/Context";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import Gameplay from "../Shared/Gameplay";
import type ManiaBeatmap from "./ManiaBeatmap";

export default class ManiaGameplay extends Gameplay {
	grid: Graphics;
	mask: Graphics;

	keys: Sprite[] = [];
	stageHint: Sprite;
	keysContainer: Container = new Container();

	constructor(public beatmap: ManiaBeatmap) {
		super(beatmap);

		this.grid = new Graphics({
			interactive: false,
			eventMode: "none",
		});
		this.drawGrid(640);

		this.mask = new Graphics({
			label: "mask",
		});
		this.mask.clear().rect(0, 0, 640, 480).fill({
			color: 0x000000,
			alpha: 0.5,
		});

		this.stageHint = new Sprite({
			label: "stage-hint",
			anchor: { x: 0, y: 0.5 },
		});

		this.keysContainer.addChild(this.stageHint);
		for (let i = 0; i < this.beatmap.data.originalTotalColumns; i++) {
			const sprite = new Sprite({
				label: `key-${i}`,
				anchor: { x: 0.5, y: 1 },
				width: 30,
			});
			this.keys.push(sprite);
			this.keysContainer.addChild(sprite);
		}

		this.wrapper.addChild(
			this.background,
			this.grid,
			this.keysContainer,
			this.objectsContainer,
			this.selectContainer,
			this.selector,
		);

		this.objectsContainer.addChild(this.mask);
		this.objectsContainer.mask = this.mask;

		this.refreshSprite();
		const skinManager = inject<SkinManager>("skinManager");
		skinManager?.addSkinChangeListener(() => {
			this.refreshSprite();
		});
	}

	reLayout() {
		const isFullscreen =
			inject<FullscreenConfig>("config/fullscreen")?.fullscreen;

		const shouldKeepScale =
			isFullscreen ||
			(this.context.consume<number>("clients") !== 1 &&
				!inject<ExperimentalConfig>("config/experimental")?.overlapGameplays);

		let columnWidth = 0;
		for (const width of this.beatmap.columnWidths ?? []) {
			columnWidth += width;
		}

		const width = this.wrapper.layout?.computedLayout.width ?? 0;
		const height = this.wrapper.layout?.computedLayout.height ?? 0;

		const scale = height / 480;
		const _w = 640 * scale;
		const _h = 480 * scale;

		this.objectsContainer.scale.set(scale);

		const gameplayWidth = columnWidth * scale;
		const offset = (width - gameplayWidth) / 2;
		this.objectsContainer.x = offset;
		this.objectsContainer.y = (height - _h) / 2;

		this.mask
			.clear()
			.rect(0, 0, gameplayWidth / scale, _h)
			.fill({
				color: 0x000000,
				alpha: 0.5,
			});

		this.selectContainer.scale.set(scale);

		this.selectContainer.x = (width - _w) / 2;
		this.selectContainer.y = (height - _h) / 2;

		this.spinner.graphics.x = width / 2;
		this.spinner.graphics.y = height / 2;

		this.grid.x = offset;
		this.grid.y = (height - _h) / 2;
		this.drawGrid(gameplayWidth, _h);

		this.keysContainer.x = offset;
		this.keysContainer.y = height;

		let accumulated = 0;
		for (let i = 0; i < this.keys.length; i++) {
			const width = this.beatmap.columnWidths?.[i] ?? 30;

			const object = this.keys[i];
			object.x = accumulated + width / 2;
			object.width = width;

			accumulated += width;
		}

		this.stageHint.width = columnWidth;
		this.stageHint.y = this.beatmap.hitPosition - 480;
		this.keysContainer.scale.set(scale);

		this.wrapper.scale.set(1);
		this.background.scale.set(shouldKeepScale ? 1 : 1.2);
	}

	refreshSprite() {
		const skinManager = inject<SkinManager>("skinManager");
		if (!skinManager) return;

		const skin = skinManager?.getCurrentSkin();
		if (!skin) return;

		const beatmap = this.beatmap;
		const halfPoint = Math.floor(beatmap.data.originalTotalColumns / 2);

		for (let i = 0; i < this.keys.length; i++) {
			const object = this.keys[i];
			const index =
				i === halfPoint && beatmap.data.originalTotalColumns % 2 === 1
					? "S"
					: i < halfPoint
						? (i % 2) + 1
						: ((beatmap.data.originalTotalColumns - i - 1) % 2) + 1;

			const key = skin.getTexture(`mania-key${index}`) ?? BLANK_TEXTURE;

			object.height = key.height * 0.625;
			object.texture = key;
		}

		const stageHint = skin.getTexture("mania-stage-hint") ?? BLANK_TEXTURE;
		this.stageHint.height = (stageHint.height * 9) / 10;
		this.stageHint.texture = stageHint;

		this.reLayout();
	}

	drawGrid(width = 512, height = 384) {
		this.grid.clear().rect(0, 0, width, height).fill({
			color: 0x000000,
			alpha: 0.5,
		});
	}
}
