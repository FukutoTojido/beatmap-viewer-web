import type Beatmap from "@/BeatmapSet/Beatmap";
import calculateSliderProgress from "@/BeatmapSet/Beatmap/HitObjects/CalculateSliderProgress";
import createGeometry from "@/BeatmapSet/Beatmap/HitObjects/CreateSliderGeometry";
import type DrawableSlider from "@/BeatmapSet/Beatmap/HitObjects/DrawableSlider";
import type SkinningConfig from "@/Config/SkinningConfig";
import { inject } from "@/Context";
import { darken, lighten } from "@/utils";
import { sharedUpdate } from "../Shared/Slider";

const blur = new URLSearchParams(window.location.search).get("blur");

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

	const trackColor = beatmap?.data.colors.sliderTrackColor;
	const trackOverride =
		trackColor && !inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
			? `${trackColor.red},${trackColor.green},${trackColor.blue}`
			: skin.config.Colours.SliderTrackOverride;

	const color = (trackOverride ?? comboColor)
		.split(",")
		.map((value) => +value / 255);
	drawable.trackColor = color;
	drawable.color = comboColor;

	const border =
		beatmap?.data.colors.sliderBorderColor &&
		!inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
			? Object.values(beatmap?.data.colors.sliderBorderColor)
					.map((val) => val / 255)
					.slice(0, 3)
			: null;
	const borderColor =
		border ??
		skin.config.Colours.SliderBorder.split(",").map((value) => +value / 255);
	drawable.borderColor = borderColor;

	drawable._shader.resources.customUniforms.uniforms.borderColor = borderColor;
	drawable._shader.resources.customUniforms.uniforms.innerColor = lighten(
		blur ? [0.5, 0.5, 0.5] : [color[0], color[1], color[2]],
		blur ? 0.1 : 0.5,
	);
	drawable._shader.resources.customUniforms.uniforms.outerColor = darken(
		blur ? [0.5, 0.5, 0.5] : [color[0], color[1], color[2]],
		0.1,
	);
	drawable._shader.resources.customUniforms.uniforms.borderWidth = 0.128;
	drawable._shader.resources.customUniforms.uniforms.bodyAlpha = 0.7;

	drawable._selectShader.resources.customUniforms.uniforms.borderColor = [
		49 / 255,
		151 / 255,
		255 / 255,
		1.0,
	];
	drawable._selectShader.resources.customUniforms.uniforms.borderWidth = 0.128;

	drawable.timelineObject?.refreshSprite();

	const path = calculateSliderProgress(drawable.object.path, 0, 1);
	if (!path.length) return;

	const { aPosition, indexBuffer } = createGeometry(
		path,
		drawable.object.radius * (236 / 256),
	);
	drawable._baseGeometry.attributes.aPosition.buffer.data = new Float32Array(
		aPosition,
	);
	drawable._baseGeometry.indexBuffer.data = new Uint32Array(indexBuffer);
};

export const update = (drawable: DrawableSlider, time: number) => {
	const { start, end } = sharedUpdate(drawable, time);
	drawable.updateGeometry(start, end);
};
