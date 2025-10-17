import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type DrawableSliderFollowCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderFollowCircle";
import Easings from "@/UI/Easings";

export const update = (drawable: DrawableSliderFollowCircle, time: number) => {
	const slider = drawable.context.consume<DrawableSlider>("drawable");
	const currentTrackingFrame = slider?.evaluation?.trackingStates.findLast(
		(frame) => frame[0].startTime <= time,
	);

	const startTime =
		currentTrackingFrame?.[0].startTime ?? drawable.object.startTime;
	const endTime =
		currentTrackingFrame?.[1].startTime ?? drawable.object.endTime;

	const duration = endTime - startTime;

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

	const scaleInDuration = Math.min(180, duration);
	const fadeInDuration = Math.min(60, duration);
	const outDuration = 200;

	if (time < startTime || time > endTime + outDuration || slider?.evaluation?.trackingStates.length === 0) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;

	if (time >= startTime && time < startTime + scaleInDuration) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - startTime) / fadeInDuration),
		);
		const scale = Math.min(
			1,
			Math.max(0, (time - startTime) / scaleInDuration),
		);

		drawable.container.scale.set(
			(0.5 + 0.5 * Easings.Out(scale)) * drawable.object.scale,
		);
		drawable.container.alpha = opacity;

		return;
	}

	if (time >= startTime + scaleInDuration && time <= endTime) {
		drawable.container.scale.set(1 * drawable.object.scale);
		drawable.container.alpha = 1;

		return;
	}

	if (time > endTime) {
		const opacity =
			1 - Math.min(1, Math.max(0, (time - endTime) / outDuration));
		const scale = Math.min(1, Math.max(0, (time - endTime) / outDuration));

		drawable.container.scale.set(
			(1 - 0.2 * Easings.Out(scale)) * drawable.object.scale,
		);
		drawable.container.alpha = Easings.In(opacity);

		return;
	}
};
