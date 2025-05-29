import type DrawableDefaults from "@/BeatmapSet/Beatmap/HitObjects/DrawableDefaults";

export const update = (drawable: DrawableDefaults, time: number) => {
	const fadeOutDuration = 60;

	if (time <= drawable.object.startTime) {
		drawable.container.alpha = 1;
		return;
	}

	if (
		time > drawable.object.startTime &&
		time <= drawable.object.startTime + fadeOutDuration
	) {
		const opacity =
			1 -
			Math.min(
				1,
				Math.max(0, (time - drawable.object.startTime) / fadeOutDuration),
			);
		drawable.container.alpha = opacity;

		return;
	}

	drawable.container.alpha = 0;
};
