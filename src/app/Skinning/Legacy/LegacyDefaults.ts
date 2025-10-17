import type DrawableDefaults from "@/BeatmapSet/Beatmap/HitObjects/DrawableDefaults";
import type DrawableHitObject from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitObject";

export const update = (drawable: DrawableDefaults, time: number) => {
	const fadeOutDuration = 60;
	const object = drawable.context.consume<DrawableHitObject>("drawable");
	const startTime = object?.evaluation?.hitTime ?? drawable.object.startTime;

	if (time <= startTime) {
		drawable.container.alpha = 1;
		return;
	}

	if (time > startTime && time <= startTime + fadeOutDuration) {
		const opacity =
			1 - Math.min(1, Math.max(0, (time - startTime) / fadeOutDuration));
		drawable.container.alpha = opacity;

		return;
	}

	drawable.container.alpha = 0;
};
