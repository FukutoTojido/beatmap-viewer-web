import IntervalTree from "@flatten-js/interval-tree";
import { sort } from "fast-sort";
import { BinarySearch, type ControlPoint } from "osu-classes";
import {
	Hold,
	type ManiaBeatmap as ManiaBeatmapBase,
	type ManiaDifficultyAttributes,
	type ManiaDifficultyCalculator,
	ManiaRuleset,
	Note,
} from "osu-mania-stable";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import type GameplayConfig from "@/Config/GameplayConfig";
import { inject } from "@/Context";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import Beatmap from "../..";
import DrawableHold from "./HitObjects/DrawableHold";
import type DrawableManiaHitObject from "./HitObjects/DrawableManiaHitObject";
import DrawableNote from "./HitObjects/DrawableNote";
import type ManiaGameplay from "./ManiaGameplay";

type VelocityPoint = {
	bpmMultiplier: number;
	sliderVelocity: number;
	startTime: number;
};

export default class ManiaBeatmap extends Beatmap {
	static override ruleset = new ManiaRuleset();

	declare difficultyAttributes: ManiaDifficultyAttributes;
	declare difficultyCalculator: ManiaDifficultyCalculator;

	declare data: ManiaBeatmapBase;

	declare objects: DrawableManiaHitObject[];
	declare container: ManiaGameplay;

	velocityPoints: VelocityPoint[] = [];

	hitPosition = 402;
	columnWidths: number[] = [30];
	skinEventListener?: (skin: Skin) => void;

	constructor(public raw: string) {
		super(raw, ManiaBeatmap.ruleset);

		const points: VelocityPoint[] = [];

		let i = 0;
		let j = 0;

		let bpmMultiplier = 1;
		let sliderVelocity = 1;

		while (
			i < this.data.controlPoints.difficultyPoints.length ||
			j < this.data.controlPoints.timingPoints.length
		) {
			const difficultyPoint = this.data.controlPoints.difficultyPoints[i];
			const timingPoint = this.data.controlPoints.timingPoints[j];

			if (!difficultyPoint && !timingPoint) break;

			if (!difficultyPoint) {
				const currentBpmMultiplier = timingPoint.bpm / this.data.bpm;
				points.push({
					startTime: timingPoint.startTime,
					sliderVelocity,
					bpmMultiplier: currentBpmMultiplier,
				});

				bpmMultiplier = currentBpmMultiplier;
				j++;
				continue;
			}

			if (!timingPoint) {
				const currentSliderVelocityMultiplier = difficultyPoint.sliderVelocity;
				points.push({
					startTime: difficultyPoint.startTime,
					sliderVelocity: currentSliderVelocityMultiplier,
					bpmMultiplier,
				});

				sliderVelocity = currentSliderVelocityMultiplier;
				i++;
				continue;
			}

			points.push({
				startTime: Math.min(difficultyPoint.startTime, timingPoint.startTime),
				sliderVelocity: difficultyPoint.sliderVelocity,
				bpmMultiplier: timingPoint.bpm / this.data.bpm,
			});

			i += Math.max(
				0,
				Math.sign(timingPoint.startTime - difficultyPoint.startTime),
			);
			j += Math.max(
				0,
				Math.sign(difficultyPoint.startTime - timingPoint.startTime),
			);

			if (timingPoint.startTime === difficultyPoint.startTime) {
				i++;
				j++;
			}
		}

		this.velocityPoints = sort(points).asc([(point) => point.startTime]);
		console.log(this);

		this.refreshSprite(this.data);
		this.skinEventListener = inject<SkinManager>(
			"skinManager",
		)?.addSkinChangeListener(() => this.refreshSprite(this.data));
	}

	refreshSprite(data: ManiaBeatmapBase) {
		const skin = inject<SkinManager>("skinManager")?.getCurrentSkin();
		if (!skin) return;

		const columnWidthRaw = `${
			skin.config[`ManiaKey=${data.originalTotalColumns}`]?.ColumnWidth ?? 30
		}`.split(",");
		this.columnWidths = [];
		this.hitPosition =
			(skin.config[`ManiaKey=${data.originalTotalColumns}`]
				?.HitPosition as number) ?? 402;

		for (let i = 0; i < this.data.originalTotalColumns; i++) {
			const columnWidth = Math.min(100, +(columnWidthRaw[i] ?? 30));
			this.columnWidths.push(columnWidth);
		}

		console.log(this.columnWidths);
	}

	createStatsAttributes(): Record<string, string> {
		return {
			WHAT: "THE FUCK",
		};
	}

	getVelocityPointAt(time: number) {
		const timingPoint = this.data.controlPoints.timingPointAt(time);
		const difficultyPoint = this.data.controlPoints.difficultyPointAt(time);

		return {
			timingPoint,
			difficultyPoint,
		};
	}

	protected override calculateStrainGraph(_: string): void {
		this.strains = [];
	}

	protected override reassignObjects() {}

	protected override loadHitObjectsSync(): void {
		this.objects = this.data.hitObjects
			.map((object) => {
				if (object instanceof Note)
					return new DrawableNote(object).hook(this.context);
				if (object instanceof Hold)
					return new DrawableHold(object).hook(this.context);
				return null;
			})
			.filter((object) => object !== null);
	}

	protected override async loadHitObjectsAsync() {
		this.objects = (
			await Promise.all(
				this.data.hitObjects.map((object) => {
					return new Promise<DrawableManiaHitObject | null>((resolve) => {
						setTimeout(() => {
							if (object instanceof Note)
								resolve(new DrawableNote(object).hook(this.context));
							if (object instanceof Hold)
								resolve(new DrawableHold(object).hook(this.context));
							resolve(null);
						}, 5);
					});
				}),
			)
		).filter((object) => object !== null);
	}

	private _objectsTree = new IntervalTree<number>();
	override async loadHitObjects() {
		console.time("Constructing hitObjects");

		const async = inject<ExperimentalConfig>(
			"config/experimental",
		)?.asyncLoading;
		if (async) await this.loadHitObjectsAsync();
		else this.loadHitObjectsSync();

		console.timeEnd("Constructing hitObjects");

		for (let i = 0; i < this.objects.length; i++) {
			const object = this.objects[i];
			const { start, end } = object.getTimeRange();
			this._objectsTree.insert([start, end], i);
		}
	}

	scrollTime = 0;
	currentDifficultyPointIdx = 0;
	currentTimingPointIdx = 0;
	velocityPointIdx = 0;
	frame(time: number): void {
		if (!this.loaded) return;
		super.frame(time);

		const scrollSpeed =
			inject<GameplayConfig>("config/gameplay")?.scrollSpeed ?? 25;

		this.velocityPointIdx = BinarySearch.findControlPointIndex(
			this.velocityPoints as unknown as ControlPoint[],
			time,
		);
		const velocityPoints = this.velocityPoints;

		let startTime = time;
		let distance = 0;
		let duration = 0;

		let i = Math.max(0, this.velocityPointIdx);

		while (i <= velocityPoints.length) {
			const currentPoint = velocityPoints[i];
			const nextPoint = velocityPoints[i + 1];

			const nextPoints = [this.data.totalLength];
			if (nextPoint?.startTime > startTime)
				nextPoints.push(nextPoint.startTime);

			const nextTime = Math.min(...nextPoints);

			const delta_t = nextTime - startTime;
			const multiplier = currentPoint?.sliderVelocity ?? 1;
			const bpmMultiplier = currentPoint?.bpmMultiplier ?? 1;
			const localDistance =
				(480 / 13720) * multiplier * bpmMultiplier * scrollSpeed * delta_t;

			if (distance + localDistance > 480) {
				const delta_s = 480 - distance;
				const fillPercentage = delta_s / localDistance;

				duration += delta_t * fillPercentage;
				break;
			}

			startTime = nextTime;
			distance += localDistance;
			duration += delta_t;

			i++;
		}

		const objects = new Set<number>(
			this._objectsTree.search([time - 200, time + duration]) as Array<number>,
		);
		const disposed = this.previousObjects.difference(objects);

		this.previousObjects = objects;

		for (const idx of disposed) {
			const object = this.objects[idx];
			this.container.objectsContainer.removeChild(object.container);
		}

		const objs = sort([...this.previousObjects]).desc(
			(u) => this.objects[u].object.startTime,
		);
		for (const idx of objs) {
			const object = this.objects[idx];
			this.container.objectsContainer.addChild(object.container);
			object.update(time);
		}
	}

	update(time: number, objects: Set<number>): void {
		if (!this.loaded) return;

		if (this.skinEventListener)
			inject<SkinManager>("skinManager")?.removeSkinChangeListener(
				this.skinEventListener,
			);

		super.update(time, objects);
	}
}
