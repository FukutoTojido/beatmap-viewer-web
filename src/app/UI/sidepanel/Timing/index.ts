import { LayoutContainer } from "@pixi/layout/components";
import type { DifficultyPoint, SamplePoint, TimingPoint } from "osu-classes";
import { Container, type FederatedPointerEvent, Rectangle } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import type State from "@/State";
import AnimationController from "@/UI/animation/AnimationController";
import Easings from "@/UI/Easings";
import Point from "./Point";

const DECAY_RATE = 0.99;
const LN0_9 = Math.log(DECAY_RATE);

export default class Timing {
	container: LayoutContainer;
	private _timingContainer: Container;

	private _scrollOffset = 0;
	private animationControler = new AnimationController();

	private _cachedWidth? = 360;

	constructor() {
		this.container = new LayoutContainer({
			label: "timing",
			layout: {
				width: 360,
				flex: 1,
				overflow: "hidden",
				backgroundColor: inject<ColorConfig>("config/color")?.color.mantle,
				borderRadius: 0,
			},
			visible: false,
		});

		this._timingContainer = new Container();
		this.container.addChild(this._timingContainer);

		this.container.on("layout", () => {
			const offset =
				this.currentIdx * 45 -
				(this.container.layout?.computedLayout.height ?? 0) +
				40;
			this.scrollTo(Math.max(0, offset));

			if (this.container.layout?.computedLayout.width !== this._cachedWidth) {
				this._cachedWidth = this.container.layout?.computedLayout.width;
				for (const point of this.points) {
					point.reWidth(this.container.layout?.computedLayout.width ?? 360);
				}
			}
		});

		inject<ColorConfig>("config/color")?.onChange("color", ({ mantle }) => {
			this.container.layout = {
				backgroundColor: mantle,
			};
		});

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							width: 360,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							width: "100%",
						};
					}
				}
			},
		);

		inject<State>("state")?.on("sidebar", (newState) => {
			if (newState === "OPENED") {
				this.container.visible = true;
			}

			if (newState === "CLOSED") {
				this.container.visible = false;
			}
		});

		this.container.on("wheel", (event) => {
			const deltaY = event.deltaY;
			this.scrollTo(this._scrollOffset + deltaY * 1.5);
		});

		this.container.on("pointerdown", (event) => this.handleDragStart(event));
		this.container.on("pointermove", (event) => this.handleDragMove(event));
		this.container.on("pointerup", () => this.handleDragEnd());
		this.container.on("pointerout", () => this.handleDragEnd());
	}

	private points: Point[] = [];

	private createTimingPointsSync(
		points: (TimingPoint | DifficultyPoint | SamplePoint)[],
	) {
		const p = [];
		let i = 0;

		for (const point of points) {
			const x = new Point(point);
			x.container.y = i++ * 45;
			p.push(x);
		}

		return p;
	}

	private async createTimingPointsAsync(
		points: (TimingPoint | DifficultyPoint | SamplePoint)[],
	) {
		return await Promise.all(
			points.map((point, i) => {
				return new Promise<Point>((resolve) => {
					setTimeout(() => {
						const x = new Point(point);
						x.container.y = i * 45;
						resolve(x);
					}, 10);
				});
			}),
		);
	}
	async updateTimingPoints(
		points: (TimingPoint | DifficultyPoint | SamplePoint)[],
	) {
		if (this.points.length > 0) {
			for (const point of this.points) {
				point.destroy();
			}
			this._timingContainer.removeChildren();
		}

		this.points = [];

		const async = inject<ExperimentalConfig>(
			"config/experimental",
		)?.asyncLoading;

		const p: Point[] = async
			? await this.createTimingPointsAsync(points)
			: this.createTimingPointsSync(points);

		this._timingContainer.boundsArea = new Rectangle(
			0,
			0,
			360,
			p.length * 45 - 5,
		);
		this.points = p;
	}

	private currentIdx = 0;
	scrollToTimingPoint(time: number) {
		const idx = this.points.findIndex((point) => point.data.startTime === time);
		this.points[this.currentIdx]?.unselect();

		this.currentIdx = idx;
		this.points[idx]?.select();

		const offset =
			idx * 45 - (this.container.layout?.computedLayout.height ?? 0) + 40;

		if (
			offset < this._scrollOffset &&
			Math.abs(offset - this._scrollOffset) <
				(this.container.layout?.computedLayout.height ?? 0)
		)
			return;
		this.scrollTo(Math.max(0, offset));
	}

	private previous = new Set<number>();
	private _scrollTo(offset: number) {
		this._scrollOffset = offset;
		this._timingContainer.y = -offset;

		const topBound = Math.floor(offset / 45);
		const bottomBound = Math.ceil(
			(offset + (this.container?.layout?.computedLayout.height ?? 0)) / 45,
		);

		const currentSet = new Set<number>();
		for (let i = topBound; i <= bottomBound; i++) {
			currentSet.add(i);
		}

		const excluded = this.previous.difference(currentSet);
		for (const idx of excluded) {
			if (!this.points[idx]) continue;
			this.points[idx].off();
			this._timingContainer.removeChild(this.points[idx].container);
		}

		for (const idx of currentSet) {
			if (!this.points[idx]) continue;
			this.points[idx].on();
			this._timingContainer.addChild(this.points[idx].container);
		}

		this.previous = currentSet;
	}

	scrollTo(offset: number, instant = false) {
		const maxScroll =
			this.points.length * 45 -
			5 -
			(this.container.layout?.computedLayout.height ?? 0);

		const boundOffset = Math.max(-200, Math.min(maxScroll + 200, offset));

		if (instant) {
			if (boundOffset < 0) {
				this._scrollTo(0);
				return;
			}

			if (boundOffset > maxScroll) {
				this._scrollTo(maxScroll);
				return;
			}

			this._scrollTo(boundOffset);
			return;
		}

		const tween = this.animationControler.addAnimation(
			"offset",
			this._scrollOffset,
			boundOffset,
			(value) => {
				this._scrollTo(value);
				if (this.bounceBack()) {
					tween.stop();
				}
			},
			200,
			Easings.OutCubic,
			() => {
				if (boundOffset < 0) {
					this.scrollTo(0);
					return;
				}

				if (boundOffset > maxScroll) {
					this.scrollTo(maxScroll);
					return;
				}
			},
		);
	}

	private _currentLoop?: number;
	private _isDown = false;
	private _startPosition = 0;
	private _cacheOffset = 0;
	private _startTime = 0;

	private _currentVelocity = 0;
	private _currentTime = 0;

	handleDragStart(event: FederatedPointerEvent) {
		this._isDown = true;
		if (this._currentLoop) {
			cancelAnimationFrame(this._currentLoop);
		}
		this._cacheOffset = this._scrollOffset;
		this._currentVelocity = 0;
		this._startPosition = event.y;
		this._startTime = performance.now();
	}

	handleDragMove(event: FederatedPointerEvent) {
		if (!this._isDown) return;

		const delta = event.y - this._startPosition;
		this._currentTime = performance.now();
		this._currentVelocity = delta / (this._currentTime - this._startTime);

		const topBound = 0;
		const bottomBound =
			this.points.length * 45 -
			5 -
			(this.container.layout?.computedLayout.height ?? 0);

		this._scrollTo(
			Math.max(
				topBound - 200,
				Math.min(bottomBound + 200, this._cacheOffset - delta),
			),
		);
	}

	handleDragEnd() {
		if (!this._isDown) return;
		this._isDown = false;

		if (
			Math.abs(this._currentVelocity) < 1 ||
			performance.now() - this._currentTime > 50
		) {
			this.bounceBack(0);
			return;
		}

		this._last = performance.now();
		this._currentLoop = requestAnimationFrame(() => this.handleVelocity());
	}

	private bounceBack(leway = 200) {
		const topBound = 0;
		const bottomBound =
			this.points.length * 45 -
			5 -
			(this.container.layout?.computedLayout.height ?? 0);

		if (this._scrollOffset < topBound - leway) {
			this.scrollTo(0);
			return true;
		}

		if (this._scrollOffset > bottomBound + leway) {
			this.scrollTo(bottomBound);
			return true;
		}

		return false;
	}

	private _last = 0;
	handleVelocity() {
		if (this.bounceBack()) return;

		const delta = performance.now() - this._last;
		this._scrollTo(this._scrollOffset - delta * this._currentVelocity);

		if (Math.abs(this._currentVelocity) < 0.01) {
			this.bounceBack(0);
			return;
		}

		this._currentVelocity *= 0.85;
		this._currentLoop = requestAnimationFrame(() => this.handleVelocity());
	}
}
