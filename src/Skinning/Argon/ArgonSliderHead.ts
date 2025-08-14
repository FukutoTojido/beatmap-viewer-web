import type DrawableSliderHead from "@/BeatmapSet/Beatmap/HitObjects/DrawableSliderHead";

export const update = (drawable: DrawableSliderHead, time: number) => {
	if (time < drawable.object.startTime) {
		const skin = drawable.skinManager?.getCurrentSkin();
		const sliderStartCircle = skin?.getTexture("sliderstartcircle");
		const hitCircle = skin?.getTexture("hitcircle");

		const baseTexture = sliderStartCircle ?? hitCircle;
		if (baseTexture) drawable.hitCircleSprite.texture = baseTexture;
	}

	if (time >= drawable.object.startTime) {
		const flashTexture = drawable.skinManager
			?.getCurrentSkin()
			.getTexture("hitcircleflash");
		if (flashTexture) drawable.hitCircleSprite.texture = flashTexture;
	}
};
