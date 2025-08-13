import type Beatmap from "@/BeatmapSet/Beatmap";
import type DrawableHitCircle from "@/BeatmapSet/Beatmap/HitObjects/DrawableHitCircle";
import type SkinningConfig from "@/Config/SkinningConfig";
import { inject } from "@/Context";
import type Skin from "../Skin";

export const sharedRefreshSprite = (drawable: DrawableHitCircle) => {
	const skin = drawable.skinManager?.getCurrentSkin();
	if (!skin) return;

	const hitCircle = skin.getTexture(
		"hitcircle",
		drawable.context.consume<Skin>("beatmapSkin"),
	);
	const hitCircleOverlay = skin.getTexture(
		"hitcircleoverlay",
		drawable.context.consume<Skin>("beatmapSkin"),
	);

	if (hitCircle) drawable.hitCircleSprite.texture = hitCircle;
	if (hitCircleOverlay) drawable.hitCircleOverlay.texture = hitCircleOverlay;

	const beatmap = drawable.context.consume<Beatmap>("beatmapObject");
	if (
		beatmap?.data?.colors.comboColors.length &&
		!inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
	) {
		const colors = beatmap.data.colors.comboColors;
		const comboIndex = drawable.object.comboIndexWithOffsets % colors.length;

		drawable.hitCircleSprite.tint = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;

		drawable.color = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
		drawable.timelineObject?.refreshSprite();

		return;
	}

	const comboIndex = drawable.object.comboIndexWithOffsets % skin.colorsLength;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const color = (skin.config.Colours as any)[
		`Combo${comboIndex + 1}`
	] as string;

	drawable.color = `rgb(${color})`;
	drawable.hitCircleSprite.tint = `rgb(${color})`;

	drawable.timelineObject?.refreshSprite();
};
