import type DrawableFollowPoints from "@/BeatmapSet/Beatmap/HitObjects/DrawableFollowPoints";
import Easings from "@/UI/Easings";

export const update = (drawable: DrawableFollowPoints, time: number) => {
	const timeFadeIn = drawable.startObject.timeFadeIn;
	const preempt = drawable.startObject.timePreempt;

	if (time < drawable.startTime - preempt) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;

	for (const [idx, sprite] of Object.entries(drawable.sprites)) {
		const d = 32 * 1.5 + 32 * +idx;
		const f = d / drawable.distance;

		const fadeOutTime = drawable.startTime + f * drawable.duration;
		const fadeInTime = fadeOutTime - preempt;

		if (time < fadeInTime + timeFadeIn) {
			const opacity = Easings.OutQuad(
				Math.min(1, Math.max(0, (time - fadeInTime) / timeFadeIn)),
			);

			sprite.alpha = opacity;
			sprite.scale.set((1.5 - 0.5 * opacity) * drawable.startObject.scale);
			sprite.x = (f - 0.1 * (1 - opacity)) * drawable.distance;
			continue;
		}

		if (time >= fadeInTime + timeFadeIn && time < fadeOutTime) {
			sprite.alpha = 1;
			sprite.scale.set(1 * drawable.startObject.scale);
			sprite.x = f * drawable.distance;
			continue;
		}

		if (time > fadeOutTime) {
			const opacity =
				1 -
				Easings.OutQuad(
					Math.min(1, Math.max(0, (time - fadeOutTime) / timeFadeIn)),
				);
			sprite.alpha = opacity;
			sprite.scale.set(1 * drawable.startObject.scale);
			sprite.x = f * drawable.distance;
		}
	}
};
