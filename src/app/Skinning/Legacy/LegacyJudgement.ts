import { HitResult } from "osu-classes";
import type { Slider, Spinner } from "osu-standard-stable";
import type DrawableJudgement from "@/BeatmapSet/Beatmap/HitObjects/DrawableJudgement";
import Easings from "@/UI/Easings";
import { Clamp } from "@/utils";

export const update = (drawable: DrawableJudgement, timestamp: number) => {
	if (!drawable.evaluation) {
		drawable.container.visible = false;
		return;
	}

	const fadeInLength = 120;
	const fadeOutDelay = 500;
	const fadeOutLength = 600;

	const startTime =
		(drawable.drawable.object as Slider | Spinner).endTime ??
		Math.min(
			drawable.evaluation.hitTime,
			drawable.drawable.object.startTime +
				drawable.drawable.object.hitWindows.windowFor(HitResult.Meh) +
				1,
		);

	const animationDuration = fadeInLength + fadeOutDelay + fadeOutLength;

	if (timestamp < startTime || timestamp >= startTime + animationDuration) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;

	if (timestamp >= startTime && timestamp < startTime + fadeInLength) {
		const alpha = Clamp((timestamp - startTime) / fadeInLength);
		drawable.text.alpha = alpha;
	}

	if (timestamp >= startTime + fadeInLength) {
		const alpha =
			1 -
			Clamp(
				(timestamp - (startTime + fadeInLength + fadeOutDelay)) / fadeOutLength,
			);
		drawable.text.alpha = alpha;
	}

	if (drawable.evaluation.value !== HitResult.Miss) {
		const step1 = fadeInLength * 0.8;
		const step2 = fadeInLength * 0.2;
		const step3 = fadeInLength * 0.2;
		const step4 = fadeInLength * 0.2;

		let t = 0.6;

		if (timestamp < startTime + step1) {
			t = 0.6 + 0.5 * Clamp((timestamp - startTime) / step1);
		}

		if (
			timestamp >= startTime + step1 &&
			timestamp < startTime + step1 + step2
		) {
			t = 1.1;
		}

		if (
			timestamp >= startTime + step1 + step2 &&
			timestamp < startTime + step1 + step2 + step3
		) {
			t = 1.1 - 0.2 * Clamp((timestamp - (startTime + step1 + step2)) / step3);
		}

		if (timestamp >= startTime + step1 + step2 + step3) {
			t =
				0.9 +
				0.05 * Clamp((timestamp - (startTime + step1 + step2 + step3)) / step4);
		}

		drawable.text.scale.set(t);
	}

	if (drawable.evaluation.value === HitResult.Miss) {
		const r = drawable.legacyRotation;

		const scale = 1.6 - 0.6 * Easings.In(Clamp((timestamp - startTime) / 100));
		drawable.text.scale.set(scale);

		if (timestamp >= startTime && timestamp < startTime + fadeInLength) {
			const rotation = Clamp((timestamp - startTime) / fadeInLength);
			drawable.text.angle = r * Easings.In(rotation);
			drawable.text.y = -5;
		}

		if (timestamp >= startTime + fadeInLength) {
			const rotation = Clamp(
				(timestamp - (startTime + fadeInLength)) /
					(fadeOutDelay + fadeOutLength),
			);

			drawable.text.angle = r + r * Easings.In(rotation);

			const y = Clamp(
				(timestamp - (startTime + fadeInLength)) /
					(fadeOutDelay + fadeOutLength),
			);
			drawable.text.y = -5 + Easings.In(y) * 85;
		}
	}
};
