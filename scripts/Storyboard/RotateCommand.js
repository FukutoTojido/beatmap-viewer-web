import { EASINGS } from "./Storyboard";
import * as Easing from "easing-utils";
import { Clamp, easeOutElasticHalf, easeOutElasticQuart } from "../Utils";

export class RotateCommand {
    easing;
    startTime;
    endTime;
    params;

    constructor({ easing, startTime, endTime, params }) {
        this.easing = easing;
        this.startTime = startTime;
        this.endTime = endTime;
        this.params = params;

        this.duration = Math.max(params.length - 1, 1) * (endTime - startTime);
    }

    execute(object, timestamp) {
        try {
            const { sprite } = object;
            if (timestamp < this.startTime) {
                // sprite.rotation = this.params.at(0);
                object.props.rotation = this.params.at(0);
                return;
            }

            if (this.duration === 0 || timestamp > this.startTime + this.duration) {
                // sprite.rotation = this.params.at(-1);
                object.props.rotation = this.params.at(-1);
                return;
            }

            if (this.params.length === 1) {
                // sprite.rotation = this.params.at(0);
                object.props.rotation = this.params.at(0);
                return;
            }

            const step = Math.floor(((timestamp - this.startTime) / this.duration) * (this.params.length - 1));
            const percentage = Clamp(((timestamp - this.startTime) % this.duration) / this.duration, 0, 1);
            const easeFunction =
                EASINGS[this.easing] === "easeOutElasticHalf"
                    ? easeOutElasticHalf
                    : EASINGS[this.easing] === "easeOutElasticQuart"
                    ? easeOutElasticQuart
                    : Easing[EASINGS[this.easing]];

            if (!easeFunction) {
                throw new Error(this.easing);
            }

            const rotation = this.params[step] + (this.params[step + 1] - this.params[step]) * easeFunction(percentage);
            // sprite.rotation = rotation;
            object.props.rotation = rotation;
        } catch (error) {
            console.log(error);
        }
    }
}