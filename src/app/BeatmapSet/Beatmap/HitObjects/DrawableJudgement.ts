import { HitResult } from "osu-classes";
import { Container, Sprite } from "pixi.js";
import { inject } from "@/Context";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonJudgement";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacyJudgement";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import type { BaseObjectEvaluation } from "../Replay";
import type DrawableHitObject from "./DrawableHitObject";
import AnimatedSkinnableElement from "./AnimatedSkinnableElement";
import type { Slider, Spinner } from "osu-standard-stable";
import { Clamp } from "@/utils";

export default class DrawableJudgement extends AnimatedSkinnableElement {
	container: Container;
	text: Sprite;

	legacyRotation: number = 0;

	constructor(public drawable: DrawableHitObject) {
		super();

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

		this.texturesList = [BLANK_TEXTURE];

		inject<SkinManager>("skinManager")?.addSkinChangeListener((skin) => {
			this.updateFn =
				skin.metadata?.type === "ARGON" ? argonUpdate : legacyUpdate;

			if (!this.evaluation) return;

			switch (this.evaluation.value) {
				case HitResult.Great: {
					this.texturesList = skin.getAnimatedTexture("hit300");
					break;
				}
				case HitResult.Ok: {
					this.texturesList = skin.getAnimatedTexture("hit100");
					break;
				}
				case HitResult.Meh: {
					this.texturesList = skin.getAnimatedTexture("hit50");
					break;
				}
				case HitResult.Miss: {
					this.texturesList = skin.getAnimatedTexture("hit0");
					break;
				}
				default: {
					this.texturesList = [BLANK_TEXTURE];
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
				this.texturesList = inject<SkinManager>("skinManager")
					?.getCurrentSkin()
					.getAnimatedTexture("hit300") ?? [BLANK_TEXTURE];
				break;
			}
			case HitResult.Ok: {
				this.texturesList = inject<SkinManager>("skinManager")
					?.getCurrentSkin()
					.getAnimatedTexture("hit100") ?? [BLANK_TEXTURE];
				break;
			}
			case HitResult.Meh: {
				this.texturesList = inject<SkinManager>("skinManager")
					?.getCurrentSkin()
					.getAnimatedTexture("hit50") ?? [BLANK_TEXTURE];
				break;
			}
			case HitResult.Miss: {
				this.texturesList = inject<SkinManager>("skinManager")
					?.getCurrentSkin()
					.getAnimatedTexture("hit0") ?? [BLANK_TEXTURE];
				break;
			}
			default: {
				this.texturesList = [BLANK_TEXTURE];
			}
		}
	}

	updateFn?: (drawable: DrawableJudgement, timestamp: number) => void;

	frame(timestamp: number) {
		this.updateFn?.(this, timestamp);

		if (!this.evaluation) return;

		const startTime =
			(this.drawable.object as Slider | Spinner).endTime ??
			Math.min(
				this.evaluation.hitTime,
				this.drawable.object.startTime +
					this.drawable.object.hitWindows.windowFor(HitResult.Meh) +
					1,
			);

		const currentSkin = this.skinManager?.getCurrentSkin();
		const frameLength = currentSkin?.config.General.AnimationFrameRate
			? 1000 / currentSkin.config.General.AnimationFrameRate
			: 1220 / this.texturesList.length;
		const frameIndex = Clamp(
			Math.floor((timestamp - startTime) / frameLength),
			0,
			this.texturesList.length - 1,
		);

		this.text.texture = this.texturesList[frameIndex];
	}
}
