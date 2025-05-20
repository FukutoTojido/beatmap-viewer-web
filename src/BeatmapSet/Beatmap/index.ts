import { BeatmapDecoder } from "osu-parsers";
import {
	Spinner,
	type StandardBeatmap,
	StandardRuleset,
} from "osu-standard-stable";
import { inject, provide, ScopedClass } from "../../Context";
import {
	DifficultyPoint,
	SamplePoint,
	StoryboardVideo,
	TimingPoint,
	type Beatmap as BeatmapData,
} from "osu-classes";
import type DrawableHitObject from "./HitObjects/DrawableHitObject";
import { Circle, Slider } from "osu-standard-stable";
import DrawableHitCircle from "./HitObjects/DrawableHitCircle";
import DrawableSlider from "./HitObjects/DrawableSlider";
import type { Resource } from "../../ZipHandler";
import {
	Assets,
	Container,
	type FederatedPointerEvent,
	type BitmapText,
	Rectangle,
} from "pixi.js";
import type Background from "../../UI/main/viewer/Background";

import ObjectsWorker from "./Worker/Objects?worker";
import type { IHasApproachCircle } from "./HitObjects/DrawableHitObject";
import DrawableFollowPoints from "./HitObjects/DrawableFollowPoints";

import type Timestamp from "@/UI/main/controls/Timestamp";
import type Metadata from "@/UI/sidepanel/Metadata";
import type Play from "@/UI/main/controls/Play";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type Audio from "@/Audio";
import Gameplay from "@/UI/main/viewer/Gameplay";

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

	private worker = new ObjectsWorker();

	private loaded = false;
	// private previousObjects = new Set<DrawableHitObject>();

	private previousConnectors = new Set<number>();
	private previousObjects = new Set<number>();
	previousTime = 0;

	container: Gameplay;

	constructor(private raw: string) {
		super();
		this.data = this.context.provide(
			"beatmap",
			ruleset.applyToBeatmap(decoder.decodeFromString(this.raw)),
		);
		this.context.provide("beatmapObject", this);
		this.container = new Gameplay();
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

	load() {
		this.loaded = true;
		this.currentAnimationFrame = requestAnimationFrame(() => this.frame());
	}

	loadTimingPoints() {
		const audio = this.context.consume<Audio>("audio");

		const points = this.data.controlPoints.groups.map((group) => {
			const hasTimingPoint = group.controlPoints.some(
				(point) => point instanceof TimingPoint,
			);
			const hasDifficultyPoint = group.controlPoints.some(
				(point) => point instanceof DifficultyPoint,
			);
			const hasSamplePoint = group.controlPoints.some(
				(point) => point instanceof SamplePoint,
			);

			return {
				position: group.startTime / (audio?.duration ?? 1),
				color:
					hasTimingPoint && !hasDifficultyPoint
						? 0xff1749
						: hasTimingPoint && hasDifficultyPoint
							? 0xff9717
							: 0x17ff51,
			};
		});

		const kiaiSections: {
			start: number;
			end: number;
		}[] = [];
		const effectPoints = this.data.controlPoints.effectPoints;
		for (let i = 0; i < effectPoints.length; i += 2) {
			const startPoint = effectPoints[i];
			const endPoint = effectPoints[i + 1];

			kiaiSections.push({
				start: startPoint.startTime / (audio?.duration ?? 1),
				end: endPoint
					? endPoint.startTime / (audio?.duration ?? 1)
					: 1,
			});
		}

		inject<ProgressBar>("ui/main/controls/progress")?.drawTimeline(points, kiaiSections);
	}

	loadHitObjects() {
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
	}

	cacheBPM = 0;
	cacheSV = 0;

	private currentAnimationFrame?: number;

	private frame() {
		const audio = this.context.consume<Audio>("audio");

		const sorted = Array.from(this.previousObjects)
			.map((idx) => this.objects[idx])
			.sort((a, b) => -a.object.startTime + b.object.startTime)
			.filter((object) => object instanceof DrawableSlider);

		for (const object of sorted) {
			object.update(audio?.currentTime ?? 0);
		}

		const currentBPM = this.data.controlPoints.timingPointAt(
			audio?.currentTime ?? 0,
		).bpm;
		const currentSV = this.data.controlPoints.difficultyPointAt(
			audio?.currentTime ?? 0,
		).sliderVelocity;

		const timestamp = inject<Timestamp>("ui/main/controls/timestamp");
		timestamp?.updateDigit(audio?.currentTime ?? 0);

		if (this.cacheBPM !== currentBPM) {
			this.cacheBPM = currentBPM;
			timestamp?.updateBPM(currentBPM);
		}

		if (this.cacheSV !== currentSV) {
			this.cacheSV = currentSV;
			timestamp?.updateSliderVelocity(currentSV);
		}

		const progressBar = inject<ProgressBar>("ui/main/controls/progress");
		progressBar?.setPercentage(
			(audio?.currentTime ?? 0) / (audio?.duration ?? 1),
		);

		this.currentAnimationFrame = requestAnimationFrame(() => this.frame());
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
		if (!this.loaded) return;

		const audio = this.context.consume<Audio>("audio");

		const objectContainer = this.container.objectsContainer;

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
				object.update(audio?.currentTime ?? 0);
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
			this.connectors[idx].update(audio?.currentTime ?? 0);
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

		const audio = this.context.consume<Audio>("audio");

		if (audio?.state === "PLAYING") {
			this.worker.postMessage({ type: "start" });
		}

		if (audio?.state === "STOPPED") {
			this.worker.postMessage({ type: "stop" });
		}
	}

	seek(time: number) {
		if (!this.loaded)
			throw new Error(
				"Cannot play / pause a beatmap that hasn't been initialized",
			);

		this.worker.postMessage({ type: "seek", time });
	}

	destroy() {
		this.worker.postMessage({ type: "destroy" });
		this.loaded = false;

		this.container.objectsContainer.removeChildren();

		for (const object of this.objects) {
			object.destroy();
		}

		for (const connector of this.connectors) {
			connector.destroy();
		}

		this.objects = [];
		this.connectors = [];

		this.previousConnectors.clear();
		this.previousObjects.clear();

		if (this.currentAnimationFrame)
			cancelAnimationFrame(this.currentAnimationFrame);
	}
}
