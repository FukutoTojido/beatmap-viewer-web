import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type TimelineHitObject from "@/BeatmapSet/Beatmap/Timeline/TimelineHitObject";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { binarySearch, gcd } from "@/utils";
import { LayoutContainer } from "@pixi/layout/components";
import type { TimingPoint } from "osu-classes";
import { Container, Graphics, Rectangle } from "pixi.js";

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
			height: 60,
			backgroundColor: {
				r: 30,
				g: 30,
				b: 46,
				a: 0.8,
			},
		},
	});

	objectsContainer = new Container();
	private _objects: TimelineHitObject[] = [];
	private _range = 0;

	private _ruler = new Graphics();

	constructor() {
		const thumb = new Graphics()
			.rect(-1, -40, 2, 80)
			.moveTo(-6, -40)
			.lineTo(-1, -36)
			.lineTo(1, -36)
			.lineTo(6, -40)
			.lineTo(-6, -40)
			.moveTo(-6, 40)
			.lineTo(-1, 36)
			.lineTo(1, 36)
			.lineTo(6, 40)
			.lineTo(-6, 40)
			.fill(0xcdd6f4);

		this.container.addChild(this.objectsContainer, thumb, this._ruler);
		this.container.on("layout", (layout) => {
			const { width, height } = layout.computedLayout;

			const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
			this._range = (width / 2) * (DEFAULT_SCALE / scale) + 120;

			this.objectsContainer.x = width / 2;

			thumb.x = width / 2;
			thumb.y = height / 2;

			this._ruler.x = width / 2;

			thumb
				.clear()
				.rect(0, -(height / 2), 1, height)
				.moveTo(-2, -(height / 2))
				.lineTo(0, -(height / 2 - 2))
				.lineTo(2, -(height / 2 - 2))
				.lineTo(4, -(height / 2))
				.lineTo(-2, -(height / 2))
				.moveTo(-2, height / 2)
				.lineTo(-0, height / 2 - 2)
				.lineTo(2, height / 2 - 2)
				.lineTo(4, height / 2)
				.lineTo(-2, height / 2)
				.fill(0xcdd6f4);
		});

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				if (direction === "landscape") {
					this.container.layout = {
						height: 60,
					};
					this.objectsContainer.scale.set(1);
					this._ruler.scale.set(1);
				}

				if (direction === "portrait") {
					this.container.layout = {
						height: 40,
					};
					this.objectsContainer.scale.set(2 / 3);
					this._ruler.scale.set(2 / 3);
				}
			},
		);
	}

	loadObjects(objects: (DrawableHitCircle | DrawableSlider)[]) {
		if (this._objects.length > 0) {
			this._objects = [];
			this.objectsContainer.removeChildren();
		}

		this._objects = objects
			.map((object) => object.timelineObject)
			.filter((object) => object !== undefined);
	}

	private _inRange(val: number, start: number, end: number) {
		if (start <= val && val <= end) return 0;
		if (val > end) return -1;
		if (val < start) return 1;
		return 1;
	}

	private _previous = new Set<number>();
	update(timestamp: number) {
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
			this.objectsContainer.removeChild(this._objects[idx].container);
		}

		this._previous = set;
		const objs: Container[] = [];
		for (const idx of [...set].sort()) {
			objs.push(this._objects[idx].container);
		}

		this.objectsContainer.addChild(...objs);
	}

	draw(timestamp: number) {
		for (const idx of [...this._previous].sort((a, b) => b - a)) {
			this._objects[idx].container.visible = true;
			this._objects[idx].update(timestamp);
		}

		this.drawRuler(timestamp);
	}

	private _currentTimingPoint?: TimingPoint;
	updateTimingPoint(timingPoint: TimingPoint) {
		this._currentTimingPoint = timingPoint;
	}

	private drawRuler(timestamp: number) {
		if (!this._currentTimingPoint) return;

		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
		const divisor = inject<TimelineConfig>("config/timeline")?.divisor ?? 4;

		const startBound = timestamp - this._range;
		const endBound = timestamp + this._range;

		const { beatLength, timeSignature, startTime } = this._currentTimingPoint;

		const nearestBeat =
			startTime + beatLength * Math.ceil((timestamp - startTime) / beatLength);

		this._ruler.clear();

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

			this._ruler
				.moveTo((currentPoint - timestamp) / (DEFAULT_SCALE / scale), 60)
				.lineTo(
					(currentPoint - timestamp) / (DEFAULT_SCALE / scale),
					isDominant ? 30 : 50,
				)
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
	}
}
