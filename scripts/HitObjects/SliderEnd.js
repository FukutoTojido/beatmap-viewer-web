import { HitCircle } from "./HitCircle";
import { Game } from "../Game";

export class SliderEnd {
    baseSlider;
    endPosition;

    hitCircle;

    constructor(baseSlider) {
        const endPosition = baseSlider.realTrackPoints.at(-1);
        this.hitCircle = new HitCircle(endPosition.x, endPosition.y, baseSlider.endTime, baseSlider.hitSounds.sliderTail);

        this.baseSlider = baseSlider;
        this.endPosition = endPosition;
    }

    draw(timestamp) {
        this.hitCircle.colourHaxedIdx = this.baseSlider.colourHaxedIdx;
        this.hitCircle.colourIdx = this.baseSlider.colourIdx;

        this.hitCircle.draw(timestamp);
        this.hitCircle.number.obj.alpha = 0;

        if (timestamp < this.baseSlider.endTime) {
            this.hitCircle.obj.alpha = this.baseSlider.opacity;
            return;
        }
    }
}