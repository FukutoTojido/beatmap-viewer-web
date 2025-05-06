import type { Container } from "pixi.js";
import { ScopedClass } from "../../../Context";
import type { StandardHitObject } from "osu-standard-stable";

export default abstract class DrawableHitObject extends ScopedClass {
    abstract container: Container;
    abstract update(time: number): void;
    abstract getTimeRange(): { start: number, end: number };
    constructor(public object: StandardHitObject) {
        super();
    };

    disable() {
        this.container.visible = false;
    };
}