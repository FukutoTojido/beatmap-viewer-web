import { Assets, BitmapText, Container, Sprite, Text } from "pixi.js";
import { inject, ScopedClass } from "@/Context";
import type { StandardHitObject } from "osu-standard-stable";
import { LayoutContainer } from "@pixi/layout/components";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import SkinnableElement from "./SkinnableElement";
import { update } from "@/Skinning/Legacy/LegacyDefaults";

const SPACING = -2;

export default class DrawableDefaults extends SkinnableElement {
	container: Container;
	sprites: { text: Sprite; digit: string }[] = [];

	constructor(public object: StandardHitObject) {
		super();
		const number = object.currentComboIndex + 1;
		const digits = number.toString().split("");

		this.container = new Container({
			// layout: {
			// 	position: "absolute",
			// 	transformOrigin: "center center",
			// 	width: 0,
			// 	height: 0,
			// 	flexDirection: "row",
			// 	gap: -SPACING,
			// 	alignItems: "center",
			// 	justifyContent: "center",
			// },
		});

		this.sprites = digits.map<{ text: Sprite; digit: string }>((digit) => {
			const text = new Sprite();
			text.anchor.set(0, 0.5);
			return { text, digit };
		});

		this.refreshSprites();
		this.container.scale.set(0.8);
		this.container.addChild(...this.sprites.map((sprite) => sprite.text));
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprites(),
		);
	}

	refreshSprites(skin?: Skin) {
		const s = skin ?? this.skinManager?.getCurrentSkin();
		if (!s) return;

		let width = s.config.Fonts.HitCircleOverlap;
		for (const { text, digit } of this.sprites) {
			width -= s.config.Fonts.HitCircleOverlap;
			const texture = s.getTexture(`default-${digit}`);
			text.x = width;

			if (texture) {
				text.texture = texture;
				width += texture.width;
			}
		}
		this.container.x = (-width / 2) * 0.8;
		// this.container.x = 0;
		this.container.y = 0;
	}

	update(time: number) {
		update(this, time);
	}

	destroy() {
		for (const { text } of this.sprites) {
			text.destroy();
		}

		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
