import { Game } from "../Game.js";
import { Texture } from "../Texture.js";
import { Beatmap } from "../Beatmap.js";
import { Skinning } from "../Skinning.js";
import * as PIXI from "pixi.js";

export class ApproachCircle {
    obj;
    hitCircle;

    constructor(hitCircle) {
        this.hitCircle = hitCircle;

        const approachCircle = new PIXI.Sprite(Texture.ARGON.APPROACH_CIRCLE.texture);
        approachCircle.anchor.set(0.5);

        if (Game.BEATMAP_FILE?.audioNode?.buf) approachCircle.zIndex = Game.BEATMAP_FILE?.audioNode?.duration * 1000 + 1;
        else approachCircle.zIndex = 999999;
        this.obj = approachCircle;
    }

    draw(timestamp) {
        const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
        const textures = skinType !== "CUSTOM" ? Texture[skinType] : Texture.CUSTOM[Skinning.SKIN_IDX];

        const hdScale = textures.APPROACH_CIRCLE.isHD ? 0.5 : 1;
        this.obj.texture = textures.APPROACH_CIRCLE.texture;

        const colors = Game.SLIDER_APPEARANCE.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
        const idx = Game.SLIDER_APPEARANCE.ignoreSkin ? this.hitCircle.colourIdx : this.hitCircle.colourHaxedIdx;
        this.obj.tint = colors[idx % colors.length];

        let approachRateExpandRate = 1;

        if (timestamp <= this.hitCircle.time) {
            const preemptRate = (timestamp - (this.hitCircle.time - Beatmap.moddedStats.preempt)) / Beatmap.moddedStats.preempt;
            approachRateExpandRate = Math.max(-3 * Math.min(preemptRate, 1) + 4, 1);
        }

        const x = this.hitCircle.originalX;
        const y = !Game.MODS.HR ? this.hitCircle.originalY : 384 - this.hitCircle.originalY;
        const stackDistance = this.hitCircle.stackHeight * Beatmap.moddedStats.stackOffset;

        this.obj.x = (x + stackDistance) * Game.SCALE_RATE;
        this.obj.y = (y + stackDistance) * Game.SCALE_RATE;

        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        this.obj.scale.set(hdScale * approachRateExpandRate * Game.SCALE_RATE * circleBaseScale * (skinType === "ARGON" ? 0.98 : (236 / 256) ** 2));
        this.obj.alpha = this.hitCircle.opacity;

        if (Game.MODS.HD || timestamp > this.hitCircle.time) this.obj.alpha = 0;
    }
}
