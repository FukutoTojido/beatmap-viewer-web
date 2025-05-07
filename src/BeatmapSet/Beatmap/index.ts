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
import { Assets, type BitmapText, type Container } from "pixi.js";
import type Background from "../../UI/main/viewer/Background";

// @ts-ignore
import ObjectsWorker from "./Worker/Objects?worker";

const decoder = new BeatmapDecoder();
const ruleset = new StandardRuleset();

export default class Beatmap extends ScopedClass {
	data: StandardBeatmap;
	objects: DrawableHitObject[] = [];
	audio?: Audio;

	private worker = new ObjectsWorker();

	private loaded = false;
	private previousObjects = new Set<DrawableHitObject>();
	previousTime = 0;

	constructor(private raw: string) {
		super();
		this.data = this.context.provide(
			"beatmap",
			ruleset.applyToBeatmap(decoder.decodeFromString(this.raw)),
		);
		this.context.provide("beatmapObject", this);
	}

	async load() {
		console.time("Constructing hitObjects");
		this.objects = this.data.hitObjects
			.map((object) => {
				if (object instanceof Circle)
					return new DrawableHitCircle(object).hook(this.context);
				if (object instanceof Slider)
					return new DrawableSlider(object).hook(this.context);
				return null;
			})
			.filter((object) => object !== null);
		console.timeEnd("Constructing hitObjects");

		console.time("Constructing audio");
		const audioFile = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.data.general.audioFilename);
		if (!audioFile) throw new Error("Cannot find audio in resource?");

		const audioContext = this.context.consume<AudioContext>("audioContext");
		if (!audioContext) throw new Error("Missing audio context!");

		this.audio = this.context.provide("audio", new Audio(audioContext));
		await this.audio.createBufferNode(audioFile);
		console.timeEnd("Constructing audio");

		const background = inject<Background>("ui/main/viewer/background");
		const backgroundResource = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.data.events.backgroundPath ?? "");

		if (backgroundResource) {
			const url = URL.createObjectURL(backgroundResource);
			background?.updateTexture(
				await Assets.load({ src: url, loadParser: "loadTextures" }),
			);
		}

		this.worker.onmessage = (event: { data: { type: string } }) => {
			switch (event.data.type) {
				case "signal": {
					const time = this.audio?.currentTime ?? 0;
					this.update(time);
					this.previousTime = time;
					break;
				}
			}
		};

		this.loaded = true;
		requestAnimationFrame(() => this.frame());
	}

	private frame() {
		// this.update(this.audio?.currentTime ?? 0);

		const timestamp = inject<BitmapText>("ui/main/viewer/timestamp");
		if (timestamp)
			timestamp.text = `${Math.round(this.audio?.currentTime ?? 0)} ms`;

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
			objectContainer?.removeChild(object.approachCircle.container);
		}

		const containers = [];
		const approachCircleContainers = [];

		for (const object of Array.from(objects).sort(
			(a, b) => -a.object.startTime + b.object.startTime,
		)) {
			object.update(time);
			containers.push(object.container);
			approachCircleContainers.push(object.approachCircle.container);
		}

		if (containers.length > 0)
			objectContainer?.addChild(...containers, ...approachCircleContainers);
	}

	toggle() {
		if (!this.loaded)
			throw new Error(
				"Cannot play / pause a beatmap that hasn't been initialized",
			);

		this.audio?.toggle();
	}
}
