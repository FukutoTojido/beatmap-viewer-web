import type DrawableSliderHead from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderHead";
import type GameplayConfig from "@/Config/GameplayConfig";
import { inject } from "@/Context";

export const update = (drawable: DrawableSliderHead, time: number) => {
	const startTime = drawable.evaluation?.hitTime ?? drawable.object.startTime;

	if (
		time < startTime ||
		!inject<GameplayConfig>("config/gameplay")?.hitAnimation
	) {
		const skin = drawable.skinManager?.getCurrentSkin();
		const sliderStartCircle = skin?.getTexture("sliderstartcircle");
		const hitCircle = skin?.getTexture("hitcircle");

		const baseTexture = sliderStartCircle ?? hitCircle;
		if (baseTexture) drawable.hitCircleSprite.texture = baseTexture;
	}

	if (!inject<GameplayConfig>("config/gameplay")?.hitAnimation) {
		return;
	}

	if (time >= startTime) {
		const flashTexture = drawable.skinManager
			?.getCurrentSkin()
			.getTexture("hitcircleflash");
		if (flashTexture) drawable.hitCircleSprite.texture = flashTexture;
	}
};
