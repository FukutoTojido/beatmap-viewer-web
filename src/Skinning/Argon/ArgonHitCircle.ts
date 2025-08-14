import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import { sharedRefreshSprite } from "../Shared/HitCircle";
import Easings from "@/UI/Easings";
import type Skin from "../Skin";
import { BLANK_TEXTURE } from "../Skin";
import { Easing } from "osu-classes";
import * as d3 from "d3";

export const refreshSprite = (drawable: DrawableHitCircle) => {
	sharedRefreshSprite(drawable);

	const flashTexture = drawable.skinManager
		?.getCurrentSkin()
		.getTexture("hitcircleflash");

	drawable.flashPiece.texture = flashTexture ?? BLANK_TEXTURE;
	drawable.container.scale.set(drawable.object.scale * 0.95);
};

export const update = (drawable: DrawableHitCircle, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeOutDuration = 800;
	const flashInDuration = 150;
	const fadeColourDuration = 80;

	if (
		time < startFadeInTime ||
		time > drawable.object.startTime + fadeOutDuration
	) {
		drawable.container.visible = false;
		return;
	}

	drawable.container.visible = true;
	drawable.sprite.scale.set(1);

	if (time < drawable.object.startTime) {
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
		drawable.container.alpha = opacity;
		drawable.hitCircleOverlay.alpha = 1;
		drawable.hitCircleSprite.alpha = 1;

		return;
	}

	if (time >= drawable.object.startTime) {
		drawable.hitCircleSprite.tint = drawable.color;

		const flashTexture = drawable.skinManager
			?.getCurrentSkin()
			.getTexture("hitcircleflash");
		if (flashTexture) drawable.hitCircleSprite.texture = flashTexture;

		drawable.flashPiece.visible = true;
		drawable.sprite.blendMode = "add";

		const opacity = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / fadeOutDuration),
		);
		const fadeProgress = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / fadeColourDuration),
		);
		const flashOpacity = Math.min(
			1,
			Math.max(0, (time - (drawable.object.startTime + fadeColourDuration)) / flashInDuration),
		);
		const flashPieceOpacity =
			2 *
				Math.min(
					1,
					Math.max(
						0,
						(time - drawable.object.startTime) / (flashInDuration * 2),
					),
				) -
			1;
		const scale = Math.min(
			1,
			Math.max(0, (time - drawable.object.startTime) / 400),
		);

		const color = d3.color(drawable.color as string);
		const white = d3.color("white");

		if (color && white) {
			const interpolator = d3.interpolateRgb(color, white);
			const interpolated = interpolator(fadeProgress);

			drawable.hitCircleSprite.tint = interpolated;
		}

		drawable.container.alpha = 1 - Easings.OutQuad(opacity);

		drawable.hitCircleOverlay.alpha = 0.5 * (1 - Easings.OutQuad(opacity));
		drawable.hitCircleSprite.alpha = 1 - Easings.OutQuint(flashOpacity);
		drawable.sprite.scale.set(1 - 0.2 * Easing.outElasticHalf(scale));

		drawable.flashPiece.alpha =
			flashPieceOpacity < 0
				? Easings.OutQuint(1 - Math.abs(flashPieceOpacity))
				: 1 - Easings.OutQuint(flashPieceOpacity);
		drawable.flashPiece.scale.set(1.0 - 0.2 * Easing.outElasticHalf(scale));

		return;
	}
};
