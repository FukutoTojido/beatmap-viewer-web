import type Beatmap from "@/BeatmapSet/Beatmap";
import calculateSliderProgress from "@/BeatmapSet/Beatmap/HitObjects/CalculateSliderProgress";
import createGeometry from "@/BeatmapSet/Beatmap/HitObjects/CreateSliderGeometry";
import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type SkinningConfig from "@/Config/SkinningConfig";
import { inject } from "@/Context";
import { darken } from "@/utils";
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
			: // biome-ignore lint/suspicious/noExplicitAny: It is complicated
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

	drawable._selectShader.resources.customUniforms.uniforms.borderColor = [
		255 / 255,
		192 / 255,
		43 / 255,
		1.0,
	];
	drawable._selectShader.resources.customUniforms.uniforms.borderWidth =
		0.128 * 1.65;

	drawable.timelineObject?.refreshSprite();

	const path = calculateSliderProgress(drawable.object.path, 0, 1);
	if (!path.length) return;

	const { aPosition, indexBuffer } = createGeometry(
		path,
		drawable.object.radius * (236 / 256) * 0.95,
	);
	drawable._baseGeometry.attributes.aPosition.buffer.data = new Float32Array(
		aPosition,
	);
	drawable._baseGeometry.indexBuffer.data = new Uint32Array(indexBuffer);
};

export const update = (drawable: DrawableSlider, time: number) => {
	const { start, end } = sharedUpdate(drawable, time);
	drawable.updateGeometry(start, end, 0.95);
};
