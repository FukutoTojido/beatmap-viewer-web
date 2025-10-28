import type DrawableApproachCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableApproachCircle";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import { inject } from "@/Context";

export const sharedUpdate = (
	drawable: DrawableApproachCircle,
	time: number,
) => {
	const isHD = inject<ExperimentalConfig>("config/experimental")?.hidden;

	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeInDuration = Math.min(
		drawable.object.timeFadeIn * 2,
		drawable.object.timePreempt,
	);
	const fadeOutDuration = 50;

	if (isHD) {
		drawable.container.visible = false;
		return 3;
	}

	if (
		time < startFadeInTime ||
		time >= drawable.object.startTime + fadeOutDuration
	) {
		drawable.container.visible = false;
		return 3;
	}

	drawable.container.visible = true;

	if (time < drawable.object.startTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - startFadeInTime) / fadeInDuration),
		);
		const scale =
			Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / drawable.object.timePreempt),
			) * 3;

		drawable.container.alpha = opacity * 0.9;
		drawable.container.scale.set((4 - scale) * drawable.object.scale);
		return scale;
	}

	if (time >= drawable.object.startTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / fadeOutDuration),
		);

		drawable.container.alpha = (1 - opacity) * 0.9;
		return 3;
	}

	return 3;
};
