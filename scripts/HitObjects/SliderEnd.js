import { HitCircle } from "./HitCircle";
import { Game } from "../Game";
import { Beatmap } from "../Beatmap";

export class SliderEnd {
    baseSlider;
    endPosition;

    hitCircle;

    props = {
        alpha: null,
        x: null,
        y: null,
    };

    constructor(baseSlider) {
        const endPosition = baseSlider.realTrackPoints.at(-1);
        this.hitCircle = new HitCircle(endPosition.x, endPosition.y, baseSlider.endTime, null);
        this.hitCircle.number.obj.alpha = 0;

        this.baseSlider = baseSlider;
        this.endPosition = endPosition;
    }

    updatePosition() {
        const stackHeight = this.baseSlider.stackHeight;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;

        const x = this.endPosition.x + stackHeight * currentStackOffset;
        const y = !Game.MODS.HR ? this.endPosition.y + stackHeight * currentStackOffset : 384 - this.endPosition.y + stackHeight * currentStackOffset;

        if (this.props.x !== x) {
            this.props.x = x;
            this.hitCircle.obj.x = this.props.x * Game.SCALE_RATE;
        }

        if (this.props.y !== y) {
            this.props.y = y;
            this.hitCircle.obj.y = this.props.y * Game.SCALE_RATE;
        }
    }

    getAlpha(timestamp) {
        const currentPreempt = Beatmap.moddedStats.preempt;
        const currentFadeIn = Beatmap.moddedStats.fadeIn;

        const startTime = this.baseSlider.time - currentPreempt + currentPreempt / 3;

        if (timestamp < this.baseSlider.endTime && !Game.SLIDER_APPEARANCE.snaking) {
            return this.baseSlider.opacity;
        }

        if (timestamp < startTime) {
            return 0;
        }

        if (timestamp >= startTime && timestamp < startTime + currentFadeIn) {
            return ((timestamp - startTime) / currentFadeIn) * 0.9;
        }

        if (timestamp > startTime + currentFadeIn && Game.MODS.HD) {
            return this.baseSlider.opacity * 0.9;
        }

        if (timestamp >= startTime + currentFadeIn && timestamp < this.baseSlider.endTime) {
            return 0.9;
        }
    }

    draw(timestamp) {
        if (!Game.SLIDER_APPEARANCE.sliderend || Game.SKINNING.type === "0") {
            if (this.props.alpha !== 0) {
                this.props.alpha = 0;
                this.hitCircle.obj.alpha = this.props.alpha;
            }

            return;
        }

        this.hitCircle.colourHaxedIdx = this.baseSlider.colourHaxedIdx;
        this.hitCircle.colourIdx = this.baseSlider.colourIdx;

        this.hitCircle.draw(timestamp);
        this.hitCircle.number.obj.alpha = 0;

        this.updatePosition();

        const alpha = this.getAlpha(timestamp);
        if (alpha !== undefined && (this.props.alpha !== alpha || this.hitCircle.props.alpha !== alpha)) {
            this.props.alpha = alpha;
            this.hitCircle.obj.alpha = alpha;
        }
    }
}
