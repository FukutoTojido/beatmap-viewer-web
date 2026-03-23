import type { Note } from "osu-mania-stable";
import { Container, Sprite, Texture } from "pixi.js";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type ManiaBeatmap from "../ManiaBeatmap";
import DrawableManiaHitObject from "./DrawableManiaHitObject";

export default class DrawableNote extends DrawableManiaHitObject {
	container: Container = new Container();
	note: Sprite = new Sprite({
		anchor: { x: 0.5, y: 1 },
	});

	constructor(object: Note) {
		super(object);

		const texture = Texture.WHITE;
		this.note.texture = texture;
		this.note.width = 30;

		this.container.addChild(this.note);
		this.container.x = this.object.column * 30 + 15;

		this.refreshSprite();
		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);
	}

	protected declare _object: Note;

	override refreshSprite(): void {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const beatmap = this.context.consume<ManiaBeatmap>("beatmapObject");
		if (!beatmap) return;

		const halfPoint = Math.floor(beatmap.data.originalTotalColumns / 2);
		const index =
			this.object.column === halfPoint &&
			beatmap.data.originalTotalColumns % 2 === 1
				? "S"
				: this.object.column < halfPoint
					? (this.object.column % 2) + 1
					: ((beatmap.data.originalTotalColumns - this.object.column - 1) % 2) +
						1;

		const note = skin.getTexture(`mania-note${index}`) ?? BLANK_TEXTURE;
		const ratio = note.height / note.width;
		

		this.note.width = beatmap.columnWidths[this.object.column];
		this.note.height = beatmap.columnWidths[this.object.column] * ratio;
		this.note.texture = note;
		
		let offset = 0;
		for (let i = 0; i < this.object.column; i++) {
			offset += beatmap.columnWidths[i];
		}
		
		this.container.x = offset + beatmap.columnWidths[this.object.column] / 2;
	}

	update(time: number, _?: number) {
		const beatmap = this.context.consume<ManiaBeatmap>("beatmapObject");
		const hitPosition = beatmap?.hitPosition ?? 480;

		const progress = super.update(time);

		this.container.visible =
			progress <= hitPosition && time <= this.object.startTime + 2;
		return progress;
	}

	getTimeRange() {
		return {
			start: this.object.startTime,
			end: this.object.startTime,
		};
	}

	playHitSound(_?: number, __?: number): void {}

	destroy() {
		this.note.destroy();
		super.destroy();
	}
}
