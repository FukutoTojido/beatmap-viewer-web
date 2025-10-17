import { HitResult } from "osu-classes";
import { Container, Sprite } from "pixi.js";
import { inject } from "@/Context";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonJudgement";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacyJudgement";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import type { BaseObjectEvaluation } from "../Replay";
import type DrawableHitObject from "./DrawableHitObject";

export default class DrawableJudgement {
	container: Container;
	text: Sprite;

	legacyRotation: number = 0;

	constructor(public drawable: DrawableHitObject) {
		this.text = new Sprite({ anchor: 0.5 });

		this.container = new Container({
			label: "judgement",
			interactive: false,
			eventMode: "none",
		});
		this.container.addChild(this.text);

		this.container.visible = false;

		this.updateFn =
			inject<SkinManager>("skinManager")?.getCurrentSkin().metadata?.type ===
			"ARGON"
				? argonUpdate
				: legacyUpdate;

		inject<SkinManager>("skinManager")?.addSkinChangeListener((skin) => {
			this.updateFn =
				skin.metadata?.type === "ARGON" ? argonUpdate : legacyUpdate;

			if (!this.evaluation) return;

			switch (this.evaluation.value) {
				case HitResult.Great: {
					this.text.texture = skin.getTexture("hit300") ?? BLANK_TEXTURE;
					break;
				}
				case HitResult.Ok: {
					this.text.texture = skin.getTexture("hit100") ?? BLANK_TEXTURE;
					break;
				}
				case HitResult.Meh: {
					this.text.texture = skin.getTexture("hit50") ?? BLANK_TEXTURE;
					break;
				}
				case HitResult.Miss: {
					this.text.texture = skin.getTexture("hit0") ?? BLANK_TEXTURE;
					break;
				}
				default: {
					this.text.texture = BLANK_TEXTURE;
				}
			}
		});

		this.legacyRotation = Math.random() * 8.6 * 2 - 8.6;
	}

	_evaluation?: BaseObjectEvaluation;
	get evaluation() {
		return this._evaluation;
	}
	set evaluation(value: BaseObjectEvaluation | undefined) {
		this._evaluation = value;

		if (!value) {
			// this.text.text = "";
			this.container.visible = false;

			return;
		}

		this.container.visible = true;
		switch (value.value) {
			case HitResult.Great: {
				this.text.texture =
					inject<SkinManager>("skinManager")
						?.getCurrentSkin()
						.getTexture("hit300") ?? BLANK_TEXTURE;
				break;
			}
			case HitResult.Ok: {
				this.text.texture =
					inject<SkinManager>("skinManager")
						?.getCurrentSkin()
						.getTexture("hit100") ?? BLANK_TEXTURE;
				break;
			}
			case HitResult.Meh: {
				this.text.texture =
					inject<SkinManager>("skinManager")
						?.getCurrentSkin()
						.getTexture("hit50") ?? BLANK_TEXTURE;
				break;
			}
			case HitResult.Miss: {
				this.text.texture =
					inject<SkinManager>("skinManager")
						?.getCurrentSkin()
						.getTexture("hit0") ?? BLANK_TEXTURE;
				break;
			}
			default: {
				this.text.texture = BLANK_TEXTURE;
			}
		}
	}

	updateFn?: (drawable: DrawableJudgement, timestamp: number) => void;

	frame(timestamp: number) {
		this.updateFn?.(this, timestamp);
	}
}
