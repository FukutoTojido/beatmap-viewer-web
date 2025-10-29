import type { Vector2 } from "osu-classes";
import type { Slider, StandardHitObject } from "osu-standard-stable";
import { Container, Sprite } from "pixi.js";
import { update } from "@/Skinning/Shared/FollowPoints";
import type Skin from "@/Skinning/Skin";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import AnimatedSkinnableElement from "./AnimatedSkinnableElement";
import { Clamp } from "@/utils";

export default class DrawableFollowPoints extends AnimatedSkinnableElement {
	container: Container = new Container();
	sprites: Sprite[] = [];

	startTime!: number;
	endTime!: number;

	startPosition!: Vector2;
	endPosition!: Vector2;

	distance!: number;

	get duration() {
		return this.endTime - this.startTime;
	}

	constructor(
		public startObject: StandardHitObject,
		public endObject: StandardHitObject,
	) {
		super();

		this.updateObjects(startObject, endObject);

		this.skinEventCallback = this.skinManager?.addSkinChangeListener((skin) => {
			const followpoint = skin.getAnimatedTexture(
				"followpoint",
				this.context.consume<Skin>("beatmapSkin"),
			);

			this.container.blendMode = skin.config.General.Argon ? "add" : "normal";
			this.texturesList = followpoint;
		});
	}

	updateObjects(startObject: StandardHitObject, endObject: StandardHitObject) {
		this.startObject = startObject;
		this.endObject = endObject;

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

		this.container.removeChildren();
		for (const sprite of this.sprites) {
			sprite.destroy();
		}

		const numberOfSprites =
			this.distance < 80 ? 0 : Math.floor((this.distance - 48) / (512 / 16));
		this.sprites = [];
		for (let i = 0; i < numberOfSprites; i++) {
			const sprite = new Sprite();
			sprite.anchor.set(0.5);
			sprite.x = (1.5 + i) * (512 / 16);

			this.sprites.push(sprite);
		}

		this.texturesList = this.skinManager
			?.getCurrentSkin()
			.getAnimatedTexture("followpoint") ?? [BLANK_TEXTURE];

		if (this.sprites.length) this.container.addChild(...this.sprites);
	}

	update(time: number) {
		update(this, time);

		for (const [idx, sprite] of Object.entries(this.sprites)) {
			const d = 32 * 1.5 + 32 * +idx;
			const f = d / this.distance;

			const fadeOutTime = this.startTime + f * this.duration;
			const fadeInTime = fadeOutTime - this.startObject.timePreempt;
			const frameLength = (fadeOutTime - fadeInTime) / this.texturesList.length;

			const frameIndex = Clamp(
				Math.floor((time - fadeInTime) / frameLength),
				0,
				this.texturesList.length - 1,
			);

			sprite.texture = this.texturesList[frameIndex];
		}
	}

	destroy() {
		for (const sprite of this.sprites) {
			sprite.destroy();
		}

		this.container.destroy();

		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
