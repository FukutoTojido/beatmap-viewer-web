import { inject, ScopedClass } from "@/Context";
import type SkinManager from "@/Skinning/SkinManager";

export default abstract class SkinnableElement extends ScopedClass{
    skinManager?: SkinManager;

    constructor() {
        super();
        this.skinManager = inject<SkinManager>("skinManager");
    }
}