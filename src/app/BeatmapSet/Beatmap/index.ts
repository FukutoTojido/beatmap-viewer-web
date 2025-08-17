import { sort } from "fast-sort";
import { DifficultyPoint, SamplePoint, TimingPoint } from "osu-classes";
import { BeatmapDecoder } from "osu-parsers";
import {
	Circle,
	Slider,
	Spinner,
	type StandardBeatmap,
	type StandardDifficultyAttributes,
	type StandardDifficultyCalculator,
	StandardRuleset,
} from "osu-standard-stable";
import type { ColorSource } from "pixi.js";
import type Audio from "@/Audio";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import Gameplay from "@/UI/main/viewer/Gameplay";
import type Gameplays from "@/UI/main/viewer/Gameplay/Gameplays";
import type Timeline from "@/UI/main/viewer/Timeline";
import type Timing from "@/UI/sidepanel/Timing";
import { difficultyRange, getDiffColour } from "@/utils";
import { inject, ScopedClass } from "../../Context";
import type BeatmapSet from "..";
import DrawableFollowPoints from "./HitObjects/DrawableFollowPoints";
import DrawableHitCircle from "./HitObjects/DrawableHitCircle";
import type DrawableHitObject from "./HitObjects/DrawableHitObject";
import type { IHasApproachCircle } from "./HitObjects/DrawableHitObject";
import DrawableSlider from "./HitObjects/DrawableSlider";
import ObjectsWorker from "./Worker/Objects?worker";

const decoder = new BeatmapDecoder();
const ruleset = new StandardRuleset();

export default class Beatmap extends ScopedClass {
	data: StandardBeatmap;

	difficultyCalculator: StandardDifficultyCalculator;
	difficultyAttributes: StandardDifficultyAttributes;

	objects: DrawableHitObject[] = [];
	connectors: DrawableFollowPoints[] = [];

	color: ColorSource;

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

		this.color = getDiffColour(this.difficultyAttributes.starRating);

		this.context.provide("beatmapObject", this);
		this.container = new Gameplay(this);

		this.worker.postMessage({
			type: "preempt",
			preempt: difficultyRange(
				this.data.difficulty.approachRate,
				1800,
				1200,
				450,
			),
		});

		inject<ExperimentalConfig>("config/experimental")?.onChange(
			"modsHR",
			(val) => {
				if (val) {
					this.data = this.context.provide(
						"beatmap",
						ruleset.applyToBeatmapWithMods(
							decoder.decodeFromString(this.raw),
							ruleset.createModCombination("HR"),
						),
					);
				} else {
					this.data = this.context.provide(
						"beatmap",
						ruleset.applyToBeatmap(decoder.decodeFromString(this.raw)),
					);
				}

				this.difficultyCalculator = ruleset.createDifficultyCalculator(
					this.data,
				);
				this.difficultyAttributes = this.difficultyCalculator.calculateWithMods(
					ruleset.createModCombination(val ? "HR" : ""),
				);

				this.recalculateDifficulty();
			},
		);
	}

	private recalculateDifficulty() {
		this.color = getDiffColour(this.difficultyAttributes.starRating);

		this.worker.postMessage({
			type: "preempt",
			preempt: difficultyRange(
				this.data.difficulty.approachRate,
				1800,
				1200,
				450,
			),
		});

		const objs = this.data.hitObjects.filter(
			(object) => object instanceof Circle || object instanceof Slider,
		);
		for (let i = 0; i < this.objects.length; i++) {
			this.objects[i].object = objs[i];
		}

		let j = 0;
		for (let i = 0; i < this.data.hitObjects.length - 1; i++) {
			const startObject = this.data.hitObjects[i];
			const endObject = this.data.hitObjects[i + 1];
			if (endObject.isNewCombo) continue;

			// console.log(this.connectors[j].startObject.startTime, this.connectors[j].endObject.startTime, startObject.startTime, endObject.startTime)
			this.connectors[j]?.updateObjects(startObject, endObject);
			j++;
		}

		if (this.context.consume<BeatmapSet>("beatmapset")?.master !== this) return;

		const el = document.querySelector<HTMLSpanElement>("#masterDiff");
		if (el) {
			el.innerHTML = `
						<span class="truncate">${this.data.metadata.version}</span>
						<br/>
						<span class="text-xs">
							CS <span class="font-medium">${this.data.difficulty.circleSize.toFixed(1).replace(".0", "")}</span> / 
							AR <span class="font-medium">${this.difficultyAttributes.approachRate.toFixed(1).replace(".0", "")}</span> / 
							OD <span class="font-medium">${this.difficultyAttributes.overallDifficulty.toFixed(1).replace(".0", "")}</span> / 
							HP <span class="font-medium">${this.difficultyAttributes.drainRate.toFixed(1).replace(".0", "")}</span> 
						</span>`;
		}
		const svg = document.querySelector<SVGSVGElement>("#extraMode");
		if (svg) {
			const color = this.color;
			svg.innerHTML = svg.innerHTML
				.replace(/stroke=".*"/g, `stroke="${color}"`)
				.replace(/fill=".*"/, `fill="${color}"`);
		}
		const sr = document.querySelector<HTMLSpanElement>("#masterSR");
		if (sr)
			sr.textContent = `${this.difficultyAttributes.starRating.toFixed(2)}★`;
	}

	private async constructConnectorsAsync() {
		return await Promise.all(
			this.data.hitObjects.map((_, i, arr) => {
				return new Promise<DrawableFollowPoints | null>((resolve) => {
					setTimeout(() => {
						if (i === arr.length - 1) {
							resolve(null);
							return;
						}

						const startObject = arr[i];
						const endObject = arr[i + 1];

						if (endObject.isNewCombo) {
							resolve(null);
							return;
						}

						resolve(new DrawableFollowPoints(startObject, endObject));
					}, 5);
				});
			}),
		);
	}

	private constructConnectorsSync() {
		const connectors = [];
		for (let i = 0; i < this.data.hitObjects.length - 1; i++) {
			const startObject = this.data.hitObjects[i];
			const endObject = this.data.hitObjects[i + 1];
			if (endObject.isNewCombo) continue;

			connectors.push(new DrawableFollowPoints(startObject, endObject));
		}

		return connectors;
	}

	private async constructConnectors() {
		const async = inject<ExperimentalConfig>(
			"config/experimental",
		)?.asyncLoading;

		if (async) return await this.constructConnectorsAsync();
		return this.constructConnectorsSync();
	}

	load() {
		this.loaded = true;
	}

	async loadTimingPoints() {
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

		await inject<Timing>("ui/sidepanel/timing")?.updateTimingPoints(
			timingPoints,
		);
		inject<Timeline>("ui/main/viewer/timeline")?.loadTimingPoints(
			this.data.controlPoints.timingPoints,
		);
		inject<ProgressBar>("ui/main/controls/progress")?.drawTimeline(
			points,
			kiaiSections,
			breaks,
		);
	}

	private loadHitObjectsSync() {
		this.objects = this.data.hitObjects
			.map((object) => {
				if (object instanceof Circle)
					return new DrawableHitCircle(object).hook(this.context);
				if (object instanceof Slider)
					return new DrawableSlider(object).hook(this.context);
				return null;
			})
			.filter((object) => object !== null);
	}

	private async loadHitObjectsAsync() {
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
	}

	async loadHitObjects() {
		console.time("Constructing hitObjects");
		const async = inject<ExperimentalConfig>(
			"config/experimental",
		)?.asyncLoading;
		if (async) await this.loadHitObjectsAsync();
		else this.loadHitObjectsSync();

		console.timeEnd("Constructing hitObjects");
		this.connectors = (await this.constructConnectors()).filter(
			(conn) => conn !== null,
		);
		this.worker.postMessage({
			type: "init",
			objects: this.data.hitObjects
				.map((object) => {
					if (object instanceof Spinner) return null;
					return {
						startTime: object.startTime,
						endTime: (object as Slider).endTime,
					};
				})
				.filter((object) => object !== null),
			connectors: this.connectors.map((connector) => {
				return {
					startTime: connector.startTime,
					endTime: connector.endTime,
				};
			}),
		});

		// biome-ignore lint/suspicious/noExplicitAny: Can't specify event type
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

		const objs = sort([...this.previousObjects]).desc(
			(u) => this.objects[u].object.startTime,
		);

		for (const idx of objs) {
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
			Math.ceil(time + 2),
		);

		let samplePoint: SamplePoint = currentSamplePoint;
		if (
			potentialFutureSamplePoint?.group &&
			potentialFutureSamplePoint.group.startTime - time < 3
		)
			samplePoint = potentialFutureSamplePoint;

		return samplePoint;
	}

	update(time: number, objects: Set<number>, connectors: Set<number>) {
		if (!this.loaded) return;

		// const audio = this.context.consume<Audio>("audio");
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
