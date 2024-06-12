import { EASINGS } from "./Storyboard";
import * as Easing from "easing-utils";
import { Clamp, easeOutElasticHalf, easeOutElasticQuart } from "../Utils";

export class MoveCommand {
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

        this.duration = Math.max(Math.max(paramsX.length - 1, paramsY.length - 1), 1) * (endTime - startTime);
    }

    execute(object, timestamp) {
        const { sprite } = object;
        if (timestamp < this.startTime) {
            if (this.paramsX.length > 0) {
                // sprite.x = this.paramsX.at(0) * Game.SB_SCALE_RATE;
                object.props.posX = this.paramsX.at(0);
            }
            if (this.paramsY.length > 0) {
                // sprite.y = this.paramsY.at(0) * Game.SB_SCALE_RATE;
                object.props.posY = this.paramsY.at(0);
            }
            return;
        }

        if (this.duration === 0 || timestamp > this.startTime + this.duration) {
            if (this.paramsX.length > 0) {
                // sprite.x = this.paramsX.at(-1) * Game.SB_SCALE_RATE;
                object.props.posX = this.paramsX.at(-1);
            }

            if (this.paramsY.length > 0) {
                // sprite.y = this.paramsY.at(-1) * Game.SB_SCALE_RATE;
                object.props.posY = this.paramsY.at(-1);
            }

            return;
        }

        // console.log(object.texturepath, timestamp, this.startTime, this.startTime + this.duration, this.paramsX, this.paramsY);

        if (this.paramsX.length === 1) {
            // sprite.x = this.paramsX.at(0) * Game.SB_SCALE_RATE;
            object.props.posX = this.paramsX.at(0);

            if (this.paramsY.length === 0) return;
        }

        if (this.paramsY.length === 1) {
            // sprite.y = this.paramsY.at(0) * Game.SB_SCALE_RATE;
            object.props.posY = this.paramsY.at(0);

            if (this.paramsX.length === 0) return;
        }

        if (this.paramsX.length === 1 || this.paramsY.length === 1) return;

        const step = Math.floor(((timestamp - this.startTime) / this.duration) * Math.max(this.paramsX.length - 1, this.paramsY.length - 1));
        const percentage = Clamp(((timestamp - this.startTime) % this.duration) / this.duration, 0, 1);
        const easeFunction =
            EASINGS[this.easing] === "easeOutElasticHalf"
                ? easeOutElasticHalf
                : EASINGS[this.easing] === "easeOutElasticQuart"
                ? easeOutElasticQuart
                : Easing[EASINGS[this.easing]];

        if (this.paramsX.length > 0) {
            const start = this.paramsX[step];
            const end = this.paramsX[step + 1];

            const x = start + (end - start) * easeFunction(percentage);
            // sprite.x = x;
            object.props.posX = x;
        }

        if (this.paramsY.length > 0) {
            const start = this.paramsY[step];
            const end = this.paramsY[step + 1];

            const y = start + (end - start) * easeFunction(percentage);
            // sprite.y = y;
            object.props.posY = y;
        }
    }
}