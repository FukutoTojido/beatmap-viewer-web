import md5 from "crypto-js/md5";
import {
	type Beatmap as BeatmapBase,
	type DifficultyAttributes,
	type DifficultyCalculator,
	DifficultyPoint,
	type Ruleset,
	SamplePoint,
	TimingPoint,
} from "osu-classes";
import { BeatmapDecoder } from "osu-parsers";
import { Color, type ColorSource } from "pixi.js";
import type Audio from "@/Audio";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type Gameplays from "@/UI/main/viewer/Gameplays";
import type Timeline from "@/UI/main/viewer/Timeline";
import type { StrainPoint } from "@/UI/sidepanel/Modding/DifficultyGraph";
import type Timing from "@/UI/sidepanel/Timing";
import { getDiffColour } from "@/utils";
import { inject, ScopedClass } from "../../Context";
import type BeatmapSet from "..";
import type Replay from "./Replay";
import type ManiaBeatmap from "./Rulesets/Mania/ManiaBeatmap";
import ManiaGameplay from "./Rulesets/Mania/ManiaGameplay";
import type Gameplay from "./Rulesets/Shared/Gameplay";
import type DrawableHitObject from "./Rulesets/Shared/HitObjects/DrawableHitObject";
import StandardGameplay from "./Rulesets/Standard/StandardGameplay";

export default abstract class Beatmap extends ScopedClass {
	static ruleset: Ruleset;
	static decoder: BeatmapDecoder = new BeatmapDecoder();

	objects: DrawableHitObject[] = [];

	color!: ColorSource;
	randomColor: ColorSource = new Color(
		Math.floor(Math.random() * 0xffffff),
	).toHex();

	protected worker?: Worker;

	protected loaded = false;

	previousObjects = new Set<number>();
	previousTime = 0;

	container!: Gameplay;

	md5: string;

	public data: BeatmapBase;
	public difficultyCalculator: DifficultyCalculator;
	public difficultyAttributes: DifficultyAttributes;

	private _ruleset: Ruleset;

	constructor(
		public raw: string,
		ruleset: Ruleset,
	) {
		super();
		this._ruleset = ruleset;

		const initialMods =
			inject<ExperimentalConfig>("config/experimental")?.getModsString() ?? "";

		this.data = this.context.provide(
			"beatmap",
			ruleset.applyToBeatmapWithMods(
				Beatmap.decoder.decodeFromString(raw),
				ruleset.createModCombination(initialMods),
			),
		);

		this.difficultyCalculator = ruleset.createDifficultyCalculator(this.data);
		this.difficultyAttributes = this.difficultyCalculator.calculateWithMods(
			ruleset.createModCombination(initialMods),
		);

		this.color = getDiffColour(this.difficultyAttributes.starRating);
		this.calculateStrainGraph(initialMods);

		this.md5 = md5(raw).toString();
		this.context.provide("beatmapObject", this);

		switch (this.data.originalMode) {
			case 0: {
				this.container = new StandardGameplay(this);
				break;
			}
			case 3: {
				this.container = new ManiaGameplay(this as unknown as ManiaBeatmap);
				break;
			}
			default: {
				this.container = new StandardGameplay(this);
			}
		}

		inject<ExperimentalConfig>("config/experimental")?.onChange(
			"mods",
			({
				mods: val,
				shouldRecalculate,
			}: {
				mods: string;
				shouldRecalculate: boolean;
			}) => {
				const appliedMods = ruleset.applyToBeatmapWithMods(
					Beatmap.decoder.decodeFromString(this.raw),
					ruleset.createModCombination(val),
				);

				if (shouldRecalculate) {
					this.data = this.context.provide("beatmap", appliedMods);
					this.reassignObjects();
					this.replay?.evaluate(this);
				}

				this.difficultyCalculator =
					ruleset.createDifficultyCalculator(appliedMods);
				this.difficultyAttributes = this.difficultyCalculator.calculateWithMods(
					ruleset.createModCombination(val),
				);
				this.calculateStrainGraph(val);

				this.recalculateDifficulty();
			},
		);
	}

	// Taken from https://github.com/Rian8337/osu-droid-module/blob/master/packages/osu-strain-graph-generator/src/index.ts
	strains: StrainPoint[] = [];
	protected abstract calculateStrainGraph(_: string): void;

	protected abstract reassignObjects(): void;

	protected abstract createStatsAttributes(): Record<string, string>;
	recalculateDifficulty(force = false) {
		if (
			!force &&
			this.context.consume<BeatmapSet>("beatmapset")?.master !== this
		)
			return;

		this.color = getDiffColour(this.difficultyAttributes.starRating);
		const el = document.querySelector<HTMLSpanElement>("#masterDiff");
		if (el) {
			el.innerHTML = `
						<span class="truncate">${this.data.metadata.version}</span>
						<br/>
						<span class="text-xs">
							${Object.entries(this.createStatsAttributes())
								.map(
									([key, value]) =>
										`${key} <span class="font-medium"> ${value} </span>`,
								)
								.join(" /\n")}
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

	load() {
		this.loaded = true;

		if (this.replay) {
			this.hookReplay(this.replay);
		}
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

		const buffer = [];
		let isKiai = false;

		for (let i = 0; i < effectPoints.length; i++) {
			if (effectPoints[i].kiai && !isKiai) {
				isKiai = true;
				buffer.push(effectPoints[i].startTime / (audio?.duration ?? 1));

				continue;
			}

			if (!effectPoints[i].kiai && isKiai) {
				isKiai = false;
				buffer.push(effectPoints[i].startTime / (audio?.duration ?? 1));

				kiaiSections.push({
					start: buffer[0],
					end: buffer.at(-1) ?? 1,
				});

				buffer.length = 0;
			}
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

	protected abstract loadHitObjectsSync(): void;
	protected abstract loadHitObjectsAsync(): Promise<void>;
	abstract loadHitObjects(): Promise<void>;

	frame(time: number) {
		const dragWindowVector = this.container.dragWindow[1].subtract(
			this.container.dragWindow[0],
		);
		const pos = this.container.wrapper.toLocal(this.container.dragWindow[0]);

		this.container.selector.scale.set(dragWindowVector.x, dragWindowVector.y);
		this.container.selector.position.set(pos.x, pos.y);

		this.replay?.frame(time);
	}

	update(time: number, objects: Set<number>, _?: unknown) {
		for (const idx of objects) {
			this.objects[idx].playHitSound(time);
		}
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

	toggle() {
		if (!this.loaded)
			throw new Error(
				"Cannot play / pause a beatmap that hasn't been initialized",
			);

		const audio = this.context.consume<Audio>("audio");

		this.worker?.postMessage({
			type: "playbackRate",
			playbackRate:
				this.context.consume<BeatmapSet>("beatmapset")?.playbackRate ?? 1,
		});

		if (audio?.state === "PLAYING") {
			this.worker?.postMessage({ type: "start" });
		}

		if (audio?.state === "STOPPED") {
			this.worker?.postMessage({ type: "stop" });
		}
	}

	seek(time: number) {
		if (!this.loaded)
			throw new Error(
				"Cannot play / pause a beatmap that hasn't been initialized",
			);

		this.worker?.postMessage({ type: "seek", time });
	}

	replay?: Replay;
	hookReplay(replay: Replay) {
		this.unhookReplay();

		const mods = this._ruleset.createModCombination(replay?.data?.info.rawMods);
		const config = inject<ExperimentalConfig>("config/experimental");

		let hasModChange = false;
		if (config) {
			if (config.hardRock !== mods.acronyms.includes("HR")) {
				hasModChange = true;
				config.hardRock = mods.acronyms.includes("HR") ?? false;
			}

			if (config.doubleTime !== mods.acronyms.includes("DT")) {
				hasModChange = true;
				config.doubleTime = mods.acronyms.includes("DT") ?? false;
			}

			if (config.hidden !== mods.acronyms.includes("HD"))
				config.hidden = mods.acronyms.includes("HD") ?? false;
		}

		this.replay = replay;

		if (!hasModChange) this.replay?.evaluate(this);
	}
	unhookReplay() {

		this.replay = undefined;
		for (const object of this.objects) {
			object.evaluation = undefined;
		}
	}

	destroy() {
		inject<Gameplays>("ui/main/viewer/gameplays")?.removeGameplay(
			this.container,
		);

		this.worker?.postMessage({ type: "destroy" });
		this.loaded = false;

		this.container.objectsContainer.removeChildren();

		for (const object of this.objects) {
			object.destroy();
			object.timelineObject?.destroy();
		}

		this.objects = [];
		this.previousObjects.clear();
	}
}
