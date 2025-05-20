import { inject, ScopedClass } from "@/Context";
import type { SkinEventCallback } from "@/Skinning/SkinManager";
import type SkinManager from "@/Skinning/SkinManager";

export default abstract class SkinnableElement extends ScopedClass{
    skinManager?: SkinManager;
    skinEventCallback?: SkinEventCallback; 

    constructor() {
        super();
        this.skinManager = inject<SkinManager>("skinManager");
    }
}