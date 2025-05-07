import { BeatmapDecoder } from "osu-parsers";
import {
	Spinner,
	type StandardBeatmap,
	StandardRuleset,
} from "osu-standard-stable";
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
import type { IHasApproachCircle } from "./HitObjects/DrawableHitObject";

const decoder = new BeatmapDecoder();
const ruleset = new StandardRuleset();

export default class Beatmap extends ScopedClass {
	data: StandardBeatmap;
	objects: DrawableHitObject[] = [];
	audio?: Audio;

	private worker = new ObjectsWorker();

	private loaded = false;
	// private previousObjects = new Set<DrawableHitObject>();
	private previousObjects = new Set<number>();
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
		this.worker.postMessage({
			type: "init",
			objects: this.data.hitObjects
				.map((object) => {
					if (object instanceof Spinner) return null;
					return {
						startTime: object.startTime,
						endTime: (object as Slider).endTime,
						timePreempt: object.timePreempt,
					};
				})
				.filter((object) => object !== null),
		});

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

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.worker.onmessage = (event: any) => {
			switch (event.data.type) {
				case "update": {
					const { objects, currentTime, previousTime } = event.data;
					this.previousTime = previousTime;
					this.update(currentTime, objects);
					break;
				}
			}
		};

		this.loaded = true;
		requestAnimationFrame(() => this.frame());
	}

	private frame() {
		// this.update(this.audio?.currentTime ?? 0);
		// this.previousTime = this.audio?.currentTime ?? 0;

		const timestamp = inject<BitmapText>("ui/main/viewer/timestamp");
		if (timestamp)
			timestamp.text = `${Math.round(this.audio?.currentTime ?? 0)} ms\n${Math.round(this.previousTime)} ms`;

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

	update(time: number, objects: Set<number>) {
		if (!this.loaded)
			throw new Error("Cannot update a beatmap that hasn't been initialized");

		const objectContainer = inject<Container>(
			"ui/main/viewer/gameplay/objectContainer",
		);

		// const objects = this.searchObjects(time);
		const disposedObjects = this.previousObjects.difference(objects);
		this.previousObjects = objects;

		// (async () => console.log(disposedObjects, objects))();

		for (const idx of disposedObjects) {
			objectContainer?.removeChild(this.objects[idx].container);

			if ((this.objects[idx] as unknown as IHasApproachCircle).approachCircle)
				objectContainer?.removeChild(
					(this.objects[idx] as unknown as IHasApproachCircle).approachCircle
						.container,
				);
		}

		const containers = [];
		const approachCircleContainers = [];
		const sorted = Array.from(objects)
			.map((idx) => this.objects[idx])
			.sort((a, b) => -a.object.startTime + b.object.startTime);

		for (const object of sorted) {
			object.update(time);
			containers.push(object.container);

			if ((object as unknown as IHasApproachCircle).approachCircle)
				approachCircleContainers.push(
					(object as unknown as IHasApproachCircle).approachCircle.container,
				);
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

		if (this.audio?.state === "PLAYING")
			this.worker.postMessage({ type: "start" });

		if (this.audio?.state === "STOPPED")
			this.worker.postMessage({ type: "stop" });
	}

	seek(time: number) {
		if (!this.loaded)
			throw new Error(
				"Cannot play / pause a beatmap that hasn't been initialized",
			);

		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		this.audio!.currentTime = time;
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		this.worker.postMessage({ type: "seek", time: this.audio!.currentTime });
	}
}
