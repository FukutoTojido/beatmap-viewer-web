import IntervalTree from "@flatten-js/interval-tree";
import type { TimingPoint } from "osu-classes";
import type { Slider } from "osu-standard-stable";
import { Container, Graphics, GraphicsContext } from "pixi.js";
import type Audio from "@/Audio";
import type BeatmapSet from "@/BeatmapSet";
import type Beatmap from "@/BeatmapSet/Beatmap";
import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type TimelineHitObject from "@/BeatmapSet/Beatmap/Timeline/TimelineHitObject";
import TimelineTimingPoint from "@/BeatmapSet/Beatmap/Timeline/TimelineTimingPoint";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import ZContainer from "@/UI/core/ZContainer";
import Easings from "@/UI/Easings";
import { binarySearch, gcd } from "@/utils";

export const DEFAULT_SCALE = 1;
const BEAT_LINE_COLOR = {
	1: 0xffffff,
	2: 0xff0000,
	3: 0xb706b7,
	4: 0x3276e6,
	5: 0xe6e605,
	6: 0x843e84,
	7: 0xe6e605,
	8: 0xe6e605,
	9: 0xe6e605,
};

export default class Timeline {
	container = new ZContainer({
		label: "timeline",
		layout: {
			flex: 1,
			height: 80,
			overflow: "hidden",
		},
	});

	private _objectsContainer = new Container({
		isRenderGroup: true,
	});
	private _dragWindow = new Graphics()
		.rect(0, 0, 1, 80)
		.fill({ color: 0xffffff, alpha: 0.3 });
	private _timingPoints: TimelineTimingPoint[] = [];
	private _objects: TimelineHitObject[] = [];
	private _range = 0;

	private _ruler = new Graphics();

	constructor() {
		const thumb = new Graphics()
			.moveTo(0, -40)
			.lineTo(0, 40)
			.stroke(0xcdd6f4)
			.moveTo(-2, -(80 / 2))
			.lineTo(0, -(80 / 2 - 2))
			.lineTo(2, -(80 / 2 - 2))
			.lineTo(4, -(80 / 2))
			.lineTo(-2, -(80 / 2))
			.moveTo(-2, 80 / 2)
			.lineTo(-0, 80 / 2 - 2)
			.lineTo(2, 80 / 2 - 2)
			.lineTo(4, 80 / 2)
			.lineTo(-2, 80 / 2)
			.fill(0xcdd6f4);

		this.container.addChild(
			this._ruler,
			this._objectsContainer,
			this._dragWindow,
			thumb,
		);
		this.container.on("layout", (layout) => {
			const { width, height } = layout.computedLayout;

			const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
			this._range = (width / 2) * (DEFAULT_SCALE / scale) + 120;

			thumb.x = width / 2;
			thumb.y = height / 2;

			const thumbContext = new GraphicsContext()
				.moveTo(0, -height / 2)
				.lineTo(0, height / 2)
				.stroke(0xcdd6f4)
				//
				.moveTo(-3, -(height / 2))
				.lineTo(0, -(height / 2 - 3))
				.lineTo(3, -(height / 2))
				.lineTo(-3, -(height / 2))
				//
				.moveTo(-3, height / 2)
				.lineTo(0, height / 2 - 3)
				.lineTo(3, height / 2)
				.lineTo(-3, height / 2)
				.fill(0xcdd6f4);

			thumb.context = thumbContext;
		});

		this.loadEventListeners();

		inject<TimelineConfig>("config/timeline")?.onChange("scale", (newScale) => {
			const width = this.container.layout?.computedLayout.width ?? 0;
			this._range = (width / 2) * (DEFAULT_SCALE / newScale) + 120;
		});

		inject<FullscreenConfig>("config/fullscreen")?.onChange(
			"fullscreen",
			(isFullscreen) => {
				if (isFullscreen) {
					this.container.triggerAnimation(
						"height",
						this.container.layout?.computedLayout.height ?? 80,
						0,
						(val) => {
							this.container.layout = { height: val };
						},
						200,
						Easings.InOut,
						() => {
							this.container.visible = false;
						},
					);
				}

				if (!isFullscreen) {
					this.container.visible = true;
					this.container.triggerAnimation(
						"height",
						this.container.layout?.computedLayout.height ?? 0,
						80,
						(val) => {
							this.container.layout = { height: val };
						},
						200,
						Easings.InOut,
					);
				}
			},
		);

		this.container.addEventListener(
			"wheel",
			(event) => {
				if (!event.altKey) return;

				event.preventDefault();
				const timeline = inject<TimelineConfig>("config/timeline");
				if (timeline === undefined) return;

				if (event.deltaY > 0) {
					timeline.scale = Math.max(0.5, timeline.scale - 0.1);
					return;
				}

				if (event.deltaY < 0) {
					timeline.scale = Math.min(1.5, timeline.scale + 0.1);
					return;
				}
			},
			{
				capture: true,
				passive: false,
			},
		);
	}

	private _dragWindowRange: [number, number] = [0, 0];
	private _selected = new Set<number>();
	private _clicked = false;
	private _offset = 0;
	loadEventListeners() {
		this.container.on("pointerdown", (event) => {
			this._clicked = true;

			const { x } = this.container.toLocal(event.global);
			const width = this.container.layout?.computedLayout.width ?? 1;
			const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
			const currentTime =
				inject<BeatmapSet>("beatmapset")?.context.consume<Audio>("audio")
					?.currentTime ?? 0;

			const time = (x - width / 2) * (DEFAULT_SCALE / scale) + currentTime;
			this._dragWindowRange = [time, time];
			const padding = 40 * (DEFAULT_SCALE / scale);

			const selected = new Set<number>();
			for (const idx of this._previous) {
				const obj = this._objects[idx];
				const startTime = obj.object.startTime;
				const endTime = (obj.object as Slider).endTime ?? obj.object.startTime;

				if (
					(time - padding < startTime && time + padding > startTime) ||
					(time - padding < endTime && time + padding > endTime) ||
					(startTime - padding < time && time < endTime + padding)
				) {
					selected.add(idx);
				}
			}

			if (!event.ctrlKey || selected.values.length === 0) {
				for (const idx of this._selected) {
					this.removeSelected(idx);
				}
			}

			this._selected.add([...selected][0]);
			for (const idx of this._selected) {
				this.addSelected(idx);
			}
		});

		this.container.on("globalpointermove", (event) => {
			if (!this._clicked) return;
			const { x } = this.container.toLocal(event.global);
			const width = this.container.layout?.computedLayout.width ?? 1;
			const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
			const currentTime =
				inject<BeatmapSet>("beatmapset")?.context.consume<Audio>("audio")
					?.currentTime ?? 0;

			const offset = (x - width / 2) * (DEFAULT_SCALE / scale);
			const time = (x - width / 2) * (DEFAULT_SCALE / scale) + currentTime;
			this._dragWindowRange[1] = time;
			this._offset = offset;
		});

		this.container.on("pointerup", () => {
			this._clicked = false;
			this._dragWindowRange = [0, 0];
			this._dragWindow.scale.set(0, 1);
			this._offset = 0;
		});

		this.container.on("pointerupoutside", () => {
			this._clicked = false;
			this._dragWindowRange = [0, 0];
			this._dragWindow.scale.set(0, 1);
			this._offset = 0;
		});
	}

	addSelected(idx: number) {
		this._selected.add(idx);
		const obj = this._objects[idx];
		obj?.context.consume<Beatmap>("beatmapObject")?.container.addSelected(idx);
	}

	removeSelected(idx: number) {
		this._selected.delete(idx);
		const obj = this._objects[idx];
		obj?.context
			.consume<Beatmap>("beatmapObject")
			?.container.removeSelected(idx);
	}

	private _tree = new IntervalTree<number>();
	loadObjects(objects: (DrawableHitCircle | DrawableSlider)[]) {
		if (this._objects.length > 0) {
			this._objectsContainer.removeChild(
				...this._objects.map((object) => object.container),
			);
			this._objects = [];
			this._tree.clear();
		}

		this._objects = objects
			.map((object) => object.timelineObject)
			.filter((object) => object !== undefined);

		for (let i = 0; i < this._objects.length; i++) {
			const { start, end } = this._objects[i].getTimeRange();
			this._tree.insert([start, end], i);
		}
	}

	loadTimingPoints(points: TimingPoint[]) {
		if (this._timingPoints.length > 0) {
			this._objectsContainer.removeChild(
				...this._timingPoints.map((point) => point.container),
			);
			this._timingPoints = [];
		}

		this._timingPoints = points.map((point) => new TimelineTimingPoint(point));
	}

	private _previous = new Set<number>();
	update(timestamp: number) {
		this.updateTiming(timestamp);

		const set = new Set<number>(
			this._tree.search([
				timestamp - this._range,
				timestamp + this._range,
			]) as Array<number>,
		);

		const removed = this._previous.difference(set);
		for (const idx of removed) {
			if (!this._objects[idx]) continue;
			this._objects[idx].container.visible = false;
			this._objectsContainer.removeChild(this._objects[idx].container);
		}

		this._previous = set;
		const objs: Container[] = [];
		for (const idx of [...set].sort()) {
			objs.push(this._objects[idx].container);
		}

		if (objs.length > 0) this._objectsContainer.addChild(...objs);
	}

	private _previousTiming = new Set<number>();
	updateTiming(timestamp: number) {
		const idx = binarySearch(
			timestamp,
			this._timingPoints,
			(mid, value) => mid.data.startTime - value,
		);

		const set = new Set<number>();
		set.add(idx);

		let start = idx - 1;
		while (
			start >= 0 &&
			this._timingPoints[start].data.startTime > timestamp - this._range
		) {
			set.add(start);
			start--;
		}

		let end = idx + 1;
		while (
			this._timingPoints[end] &&
			end < this._objects.length &&
			this._timingPoints[end].data.startTime < timestamp + this._range
		) {
			set.add(end);
			end++;
		}

		const removed = this._previousTiming.difference(set);
		for (const idx of removed) {
			if (!this._timingPoints[idx]) continue;
			this._timingPoints[idx].container.visible = false;
			this._objectsContainer.removeChild(this._timingPoints[idx].container);
		}

		this._previousTiming = set;
		const objs: Container[] = [];
		for (const idx of [...set].sort()) {
			if (!this._timingPoints[idx]) continue;
			objs.push(this._timingPoints[idx].container);
		}

		if (objs.length > 0) this._objectsContainer.addChild(...objs);

		if (Math.abs(this._dragWindowRange[0] - this._dragWindowRange[1]) !== 0) {
			const min = Math.min(...this._dragWindowRange);
			const max = Math.max(...this._dragWindowRange);

			for (const idx of this._previous) {
				const obj = this._objects[idx];
				const startTime = obj.object.startTime;
				const endTime = (obj.object as Slider).endTime ?? obj.object.startTime;

				if (
					(min < startTime && max > startTime) ||
					(min < endTime && max > endTime) ||
					(min < startTime && endTime < max)
				) {
					this.addSelected(idx);
				} else {
					this.removeSelected(idx);
				}
			}
		}
	}

	draw(timestamp: number) {
		if (
			this._clicked &&
			inject<BeatmapSet>("beatmapset")?.context.consume<Audio>("audio")
				?.state === "PLAYING"
		) {
			this._dragWindowRange[1] = timestamp + this._offset;
		}

		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
		const width = this.container.layout?.computedLayout.width ?? 0;
		this._objectsContainer.x = width / 2 + -timestamp / (DEFAULT_SCALE / scale);
		this._ruler.x = width / 2 + -timestamp / (DEFAULT_SCALE / scale);

		for (const idx of [...this._previousTiming].sort((a, b) => b - a)) {
			if (!this._timingPoints[idx]) continue;
			this._timingPoints[idx].container.visible = true;
		}

		for (const idx of [...this._previous].sort((a, b) => b - a)) {
			if (!this._objects[idx]) continue;
			this._objects[idx].container.visible = true;
		}

		this.drawRuler(timestamp);

		if (Math.abs(this._dragWindowRange[0] - this._dragWindowRange[1]) !== 0) {
			const min = Math.min(...this._dragWindowRange);
			const max = Math.max(...this._dragWindowRange);

			const width = this.container.layout?.computedLayout.width ?? 1;
			const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
			const currentTime =
				inject<BeatmapSet>("beatmapset")?.context.consume<Audio>("audio")
					?.currentTime ?? 0;

			const dist = max - min;

			const x = (min - currentTime) / (DEFAULT_SCALE / scale);
			const w = dist / (DEFAULT_SCALE / scale);

			this._dragWindow.x = width / 2 + x;
			this._dragWindow.scale.set(w, 1);
		}
	}

	private _currentTimingPoint?: TimingPoint;
	updateTimingPoint(timingPoint: TimingPoint) {
		this._currentTimingPoint = timingPoint;
	}

	private _currentContext?: GraphicsContext;
	private drawRuler(timestamp: number) {
		if (!this._currentTimingPoint) return;

		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
		const divisor = inject<TimelineConfig>("config/timeline")?.divisor ?? 4;

		const startBound = timestamp - this._range;
		const endBound = timestamp + this._range;

		const { beatLength, timeSignature, startTime } = this._currentTimingPoint;

		const nearestBeat =
			startTime + beatLength * Math.ceil((timestamp - startTime) / beatLength);

		const context = new GraphicsContext();

		let currentPoint = nearestBeat;

		const drawAtPoint = (currentPoint: number, _: number) => {
			const isWholeBeat =
				Math.round(
					currentPoint -
						(Math.round((currentPoint - startTime) / beatLength) * beatLength +
							startTime),
				) === 0;

			const isDominant =
				isWholeBeat &&
				Math.round((currentPoint - startTime) / beatLength) % timeSignature ===
					0;

			let color = 0xffffff;
			if (!isWholeBeat) {
				const nearestWholeBeat =
					Math.floor((currentPoint - startTime) / beatLength) * beatLength +
					startTime;

				const distance = currentPoint - nearestWholeBeat;
				const idx = Math.round(distance / (beatLength / divisor));

				const denominator = divisor / gcd(divisor, idx);
				color =
					BEAT_LINE_COLOR[denominator as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9] ??
					0x929292;
			}

			context
				.moveTo(currentPoint / (DEFAULT_SCALE / scale), isDominant ? 0 : 10)
				.lineTo(currentPoint / (DEFAULT_SCALE / scale), isDominant ? 80 : 70)
				.stroke({
					color,
					pixelLine: true,
				});
		};

		while (currentPoint <= endBound) {
			drawAtPoint(currentPoint, timestamp);
			currentPoint += beatLength / divisor;
		}

		currentPoint = nearestBeat - beatLength / divisor;
		while (currentPoint >= startBound) {
			drawAtPoint(currentPoint, timestamp);
			currentPoint -= beatLength / divisor;
		}

		this._currentContext?.destroy();
		this._currentContext = context;
		this._ruler.context = context;
	}
}
