import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type TimelineHitObject from "@/BeatmapSet/Beatmap/Timeline/TimelineHitObject";
import TimelineTimingPoint from "@/BeatmapSet/Beatmap/Timeline/TimelineTimingPoint";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { binarySearch, gcd } from "@/utils";
import { LayoutContainer } from "@pixi/layout/components";
import type { TimingPoint } from "osu-classes";
import { Container, Graphics, GraphicsContext, Rectangle } from "pixi.js";

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
	container = new LayoutContainer({
		label: "timeline",
		layout: {
			width: "100%",
			height: 80,
			backgroundColor: {
				r: 30,
				g: 30,
				b: 46,
				a: 0.8,
			},
			overflow: "hidden",
		},
	});

	private _objectsContainer = new Container({
		isRenderGroup: true,
	});
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

		this.container.addChild(this._ruler, this._objectsContainer, thumb);
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

		inject<TimelineConfig>("config/timeline")?.onChange("scale", (newScale) => {
			const width = this.container.layout?.computedLayout.width ?? 0;
			this._range = (width / 2) * (DEFAULT_SCALE / newScale) + 120;
		});

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

	loadObjects(objects: (DrawableHitCircle | DrawableSlider)[]) {
		if (this._objects.length > 0) {
			this._objectsContainer.removeChild(
				...this._objects.map((object) => object.container),
			);
			this._objects = [];
		}

		this._objects = objects
			.map((object) => object.timelineObject)
			.filter((object) => object !== undefined);
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

	private _inRange(val: number, start: number, end: number) {
		if (start <= val && val <= end) return 0;
		if (val > end) return -1;
		if (val < start) return 1;
		return 1;
	}

	private _previous = new Set<number>();
	update(timestamp: number) {
		this.updateTiming(timestamp);

		const idx = binarySearch(timestamp, this._objects, (mid, value) =>
			this._inRange(value, mid.getTimeRange().start, mid.getTimeRange().end),
		);

		const set = new Set<number>();
		set.add(idx);

		let start = idx - 1;
		while (
			start >= 0 &&
			this._inRange(
				timestamp - this._range,
				this._objects[start].getTimeRange().start,
				this._objects[start].getTimeRange().end,
			) >= 0
		) {
			set.add(start);
			start--;
		}

		let end = idx + 1;
		while (
			end < this._objects.length &&
			this._inRange(
				timestamp + this._range,
				this._objects[end].getTimeRange().start,
				this._objects[end].getTimeRange().end,
			) <= 0
		) {
			set.add(end);
			end++;
		}

		const removed = this._previous.difference(set);
		for (const idx of removed) {
			this._objects[idx].container.visible = false;
			this._objectsContainer.removeChild(this._objects[idx].container);
		}

		this._previous = set;
		const objs: Container[] = [];
		for (const idx of [...set].sort()) {
			objs.push(this._objects[idx].container);
		}

		this._objectsContainer.addChild(...objs);
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
			this._timingPoints[idx].container.visible = false;
			this._objectsContainer.removeChild(this._timingPoints[idx].container);
		}

		this._previousTiming = set;
		const objs: Container[] = [];
		for (const idx of [...set].sort()) {
			objs.push(this._timingPoints[idx].container);
		}

		this._objectsContainer.addChild(...objs);
	}

	draw(timestamp: number) {
		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
		const width = this.container.layout?.computedLayout.width ?? 0;
		this._objectsContainer.x = width / 2 + -timestamp / (DEFAULT_SCALE / scale);
		this._ruler.x = width / 2 + -timestamp / (DEFAULT_SCALE / scale);

		for (const idx of [...this._previousTiming].sort((a, b) => b - a)) {
			this._timingPoints[idx].container.visible = true;
		}

		for (const idx of [...this._previous].sort((a, b) => b - a)) {
			this._objects[idx].container.visible = true;
		}

		this.drawRuler(timestamp);
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

		const drawAtPoint = (currentPoint: number, timestamp: number) => {
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
