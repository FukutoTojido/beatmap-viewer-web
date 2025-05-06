import { BeatmapDecoder } from "osu-parsers";
import { type StandardBeatmap, StandardRuleset } from "osu-standard-stable";
import { inject, ScopedClass } from "../../Context";
import type { Beatmap as BeatmapData } from "osu-classes";
import type DrawableHitObject from "./HitObjects/DrawableHitObject";
import { Circle, Slider } from "osu-standard-stable";
import DrawableHitCircle from "./HitObjects/DrawableHitCircle";
import DrawableSlider from "./HitObjects/DrawableSlider";
import Audio from "../../Audio";
import type { Resource } from "..";
import { Assets, BitmapText, type Container } from "pixi.js";
import type Background from "../../UI/main/viewer/Background";

const decoder = new BeatmapDecoder();
const ruleset = new StandardRuleset();

export default class Beatmap extends ScopedClass {
	data: StandardBeatmap;
	audioContext: AudioContext;
	objects: DrawableHitObject[] = [];
	audio?: Audio;

	private loaded = false;
	private previousObjects = new Set<DrawableHitObject>();

	constructor(private raw: string) {
		super();
		this.data = this.context.provide(
			"beatmap",
			ruleset.applyToBeatmap(decoder.decodeFromString(this.raw)),
		);
		this.audioContext = new AudioContext();
	}

	async load() {
		let start = performance.now();
		this.objects = this.data.hitObjects
			.map((object) => {
				if (object instanceof Circle)
					return new DrawableHitCircle(object).hook(this.context);
				if (object instanceof Slider)
					return new DrawableSlider(object).hook(this.context);
				return null;
			})
			.filter((object) => object !== null);
		console.log(
			`Took ${(performance.now() - start).toFixed(2)}ms to initiate ${this.objects.length} objects`,
		);

		start = performance.now();
		const audioFile = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.data.general.audioFilename);
		if (!audioFile?.blob)
			throw new Error("Cannot find audio in resource?");

		this.audio = new Audio(this.audioContext);
		await this.audio.createBufferNode(audioFile.blob);
		console.log(
			`Took ${(performance.now() - start).toFixed(2)}ms to initiate audio`,
		);

		const background = inject<Background>("ui/main/viewer/background");
		const backgroundResource = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.data.events.backgroundPath ?? "");

		if (backgroundResource?.blob) {
			const url = URL.createObjectURL(backgroundResource.blob);
			background?.updateTexture(
				await Assets.load({ src: url, loadParser: "loadTextures" }),
			);
		}

		this.loaded = true;
		requestAnimationFrame(() => this.frame());
	}

	private frame() {
		this.update(this.audio?.currentTime ?? 0);

		const timestamp = inject<BitmapText>("ui/main/viewer/timestamp");
        if (timestamp) timestamp.text = `${Math.round(this.audio?.currentTime ?? 0)} ms`;
		
		requestAnimationFrame(() => this.frame());
	}

	private inRange(val: number, start: number, end: number) {
		if (start <= val && val <= end) return 0;
		if (val > end) return 1;
		if (val < start) return -1;
		return -1;
	}

	private binarySearchNearestIndex(time: number) {
		let start = 0;
		let end = this.objects.length - 1;

		while (end >= start) {
			const mid = start + Math.floor((end - start) / 2);
			const { start: midStart, end: midEnd } = this.objects[mid].getTimeRange();
			const isInTimeRange = this.inRange(time, midStart, midEnd);

			if (isInTimeRange === 0) return mid;
			if (isInTimeRange === 1) {
				start = mid + 1;
				continue;
			}
			if (isInTimeRange === -1) {
				end = mid - 1;
			}
		}

		return -1;
	}

	private searchObjects(time: number) {
		const idx = this.binarySearchNearestIndex(time);
		if (idx === -1) return new Set<DrawableHitObject>();

		const objects = new Set<DrawableHitObject>();
		objects.add(this.objects[idx]);

		let start = idx - 1;
		while (
			start >= 0 &&
			this.inRange(
				time,
				this.objects[start].getTimeRange().start,
				this.objects[start].getTimeRange().end,
			) === 0
		) {
			objects.add(this.objects[start]);
			start--;
		}

		let end = idx + 1;
		while (
			end <= this.objects.length - 1 &&
			this.inRange(
				time,
				this.objects[end].getTimeRange().start,
				this.objects[end].getTimeRange().end,
			) === 0
		) {
			objects.add(this.objects[end]);
			end++;
		}

		return objects;
	}

	update(time: number) {
		if (!this.loaded)
			throw new Error("Cannot update a beatmap that hasn't been initialized");

		const objectContainer = inject<Container>(
			"ui/main/viewer/gameplay/objectContainer",
		);

		const objects = this.searchObjects(time);
		const disposedObjects = this.previousObjects.difference(objects);
		this.previousObjects = objects;

		for (const object of disposedObjects) {
			objectContainer?.removeChild(object.container);
		}

		for (const object of Array.from(objects).sort(
			(a, b) => -a.object.startTime + b.object.startTime,
		)) {
			objectContainer?.addChild(object.container);
			object.update(time);
		}
	}
}
