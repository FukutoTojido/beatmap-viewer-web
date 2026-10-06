import { inject, ScopedClass } from "@/Context";
import type SkinManager from "@/Skinning/SkinManager";
import type { SkinEventCallback } from "@/Skinning/SkinManager";
import type { GameplaysEventCallback } from "@/UI/main/viewer/Gameplays";

export default abstract class SkinnableElement extends ScopedClass {
	skinManager?: SkinManager;
	skinEventCallback?: SkinEventCallback;
	gameplaysEventCallback?: GameplaysEventCallback;

	refreshSprite() {}

	constructor() {
		super();
		this.skinManager = inject<SkinManager>("skinManager");
	}
}
