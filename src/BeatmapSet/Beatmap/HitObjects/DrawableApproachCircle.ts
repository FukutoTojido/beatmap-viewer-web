import type { Circle } from "osu-standard-stable";
import { Graphics, Sprite } from "pixi.js";
import SkinnableElement from "./SkinnableElement";
import type Beatmap from "..";

export default class DrawableApproachCircle extends SkinnableElement {
	container = new Sprite();

	constructor(private object: Circle) {
		super();

		this.container.visible = false;
		this.container.x = object.startX + object.stackedOffset.x;
		this.container.y = object.startY + object.stackedOffset.y;
		this.container.anchor.set(0.5);
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.refreshSprite();
		this.skinManager?.addSkinChangeListener(() => this.refreshSprite());
	}

	refreshSprite() {
		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		const approachCircle = skin.getTexture("approachcircle");
		if (approachCircle) this.container.texture = approachCircle;

		const beatmap = this.context.consume<Beatmap>("beatmapObject");
		if (beatmap?.data.colors.comboColors.length) {
			const colors = beatmap.data.colors.comboColors;
			const comboIndex = this.object.comboIndex % colors.length;

			this.container.tint = `rgb(${colors[comboIndex].red},${colors[comboIndex].green},${colors[comboIndex].blue})`;
			return;
		}

		const comboIndex = this.object.comboIndex % skin.colorsLength;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const color = (skin.config.Colours as any)[
			`Combo${comboIndex + 1}`
		] as string;
		this.container.tint = `rgb(${color})`;
	}

	update(time: number) {
		const startFadeInTime = this.object.startTime - this.object.timePreempt;
		const fadeInDuration = Math.min(
			this.object.timeFadeIn * 2,
			this.object.timePreempt,
		);
		const fadeOutDuration = 50;

		if (
			time < startFadeInTime ||
			time >= this.object.startTime + fadeOutDuration
		) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

		if (time < this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - startFadeInTime) / fadeInDuration),
			);
			const scale =
				Math.min(
					1,
					Math.max(0, (time - startFadeInTime) / this.object.timePreempt),
				) * 3;

			this.container.alpha = opacity * 0.9;
			this.container.scale.set((4 - scale) * this.object.scale);
			return;
		}

		if (time >= this.object.startTime) {
			const opacity = Math.min(
				1,
				Math.max(0, (time - this.object.startTime) / fadeOutDuration),
			);

			this.container.alpha = (1 - opacity) * 0.9;
			this.container.scale.set(1 * this.object.scale);
			return;
		}
	}
}
