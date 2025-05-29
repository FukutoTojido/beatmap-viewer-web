import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";

export const update = (drawable: DrawableSlider, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeOutDuration = 200;

	if (
		time < startFadeInTime ||
		time > drawable.object.endTime + fadeOutDuration
	) {
		drawable._alphaFilter.alpha = 0;
		drawable.container.visible = false;

		return;
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

	drawable.updateGeometry(start, end);

	if (time < drawable.object.startTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
		);
		drawable._alphaFilter.alpha = opacity;
		return;
	}

	if (time >= drawable.object.startTime && time < drawable.object.endTime) {
		drawable._alphaFilter.alpha = 1;
		return;
	}

	if (time >= drawable.object.endTime) {
		const opacity =
			1 -
			Math.min(
				1,
				Math.max(0, (time - drawable.object.endTime) / fadeOutDuration),
			);
		drawable._alphaFilter.alpha = opacity;
		return;
	}
};
