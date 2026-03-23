import { BinarySearch, type ControlPoint } from "osu-classes";
import type { ManiaHitObject } from "osu-mania-stable";
import type { Container } from "pixi.js";
import type GameplayConfig from "@/Config/GameplayConfig";
import { type Context, inject } from "@/Context";
import { Clamp } from "@/utils";
import DrawableHitObject from "../../Shared/HitObjects/DrawableHitObject";
import type ManiaBeatmap from "../ManiaBeatmap";

export default abstract class DrawableManiaHitObject extends DrawableHitObject {
	abstract container: Container;

	constructor(object: ManiaHitObject) {
		super(object);
		this.object = object;
	}
	
	hook(context: Context) {
		super.hook(context);
		
		this.refreshSprite();
		
		return this;
	}

	update(time: number) {
		const beatmap = this.context.consume<ManiaBeatmap>("beatmapObject");
		const hitPosition = beatmap?.hitPosition ?? 480; 
		
		const progress = this.getDistanceAtTime(time, this.object.startTime);
		this.container.y = Clamp(hitPosition - progress, 0, hitPosition);

		return progress;
	}

	getDistanceAtTime(time: number, endTime: number) {
		const beatmap = this.context.consume<ManiaBeatmap>("beatmapObject");
		const velocityPoints = beatmap?.velocityPoints ?? [];

		const scrollSpeed =
			inject<GameplayConfig>("config/gameplay")?.scrollSpeed ?? 1;

		const startIndex = beatmap?.velocityPointIdx ?? 0;
		const endIndex = BinarySearch.findControlPointIndex(
			velocityPoints as unknown as ControlPoint[],
			endTime,
		);

		let i = Math.max(0, startIndex);

		let startTime = time;
		let distance = 0;

		while (i <= Math.max(0, endIndex)) {
			const currentPoint = velocityPoints[i];
			const nextPoint = velocityPoints[i + 1];

			const nextPoints = [endTime];
			if (nextPoint?.startTime > startTime)
				nextPoints.push(nextPoint.startTime);

			const nextTime = Math.min(...nextPoints);

			const delta_t = nextTime - startTime;
			const multiplier = currentPoint?.sliderVelocity ?? 1;
			const bpmMultiplier = currentPoint?.bpmMultiplier ?? 1;

			const localDistance =
				((beatmap?.hitPosition ?? 480) / 13720) *
				multiplier *
				bpmMultiplier *
				scrollSpeed *
				delta_t;

			distance += localDistance;

			startTime = nextTime;

			i++;
		}

		return distance;
	}

	protected _object!: ManiaHitObject;
	get object() {
		return this._object;
	}
	set object(val: ManiaHitObject) {
		this._object = val;
	}

	abstract getTimeRange(): { start: number; end: number };

	playHitSound(_?: number, __?: number): void {}

	destroy() {
		this.container.destroy();
		
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
