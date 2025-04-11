import * as PIXI from "pixi.js";
import { Game } from "../Game";
import { Beatmap } from "../Beatmap";
import { Texture } from "../Texture";
import { HitCircle } from "./HitCircle";
import { Slider } from "./Slider";
import { Clamp } from "../Utils";
import { easeOutQuad } from "easing-utils";

export class FollowPoint {
	isHR = false;
	sprites = [];

	constructor({ startObj, endObj }) {
		this.startObj = startObj;
		this.endObj = endObj;
		this.container = new PIXI.Container();

		this.calculate();

		this.color = Math.floor(Math.random() * 0xffffff);

		this.container.zIndex = -999;
		// this.container.visible = false;
		this.container.eventMode = "none";

		this.graphics = new PIXI.Graphics();
		this.container.addChild(this.graphics);
	}

	refreshSprites() {
		if (Number.isNaN(this.width) || this.width < 80) {
			this.sprites = [];
			this.container.removeChildren();
			return;
		}

		const texture = Texture.FOLLOWPOINT.texture;
		const numberOfSprites = Math.floor((this.width - 48) / (512 / 16));

		this.container.removeChildren();
		this.sprites = Array(numberOfSprites)
			.fill(true)
			.map((_, idx) => {
				const sprite = new PIXI.Sprite(texture);
				sprite.anchor.set(0.5);
				// if (Texture.FOLLOWPOINT.isHD) sprite.scale.set(0.5);
				sprite.scale.set(
					Game.SCALE_RATE * (Texture.FOLLOWPOINT.isHD ? 0.5 : 1),
				);
				sprite.eventMode = "none";

				sprite.x = (1.5 + idx) * (512 / 16) * Game.SCALE_RATE;

				this.container.addChild(sprite);
				return sprite;
			});
	}

	calculate() {
		if (this.startObj instanceof HitCircle) {
			this.startTime = this.startObj.time - Beatmap.moddedStats.preempt;
		}

		if (this.startObj instanceof Slider) {
			this.startTime = this.startObj.endTime - Beatmap.moddedStats.preempt;
		}

		this.readyTime = this.endObj.time - Beatmap.moddedStats.preempt;
		this.animTime = this.startObj.endTime;
		this.endTime = this.endObj.time;

		let { x: startX, y: startY } = this.startObj.endPosition;
		let { x: endX, y: endY } = this.endObj.startPosition;

		if (Game.MODS.HR) {
			startY = 384 - startY;
			endY = 384 - endY;
		}

		startX += this.startObj.stackHeight * Beatmap.moddedStats.stackOffset;
		startY += this.startObj.stackHeight * Beatmap.moddedStats.stackOffset;
		endX += this.endObj.stackHeight * Beatmap.moddedStats.stackOffset;
		endY += this.endObj.stackHeight * Beatmap.moddedStats.stackOffset;

		this.width = Math.hypot(endX - startX, endY - startY);

		this.rotation = Math.atan2(endY - startY, endX - startX);
		this.startX = startX;
		this.startY = startY;
		this.enđX = endX;
		this.endY = endY;

		this.container.rotation = this.rotation;

		this.refreshSprites();
	}

	checkModChange() {
		if (Game.MODS.HR === this.isHR) return;
		this.isHR = Game.MODS.HR;

		this.calculate();
	}

	updateOpacity(timestamp) {
		const duration = this.endTime - this.animTime;
		const preempt = 800 * Math.min(1, Beatmap.moddedStats.preempt / 800);
		const timeFade = Beatmap.moddedStats.fadeIn;

		this.sprites.forEach((sprite, idx) => {
			const d = 32 * 1.5 + 32 * idx;
			const f = d / this.width;

			const fadeOutTime = this.animTime + f * duration;
			const fadeInTime = fadeOutTime - preempt;

			if (timestamp < fadeInTime + timeFade) {
				const opacity = easeOutQuad(
					Clamp((timestamp - fadeInTime) / timeFade, 0, 1),
				);
				sprite.alpha = opacity;
				sprite.scale.set(
					(1.5 - 0.5 * opacity) *
						Game.SCALE_RATE *
						(Texture.FOLLOWPOINT.isHD ? 0.5 : 1),
				);

				sprite.x = (f - 0.1 * (1 - opacity)) * this.width * Game.SCALE_RATE;
			}

			if (timestamp > fadeOutTime) {
				const opacity =
					1 - easeOutQuad(Clamp((timestamp - fadeOutTime) / timeFade, 0, 1));
				sprite.alpha = opacity;
				sprite.scale.set(
					Game.SCALE_RATE * (Texture.FOLLOWPOINT.isHD ? 0.5 : 1),
				);
				// sprite.x = (1.5 + idx) * (512 / 16) * Game.SCALE_RATE
				sprite.x = f * this.width * Game.SCALE_RATE;
			}

			if (timestamp >= fadeInTime + timeFade && timestamp < fadeOutTime) {
				sprite.alpha = 1;
				sprite.scale.set(
					Game.SCALE_RATE * (Texture.FOLLOWPOINT.isHD ? 0.5 : 1),
				);
				// sprite.x = (1.5 + idx) * (512 / 16) * Game.SCALE_RATE
				sprite.x = f * this.width * Game.SCALE_RATE;
			}
		});
	}

	draw(timestamp) {
		this.checkModChange();

		this.container.x = this.startX * Game.SCALE_RATE;
		this.container.y = this.startY * Game.SCALE_RATE;

		this.updateOpacity(timestamp);

		// this.graphics.clear().rect(0, 0, this.width * Game.SCALE_RATE, 3).fill(this.color);
	}
}
