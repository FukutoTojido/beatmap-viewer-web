import { Game } from "../Game.js";
import { Texture } from "../Texture.js";
import { Beatmap } from "../Beatmap.js";
import { ObjectsController } from "./ObjectsController.js";
import { Clamp, easeOutSine, binarySearch } from "../Utils.js";
import { Skinning } from "../Skinning.js";
import { ScoreParser } from "../ScoreParser.js";
import * as PIXI from "pixi.js";
import { HitCircle } from "./HitCircle.js";

export class ReverseArrow {
    baseSlider;
    time;
    willHit = false;
    idx;

    position;
    angle;
    stackHeight;

    obj;
    ringSprite;
    arrowSprite;
    baseUnit = 200 / 2;

    hitCircle;

    constructor(baseSlider, time, position, angle, stackHeight, idx) {
        this.baseSlider = baseSlider;
        this.time = time;
        this.position = position;
        this.angle = angle;
        this.stackHeight = stackHeight;
        this.idx = idx;

        const arrowSprite = new PIXI.Sprite(Texture.ARGON.REVERSE_ARROW.arrow.texture);
        arrowSprite.anchor.set(0.5);
        this.arrowSprite = arrowSprite;

        const ringSprite = new PIXI.Sprite(Texture.ARGON.REVERSE_ARROW.ring.texture);
        ringSprite.anchor.set(0.5);
        ringSprite.scale.set(0.5 * (229 / 200));
        this.ringSprite = ringSprite;

        this.hitCircle = new HitCircle(0, 0, this.time, null);

        this.obj = new PIXI.Container();
        this.obj.addChild(this.hitCircle.obj);
        this.obj.addChild(ringSprite);
        this.obj.addChild(arrowSprite);

        // this.baseUnit = Math.max(this.obj.width, this.obj.height);
    }

    calculatePulseAtTime(timestamp) {
        const modulo = timestamp % 300;
        let pulseRate = 0;

        if (modulo <= 35) pulseRate = modulo / 35;
        if (modulo > 35 && modulo < 35 + 250) pulseRate = 1 - (modulo - 35) / 250;

        return pulseRate;
    }

    playHitsound(timestamp) {
        if (!Game.BEATMAP_FILE.audioNode.isPlaying) return;
        if (timestamp < this.time || ObjectsController.lastTimestamp >= this.time) return;

        if (!ScoreParser.REPLAY_DATA) {
            this.baseSlider.hitSounds.sliderReverse[this.idx].play();
            return;
        }

        // Will reimplement later;
        const evaluation = binarySearch(ScoreParser.EVAL_LIST, this.baseSlider.time, (evaluation, time) => {
            if (evaluation.time < time) return -1;
            if (evaluation.time > time) return 1;
            return 0;
        });

        if (ScoreParser.EVAL_LIST[evaluation]?.checkPointState.filter((checkPoint) => checkPoint.type === "Slider Repeat")[this.idx].eval === 1)
            this.baseSlider.hitSounds.sliderReverse[this.idx].play();
    }

    draw(timestamp) {
        this.playHitsound(timestamp);

        this.hitCircle.colourHaxedIdx = this.baseSlider.colourHaxedIdx;
        this.hitCircle.colourIdx = this.baseSlider.colourIdx;

        this.hitCircle.draw(timestamp);
        this.hitCircle.number.obj.alpha = 0;
        this.hitCircle.obj.alpha = 1;

        const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
        const textures = skinType !== "CUSTOM" ? Texture[skinType] : Texture.CUSTOM[Skinning.SKIN_IDX];

        this.ringSprite.texture = textures.REVERSE_ARROW.ring.texture;
        this.arrowSprite.texture = textures.REVERSE_ARROW.arrow.texture;

        const currentStackOffset = Beatmap.moddedStats.stackOffset;
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        const y = !Game.MODS.HR ? this.position.y : 384 - this.position.y;

        this.obj.x = (this.position.x + this.baseSlider.stackHeight * currentStackOffset) * (Game.WIDTH / 512);
        this.obj.y = (y + this.baseSlider.stackHeight * currentStackOffset) * (Game.WIDTH / 512);
        this.obj.rotation = !Game.MODS.HR ? this.angle : Math.PI * 2 - this.angle;
        this.hitCircle.obj.rotation = !Game.MODS.HR ? -this.angle : -(Math.PI * 2 - this.angle);

        let pulseRate = this.calculatePulseAtTime(timestamp);

        const baseScale =
            circleBaseScale * Game.SCALE_RATE * (textures.REVERSE_ARROW.arrow.isHD ? 0.5 : 1) * (236 / 256) ** 2 * (skinType === "ARGON" ? 0.95 : 1);

        this.arrowSprite.scale.set(baseScale * (1 + easeOutSine(pulseRate) * 0.2));
        this.ringSprite.scale.set((229 / 200) * baseScale);
        this.ringSprite.x = easeOutSine(pulseRate) * -12 * (512 / Game.WIDTH);
        this.obj.scale.set(1);
        this.obj.alpha = 0;

        if (this.idx === 0 && timestamp < this.baseSlider.time) {
            this.obj.alpha = Clamp((this.baseSlider.opacity - 0.5) * 2, 0, 1);
            return;
        }

        if (timestamp > this.baseSlider.time && Game.MODS.HD) this.hitCircle.obj.alpha = this.baseSlider.opacity;

        const fadeInTime = Math.min(300, this.baseSlider.sliderTime);
        if (this.idx !== 0) {
            if (timestamp < this.time - this.baseSlider.sliderTime * 2) return;
            if (timestamp >= this.time - this.baseSlider.sliderTime * 2 && timestamp < this.time - this.baseSlider.sliderTime * 2 + fadeInTime) {
                this.obj.alpha = (timestamp - (this.time - this.baseSlider.sliderTime * 2)) / fadeInTime;
                return;
            }
        }

        if (timestamp < this.time) {
            this.obj.alpha = 1;
            return;
        }

        if (Game.MODS.HD) {
            this.obj.alpha = 1;

            if (timestamp > this.time) this.obj.alpha = 0;
            return;
        }

        // if (ScoreParser.REPLAY_DATA) {
        //     return;
        // }

        const spanTime = this.baseSlider.endTime - this.baseSlider.time;
        const animationDuration = Math.min(300, spanTime);
        this.arrowSprite.scale.set(baseScale);
        this.ringSprite.x = 0;

        const percentage = (timestamp - this.time) / animationDuration;
        this.obj.scale.set(Clamp(easeOutSine(percentage), 0, 1) * 0.5 + 1);
        this.obj.alpha = Clamp(1 - easeOutSine(percentage), 0, 1);

        if (timestamp > this.time + animationDuration) this.obj.alpha = 0;
    }
}
