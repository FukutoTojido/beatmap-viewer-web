import type { Circle } from "osu-standard-stable";
import { Graphics, Sprite } from "pixi.js";
import SkinnableElement from "./SkinnableElement";
import type Beatmap from "..";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonApproachCircle";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacyApproachCircle";
import type Skin from "@/Skinning/Skin";
import type SkinningConfig from "@/Config/SkinningConfig";
import { inject } from "@/Context";

export default class DrawableApproachCircle extends SkinnableElement {
	container = new Sprite();

	constructor(public object: Circle) {
		super();

		this.container.visible = false;
		this.container.x = object.startX + object.stackedOffset.x;
		this.container.y = object.startY + object.stackedOffset.y;
		this.container.anchor.set(0.5);
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.refreshSprite();
		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprite(),
		);
	}

	updateFn = legacyUpdate;

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		if (skin.config.General.Argon) {
			this.updateFn = argonUpdate;
		} else {
			this.updateFn = legacyUpdate;
		}

		const approachCircle = skin.getTexture(
			"approachcircle",
			this.context.consume<Skin>("beatmapSkin"),
		);
		if (approachCircle) this.container.texture = approachCircle;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (
			beatmap?.data.colors.comboColors.length &&
			!inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin
		) {
			const colors = beatmap.data.colors.comboColors;
			const comboIndex = this.object.comboIndexWithOffsets % colors.length;

			this.container.tint = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
			return;
		}

		const comboIndex = this.object.comboIndexWithOffsets % skin.colorsLength;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const color = (skin.config.Colours as any)[
			`Combo${comboIndex + 1}`
		] as string;
		this.container.tint = `rgb(${color})`;
	}

	update(time: number) {
		this.updateFn(this, time);
	}

	destroy() {
		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
