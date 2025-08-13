import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import { sharedRefreshSprite } from "../Shared/HitCircle";
import Easings from "@/UI/Easings";
import type Skin from "../Skin";

export const refreshSprite = (drawable: DrawableHitCircle) => {
	sharedRefreshSprite(drawable);
	drawable.container.scale.set(drawable.object.scale * 0.95);
};

export const update = (drawable: DrawableHitCircle, time: number) => {
	const startFadeInTime =
		drawable.object.startTime - drawable.object.timePreempt;
	const fadeOutDuration = 240;

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
			.getTexture("hitcircle", drawable.context.consume<Skin>("beatmapSkin"));
		if (baseTexture) drawable.hitCircleSprite.texture = baseTexture;

        drawable.hitCircleSprite.blendMode = "normal";

		const opacity = Math.min(
			1,
			Math.max(0, (time - startFadeInTime) / drawable.object.timeFadeIn),
		);
		drawable.container.alpha = opacity;

		return;
	}

	if (time >= drawable.object.startTime) {
		const flashTexture = drawable.skinManager
			?.getCurrentSkin()
			.getTexture("hitcircleflash", drawable.context.consume<Skin>("beatmapSkin"));
		if (flashTexture) drawable.hitCircleSprite.texture = flashTexture;

        drawable.hitCircleSprite.blendMode = "add";

		const opacity =
			1 -
			Math.min(
				1,
				Math.max(0, (time - drawable.object.startTime) / fadeOutDuration),
			);
		const scale =
			1 -
			0.2 *
				Easings.OutElasticHalf(
					Math.min(1, Math.max(0, (time - drawable.object.startTime) / 400)),
				);

		drawable.container.alpha = opacity;
		drawable.sprite.scale.set(scale);

		return;
	}
};
