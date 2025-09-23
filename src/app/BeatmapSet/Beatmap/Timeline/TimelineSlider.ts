import {
	type Slider,
	SliderHead,
	SliderRepeat,
	SliderTail,
	SliderTick,
	SpinnerBonusTick,
	SpinnerTick,
	type StandardHitObject,
} from "osu-standard-stable";
import {
	AlphaFilter,
	Color,
	FillGradient,
	Graphics,
	Text,
} from "pixi.js";
import type TimelineConfig from "@/Config/TimelineConfig";
import { type Context, inject } from "@/Context";
import { DEFAULT_SCALE } from "@/UI/main/viewer/Timeline";
import { darken } from "@/utils";
import type Beatmap from "..";
import type DrawableSlider from "../HitObjects/DrawableSlider";
import type TimelineHitCircle from "./TimelineHitCircle";
import TimelineHitObject from "./TimelineHitObject";
import TimelineSliderHead from "./TimelineSliderHead";
import TimelineSliderRepeat from "./TimelineSliderRepeat";
import TimelineSliderTail from "./TimelineSliderTail";

const gradient = new FillGradient({
	start: { x: 0, y: 0 },
	end: { x: 0, y: 1 },
	colorStops: [
		{ offset: 0, color: 0xffffff },
		{
			offset: 0.5,
			color: Color.shared.setValue(darken([1, 1, 1, 1], 0.1)).toHex(),
		},
		{ offset: 1, color: 0xffffff },
	],
	textureSpace: "local",
	type: "linear",
	textureSize: 256,
	wrapMode: "clamp-to-edge",
});

const radialGradient = new FillGradient({
	type: "radial",
	colorStops: [
		{
			offset: 0,
			color: Color.shared.setValue(darken([1, 1, 1, 1], 0.1)).toHex(),
		},
		{ offset: 1, color: 0xffffff },
	],
});

export default class TimelineSlider extends TimelineHitObject {
	circles: TimelineHitCircle[] = [];
	filter = new AlphaFilter({
		alpha: 0.7,
	});
	body: Graphics = new Graphics({
		filters: this.filter,
	});
	select: Graphics;

	length = 0;

	constructor(object: Slider) {
		super(object);
		this.object = object;

		this.length =
			object.duration /
			(DEFAULT_SCALE / (inject<TimelineConfig>("config/timeline")?.scale ?? 1));

		this.select = new Graphics({ visible: false });

		for (const object of this.object.nestedHitObjects
			.filter(
				(object) =>
					!(
						object instanceof SliderTick ||
						object instanceof SpinnerTick ||
						object instanceof SpinnerBonusTick
					),
			)
			.map((object) => {
				const obj = object.clone();
				obj.startTime = obj.startTime - this.object.startTime;
				return obj;
			})
			.toReversed()) {
			const obj =
				object instanceof SliderHead
					? new TimelineSliderHead(object, this.object as Slider).hook(
							this.context,
						)
					: object instanceof SliderTail
						? new TimelineSliderTail(object).hook(this.context)
						: object instanceof SliderRepeat
							? new TimelineSliderRepeat(object).hook(this.context)
							: new TimelineSliderTail(object as unknown as SliderTail).hook(
									this.context,
								);

			obj.container.y = 0;
			obj.container.visible = true;

			this.circles.push(obj);
		}

		this.container.addChild(
			this.body,
			...this.circles.map((circle) => circle.container),
			this.select,
		);

		this.updateCircles();
		this.refreshSprite();

		inject<TimelineConfig>("config/timeline")?.onChange("scale", () => {
			this.updateCircles();
			this.refreshSprite();
		});
	}

	get object() {
		return this._object as Slider;
	}

	set object(val: Slider) {
		super.object = val;
		this._object = val;
		this.length =
			val.duration /
			(DEFAULT_SCALE / (inject<TimelineConfig>("config/timeline")?.scale ?? 1));

		if (!this.circles?.length) return;

		let idx = 0;
		for (const object of val.nestedHitObjects
			.filter(
				(object) =>
					!(
						object instanceof SliderTick ||
						object instanceof SpinnerTick ||
						object instanceof SpinnerBonusTick
					),
			)
			.map((object) => {
				const obj = object.clone();
				obj.startTime = obj.startTime - val.startTime;
				return obj;
			})
			.toReversed()) {
			this.circles[idx++].object = object as unknown as StandardHitObject;
		}

		this.updateCircles();
		this.refreshSprite();
	}

	get isSelected() {
		return this._isSelected;
	}
	set isSelected(val: boolean) {
		this._isSelected = val;
		for (const circle of this.circles) {
			circle.isSelected = val;
		}
		this.refreshSprite();
	}

	updateVelocity() {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;

		const difficultyPoint = beatmap.data.controlPoints.difficultyPointAt(
			this.object.startTime,
		);
		const velocity = new Text({
			text: `${difficultyPoint.sliderVelocity.toFixed(2)}x`,
			style: {
				fontFamily: "Rubik",
				fontSize: 10,
				fill: 0xa6e3a1,
			},
			anchor: {
				x: 0,
				y: 0.5,
			},
			x: 5,
			y: -32,
		});

		this.container.addChild(velocity);
	}

	refreshSprite() {
		this.length =
			(this.object as Slider).duration /
			(DEFAULT_SCALE / (inject<TimelineConfig>("config/timeline")?.scale ?? 1));

		this.select
			.clear()
			.roundRect(-25, -25, this.length + 50, 50, 25)
			.stroke({
				width: 50 * 0.1,
				cap: "round",
				color: 0xffc02b,
				alignment: 1,
			});

		this.select.visible =
			(this.skinManager?.getCurrentSkin().config.General.Argon ?? false) &&
			this.isSelected;

		if (this.skinManager?.getCurrentSkin().config.General.Argon) {
			this.body
				.clear()
				.moveTo(0, 0)
				.lineTo(this.length, 0)
				.stroke({
					width: 50,
					cap: "round",
					color: 0xb6b6b6,
				})
				.moveTo(0, 0)
				.lineTo(this.length, 0)
				.stroke({
					width: 50 * 0.8,
					cap: "round",
					color: "white",
				});
			this.filter.alpha = 1;
		} else {
			this.body
				.clear()
				.circle(0, 0, (25 * 236) / 256)
				.fill(radialGradient)
				.circle(this.length, 0, (25 * 236) / 256)
				.fill(radialGradient)
				.rect(0, -((25 * 236) / 256), this.length, (50 * 236) / 256)
				.fill(gradient);
			this.filter.alpha = 0.7;
		}

		this.body.tint = this.context
			.consume<DrawableSlider>("object")
			?.color.includes("rgb")
			? (this.context.consume<DrawableSlider>("object")?.color ??
				"rgb(0, 0, 0)")
			: `rgb(${
					this.context.consume<DrawableSlider>("object")?.color ?? "0,0,0"
				})`;

		for (const object of this.circles) {
			object.refreshSprite();
		}
	}

	hook(context: Context) {
		super.hook(context);

		for (const object of this.circles) {
			object.refreshSprite();
		}
		this.refreshSprite();

		return this;
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - 30 * 5,
			end: (this.object as Slider).endTime + 30 * 5,
		};
	}

	updateCircles() {
		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
		for (const object of this.circles.filter(
			(object) => object instanceof TimelineSliderTail || TimelineSliderRepeat,
		)) {
			object.container.x =
				(object.object.startTime +
					(object instanceof TimelineSliderTail &&
					!(object instanceof TimelineSliderRepeat)
						? 36
						: 0)) /
				(DEFAULT_SCALE / scale);
		}
	}
}
