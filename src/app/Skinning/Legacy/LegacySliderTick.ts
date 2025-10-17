import { HitResult } from "osu-classes";
import type DrawableSliderTick from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderTick";

export const update = (drawable: DrawableSliderTick, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeOutDuration = 200;

	const shouldHit =
		!drawable.evaluation ||
		![
			HitResult.Miss,
			HitResult.LargeTickMiss,
			HitResult.SmallTickMiss,
		].includes(drawable.evaluation.value);

	drawable.container.x =
		drawable.object.startX + drawable.object.stackedOffset.x;
	drawable.container.y =
		drawable.object.startY + drawable.object.stackedOffset.y;

	drawable.container.scale.set(1 * drawable.object.scale);

	if (time < drawable.object.startTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
		);
		drawable.container.alpha = opacity;

		return;
	}

	if (time >= drawable.object.startTime) {
		const opacity =
			1 -
			Math.min(
				1,
				Math.max(0, (time - drawable.object.startTime) / fadeOutDuration),
			);
		const scale = Math.min(
			2,
			1 + Math.max(0, (time - drawable.object.startTime) / fadeOutDuration),
		);

		drawable.container.alpha = opacity;
		drawable.container.scale.set(
			(shouldHit ? scale : 1) * drawable.object.scale,
		);

		return;
	}
};
