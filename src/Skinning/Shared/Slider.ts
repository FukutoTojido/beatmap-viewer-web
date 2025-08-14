import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import { Clamp } from "@/utils";

export const sharedUpdate = (drawable: DrawableSlider, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeOutDuration = 240;
	const bodyFadeOutDuration = 40;

	if (
		time < startFadeInTime ||
		time > drawable.object.endTime + fadeOutDuration
	) {
		drawable._alphaFilter.alpha = 0;
		drawable.container.visible = false;

		return { start: 0, end: 0 };
	}

	drawable.container.visible = true;

	const completionProgress = Math.min(
		1,
		Math.max(0, (time - drawable.object.startTime) / drawable.object.duration),
	);
	const span = drawable.spanAt(completionProgress);
	const spanProgress = drawable.progressAt(completionProgress);

	let start = 0;
	let end = Math.min(
		1,
		Math.max(
			0,
			(time - (drawable.object.startTime - drawable.object.timePreempt)) /
				(drawable.object.timePreempt / 3),
		),
	);

	if (span >= drawable.object.spans - 1) {
		if (Math.min(span, drawable.object.spans - 1) % 2 === 1) {
			start = 0;
			end = spanProgress;
		} else {
			start = spanProgress;
		}
	}

	if (time < drawable.object.startTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
		);
		drawable._alphaFilter.alpha = opacity;
		return { start, end };
	}

	if (time >= drawable.object.startTime && time < drawable.object.endTime) {
		drawable._alphaFilter.alpha = 1;
		return { start, end };
	}

	if (time >= drawable.object.endTime) {
		const opacity =
			1 - Clamp((time - drawable.object.endTime) / bodyFadeOutDuration);
		drawable._alphaFilter.alpha = opacity;
		return { start, end };
	}

	return { start, end };
};
