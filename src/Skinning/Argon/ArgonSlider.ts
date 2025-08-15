import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type SkinningConfig from "@/Config/SkinningConfig";
import { inject } from "@/Context";
import { lighten, darken } from "@/utils";
import type Beatmap from "@/BeatmapSet/Beatmap";
import { sharedUpdate } from "../Shared/Slider";

export const refreshSprite = (drawable: DrawableSlider) => {
	const skin = drawable.skinManager?.getCurrentSkin();
	if (!skin) return;

	const beatmap = drawable.context.consume<Beatmap>("beatmapObject");

	const comboIndex =
		drawable.object.comboIndexWithOffsets %
		(beatmap?.data.colors.comboColors.length &&
		!inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
			? beatmap?.data.colors.comboColors.length
			: skin.colorsLength);
	const colors = beatmap?.data.colors.comboColors;
	const comboColor =
		colors?.length &&
		!inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
			? `${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue}`
			: // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				((skin.config.Colours as any)[`Combo${comboIndex + 1}`] as string);

	const color = comboColor.split(",").map((value) => +value / 255);
	drawable.trackColor = color;
	drawable.color = comboColor;

	drawable.borderColor = color;

	drawable._shader.resources.customUniforms.uniforms.borderColor = color;
	drawable._shader.resources.customUniforms.uniforms.innerColor = darken(
		[color[0], color[1], color[2]],
		4.0,
	);
	drawable._shader.resources.customUniforms.uniforms.outerColor = darken(
		[color[0], color[1], color[2]],
		4.0,
	);
	drawable._shader.resources.customUniforms.uniforms.borderWidth = 0.128 * 1.65;
	drawable._shader.resources.customUniforms.uniforms.bodyAlpha = 0.92;

	drawable.timelineObject?.refreshSprite();
};

export const update = (drawable: DrawableSlider, time: number) => {
	const { start, end } = sharedUpdate(drawable, time);
	drawable.updateGeometry(start, end, 0.95);
};
