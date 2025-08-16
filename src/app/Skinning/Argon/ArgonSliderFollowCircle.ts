import type DrawableSliderFollowCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderFollowCircle";
import Easings from "@/UI/Easings";
import { Clamp } from "@/utils";

export const update = (drawable: DrawableSliderFollowCircle, time: number) => {
	const completionProgress = Math.min(
		1,
		Math.max(0, (time - drawable.object.startTime) / drawable.object.duration),
	);

	const position = drawable.object.path.curvePositionAt(
		completionProgress,
		drawable.object.spans,
	);

	drawable.container.x =
		drawable.object.startX + position.x + drawable.object.stackedOffset.x;
	drawable.container.y =
		drawable.object.startY + position.y + drawable.object.stackedOffset.y;

	const duration = 300;

	if (
		time < drawable.object.startTime ||
		time > drawable.object.endTime + duration
	) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;

	if (time >= drawable.object.startTime && time <= drawable.object.endTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / duration),
		);
		const scale = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / duration),
		);

		drawable.container.scale.set(
			(1 + 1.4 * Easings.OutQuint(scale)) * drawable.object.scale,
		);
		drawable.container.alpha = Easings.OutQuint(opacity);

		return;
	}

	const maxScale = 1 + 1.4 * Clamp(Easings.OutQuint(drawable.object.duration / duration));

	if (time > drawable.object.endTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - drawable.object.endTime) / (duration / 2)),
		);
		const scale = Math.min(
			1,
			Math.max(0, (time - drawable.object.endTime) / duration),
		);

		drawable.container.scale.set(
			(maxScale - (maxScale - 1) * Easings.OutQuint(scale)) * drawable.object.scale,
		);
		drawable.container.alpha = 1 - Easings.OutQuint(opacity);

		return;
	}
};
