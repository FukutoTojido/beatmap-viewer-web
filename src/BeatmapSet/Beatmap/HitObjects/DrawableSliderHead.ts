import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type SliderHead,
	type Slider,
} from "osu-standard-stable";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import { Container, Graphics } from "pixi.js";
import DrawableHitObject, {
	type IHasApproachCircle,
} from "./DrawableHitObject";
import type { Context } from "../../../Context";
import DrawableApproachCircle from "./DrawableApproachCircle";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableDefaults from "./DrawableDefaults";

export default class DrawableSliderHead
	extends DrawableHitObject
	implements IHasApproachCircle
{
	container = new Container();
	sprite = new Graphics();

	approachCircle: DrawableApproachCircle;
	defaults: DrawableDefaults;

	hitSound?: HitSample;

	constructor(
		public object: SliderHead,
		parent: Slider,
		samples: Sample[],
	) {
		super(object);
		this.container.visible = false;
		this.container.x = object.startX + object.stackedOffset.x;
		this.container.y = object.startY + object.stackedOffset.y;

		this.sprite
			.circle(0, 0, object.radius * (236 / 256) ** 2)
			.fill(0x585b70)
			.stroke({
				alignment: 0.5,
				color: 0xcdd6f4,
				width: object.radius * (236 / 256) ** 2 * 0.128,
			});

		this.approachCircle = new DrawableApproachCircle(object);
		this.defaults = new DrawableDefaults(parent);

		this.container.addChild(this.sprite, this.defaults.container);
		this.hitSound = new HitSample(samples).hook(this.context);
	}

	playHitSound(time: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (!beatmap) return;
		if (
			!(
				beatmap.previousTime <= this.object.startTime &&
				this.object.startTime < time
			)
		)
			return;

		const currentSamplePoint = beatmap.getNearestSamplePoint(
			this.object.startTime,
		);
		this.hitSound?.play(currentSamplePoint);
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - this.object.timePreempt,
			end: this.object.startTime + 800,
		};
	}

	update(time: number) {
		this.playHitSound(time);
		this.approachCircle.update(time);
		this.defaults.update(time);

		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeOutDuration = 240;

		if (
			time < startFadeInTime ||
			time > this.object.startTime + fadeOutDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;
		this.sprite.scale.set(1);

		if (time < this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.object.timeFadeIn),
			);
			this.container.alpha = opacity;

			return;
		}

		if (time >= this.object.startTime) {
			const opacity =
				1 -
				Math.min(
					1,
					Math.max(0, (time - this.object.startTime) / fadeOutDuration),
				);
			const scale = Math.min(
				1.5,
				1 + 0.5 * Math.max(0, (time - this.object.startTime) / fadeOutDuration),
			);

			this.container.alpha = opacity;
			this.sprite.scale.set(scale);

			return;
		}
	}
}
