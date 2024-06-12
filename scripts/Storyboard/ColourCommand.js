import { EASINGS } from "./Storyboard";
import { Clamp, easeOutElasticHalf, easeOutElasticQuart } from "../Utils";
import * as Easing from "easing-utils";

export class ColourCommand {
    startTime;
    endTime;
    paramsR;
    paramsG;
    paramsB;

    constructor({ easing, startTime, endTime, paramsR, paramsG, paramsB }) {
        this.easing = easing;
        this.startTime = startTime;
        this.endTime = endTime;
        this.paramsR = paramsR;
        this.paramsG = paramsG;
        this.paramsB = paramsB;

        this.duration = Math.max(paramsR.length - 1, 1) * (endTime - startTime);
    }

    execute(object, timestamp) {
        const { sprite } = object;
        if (timestamp < this.startTime) {
            // sprite.tint = (this.paramsR.at(0) << 16) | (this.paramsG.at(0) << 8) | this.paramsB.at(0);
            object.props.tint = (this.paramsR.at(0) << 16) | (this.paramsG.at(0) << 8) | this.paramsB.at(0);

            return;
        }

        if (this.duration === 0 || timestamp > this.startTime + this.duration) {
            if (this.paramsR.length > 0) {
                // sprite.tint = (this.paramsR.at(-1) << 16) | (this.paramsG.at(-1) << 8) | this.paramsB.at(-1);
                object.props.tint = (this.paramsR.at(-1) << 16) | (this.paramsG.at(-1) << 8) | this.paramsB.at(-1);
            }

            return;
        }

        // console.log(object.texturepath, timestamp, this.startTime, this.startTime + this.duration, this.paramsX, this.paramsY);

        if (this.paramsR.length === 1) {
            // sprite.tint = (this.paramsR.at(0) << 16) | (this.paramsG.at(0) << 8) | this.paramsB.at(0);
            object.props.tint = (this.paramsR.at(0) << 16) | (this.paramsG.at(0) << 8) | this.paramsB.at(0);
            return;
        }

        const step = Math.floor(((timestamp - this.startTime) / this.duration) * (this.paramsR.length - 1));
        const percentage = Clamp(((timestamp - this.startTime) % this.duration) / this.duration, 0, 1);
        const easeFunction =
            EASINGS[this.easing] === "easeOutElasticHalf"
                ? easeOutElasticHalf
                : EASINGS[this.easing] === "easeOutElasticQuart"
                ? easeOutElasticQuart
                : Easing[EASINGS[this.easing]];

        if (this.paramsR.length > 0) {
            const r = this.paramsR[step] + (this.paramsR[step + 1] - this.paramsR[step]) * easeFunction(percentage);
            const g = this.paramsG[step] + (this.paramsG[step + 1] - this.paramsG[step]) * easeFunction(percentage);
            const b = this.paramsB[step] + (this.paramsB[step + 1] - this.paramsB[step]) * easeFunction(percentage);

            // sprite.tint = (r << 16) | (g << 8) | b;
            object.props.tint = (r << 16) | (g << 8) | b;
        }
    }
}
