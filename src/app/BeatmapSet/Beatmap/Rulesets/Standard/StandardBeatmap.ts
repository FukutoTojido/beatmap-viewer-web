import { sort } from "fast-sort";
import {
	Circle,
	Slider,
	Spinner,
	type StandardBeatmap as StandardBeatmapBase,
	type StandardDifficultyAttributes,
	type StandardDifficultyCalculator,
	StandardRuleset,
	type StandardStrainSkill,
} from "osu-standard-stable";
import type BackgroundConfig from "@/Config/BackgroundConfig";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import { inject } from "@/Context";
import { difficultyRange } from "@/utils";
import Beatmap from "../..";
import type Replay from "../../Replay";
import type DrawableHitObject from "../Shared/HitObjects/DrawableHitObject";
import type { IHasApproachCircle } from "../Shared/HitObjects/DrawableHitObject";
import DrawableFollowPoints from "./HitObjects/DrawableFollowPoints";
import DrawableHitCircle from "./HitObjects/DrawableHitCircle";
import DrawableSlider from "./HitObjects/DrawableSlider";
import DrawableSpinner from "./HitObjects/DrawableSpinner";
import ObjectsWorker from "./Worker/Objects?worker";
import type StandardGameplay from "./StandardGameplay";

export default class StandardBeatmap extends Beatmap {
	static override ruleset = new StandardRuleset();

	declare difficultyAttributes: StandardDifficultyAttributes;
	declare difficultyCalculator: StandardDifficultyCalculator;

	declare data: StandardBeatmapBase;

	protected connectors: DrawableFollowPoints[] = [];
	protected previousConnectors = new Set<number>();

	protected worker = new ObjectsWorker();
	declare container: StandardGameplay;

	constructor(public raw: string) {
		super(raw, StandardBeatmap.ruleset);

		this.worker.postMessage({
			type: "preempt",
			preempt: difficultyRange(
				this.data.difficulty.approachRate,
				1800,
				1200,
				450,
			),
		});
	}

	createStatsAttributes(): Record<string, string> {
		return {
			CS: this.data.difficulty.circleSize.toFixed(1).replace(".0", ""),
			AR: this.difficultyAttributes.approachRate.toFixed(1).replace(".0", ""),
			OD: this.difficultyAttributes.overallDifficulty
				.toFixed(1)
				.replace(".0", ""),
			HP: this.difficultyAttributes.drainRate.toFixed(1).replace(".0", ""),
		};
	}

	protected override calculateStrainGraph(mods: string): void {
		const modsCombination = StandardBeatmap.ruleset.createModCombination(mods);
		const beatmap: StandardBeatmapBase =
			// biome-ignore lint/complexity/useLiteralKeys: Access Private
			this.difficultyCalculator["_getWorkingBeatmap"](modsCombination);

		if (!beatmap.hitObjects.length) return;

		const sectionLength = 400;
		const currentSectionEnd =
			Math.ceil(beatmap.hitObjects[0].startTime / sectionLength) *
			sectionLength;

		const clockRate = beatmap.difficulty.clockRate ?? 1;

		const skills: StandardStrainSkill[] = this.difficultyCalculator[
			// biome-ignore lint/complexity/useLiteralKeys: Access Private
			"_createSkills"
		](beatmap, modsCombination) as StandardStrainSkill[];

		// biome-ignore lint/complexity/useLiteralKeys: Access Private
		const aimStrainPeaks = skills[1]["_strainPeaks"];
		// biome-ignore lint/complexity/useLiteralKeys: Access Private
		const speedStrainPeaks = skills[1]["_strainPeaks"];

		for (const hitObject of this.difficultyCalculator[
			// biome-ignore lint/complexity/useLiteralKeys: Access Private
			"_getDifficultyHitObjects"
		](beatmap, clockRate)) {
			for (const skill of skills) {
				skill.process(hitObject);
			}
		}

		const strainInformations: {
			time: number;
			strain: number;
		}[] = new Array(
			Math.max(aimStrainPeaks.length, speedStrainPeaks.length) + 1,
		);

		strainInformations[0] = {
			strain: 0,
			time: (currentSectionEnd - sectionLength) / 1000,
		};

		for (let i = 1; i < strainInformations.length; ++i) {
			const aimStrain = aimStrainPeaks[i] ?? 0;
			const speedStrain = speedStrainPeaks[i] ?? 0;

			strainInformations[i] = {
				time: (currentSectionEnd + sectionLength * (i - 1)) / 1000,
				strain: (aimStrain + speedStrain) / 2,
			};
		}

		this.strains = strainInformations;
	}

	protected override reassignObjects() {
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
			(object) =>
				object instanceof Circle ||
				object instanceof Slider ||
				object instanceof Spinner,
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

						resolve(
							new DrawableFollowPoints(startObject, endObject).hook(
								this.context,
							),
						);
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

			connectors.push(
				new DrawableFollowPoints(startObject, endObject).hook(this.context),
			);
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

	protected override loadHitObjectsSync(): void {
		this.objects = this.data.hitObjects
			.map((object) => {
				if (object instanceof Circle)
					return new DrawableHitCircle(object).hook(this.context);
				if (object instanceof Slider)
					return new DrawableSlider(object).hook(this.context);
				if (object instanceof Spinner)
					return new DrawableSpinner(object).hook(this.context);
				return null;
			})
			.filter((object) => object !== null);
	}

	protected override async loadHitObjectsAsync() {
		this.objects = (
			await Promise.all(
				this.data.hitObjects.map((object) => {
					return new Promise<DrawableHitObject | null>((resolve) => {
						setTimeout(() => {
							if (object instanceof Circle)
								resolve(new DrawableHitCircle(object).hook(this.context));
							if (object instanceof Slider)
								resolve(new DrawableSlider(object).hook(this.context));
							if (object instanceof Spinner)
								resolve(new DrawableSpinner(object).hook(this.context));
							resolve(null);
						}, 5);
					});
				}),
			)
		).filter((object) => object !== null);
	}

	override async loadHitObjects() {
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

					const currentInBreak = this.data.events.breaks.some(
						({ startTime, endTime }) =>
							startTime <= currentTime && currentTime <= endTime,
					);

					const currentInMap =
						currentTime >
							this.data.hitObjects[0].startTime -
								this.data.hitObjects[0].timePreempt &&
						currentTime <
							((this.data.hitObjects.at(-1) as Slider).endTime ??
								this.data.hitObjects.at(-1)?.startTime);

					const backgroundConfig =
						inject<BackgroundConfig>("config/background");

					if (backgroundConfig) {
						const shouldBreak = !(!currentInBreak && currentInMap);

						if (backgroundConfig.breakSection !== shouldBreak)
							backgroundConfig.breakSection = shouldBreak;
					}

					this.previousTime = previousTime;
					this.update(currentTime, objects, connectors);
					break;
				}
			}
		};
	}

	frame(time: number): void {
		super.frame(time);
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

	update(time: number, objects: Set<number>, connectors: Set<number>): void {
		if (!this.loaded) return;

		if (
			this.container.dragWindow[0].distance(this.container.dragWindow[1]) > 0
		) {
			for (const idx of objects) {
				const obj = this.objects[idx];
				const isInBound = this.container.checkInBound(obj.object.startPosition);

				if (isInBound) {
					this.container.addSelected(idx);
				} else {
					this.container.removeSelected(idx);
				}
			}
		}

		const objectsWithSelected = objects.union(this.container.selected);

		// const audio = this.context.consume<Audio>("audio");
		const objectContainer = this.container.objectsContainer;

		const disposedObjects =
			this.previousObjects.difference(objectsWithSelected);
		const disposedConnectors = this.previousConnectors.difference(connectors);
		this.previousObjects = objectsWithSelected;
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

		super.update(time, objects);
	}

	hookReplay(replay: Replay): void {
		super.hookReplay(replay);
		this.container.cursorLayer.addChild(
			...replay.trails.toReversed(),
			replay.cursor,
		);
	}

	unhookReplay() {
		if (this.replay) this.container.cursorLayer.removeChildren();
		super.unhookReplay();
	}

	destroy(): void {
		for (const connector of this.connectors) {
			connector.destroy();
		}

		this.connectors = [];
		this.previousConnectors.clear();

		super.destroy();
	}
}
