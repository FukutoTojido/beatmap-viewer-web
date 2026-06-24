import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { inject } from "@/Context";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import { Clamp } from "@/utils";
import Gameplay from "../Shared/Gameplay";
import DrawableHold from "./HitObjects/DrawableHold";
import type DrawableManiaHitObject from "./HitObjects/DrawableManiaHitObject";
import DrawableNote from "./HitObjects/DrawableNote";
import type ManiaBeatmap from "./ManiaBeatmap";

export default class ManiaGameplay extends Gameplay {
	grid: Graphics;
	mask: Graphics;

	keys: Sprite[] = [];
	stageLights: Sprite[] = [];

	stageHint: Sprite;
	keysContainer: Container = new Container();

	stageLightTextureList: Texture[] = [];
	lightingLTextureList: Texture[] = [];
	lightingNTextureList: Texture[] = [];

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
			const light = new Sprite({
				label: `light-${i}`,
				anchor: { x: 0.5, y: 1 },
				width: 30,
				visible: false,
			});

			this.keys.push(sprite);
			this.stageLights.push(light);

			this.keysContainer.addChild(sprite, light);
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

			const light = this.stageLights[i];
			light.x = accumulated + width / 2;
			light.width = width;
			light.y = -67;

			accumulated += width;
		}

		this.stageHint.width = columnWidth;
		this.stageHint.y = this.beatmap.hitPosition - 480;
		this.keysContainer.scale.set(scale);

		this.wrapper.scale.set(1);
		this.background.scale.set(1);
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

			const key =
				skin.getTexture(`mania-key${index}`.toLowerCase()) ?? BLANK_TEXTURE;

			object.height = key.height * 0.625;
			object.texture = key;
		}

		this.stageLightTextureList = skin.getAnimatedTexture(
			`mania-stage-light`.toLowerCase(),
		) ?? [BLANK_TEXTURE];

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

	frame(time: number, drawables: DrawableManiaHitObject[]) {
		// peppy said it should have been 400 * 100 / currentBPM but who knows lol
		const animationLength = 250;

		const scanned = drawables.filter((drawable) => {
			const startTime = drawable.object.startTime;
			let endTime = drawable.object.startTime;

			if (drawable instanceof DrawableHold) {
				endTime = drawable.object.endTime;
			}

			return startTime <= time && time <= endTime + 200;
		});

		const state: (DrawableManiaHitObject | undefined)[] = Array(
			this.beatmap.data.originalTotalColumns,
		).fill(undefined);
		for (const drawable of scanned) {
			const idx = drawable.object.column;

			if (!state[idx]) {
				state[idx] = drawable;
			}

			if (state[idx].object.startTime < drawable.object.startTime) {
				state[idx] = drawable;
			}
		}

		for (let i = 0; i < this.beatmap.data.originalTotalColumns; i++) {
			const drawable = state[i];
			const stageLight = this.stageLights[i];

			if (!drawable) {
				stageLight.visible = false;
				stageLight.alpha = 0;
				continue;
			}

			const startTime = drawable.object.startTime;
			const deltaStart = time - startTime;

			let deltaEnd = 0;

			if (drawable instanceof DrawableNote) {
				deltaEnd = time - drawable.object.startTime;
			}

			if (drawable instanceof DrawableHold) {
				deltaEnd = time - drawable.object.endTime;
			}

			if (deltaEnd > animationLength || deltaStart < 0) {
				stageLight.visible = false;
				stageLight.alpha = 0;
				continue;
			}

			const frameLength = 1000 / 30;
			const frameIndex =
				Math.floor(Math.max(0, deltaStart) / frameLength) %
				this.stageLightTextureList.length;

			const texture = this.stageLightTextureList[frameIndex];
			stageLight.texture = texture;
			stageLight.height = texture.height;

			if (deltaStart >= 0) {
				stageLight.visible = true;
				stageLight.alpha = 1;
			}

			if (deltaEnd >= 0 && deltaEnd < animationLength) {
				const opacity = 1 - deltaEnd / animationLength;
				stageLight.alpha = Clamp(opacity, 0, 1);
			}
		}
	}
}
