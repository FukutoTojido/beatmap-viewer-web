import type {
    Slider,
    Spinner,
    StandardHitObject,
} from "osu-standard-stable";
import type BeatmapSet from "@/BeatmapSet";
import { inject } from "@/Context";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type Beatmap from "..";
import type TimelineHitCircle from "../Timeline/TimelineHitCircle";
import TimelineSlider from "../Timeline/TimelineSlider";
import DrawableHitCircle from "./DrawableHitCircle";
import { TAIL_LENIENCY } from "./DrawableSliderTail";
import DrawableSpinnerApproachCircle from "./DrawableSpinnerApproachCircle";
import { HitResult, type LegacyReplayFrame } from "osu-classes";

export default class DrawableSpinner extends DrawableHitCircle {
	constructor(object: Spinner) {
		super(object, false);
		this.approachCircle.destroy();

		this.wrapper.visible = true;
		this.approachCircle.container.visible = true;

		this.approachCircle = new DrawableSpinnerApproachCircle(object).hook(
			this.context,
		);

		this.timelineObject?.destroy();

		const cloned = object.clone();
		const head = object.clone();
		const tail = object.clone();
        head.startTime = head.startTime - TAIL_LENIENCY;
		tail.startTime = tail.endTime - TAIL_LENIENCY;
		cloned.nestedHitObjects = [head, tail];
		this.timelineObject = new TimelineSlider(cloned as unknown as Slider).hook(
			this.context,
		) as unknown as TimelineHitCircle;
	}

	get object() {
		return super.object;
	}

	set object(val: StandardHitObject) {
		super.object = val;
	}

	getTimeRange(): { start: number; end: number } {
		return {
			start: this.object.startTime - this.object.timePreempt,
			end: (this.object as Spinner).endTime + 800,
		};
	}

	refreshSprite(): void {
		super.refreshSprite();

		this.hitCircleOverlay.texture =
			this.skinManager?.getCurrentSkin().getTexture("spinner-bottom") ??
			BLANK_TEXTURE;
		this.hitCircleSprite.texture = BLANK_TEXTURE;
		this.flashPiece.texture = BLANK_TEXTURE;
        this.select.texture = BLANK_TEXTURE;
		this.container.tint = 0xffffff;
	}

	update(time: number) {
		this.approachCircle.update(time);
		this.judgement.frame(time);

		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeOutDuration = 800;
		const endTime = (this.object as Spinner).endTime;

		if (time < startFadeInTime || time > endTime + fadeOutDuration) {
			this.wrapper.visible = false;
			return;
		}

		this.wrapper.visible = true;

		if (time < this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / this.object.timeFadeIn),
			);
			this.wrapper.alpha = opacity;

			return;
		}

		if (time >= this.object.startTime) {
			const opacity =
				1 - Math.min(1, Math.max(0, (time - endTime) / fadeOutDuration));

			this.wrapper.alpha = opacity;

			return;
		}

		this.wrapper.alpha = 1;
	}

	playHitSound(time: number, _?: number): void {
		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		const endTime = (this.object as Spinner).endTime;
		const isSeeking = inject<ProgressBar>("ui/main/controls/progress")?.isSeeking || inject<BeatmapSet>("beatmapset")?.isSeeking;
		if (!beatmap || isSeeking) return;
		if (
			!(
				beatmap.previousTime <= endTime &&
				endTime < time &&
				time - beatmap.previousTime < 30
			)
		)
			return;

		const currentSamplePoint = beatmap.getNearestSamplePoint(endTime);
		this.hitSound?.play(currentSamplePoint);
	}

	override eval(_: LegacyReplayFrame[]) {
		return {
			value: HitResult.Great,
			hitTime: (this.object as Spinner).endTime
		}
	}
}
