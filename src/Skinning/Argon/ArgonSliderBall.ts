import type DrawableSliderBall from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderBall";
import Easings from "@/UI/Easings";

export const update = (drawable: DrawableSliderBall, time: number) => {
	const completionProgress = Math.min(
		1,
		Math.max(0, (time - drawable.object.startTime) / drawable.object.duration),
	);

	const position = drawable.object.path.curvePositionAt(
		completionProgress,
		drawable.object.spans,
	);

	const duration = 200;

	drawable.container.x =
		drawable.object.startX + position.x + drawable.object.stackedOffset.x;
	drawable.container.y =
		drawable.object.startY + position.y + drawable.object.stackedOffset.y;

	if (
		time < drawable.object.startTime ||
		time > drawable.object.endTime + duration / 4
	) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;

	if (time >= drawable.object.startTime && time <= drawable.object.endTime) {
		drawable.container.alpha = Easings.OutQuint(
			Math.max(0, Math.min(1, (time - drawable.object.startTime) / duration)),
		);
		return;
	}

	if (time > drawable.object.endTime) {
		drawable.container.alpha =
			1 -
			Easings.OutQuint(
				Math.max(
					0,
					Math.min(1, (time - drawable.object.endTime) / (duration / 4)),
				),
			);
	}
};
