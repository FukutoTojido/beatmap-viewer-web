import { Clamp, easeOutElasticHalf, easeOutElasticQuart } from "../Utils";
import { EASINGS } from "./Storyboard";
import * as Easing from "easing-utils";

export class FadeCommand {
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
                // sprite.alpha = this.params.at(0);
                object.props.alpha = this.params.at(0);
                return;
            }

            if (this.duration === 0 || timestamp > this.startTime + this.duration) {
                // sprite.alpha = this.params.at(-1);
                object.props.alpha = this.params.at(-1);
                return;
            }

            if (this.params.length === 1) {
                // sprite.alpha = this.params.at(0);
                object.props.alpha = this.params.at(0);
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

            const alpha = this.params[step] + (this.params[step + 1] - this.params[step]) * easeFunction(percentage);
            // sprite.alpha = alpha;
            object.props.alpha = alpha;
        } catch (error) {
            console.log(error);
        }
    }
}