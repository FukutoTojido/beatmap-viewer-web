import type { Vector2 } from "osu-classes";
import type { Slider, StandardHitObject } from "osu-standard-stable";
import { Assets, Container, Graphics, Sprite, type Texture } from "pixi.js";
import Easings from "../../../UI/Easings";
import { inject } from "@/Context";
import type Skin from "@/Skinning/Skin";
import type SkinManager from "@/Skinning/SkinManager";
import SkinnableElement from "./SkinnableElement";

export default class DrawableFollowPoints extends SkinnableElement {
	container: Container = new Container();
	sprites: Sprite[] = [];

	startTime: number;
	endTime: number;

	startPosition: Vector2;
	endPosition: Vector2;

	distance: number;
	timePreempt: number;

	get duration() {
		return this.endTime - this.startTime;
	}

	constructor(
		private startObject: StandardHitObject,
		private endObject: StandardHitObject,
	) {
		super();

		this.timePreempt = startObject.timePreempt;
		this.startTime =
			(this.startObject as unknown as Slider).endTime ??
			this.startObject.startTime;
		this.endTime = this.endObject.startTime;

		this.startPosition = this.startObject.endPosition.add(
			this.startObject.stackedOffset,
		);
		this.endPosition = this.endObject.startPosition.add(
			this.endObject.stackedOffset,
		);

		this.distance = this.endPosition.distance(this.startPosition);

		const vector = this.endPosition.subtract(this.startPosition).normalize();
		const angle = Math.atan2(vector.y, vector.x);

		this.container.x = this.startPosition.x;
		this.container.y = this.startPosition.y;
		this.container.rotation = angle;
		this.container.interactive = false;
		this.container.interactiveChildren = false;

		const numberOfSprites = Math.floor((this.distance - 48) / (512 / 16));
		for (let i = 0; i < numberOfSprites; i++) {
			const sprite = new Sprite(this.skinManager?.getCurrentSkin().getTexture("followpoint"));
			sprite.anchor.set(0.5);
			sprite.x = (1.5 + i) * (512 / 16);

			this.sprites.push(sprite);
		}

		this.container.addChild(...this.sprites);

		this.skinManager?.addSkinChangeListener((skin) => {
			const followpoint = skin.getTexture("followpoint");

			if (!followpoint) return;
			for (const sprite of this.sprites) {
				sprite.texture = followpoint;
			}
		});
	}

	update(time: number) {
		const timeFadeIn = this.startObject.timeFadeIn;
		const preempt = this.startObject.timePreempt;

		if (time < this.startTime - preempt) {
			this.container.visible = false;
			return;
		}

		this.container.visible = true;

		for (const [idx, sprite] of Object.entries(this.sprites)) {
			const d = 32 * 1.5 + 32 * +idx;
			const f = d / this.distance;

			const fadeOutTime = this.startTime + f * this.duration;
			const fadeInTime = fadeOutTime - preempt;

			if (time < fadeInTime + timeFadeIn) {
				const opacity = Easings.OutQuad(
					Math.min(1, Math.max(0, (time - fadeInTime) / timeFadeIn)),
				);

				sprite.alpha = opacity;
				sprite.scale.set((1.5 - 0.5 * opacity) * this.startObject.scale);
				sprite.x = (f - 0.1 * (1 - opacity)) * this.distance;
				continue;
			}

			if (time >= fadeInTime + timeFadeIn && time < fadeOutTime) {
				sprite.alpha = 1;
				sprite.scale.set(1 * this.startObject.scale);
				sprite.x = f * this.distance;
				continue;
			}

			if (time > fadeOutTime) {
				const opacity =
					1 -
					Easings.OutQuad(
						Math.min(1, Math.max(0, (time - fadeOutTime) / timeFadeIn)),
					);
				sprite.alpha = opacity;
				sprite.scale.set(1 * this.startObject.scale);
				sprite.x = f * this.distance;
			}
		}
	}
}
