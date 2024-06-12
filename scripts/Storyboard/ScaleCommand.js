import { EASINGS } from "./Storyboard";
import * as Easing from "easing-utils";
import { Clamp, easeOutElasticHalf, easeOutElasticQuart } from "../Utils";

export class ScaleCommand {
    easing;
    startTime;
    endTime;
    paramsX;
    paramsY;

    constructor({ easing, startTime, endTime, paramsX, paramsY }) {
        this.easing = easing;
        this.startTime = startTime;
        this.endTime = endTime;
        this.paramsX = paramsX;
        this.paramsY = paramsY;

        this.duration = Math.max(paramsX.length - 1, 1) * (endTime - startTime);
    }

    execute(object, timestamp) {
        const { sprite } = object;

        if (timestamp < this.startTime) {
            // sprite.scale.set(this.paramsX.at(0) * Game.SB_SCALE_RATE * 0.8, this.paramsY.at(0) * Game.SB_SCALE_RATE * 0.8);
            object.props.scaleX = this.paramsX.at(0);
            object.props.scaleY = this.paramsY.at(0);

            return;
        }

        if (timestamp > this.startTime + this.duration) {
            if (this.paramsX.length > 0) {
                // sprite.scale.set(this.paramsX.at(-1) * Game.SB_SCALE_RATE * 0.8, this.paramsY.at(-1) * Game.SB_SCALE_RATE * 0.8);
                object.props.scaleX = this.paramsX.at(-1);
                object.props.scaleY = this.paramsY.at(-1);
            }

            return;
        }

        // console.log(object.texturepath, timestamp, this.startTime, this.startTime + this.duration, this.paramsX, this.paramsY);

        if (this.paramsX.length === 1) {
            // sprite.scale.set(this.paramsX.at(0) * Game.SB_SCALE_RATE * 0.8, this.paramsY.at(0) * Game.SB_SCALE_RATE * 0.8);
            object.props.scaleX = this.paramsX.at(0);
            object.props.scaleY = this.paramsY.at(0);
            return;
        }

        const step = Math.floor(((timestamp - this.startTime) / this.duration) * (this.paramsX.length - 1));
        const percentage = Clamp(((timestamp - this.startTime) % this.duration) / this.duration, 0, 1);
        const easeFunction =
            EASINGS[this.easing] === "easeOutElasticHalf"
                ? easeOutElasticHalf
                : EASINGS[this.easing] === "easeOutElasticQuart"
                ? easeOutElasticQuart
                : Easing[EASINGS[this.easing]];

        if (this.paramsX.length > 0) {
            const startX = this.paramsX[step];
            const endX = this.paramsX[step + 1];

            const startY = this.paramsY[step];
            const endY = this.paramsY[step + 1];

            const x = startX + (endX - startX) * easeFunction(percentage);
            const y = startY + (endY - startY) * easeFunction(percentage);
            // sprite.scale.set(x, y);
            object.props.scaleX = x;
            object.props.scaleY = y;
        }
    }
}