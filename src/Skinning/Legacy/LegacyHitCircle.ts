import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";

export const update = (drawable: DrawableHitCircle, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeOutDuration = 240;

	if (
		time < startFadeInTime ||
		time > drawable.object.startTime + fadeOutDuration
	) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;
	drawable.sprite.scale.set(1);

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
			1.5,
			1 +
				0.5 * Math.max(0, (time - drawable.object.startTime) / fadeOutDuration),
		);

		drawable.container.alpha = opacity;
		drawable.sprite.scale.set(scale);

		return;
	}
};
