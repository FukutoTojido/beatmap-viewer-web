import type { Container } from "pixi.js";
import { inject, ScopedClass } from "../../../Context";
import type { StandardHitObject } from "osu-standard-stable";
import type DrawableApproachCircle from "./DrawableApproachCircle";
import type SkinManager from "@/Skinning/SkinManager";
import SkinnableElement from "./SkinnableElement";

export interface IHasApproachCircle {
    approachCircle: DrawableApproachCircle;
}

export default abstract class DrawableHitObject extends SkinnableElement {
    abstract container: Container;
    abstract update(time: number): void;
    abstract getTimeRange(): { start: number, end: number };
    playHitSound(time?: number, offset?: number) {};

    constructor(public object: StandardHitObject) {
        super();
        this.context.provide("object", this);
    };

    disable() {
        this.container.visible = false;
    };

    abstract destroy(): void;
}