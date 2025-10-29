import type { Texture } from "pixi.js";
import SkinnableElement from "./SkinnableElement";

export default class AnimatedSkinnableElement extends SkinnableElement {
    texturesList: Texture[] = [];
}