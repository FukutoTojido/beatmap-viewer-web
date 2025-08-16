import type { Circle, StandardHitObject } from "osu-standard-stable";
import { Container, Sprite } from "pixi.js";
import { update } from "@/Skinning/Legacy/LegacyDefaults";
import type Skin from "@/Skinning/Skin";
import SkinnableElement from "./SkinnableElement";

export default class DrawableDefaults extends SkinnableElement {
	container: Container;
	sprites: Sprite[] = [];
	digits: string[] = [];

	constructor(object: StandardHitObject) {
		super();
		this.container = new Container();
		this.object = object;

		const number = object.currentComboIndex + 1;
		const digits = number.toString().split("");

		this.sprites = digits.map<Sprite>(() => {
			const text = new Sprite();
			text.anchor.set(0, 0.5);
			return text;
		});

		this.refreshSprites();

		this.container.scale.set(0.8);
		this.container.interactive = false;
		this.container.interactiveChildren = false;
		this.container.addChild(...this.sprites);

		this.skinEventCallback = this.skinManager?.addSkinChangeListener(() =>
			this.refreshSprites(),
		);
	}

	private _object!: Circle;
	get object() {
		return this._object;
	}

	set object(val: Circle) {
		this._object = val;

		const number = val.currentComboIndex + 1;
		const digits = number.toString().split("");

		this.digits = digits;
	}

	refreshSprites(skin?: Skin) {
		const s = skin ?? this.skinManager?.getCurrentSkin();
		if (!s) return;

		let width = s.config.Fonts.HitCircleOverlap;
		for (let i = 0; i < this.sprites.length; i++) {
			const text = this.sprites[i];
			const digit = this.digits[i];

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
		for (const text of this.sprites) {
			text.destroy();
		}

		this.container.destroy();
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
