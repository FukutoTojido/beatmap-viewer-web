import type { Vector2 } from "osu-classes";
import type { Slider, StandardHitObject } from "osu-standard-stable";
import { Container, Sprite } from "pixi.js";
import { update } from "@/Skinning/Shared/FollowPoints";
import type Skin from "@/Skinning/Skin";
import SkinnableElement from "./SkinnableElement";

export default class DrawableFollowPoints extends SkinnableElement {
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
			const followpoint = skin.getTexture(
				"followpoint",
				this.context.consume<Skin>("beatmapSkin"),
			);

			this.container.blendMode = skin.config.General.Argon ? "add" : "normal";

			if (!followpoint) return;
			for (const sprite of this.sprites) {
				sprite.texture = followpoint;
			}
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
			const sprite = new Sprite(
				this.skinManager?.getCurrentSkin().getTexture("followpoint"),
			);
			sprite.anchor.set(0.5);
			sprite.x = (1.5 + i) * (512 / 16);

			this.sprites.push(sprite);
		}

		if (this.sprites.length) this.container.addChild(...this.sprites);
	}

	update(time: number) {
		update(this, time);
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
