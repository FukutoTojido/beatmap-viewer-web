import * as PIXI from "pixi.js";
import { Game } from "../Game";
import { Beatmap } from "../Beatmap";
import { Texture } from "../Texture";
import { HitCircle } from "./HitCircle";
import { Slider } from "./Slider";
import { Clamp } from "../Utils";
import { easeInOutSine, easeOutQuint, easeOutSine } from "easing-utils";

export class FollowPoint {
    isHR = false;
    sprites = [];

    constructor({ startObj, endObj }) {
        this.startObj = startObj;
        this.endObj = endObj;
        this.container = new PIXI.Container();

        this.calculate();

        this.color = Math.floor(Math.random() * 0xffffff);

        this.container.zIndex = -1;
        this.container.visible = false;
        this.container.eventMode = "none";

        this.graphics = new PIXI.Graphics();
        this.container.addChild(this.graphics);
    }

    refreshSprites() {
        if (this.width < 80) {
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
                sprite.scale.set(Game.SCALE_RATE * (Texture.FOLLOWPOINT.isHD ? 0.5 : 1));
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

    updateSpritesPosition(timestamp) {
        if (timestamp < this.readyTime) {
            const percentage = easeOutQuint(Clamp((timestamp - this.startTime) / (this.readyTime - this.startTime), 0, 1));
            this.sprites.forEach((sprite, idx) => {
                sprite.x = (1.5 + idx) * (512 / 16) * Game.SCALE_RATE * percentage;
            });
        }

        if (timestamp >= this.readyTime) {
            this.sprites.forEach((sprite, idx) => {
                sprite.x = (1.5 + idx) * (512 / 16) * Game.SCALE_RATE;
            });
        }
    }

    updateOpacity(timestamp) {
        const duration = this.endTime - this.animTime;
        const fraction = duration / this.sprites.length;
        const preempt = 800 * Math.min(1, Beatmap.moddedStats.preempt / 800);
        const timeFade = Beatmap.moddedStats.fadeIn;

        this.sprites.forEach((sprite, idx) => {
            const fadeOutTime = this.animTime + idx * fraction;
            const fadeInTime = this.animTime + idx * fraction - preempt;

            if (timestamp < fadeInTime + timeFade) {
                const opacity = easeOutSine(Clamp((timestamp - fadeInTime) / timeFade, 0, 1));
                sprite.alpha = opacity;
            }

            if (timestamp > fadeOutTime) {
                const opacity = 1 - easeInOutSine(Clamp((timestamp - fadeOutTime) / timeFade, 0, 1));
                sprite.alpha = opacity;
            }

            if (timestamp >= fadeInTime + timeFade && timestamp < fadeOutTime) {
                sprite.alpha = 1;
            }
        });
    }

    draw(timestamp) {
        this.checkModChange();

        this.container.x = this.startX * Game.SCALE_RATE;
        this.container.y = this.startY * Game.SCALE_RATE;

        this.updateSpritesPosition(timestamp);
        this.updateOpacity(timestamp);

        // this.graphics.clear().rect(0, 0, this.width * Game.SCALE_RATE, 3).fill(this.color);
    }
}
