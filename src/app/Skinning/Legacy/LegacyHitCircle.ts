import { HitResult } from "osu-classes";
import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import type GameplayConfig from "@/Config/GameplayConfig";
import { inject } from "@/Context";
import { Clamp } from "@/utils";
import { sharedRefreshSprite } from "../Shared/HitCircle";
import { BLANK_TEXTURE } from "../Skin";

export const refreshSprite = (drawable: DrawableHitCircle) => {
	sharedRefreshSprite(drawable);
	drawable.flashPiece.texture = BLANK_TEXTURE;
	drawable.flashPiece.visible = false;
	drawable.container.scale.set(drawable.object.scale);
	drawable.select.scale.set(drawable.object.scale);
	drawable.sprite.blendMode = "normal";
};

export const update = (drawable: DrawableHitCircle, time: number) => {
	const isHD = inject<ExperimentalConfig>("config/experimental")?.hidden;

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

	if (isHD) return applyHidden(drawable, time);
	if (!inject<GameplayConfig>("config/gameplay")?.hitAnimation)
		return surpressAnimation(drawable, time);

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

const applyHidden = (drawable: DrawableHitCircle, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const opacity = Math.min(
		1,
		Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
	);

	if (opacity >= 1) {
		const opacity = Clamp(
			(time - (startFadeInTime + drawable.object.timeFadeIn)) /
				(drawable.object.timePreempt * 0.3),
		);
		drawable.wrapper.alpha = 1 - opacity;
		return;
	}

	drawable.wrapper.alpha = opacity;
	return;
};

const surpressAnimation = (drawable: DrawableHitCircle, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;

	const opacity = Math.min(
		1,
		Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
	);
	drawable.hitCircleSprite.tint = drawable.color;

	if (time > drawable.object.startTime) {
		const opacity = Clamp((time - drawable.object.startTime) / 800);
		drawable.wrapper.alpha = 1 - opacity;
		drawable.hitCircleSprite.tint = 0xffffff;
		return;
	}

	drawable.wrapper.alpha = opacity;
	return;
};
