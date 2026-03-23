import type { Texture } from "pixi.js";
import type IAnimatedSkinnableElement from "./IAnimatedSkinnableElement";
import SkinnableElement from "./SkinnableElement";

export default class AnimatedSkinnableElement
	extends SkinnableElement
	implements IAnimatedSkinnableElement
{
	texturesList: Texture[] = [];
}
