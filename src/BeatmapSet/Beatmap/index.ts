import { BeatmapDecoder } from "osu-parsers";
import {
	Spinner,
	type StandardBeatmap,
	StandardRuleset,
} from "osu-standard-stable";
import { inject, ScopedClass } from "../../Context";
import {
	StoryboardVideo,
	type Beatmap as BeatmapData,
	type SamplePoint,
} from "osu-classes";
import type DrawableHitObject from "./HitObjects/DrawableHitObject";
import { Circle, Slider } from "osu-standard-stable";
import DrawableHitCircle from "./HitObjects/DrawableHitCircle";
import DrawableSlider from "./HitObjects/DrawableSlider";
import Audio from "../../Audio";
import type { Resource } from "../../ZipHandler";
import { Assets, type BitmapText, type Container } from "pixi.js";
import type Background from "../../UI/main/viewer/Background";

import ObjectsWorker from "./Worker/Objects?worker";
import type { IHasApproachCircle } from "./HitObjects/DrawableHitObject";
import DrawableFollowPoints from "./HitObjects/DrawableFollowPoints";
import Video from "@/Video";

const decoder = new BeatmapDecoder();
const ruleset = new StandardRuleset();

interface ObjectMini {
	startTime: number;
	endTime: number;
	timePreempt: number;
}

export default class Beatmap extends ScopedClass {
	data: StandardBeatmap;
	objects: DrawableHitObject[] = [];
	connectors: DrawableFollowPoints[] = [];
	audio?: Audio;

	private worker = new ObjectsWorker();

	private loaded = false;
	// private previousObjects = new Set<DrawableHitObject>();

	private previousConnectors = new Set<number>();
	private previousObjects = new Set<number>();
	previousTime = 0;

	video?: Video;

	constructor(private raw: string) {
		super();
		this.data = this.context.provide(
			"beatmap",
			ruleset.applyToBeatmap(decoder.decodeFromString(this.raw)),
		);
		this.context.provide("beatmapObject", this);
	}

	private constructConnectors() {
		const connectors = [];
		for (let i = 0; i < this.data.hitObjects.length - 1; i++) {
			const startObject = this.data.hitObjects[i];
			const endObject = this.data.hitObjects[i + 1];
			if (endObject.isNewCombo) continue;

			const distance = startObject.endPosition
				.add(startObject.stackedOffset)
				.distance(endObject.startPosition.add(endObject.stackedOffset));
			if (distance < 80) continue;

			connectors.push(new DrawableFollowPoints(startObject, endObject));
		}

		return connectors;
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
		this.connectors = this.constructConnectors();
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
			connectors: this.connectors.map((connector) => {
				return {
					startTime: connector.startTime,
					endTime: connector.endTime,
					timePreempt: connector.timePreempt,
				};
			}),
		});

		console.time("Constructing audio");
		const audioFile = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.data.general.audioFilename);
		if (!audioFile) throw new Error("Cannot find audio in resource?");

		const audioContext = this.context.consume<AudioContext>("audioContext");
		if (!audioContext) throw new Error("Missing audio context!");

		this.audio = this.context.provide(
			"audio",
			new Audio(audioContext).hook(this.context),
		);
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

		const videoFilePath =
			this.data.events.storyboard?.layers.get("Video")?.elements.at(0)
				?.filePath ?? "";
		const videoResource = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(
				this.data.events.storyboard?.layers.get("Video")?.elements.at(0)
					?.filePath ?? "",
			);
		// if (
		// 	videoResource &&
		// 	!["avi", "flv"].includes(videoFilePath.split(".").at(-1) ?? "")
		// ) {
		// 	const url = URL.createObjectURL(videoResource);
		// 	background?.updateVideo(
		// 		await Assets.load({
		// 			src: url,
		// 			data: {
		// 				autoPlay: false,
		// 			},
		// 			loadParser: "loadVideo",
		// 		}),
		// 	);
		// }

		// console.log(videoFilePath, this.data.events.storyboard?.layers.get("Video")?.elements.at(0));

		if (
			videoResource &&
			new URLSearchParams(window.location.search).get("v") === "true"
			// !["avi", "flv"].includes(videoFilePath.split(".").at(-1) ?? "")
		) {
			this.video = new Video();
			try {
				await this.video.load(videoResource);
			} catch (e) {
				console.error(e);
			}
		}

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		this.worker.onmessage = (event: any) => {
			switch (event.data.type) {
				case "update": {
					const { objects, connectors, currentTime, previousTime } = event.data;
					this.previousTime = previousTime;
					this.update(currentTime, objects, connectors);
					break;
				}
			}
		};

		this.loaded = true;
		requestAnimationFrame(() => this.frame());
	}

	private frame() {
		// this.video?.seek(this.audio?.currentTime ?? 0);

		// this.update(this.audio?.currentTime ?? 0);
		// this.previousTime = this.audio?.currentTime ?? 0;
		// for (const idx of this.previousObjects) {
		// 	this.objects[idx].update(this.audio?.currentTime ?? 0);
		// }

		// for (const idx of this.previousConnectors) {
		// 	this.connectors[idx].update(this.audio?.currentTime ?? 0)
		// }

		const sorted = Array.from(this.previousObjects)
			.map((idx) => this.objects[idx])
			.sort((a, b) => -a.object.startTime + b.object.startTime)
			.filter((object) => object instanceof DrawableSlider);

		for (const object of sorted) {
			object.update(this.audio?.currentTime ?? 0);
		}

		const timestamp = inject<BitmapText>("ui/main/viewer/timestamp");
		if (timestamp)
			timestamp.text = `Timestamp: ${Math.round(this.audio?.currentTime ?? 0)} ms\nVideo: ${Math.round(1000 / (inject<Background>("ui/main/viewer/background")?.frameTime ?? 0))}fps`;

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

	private searchObjects(list: ObjectMini[], time: number) {
		const idx = this.binarySearchNearestIndex(time);
		if (idx === -1) return new Set<number>();

		const objects = new Set<number>();
		objects.add(idx);

		let start = idx - 1;
		while (
			start >= 0 &&
			this.inRange(
				time,
				this.objects[start].getTimeRange().start,
				this.objects[start].getTimeRange().end,
			) === 0
		) {
			objects.add(start);
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
			objects.add(end);
			end++;
		}

		return objects;
	}

	getNearestSamplePoint(time: number) {
		const currentSamplePoint = this.data.controlPoints.samplePointAt(
			Math.ceil(time),
		);

		const potentialFutureSamplePoint = this.data.controlPoints.samplePointAt(
			Math.ceil(time + 1),
		);

		let samplePoint: SamplePoint = currentSamplePoint;
		if (
			potentialFutureSamplePoint?.group &&
			potentialFutureSamplePoint.group.startTime - time < 2
		)
			samplePoint = potentialFutureSamplePoint;

		return samplePoint;
	}

	update(time: number, objects: Set<number>, connectors: Set<number>) {
		if (!this.loaded)
			throw new Error("Cannot update a beatmap that hasn't been initialized");

		const objectContainer = inject<Container>(
			"ui/main/viewer/gameplay/objectContainer",
		);

		// const objects = this.searchObjects(time);
		const disposedObjects = this.previousObjects.difference(objects);
		const disposedConnectors = this.previousConnectors.difference(connectors);
		this.previousObjects = objects;
		this.previousConnectors = connectors;

		// (async () => console.log(disposedObjects, objects))();

		for (const idx of disposedObjects) {
			objectContainer?.removeChild(this.objects[idx].container);

			// if (this.objects[idx] instanceof DrawableSlider) {
			// 	objectContainer?.removeChild(this.objects[idx].ball.container)
			// 	objectContainer?.removeChild(this.objects[idx].followCircle.container)
			// }

			if ((this.objects[idx] as unknown as IHasApproachCircle).approachCircle)
				objectContainer?.removeChild(
					(this.objects[idx] as unknown as IHasApproachCircle).approachCircle
						.container,
				);
		}

		for (const idx of disposedConnectors) {
			objectContainer?.removeChild(this.connectors[idx].container);
		}

		const containers = [];
		const approachCircleContainers = [];
		const connectorContainers = [];

		const sorted = Array.from(objects)
			.map((idx) => this.objects[idx])
			.sort((a, b) => -a.object.startTime + b.object.startTime);

		for (const object of sorted) {
			// if (object instanceof DrawableSlider)
			// 	requestAnimationFrame(() =>
			// 		object.update(this.audio?.currentTime ?? 0),
			// 	);

			if (object instanceof DrawableHitCircle) {
				object.update(this.audio?.currentTime ?? 0);
			}

			object.playHitSound(time);
			containers.push(object.container);

			// if (object instanceof DrawableSlider) {
			// 	containers.push(object.ball.container, object.followCircle.container)
			// }

			if ((object as unknown as IHasApproachCircle).approachCircle)
				approachCircleContainers.push(
					(object as unknown as IHasApproachCircle).approachCircle.container,
				);
		}

		for (const idx of connectors) {
			this.connectors[idx].update(this.audio?.currentTime ?? 0);
			connectorContainers.push(this.connectors[idx].container);
		}

		if (containers.length > 0)
			objectContainer?.addChild(
				...connectorContainers,
				...containers,
				...approachCircleContainers,
			);
	}

	toggle() {
		if (!this.loaded)
			throw new Error(
				"Cannot play / pause a beatmap that hasn't been initialized",
			);

		this.audio?.toggle();

		if (this.audio?.state === "PLAYING") {
			this.worker.postMessage({ type: "start" });
			// inject<Background>("ui/main/viewer/background")?.playVideo(
			// 	this.audio?.currentTime ?? 0,
			// );
			this.video?.play(this.audio?.currentTime);
		}

		if (this.audio?.state === "STOPPED") {
			this.worker.postMessage({ type: "stop" });
			// inject<Background>("ui/main/viewer/background")?.pauseVideo(
			// 	this.audio?.currentTime ?? 0,
			// );
			this.video?.stop(this.audio?.currentTime);
		}
	}

	seek(time: number) {
		if (!this.loaded)
			throw new Error(
				"Cannot play / pause a beatmap that hasn't been initialized",
			);

		if (!this.audio) throw new Error("Audio hasn't been initialized");

		this.audio.currentTime = time;
		this.worker.postMessage({ type: "seek", time: this.audio.currentTime });
		inject<Background>("ui/main/viewer/background")?.seekVideo(
			this.audio?.currentTime ?? 0,
		);
		this.video?.seek(this.audio?.currentTime);
	}
}
