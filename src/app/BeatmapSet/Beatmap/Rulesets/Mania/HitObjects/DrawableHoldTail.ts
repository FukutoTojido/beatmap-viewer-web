import type { HoldTail } from "osu-mania-stable";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type ManiaBeatmap from "../ManiaBeatmap";
import type DrawableHold from "./DrawableHold";
import DrawableHoldHead from "./DrawableHoldHead";

export default class DrawableHoldTail extends DrawableHoldHead {
	constructor(
		object: HoldTail,
		public hold: DrawableHold,
	) {
		super(object, hold);
	}

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

		const note =
			skin.getTexture(`mania-note${index}t`) ??
			skin.getTexture(`mania-note${index}`) ??
			BLANK_TEXTURE;
		const ratio = note.height / note.width;

		this.note.width = beatmap.columnWidths[this.object.column];
		this.note.height = beatmap.columnWidths[this.object.column] * ratio;
		this.note.texture = note;
	}
}
