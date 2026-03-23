import type { HoldHead } from "osu-mania-stable";
import { Clamp } from "@/utils";
import type ManiaBeatmap from "../ManiaBeatmap";
import type DrawableHold from "./DrawableHold";
import DrawableNote from "./DrawableNote";
import { BLANK_TEXTURE } from "@/Skinning/Skin";

export default class DrawableHoldHead extends DrawableNote {
	constructor(
		object: HoldHead,
		public hold: DrawableHold,
	) {
		super(object);
		this.container.x = 0;
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

		const note = skin.getTexture(`mania-note${index}h`) ?? skin.getTexture(`mania-note${index}`) ?? BLANK_TEXTURE;
		const ratio = note.height / note.width;

		this.note.width = beatmap.columnWidths[this.object.column];
		this.note.height = beatmap.columnWidths[this.object.column] * ratio;
		this.note.texture = note;
	}
	
	update(time: number, offset: number): number {
		const beatmap = this.context.consume<ManiaBeatmap>("beatmapObject");
		const hitPosition = beatmap?.hitPosition ?? 480;

		const progress = this.hold.getDistanceAtTime(time, this.object.startTime);
		const y = hitPosition - progress;
		const yHold = Clamp(hitPosition - offset, 0, hitPosition);

		this.container.y = -Clamp(yHold - y, 0, hitPosition);
		this.container.visible = true;
		return progress;
	}
}
