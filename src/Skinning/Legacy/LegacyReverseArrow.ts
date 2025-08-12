import type DrawableSliderRepeat from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderRepeat";
import Easings from "@/UI/Easings";

export const update = (drawable: DrawableSliderRepeat, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	if (time > drawable.object.startTime) {
		const animDuration = Math.min(300, drawable.object.spanDuration);
		drawable.reverseArrow.scale.set(
			1 +
				Easings.Out(
					Math.max(
						0,
						Math.min(1, (time - drawable.object.startTime) / animDuration),
					),
				) *
					0.4,
		);
		return;
	}

	const fadeInDuration = 150;
	const duration = 300;
	const rotation = 5.625;

	const loopCurrentTime = (time - startFadeInTime) % duration;

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
