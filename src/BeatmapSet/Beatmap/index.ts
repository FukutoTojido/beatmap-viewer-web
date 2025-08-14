import { BeatmapDecoder } from "osu-parsers";
import {
	Spinner,
	type StandardBeatmap,
	type StandardDifficultyAttributes,
	type StandardDifficultyCalculator,
	StandardRuleset,
} from "osu-standard-stable";
import { inject, ScopedClass } from "../../Context";
import { DifficultyPoint, SamplePoint, TimingPoint } from "osu-classes";
import type DrawableHitObject from "./HitObjects/DrawableHitObject";
import { Circle, Slider } from "osu-standard-stable";
import DrawableHitCircle from "./HitObjects/DrawableHitCircle";
import DrawableSlider from "./HitObjects/DrawableSlider";

import ObjectsWorker from "./Worker/Objects?worker";
import type { IHasApproachCircle } from "./HitObjects/DrawableHitObject";
import DrawableFollowPoints from "./HitObjects/DrawableFollowPoints";

import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type Audio from "@/Audio";
import Gameplay from "@/UI/main/viewer/Gameplay";
import type Timing from "@/UI/sidepanel/Timing";
import type Timeline from "@/UI/main/viewer/Timeline";
import type Gameplays from "@/UI/main/viewer/Gameplay/Gameplays";

const decoder = new BeatmapDecoder();
const ruleset = new StandardRuleset();

export default class Beatmap extends ScopedClass {
	data: StandardBeatmap;

	difficultyCalculator: StandardDifficultyCalculator;
	difficultyAttributes: StandardDifficultyAttributes;

	objects: DrawableHitObject[] = [];
	connectors: DrawableFollowPoints[] = [];

	private worker = new ObjectsWorker();

	private loaded = false;

	private previousConnectors = new Set<number>();
	private previousObjects = new Set<number>();
	previousTime = 0;

	container: Gameplay;

	constructor(public raw: string) {
		super();
		this.data = this.context.provide(
			"beatmap",
			ruleset.applyToBeatmap(decoder.decodeFromString(this.raw)),
		);

		this.difficultyCalculator = ruleset.createDifficultyCalculator(this.data);
		this.difficultyAttributes = this.difficultyCalculator.calculateWithMods(
			ruleset.createModCombination(""),
		);

		this.context.provide("beatmapObject", this);
		this.container = new Gameplay(this);
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

			if (!hasTimingPoint && !hasDifficultyPoint && hasSamplePoint) {
				return null;
			}

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
				end: endPoint ? endPoint.startTime / (audio?.duration ?? 1) : 1,
			});
		}

		const breaks: {
			start: number;
			end: number;
		}[] = this.data.events.breaks.map(({ startTime, endTime }) => ({
			start: startTime / (audio?.duration ?? 1),
			end: endTime / (audio?.duration ?? 1),
		}));

		const timingPoints = [
			...this.data.controlPoints.timingPoints,
			...this.data.controlPoints.difficultyPoints,
			...this.data.controlPoints.samplePoints,
		].sort((a, b) => {
			if (a.startTime === b.startTime) {
				const getPointRank = (
					t: TimingPoint | DifficultyPoint | SamplePoint,
				) => {
					if (t instanceof TimingPoint) return 0;
					if (t instanceof DifficultyPoint) return 1;
					if (t instanceof SamplePoint) return 2;
					return 0;
				};

				return getPointRank(a) - getPointRank(b);
			}

			return a.startTime - b.startTime;
		});

		inject<ProgressBar>("ui/main/controls/progress")?.drawTimeline(
			points,
			kiaiSections,
			breaks,
		);
		inject<Timing>("ui/sidepanel/timing")?.updateTimingPoints(timingPoints);
		inject<Timeline>("ui/main/viewer/timeline")?.loadTimingPoints(
			this.data.controlPoints.timingPoints,
		);
	}

	async loadHitObjects() {
		console.time("Constructing hitObjects");
		this.objects = (
			await Promise.all(
				this.data.hitObjects.map((object) => {
					return new Promise<DrawableHitObject | null>((resolve) => {
						setTimeout(() => {
							if (object instanceof Circle)
								resolve(new DrawableHitCircle(object).hook(this.context));
							if (object instanceof Slider)
								resolve(new DrawableSlider(object).hook(this.context));
							resolve(null);
						}, 5);
					});
				}),
			)
		).filter((object) => object !== null);
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

	frame(time: number) {
		const containers = [];
		const approachCircleContainers = [];
		const connectorContainers = [];

		for (const idx of [...this.previousObjects].sort().toReversed()) {
			containers.push(this.objects[idx].container);
			if ((this.objects[idx] as unknown as IHasApproachCircle).approachCircle)
				approachCircleContainers.push(
					(this.objects[idx] as unknown as IHasApproachCircle).approachCircle
						.container,
				);

			this.objects[idx].update(time);
		}

		for (const idx of this.previousConnectors) {
			connectorContainers.push(this.connectors[idx].container);
			this.connectors[idx].update(time);
		}

		if (containers.length > 0)
			this.container.objectsContainer?.addChild(
				...connectorContainers,
				...containers,
				...approachCircleContainers,
			);
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

		const disposedObjects = this.previousObjects.difference(objects);
		const disposedConnectors = this.previousConnectors.difference(connectors);
		this.previousObjects = objects;
		this.previousConnectors = connectors;

		for (const idx of disposedObjects) {
			objectContainer?.removeChild(this.objects[idx].container);

			if ((this.objects[idx] as unknown as IHasApproachCircle).approachCircle)
				objectContainer?.removeChild(
					(this.objects[idx] as unknown as IHasApproachCircle).approachCircle
						.container,
				);
		}

		for (const idx of disposedConnectors) {
			objectContainer?.removeChild(this.connectors[idx].container);
		}

		for (const idx of objects) {
			this.objects[idx].playHitSound(time);
		}
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
		inject<Gameplays>("ui/main/viewer/gameplays")?.removeGameplay(
			this.container,
		);

		this.worker.postMessage({ type: "destroy" });
		this.loaded = false;

		this.container.objectsContainer.removeChildren();

		for (const object of this.objects) {
			object.destroy();
			(object as DrawableHitCircle | DrawableSlider).timelineObject?.destroy();
		}

		for (const connector of this.connectors) {
			connector.destroy();
		}

		this.objects = [];
		this.connectors = [];

		this.previousConnectors.clear();
		this.previousObjects.clear();
	}
}
