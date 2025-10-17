import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import { sharedRefreshSprite } from "../Shared/HitCircle";
import { BLANK_TEXTURE } from "../Skin";
import { HitResult } from "osu-classes";

export const refreshSprite = (drawable: DrawableHitCircle) => {
	sharedRefreshSprite(drawable);
	drawable.flashPiece.texture = BLANK_TEXTURE;
	drawable.flashPiece.visible = false;
	drawable.container.scale.set(drawable.object.scale);
	drawable.select.scale.set(drawable.object.scale);
	drawable.sprite.blendMode = "normal";
};

export const update = (drawable: DrawableHitCircle, time: number) => {
	const maxThreshold =
		drawable.object.startTime +
		drawable.object.hitWindows.windowFor(HitResult.Meh);
	const startTime = Math.min(
		maxThreshold,
		drawable.evaluation?.hitTime ?? drawable.object.startTime,
	);
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeOutDuration = 240;

	const shouldHit = ![
		HitResult.Miss,
		HitResult.LargeTickMiss,
		HitResult.SmallTickMiss,
	].includes(drawable.evaluation?.value as HitResult);

	if (time < startFadeInTime || time > drawable.object.startTime + 800) {
		drawable.wrapper.visible = false;
		return;
	}

	drawable.wrapper.visible = true;
	drawable.sprite.scale.set(1);

	if (time < startTime) {
		const opacity = Math.min(
			1,
			Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
		);
		drawable.wrapper.alpha = opacity;

		return;
	}

	if (time >= startTime && shouldHit) {
		const opacity =
			1 - Math.min(1, Math.max(0, (time - startTime) / fadeOutDuration));
		const scale = Math.min(
			1.5,
			1 + 0.5 * Math.max(0, (time - startTime) / fadeOutDuration),
		);

		drawable.wrapper.alpha = opacity;
		drawable.sprite.scale.set(scale);

		return;
	}

	if (!shouldHit && time > maxThreshold) {
		const opacity = 1 - Math.min(1, Math.max(0, (time - maxThreshold) / 100));
		drawable.wrapper.alpha = opacity;
		drawable.sprite.scale.set(1);
	}
};
