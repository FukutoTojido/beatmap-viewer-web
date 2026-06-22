import type { Note } from "osu-mania-stable";
import { Container, Sprite, Texture } from "pixi.js";
import HitSample from "@/Audio/HitSample";
import type BeatmapSet from "@/BeatmapSet";
import type Beatmap from "@/BeatmapSet/Beatmap";
import { inject } from "@/Context";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type ManiaBeatmap from "../ManiaBeatmap";
import DrawableManiaHitObject from "./DrawableManiaHitObject";

export default class DrawableNote extends DrawableManiaHitObject {
	container: Container = new Container();
	note: Sprite = new Sprite({
		anchor: { x: 0.5, y: 1 },
	});

	hitSound?: HitSample;

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

		this.hitSound = new HitSample(object.samples).hook(this.context);
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
				? "s"
				: this.object.column < halfPoint
					? (this.object.column % 2) + 1
					: ((beatmap.data.originalTotalColumns - this.object.column - 1) % 2) +
						1;

		const note = skin.getTexture(`mania-note${index}`.toLowerCase()) ?? BLANK_TEXTURE;
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

	playHitSound(time: number, _?: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		const isSeeking =
			inject<ProgressBar>("ui/main/controls/progress")?.isSeeking ||
			inject<BeatmapSet>("beatmapset")?.isSeeking;
		if (!beatmap || isSeeking) return;


		const startTime = this.evaluation?.hitTime ?? this.object.startTime;
		if (
			!(
				beatmap.previousTime <= startTime &&
				startTime < time &&
				time - beatmap.previousTime < 30
			)
		)
			return;

		const currentSamplePoint = beatmap.getNearestSamplePoint(
			this.object.startTime,
		);
		this.hitSound?.play(currentSamplePoint);
	}

	destroy() {
		this.note.destroy();
		super.destroy();
	}
}
