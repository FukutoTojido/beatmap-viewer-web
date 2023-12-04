import { Beatmap } from "../Beatmap.js";
import { Clamp, binarySearchNearest, easeOutElastic } from "../Utils.js";
import { Game } from "../Game.js";
import { ObjectsController } from "./ObjectsController.js";
import { Skinning } from "../Skinning.js";
import { HitSample } from "../Audio.js";
import { HitSound } from "../HitSound.js";
import { ScoreParser } from "../ScoreParser.js";
import * as PIXI from "pixi.js";

export class SliderTick {
    hitTime = -1;
    info;
    spanIdx;

    obj;
    graphic;

    slider;

    scale;

    hitSound;

    constructor(info, slider, spanIdx) {
        this.info = info;
        this.slider = slider;

        this.obj = new PIXI.Container();
        this.graphic = new PIXI.Graphics()
            .lineStyle({
                width: 3,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .drawCircle(0, 0, 4);
        this.obj.addChild(this.graphic);
        this.scale = Beatmap.moddedStats.radius / 54.4;

        this.spanIdx = spanIdx;
        this.getHitSound();
    }

    getHitSound() {
        let foundNearestIndex = binarySearchNearest(Beatmap.timingPointsList, this.info.time, (element, value) => {
            if (element.time < value) return -1;
            if (element.time > value) return 1;
            return 0;
        });

        while (Beatmap.timingPointsList[foundNearestIndex].time > this.info.time && foundNearestIndex > 0) {
            foundNearestIndex--;
        }

        const { sampleIdx, sampleSet: timingSampleSet, sampleVol } = Beatmap.timingPointsList[foundNearestIndex];
        const normalSet = this.slider.hitSounds.defaultSet.normal;

        let sampleSet = HitSound.HIT_SAMPLES[Beatmap.SAMPLE_SET];
        if (timingSampleSet !== 0) sampleSet = HitSound.HIT_SAMPLES[timingSampleSet];
        if (normalSet !== 0) sampleSet = HitSound.HIT_SAMPLES[normalSet];

        this.hitSound = new HitSample([`${sampleSet}-slidertick${sampleIdx}`], sampleVol / 100);
    }

    playHitsound(timestamp) {
        if (!this.hitSound) return;
        if (!Game.BEATMAP_FILE.audioNode.isPlaying) return;
        if (timestamp < this.info.time || ObjectsController.lastTimestamp >= this.info.time) return;

        if (!ScoreParser.REPLAY_DATA) {
            this.hitSound.play();
            return;
        }

        const evaluation = ScoreParser.EVAL_LIST.find((evaluation) => evaluation.time === this.slider.time);
        if (evaluation && evaluation.checkPointState.filter((checkPoint) => checkPoint.type === "Slider Tick")[this.spanIdx].eval === 1)
            this.hitSound.play();
    }

    draw(timestamp) {
        this.playHitsound(timestamp);

        const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];

        // This appears to be a very bullshit implementation from me so please do not follow T.T
        const appearTime =
            this.slider.time -
            Beatmap.moddedStats.preempt / 2 +
            this.spanIdx * (Beatmap.moddedStats.preempt / 2 / this.slider.sliderParts.filter((p) => p.type === "Slider Tick").length);

        let expandTime = 600;
        if (this.info.time - appearTime < expandTime) expandTime = this.info.time - appearTime;

        const currentStackOffset = Beatmap.moddedStats.stackOffset;
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        let { x, y } = this.info;
        if (Game.MODS.HR) y = 384 - y;

        this.obj.x = (x + this.slider.stackHeight * currentStackOffset) * Game.SCALE_RATE;
        this.obj.y = (y + this.slider.stackHeight * currentStackOffset) * Game.SCALE_RATE;

        this.graphic.tint = 0xffffff;
        if (skinType !== "LEGACY" && skinType !== "CUSTOM") {
            const colors = Game.SLIDER_APPEARANCE.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
            const idx = Game.SLIDER_APPEARANCE.ignoreSkin ? this.slider.colourIdx : this.slider.colourHaxedIdx;
            const color = colors[idx % colors.length];

            this.graphic.tint = color;
        }

        if (timestamp < appearTime) {
            this.obj.alpha = 0;
            return;
        }

        if (timestamp >= appearTime && timestamp < appearTime + expandTime) {
            const alpha = Clamp((timestamp - appearTime) / 150, 0, 1);
            this.obj.alpha = alpha;

            const t = Clamp((timestamp - appearTime) / expandTime, 0, 1);
            const scale = easeOutElastic(t);
            this.obj.scale.set(circleBaseScale * Game.SCALE_RATE * (0.5 + scale * 0.5));
            return;
        }

        this.obj.alpha = 1;
        this.obj.scale.set(circleBaseScale * Game.SCALE_RATE);

        if (timestamp > this.info.time) this.obj.alpha = 0;
    }
}
