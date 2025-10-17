import { HitResult } from "osu-classes";
import type { Slider, Spinner } from "osu-standard-stable";
import type DrawableJudgement from "@/BeatmapSet/Beatmap/HitObjects/DrawableJudgement";
import Easings from "@/UI/Easings";
import { Clamp } from "@/utils";

export const update = (drawable: DrawableJudgement, timestamp: number) => {
	if (!drawable.drawable.evaluation) {
		drawable.container.visible = false;
		return;
	}

	const startTime =
		(drawable.drawable.object as Slider | Spinner).endTime ??
		Math.min(
			drawable.drawable.evaluation.hitTime,
			drawable.drawable.object.startTime +
				drawable.drawable.object.hitWindows.windowFor(HitResult.Meh) +
				1,
		);

	const animationDuration = 800;
	const fadeOutDuration = 100;

	if (timestamp < startTime || timestamp >= startTime + animationDuration) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;
	const t = Clamp((timestamp - startTime) / animationDuration);

	if (drawable.drawable.evaluation.value !== HitResult.Miss) {
		const scale = 1 + 0.4 * Easings.OutQuint(t);
		const alpha = 1 - t ** 5;

		drawable.text.scale.set(scale);
		drawable.text.alpha = alpha;
		drawable.text.angle = 0;
		return;
	}

	if (drawable.drawable.evaluation.value === HitResult.Miss) {
		const scale =
			1.6 -
			0.6 * Easings.OutSine(Clamp((timestamp - startTime) / fadeOutDuration));
		const alpha = 1 - t ** 5;

		drawable.text.scale.set(scale);
		drawable.text.alpha = alpha;

		drawable.text.y = 100 * t ** 5;
		drawable.text.angle = 40 * t ** 5;
	}
};
