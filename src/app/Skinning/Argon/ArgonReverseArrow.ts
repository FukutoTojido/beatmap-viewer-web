import type DrawableSliderRepeat from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderRepeat";
import Easings from "@/UI/Easings";
import { Clamp } from "@/utils";

export const update = (drawable: DrawableSliderRepeat, time: number) => {
	const duration = 300;
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;

	const moveDistance = -12;

	const moveOutDuration = 35;
	const moveInDuration = 250;

	const loopCurrentTime =
		(Math.min(time, drawable.object.startTime) - startFadeInTime) % duration;

	if (time > drawable.object.startTime) {
		const startValue = 1.3 - Easings.Out(loopCurrentTime / duration) * 0.3;
		const delta = 1.4 - startValue;

		const animDuration = Math.min(300, drawable.object.spanDuration);
		drawable.reverseArrow.scale.set(
			startValue +
				Easings.Out(Clamp((time - drawable.object.startTime) / animDuration)) *
					delta,
		);
		drawable.reverseArrow.alpha = Easings.Out(
			1 - Clamp((time - drawable.object.startTime) / animDuration),
		);
		drawable.ringPiece.scale.set(
			startValue +
				Easings.Out(Clamp((time - drawable.object.startTime) / animDuration)) *
					delta,
		);
		drawable.ringPiece.alpha = Easings.Out(
			1 - Clamp((time - drawable.object.startTime) / animDuration),
		);
		return;
	}

	const fadeInDuration = 150;

	drawable.ringPiece.scale.set(236 / 200);

	drawable.reverseArrow.alpha = Clamp(
		(time - startFadeInTime) / fadeInDuration,
	);

	drawable.ringPiece.alpha = Clamp((time - startFadeInTime) / fadeInDuration);

	if (loopCurrentTime < moveOutDuration) {
		drawable.reverseArrow.scale.set(
			1 + Easings.Out(loopCurrentTime / moveOutDuration) * 0.3,
		);

		drawable.ringPiece.x =
			Easings.Out(loopCurrentTime / moveOutDuration) * moveDistance;
	} else {
		drawable.reverseArrow.scale.set(
			1.3 -
				Easings.Out(
					(loopCurrentTime - moveOutDuration) /
						(moveOutDuration + moveInDuration),
				) *
					0.3,
		);
		drawable.ringPiece.x =
			moveDistance -
			Easings.Out(
				(loopCurrentTime - moveOutDuration) /
					(moveOutDuration + moveInDuration),
			) *
				moveDistance;
	}
};
