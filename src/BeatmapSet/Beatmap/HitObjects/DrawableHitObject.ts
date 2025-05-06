import type { Container } from "pixi.js";
import { ScopedClass } from "../../../Context";

export default abstract class DrawableHitObject extends ScopedClass {
    abstract container: Container;
    abstract update(time: number): void;
}