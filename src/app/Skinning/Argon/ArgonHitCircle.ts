import * as d3 from "d3";
import { Easing, HitResult } from "osu-classes";
import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import type ExperimentalConfig from "@/Config/ExperimentalConfig";
import type GameplayConfig from "@/Config/GameplayConfig";
import { inject } from "@/Context";
import Easings from "@/UI/Easings";
import { Clamp } from "@/utils";
import { sharedRefreshSprite } from "../Shared/HitCircle";
import { BLANK_TEXTURE } from "../Skin";

export const refreshSprite = (drawable: DrawableHitCircle) => {
	sharedRefreshSprite(drawable);

	const flashTexture = drawable.skinManager
		?.getCurrentSkin()
		.getTexture("hitcircleglow");

	drawable.flashPiece.texture = flashTexture ?? BLANK_TEXTURE;
	drawable.container.scale.set(drawable.object.scale * 0.95);
	drawable.select.scale.set(drawable.object.scale * 0.95);
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
	const fadeOutDuration = 800;
	const flashInDuration = 150;
	const fadeColourDuration = 80;

	if (
		time < startFadeInTime ||
		time > drawable.object.startTime + fadeOutDuration
	) {
		drawable.wrapper.visible = false;
		return;
	}

	drawable.wrapper.visible = true;
	drawable.sprite.scale.set(1);
	drawable.hitCircleSprite.tint = drawable.color;

	const shouldHit = ![
		HitResult.Miss,
		HitResult.LargeTickMiss,
		HitResult.SmallTickMiss,
	].includes(drawable.evaluation?.value as HitResult);

	if (isHD) return applyHidden(drawable, time);
	if (!inject<GameplayConfig>("config/gameplay")?.hitAnimation)
		return surpressAnimation(drawable, time);

	if (time <= startTime) {
		const baseTexture = drawable.skinManager
			?.getCurrentSkin()
			.getTexture("hitcircle");
		if (baseTexture) drawable.hitCircleSprite.texture = baseTexture;

		drawable.flashPiece.visible = false;
		drawable.sprite.blendMode = "normal";

		const opacity = Math.min(
			1,
			Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
		);
		drawable.wrapper.alpha = opacity;
		drawable.hitCircleOverlay.alpha = 1;
		drawable.hitCircleSprite.alpha = 1;

		return;
	}

	if (time > startTime && shouldHit) {
		drawable.hitCircleSprite.tint = drawable.color;

		const flashTexture = drawable.skinManager
			?.getCurrentSkin()
			.getTexture("hitcircleflash");
		if (flashTexture) drawable.hitCircleSprite.texture = flashTexture;

		drawable.flashPiece.visible = true;
		// drawable.sprite.blendMode = "add";

		const opacity = Clamp((time - startTime) / fadeOutDuration);
		const fadeProgress = Clamp((time - startTime) / fadeColourDuration);
		const flashOpacity = Clamp(
			(time - (startTime + fadeColourDuration)) / flashInDuration,
		);
		const flashPieceOpacity =
			2 * Clamp((time - startTime) / (flashInDuration * 2)) - 1;
		const scale = Clamp((time - startTime) / 400);

		const color = d3.color(drawable.color as string);
		const white = d3.color("white");

		if (color && white) {
			const interpolator = d3.interpolateRgb(color, white);
			const interpolated = interpolator(0.3 * fadeProgress);

			drawable.hitCircleSprite.tint = interpolated;
		}

		drawable.wrapper.alpha = 1 - Easings.OutQuad(opacity);

		drawable.hitCircleOverlay.alpha = 0.5 * (1 - Easings.OutQuad(opacity));
		drawable.hitCircleSprite.alpha = 1 - Easings.OutQuint(flashOpacity);
		drawable.sprite.scale.set(1 - 0.15 * Easing.outElasticHalf(scale));
		drawable.sprite.blendMode = "add";

		drawable.flashPiece.alpha =
			flashPieceOpacity < 0
				? Easings.OutQuint(1 - Math.abs(flashPieceOpacity))
				: 1 - Easings.OutQuint(flashPieceOpacity);
		drawable.flashPiece.scale.set(1.0 - 0.15 * Easing.outElasticHalf(scale));

		return;
	}

	if (!shouldHit && time > maxThreshold) {
		const opacity = 1 - Math.min(1, Math.max(0, (time - maxThreshold) / 100));
		drawable.wrapper.alpha = opacity;
	}
};

const applyHidden = (drawable: DrawableHitCircle, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const opacity = Math.min(
		1,
		Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
	);

	drawable.flashPiece.visible = false;
	drawable.sprite.blendMode = "normal";

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

	const baseTexture = drawable.skinManager
		?.getCurrentSkin()
		.getTexture("hitcircle");
	if (baseTexture) drawable.hitCircleSprite.texture = baseTexture;
	drawable.flashPiece.visible = false;
	drawable.hitCircleOverlay.alpha = 1;
	drawable.hitCircleSprite.alpha = 1;
	drawable.sprite.blendMode = "normal";

	if (time > drawable.object.startTime) {
		const opacity = Clamp((time - drawable.object.startTime) / 800);
		drawable.wrapper.alpha = 1 - opacity;
		drawable.hitCircleSprite.tint = 0xffffff;
		return;
	}

	drawable.wrapper.alpha = opacity;
	return;
};
