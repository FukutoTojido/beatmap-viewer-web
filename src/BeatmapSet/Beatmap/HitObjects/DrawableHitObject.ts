import type { Container } from "pixi.js";
import { ScopedClass } from "../../../Context";
import type { StandardHitObject } from "osu-standard-stable";
import type DrawableApproachCircle from "./DrawableApproachCircle";

export default abstract class DrawableHitObject extends ScopedClass {
    abstract container: Container;
    abstract approachCircle: DrawableApproachCircle;
    abstract update(time: number): void;
    abstract getTimeRange(): { start: number, end: number };
    abstract playHitSound(time?: number): void;

    constructor(public object: StandardHitObject) {
        super();
    };

    disable() {
        this.container.visible = false;
    };
}