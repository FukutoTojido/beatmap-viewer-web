import { HitCircle } from "./HitCircle";
import { Game } from "../Game";
import { Beatmap } from "../Beatmap";

export class SliderEnd {
    baseSlider;
    endPosition;

    hitCircle;

    constructor(baseSlider) {
        const endPosition = baseSlider.realTrackPoints.at(-1);
        this.hitCircle = new HitCircle(endPosition.x, endPosition.y, baseSlider.endTime, null);

        this.baseSlider = baseSlider;
        this.endPosition = endPosition;
    }

    draw(timestamp) {
        this.hitCircle.colourHaxedIdx = this.baseSlider.colourHaxedIdx;
        this.hitCircle.colourIdx = this.baseSlider.colourIdx;

        this.hitCircle.draw(timestamp);
        this.hitCircle.number.obj.alpha = 0;

        const stackHeight = this.baseSlider.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        const x = this.endPosition.x + stackHeight * currentStackOffset;
        const y = !Game.MODS.HR ? this.endPosition.y + stackHeight * currentStackOffset : 384 - this.endPosition.y + stackHeight * currentStackOffset;

        this.hitCircle.obj.x = x * Game.SCALE_RATE;
        this.hitCircle.obj.y = y * Game.SCALE_RATE;

        const currentPreempt = Beatmap.moddedStats.preempt;
        const currentFadeIn = Beatmap.moddedStats.fadeIn;

        const startTime = this.baseSlider.time - currentPreempt + currentPreempt / 3;

        if ((timestamp < this.baseSlider.endTime && !Game.SLIDER_APPEARANCE.snaking)) {
            this.hitCircle.obj.alpha = this.baseSlider.opacity;
            return;
        }

        if (timestamp < startTime) {
            this.hitCircle.obj.alpha = 0;
            return;
        }

        if (timestamp >= startTime && timestamp < startTime + currentFadeIn) {
            this.hitCircle.obj.alpha = (timestamp - startTime) / currentFadeIn;
            return;
        }

        if (timestamp > startTime + currentFadeIn && Game.MODS.HD) {
            this.hitCircle.obj.alpha = this.baseSlider.opacity;
            return;
        }

        if (timestamp >= startTime + currentFadeIn && timestamp < this.baseSlider.endTime) {
            this.hitCircle.obj.alpha = 1;
            return;
        }
    }
}
