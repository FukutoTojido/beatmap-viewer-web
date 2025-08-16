import type DrawableSliderRepeat from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderRepeat";
import Easings from "@/UI/Easings";

export const update = (drawable: DrawableSliderRepeat, time: number) => {
	const duration = 300;
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const loopCurrentTime =
		(Math.min(time, drawable.object.startTime) - startFadeInTime) % duration;

	if (time > drawable.object.startTime) {
		const startValue = 1.3 - Easings.Out(loopCurrentTime / duration) * 0.3;
		const delta = 1.4 - startValue;

		const animDuration = Math.min(300, drawable.object.spanDuration);
		drawable.reverseArrow.scale.set(
			startValue +
				Easings.Out(
					Math.max(
						0,
						Math.min(1, (time - drawable.object.startTime) / animDuration),
					),
				) *
					delta,
		);
		drawable.reverseArrow.alpha = Easings.Out(
			1 -
				Math.min(
					1,
					Math.max(0, (time - drawable.object.startTime) / animDuration),
				),
		);
		return;
	}

	const fadeInDuration = 150;
	const rotation = 5.625;

	drawable.reverseArrow.alpha = Math.min(
		1,
		Math.max(0, (time - startFadeInTime) / fadeInDuration),
	);
	// drawable.reverseArrow.angle =
	// 	(drawable.rotation * 180) / Math.PI +
	// 	rotation * (1 + (loopCurrentTime / duration) * -2);
	drawable.reverseArrow.scale.set(
		1.3 - Easings.Out(loopCurrentTime / duration) * 0.3,
	);
};
