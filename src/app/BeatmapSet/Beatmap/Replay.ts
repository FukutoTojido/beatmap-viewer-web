import { HitResult, type LegacyReplayFrame, type Score } from "osu-classes";
import { ScoreDecoder } from "osu-parsers";
import { Slider, Spinner } from "osu-standard-stable";
import { Sprite } from "pixi.js";
import { inject } from "@/Context";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import { binarySearch, Clamp } from "@/utils";
import type Beatmap from ".";
import DrawableSlider from "./HitObjects/DrawableSlider";

export type BaseObjectEvaluation = {
	value: number;
	value_v2?: number;
	hitTime: number;
};

export type SliderEvaluation = BaseObjectEvaluation & {
	circlesEvals: BaseObjectEvaluation[];
	trackingStates: LegacyReplayFrame[][];
};

export default class Replay {
	decoder: ScoreDecoder = new ScoreDecoder();
	data?: Score;
	evals: BaseObjectEvaluation[] = [];
	cursor: Sprite = new Sprite({
		label: "cursor",
		anchor: 0.5,
		interactive: false,
		eventMode: "none",
	});
	trails: Sprite[];

	constructor() {
		this.cursor.texture =
			inject<SkinManager>("skinManager")
				?.getCurrentSkin()
				.getTexture("cursor") ?? BLANK_TEXTURE;

		this.trails = [...Array(10)].map(
			(_, idx) =>
				new Sprite({
					anchor: 0.5,
					alpha: (10 - idx) / 10,
					interactive: false,
					eventMode: "none",
				}),
		);
		for (const trail of this.trails) {
			trail.texture =
				inject<SkinManager>("skinManager")
					?.getCurrentSkin()
					.getTexture("cursortrail") ?? BLANK_TEXTURE;
		}

		inject<SkinManager>("skinManager")?.addSkinChangeListener((skin) => {
			this.cursor.texture = skin.getTexture("cursor") ?? BLANK_TEXTURE;
			for (const trail of this.trails) {
				trail.texture = skin.getTexture("cursortrail") ?? BLANK_TEXTURE;
			}
		});
	}

	async process(raw: Blob) {
		this.data = await this.decoder.decodeFromBuffer(
			await raw.arrayBuffer(),
			true,
		);
	}

	evaluate(beatmap: Beatmap) {
		if (!this.data?.replay) {
			throw "Replay has not been initiated";
		}

		const frames = this.data.replay?.frames as LegacyReplayFrame[];
		const data = [];

		let frameIndex = 0;

		for (const drawable of beatmap.objects) {
			const startTime =
				drawable instanceof DrawableSlider
					? drawable.drawableCircles[0].object.startTime -
						drawable.drawableCircles[0].object.hitWindows.windowFor(
							HitResult.Meh,
						)
					: drawable.object.startTime -
						drawable.object.hitWindows.windowFor(HitResult.Meh);
			const endTime =
				drawable.object instanceof Slider
					? drawable.object.endTime
					: drawable.object instanceof Spinner
						? drawable.object.endTime
						: drawable.object.startTime +
							drawable.object.hitWindows.windowFor(HitResult.Meh);

			while (frames[frameIndex] && frames[frameIndex].startTime < startTime) {
				frameIndex++;
			}
			const objectFrames: LegacyReplayFrame[] = [];

			while (frames[frameIndex] && frames[frameIndex].startTime <= endTime) {
				objectFrames.push(frames[frameIndex++]);
			}

			const evaluation = drawable.eval(objectFrames as LegacyReplayFrame[]);
			drawable.evaluation = evaluation;

			data.push(evaluation);
			frameIndex =
				frames.findLastIndex(
					(frame) =>
						frame.startTime <=
						Math.min(
							evaluation.hitTime,
							drawable.object.startTime +
								drawable.object.hitWindows.windowFor(HitResult.Meh) +
								1,
						),
				) + 1;
		}

		return data;
	}

	frame(time: number) {
		const frames = (this.data?.replay?.frames ?? []) as LegacyReplayFrame[];

		let idx = binarySearch(time, frames, (mid, value) => mid.startTime - value);
		while (frames[idx].startTime > time) {
			if (idx <= 0) break;
			idx--;
		}
		const last = frames[idx];
		const next = frames[idx + 1] ?? last;

		const percentage = Clamp(
			(time - last.startTime) / Math.max(1, next.startTime - last.startTime),
		);
		const position = last.position.add(
			next.position.subtract(last.position).scale(percentage),
		);

		this.cursor.x = position.x;
		this.cursor.y = position.y;

		for (let i = 0; i < 10; i++) {
			const j = idx - i;
			if (j < 0) {
				this.trails[i].visible = false;
				continue;
			}

			this.trails[i].visible = true;
			this.trails[i].x = frames[j].position.x;
			this.trails[i].y = frames[j].position.y;
		}
	}
}
