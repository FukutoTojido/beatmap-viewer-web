import { SliderBody } from "./SliderBody2.js";

// Ported from https://github.com/111116/webosu/blob/master/scripts/SliderMesh.js
// Also have a visit at http://osugame.online/ , very cool tbh

export class SliderGeometryContainers {
    curve;
    geometry;

    sliderContainer;
    selSliderContainer;

    constructor(curve, slider) {
        this.curve = curve;

        // this.sliderContainer = new SliderMesh(this.curve, slider);
        // this.selSliderContainer = new SliderMesh(this.curve, slider);

        this.geometry = SliderBody.curveGeometry(this.curve, SliderBody.RADIUS);
        this.circle = SliderBody.circleGeometry(SliderBody.RADIUS);

        this.sliderContainer = new SliderBody(this.curve, this.geometry, this.circle, slider, false);
        this.selSliderContainer = new SliderBody(this.curve, this.geometry, this.circle, slider, true);
    }
}