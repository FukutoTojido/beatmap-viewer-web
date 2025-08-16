import type DrawableSliderFollowCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderFollowCircle";
import Easings from "@/UI/Easings";

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

	const scaleInDuration = Math.min(180, drawable.object.duration);
	const fadeInDuration = Math.min(60, drawable.object.duration);
	const outDuration = 200;

	if (
		time < drawable.object.startTime ||
		time > drawable.object.endTime + outDuration
	) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;

	if (
		time >= drawable.object.startTime &&
		time < drawable.object.startTime + scaleInDuration
	) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / fadeInDuration),
		);
		const scale = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / scaleInDuration),
		);

		drawable.container.scale.set(
			(0.5 + 0.5 * Easings.Out(scale)) * drawable.object.scale,
		);
		drawable.container.alpha = opacity;

		return;
	}

	if (
		time >= drawable.object.startTime + scaleInDuration &&
		time <= drawable.object.endTime
	) {
		drawable.container.scale.set(1 * drawable.object.scale);
		drawable.container.alpha = 1;

		return;
	}

	if (time > drawable.object.endTime) {
		const opacity =
			1 - Math.min(1, Math.max(0, (time - drawable.object.endTime) / outDuration));
		const scale = Math.min(
			1,
			Math.max(0, (time - drawable.object.endTime) / outDuration),
		);

		drawable.container.scale.set(
			(1 - 0.2 * Easings.Out(scale)) * drawable.object.scale,
		);
		drawable.container.alpha = Easings.In(opacity);

		return;
	}
};
