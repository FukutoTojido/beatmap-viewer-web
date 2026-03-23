import { type Hold, HoldHead, HoldTail } from "osu-mania-stable";
import { Container, Sprite, Texture } from "pixi.js";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type IAnimatedSkinnableElement from "../../Shared/HitObjects/IAnimatedSkinnableElement";
import type ManiaBeatmap from "../ManiaBeatmap";
import DrawableHoldHead from "./DrawableHoldHead";
import DrawableHoldTail from "./DrawableHoldTail";
import DrawableManiaHitObject from "./DrawableManiaHitObject";
import type DrawableNote from "./DrawableNote";

export default class DrawableHold
	extends DrawableManiaHitObject
	implements IAnimatedSkinnableElement
{
	container: Container = new Container();
	body: Sprite = new Sprite({ anchor: { x: 0.5, y: 1.0 } });

	nestedObjects: DrawableNote[] = [];
	texturesList: Texture[] = [];

	constructor(object: Hold) {
		super(object);

		const texture = Texture.WHITE;
		this.body.texture = texture;
		this.body.width = 30;

		this.container.addChild(this.body);
		this.container.x = this.object.column * 30 + 15;

		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);

		for (const object of this.object.nestedHitObjects) {
			if (object instanceof HoldHead)
				this.nestedObjects.push(
					new DrawableHoldHead(object, this).hook(this.context),
				);
			if (object instanceof HoldTail)
				this.nestedObjects.push(
					new DrawableHoldTail(object, this).hook(this.context),
				);
		}

		for (const object of this.nestedObjects) {
			this.container.addChild(object.container);
		}
	}

	protected declare _object: Hold;
	get object() {
		return this._object as Hold;
	}
	set object(val: Hold) {
		this._object = val;
	}

	refreshSprite(): void {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const beatmap = this.context.consume<ManiaBeatmap>("beatmapObject");
		if (!beatmap) return;

		const halfPoint = Math.floor(beatmap.data.originalTotalColumns / 2);
		const index =
			beatmap.data.originalTotalColumns % 2 === 1
				? "S"
				: this.object.column < halfPoint
					? (this.object.column % 2) + 1
					: ((beatmap.data.originalTotalColumns - this.object.column - 1) % 2) +
						1;

		const hold = skin.getAnimatedTexture(`mania-note${index}l`);
		this.texturesList = hold;

		const note = skin.getTexture(`mania-note${index}h`) ?? BLANK_TEXTURE;
		const ratio = note.height / note.width;
		
		const columnWidth = beatmap.columnWidths[this.object.column];

		this.body.y = -columnWidth * ratio / 2;
		this.body.width = columnWidth;
		
		let offset = 0;
		for (let i = 0; i < this.object.column; i++) {
			offset += beatmap.columnWidths[i];
		}
		
		this.container.x = offset + beatmap.columnWidths[this.object.column] / 2;

		for (const object of this.nestedObjects) {
			object.refreshSprite();
		}
	}

	update(time: number) {
		const progress = super.update(time);
		const beatmap = this.context.consume<ManiaBeatmap>("beatmapObject");
		const hitPosition = beatmap?.hitPosition ?? 480;

		const bodyDistance = this.getDistanceAtTime(time, this.object.endTime);
		this.body.height = Math.max(bodyDistance - Math.max(progress, 0), 0);

		this.container.visible =
			progress <= hitPosition && time <= this.object.endTime + 2;

		for (const object of this.nestedObjects) {
			object.update(time, progress);
		}

		const startTime = this.object.startTime;
		const frameLength = 1000 / 30;
		const frameIndex =
			Math.floor(Math.max(0, time - startTime) / frameLength) %
			this.texturesList.length;

		this.body.texture = this.texturesList[frameIndex];

		return progress;
	}

	getTimeRange() {
		return {
			start: this.object.startTime,
			end: this.object.endTime,
		};
	}

	playHitSound(_?: number, __?: number): void {}

	destroy() {
		super.destroy();
	}
}
