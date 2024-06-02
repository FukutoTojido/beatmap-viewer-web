import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { imageToBase64 } from "./Utils";

export class Background {
    container;
    sprite;
    mask;
    filter;

    blob;

    w = 1;
    h = 1;

    static init() {
        this.container = new PIXI.Container();
        this.sprite = new PIXI.Sprite();
        this.mask = new PIXI.Graphics();

        this.filter = new PIXI.BlurFilter({
            kernelSize: 9,
            quality: 10,
            strength: 50,
        });
        this.filter.blur = 0;

        this.sprite.filters = [this.filter];

        // this.mask.rect(0, 0, Game.MASTER_CONTAINER.w, Game.MASTER_CONTAINER.h);
        this.mask.rect(0, 0, Game.MASTER_CONTAINER.w, Game.MASTER_CONTAINER.h).fill(0x000000);

        this.container.addChild(this.sprite, this.mask);
        this.container.label = "Hello";
        // this.container.mask = this.mask;

        this._src = null;
        return this.container;
    }

    static get src() {
        return this._src;
    }

    static set src(val) {
        this._src = val;
        this.setBG();
    }

    static changeStrength(val) {
        this.filter.blur = (val / 20) * 100;
    }

    static changeOpacity(val) {
        const wRatio = Game.MASTER_CONTAINER.w / this.w;
        const hRatio = Game.MASTER_CONTAINER.h / this.h;
        const ratio = Math.max(wRatio, hRatio);
        
        this.mask.clear().rect(0, 0, this.w * ratio, this.h * ratio).fill({
            color: 0x000000,
            alpha: val,
        });
    }

    static manuallyUpdateSize() {
        this.sprite.scale.set(1.0);

        if (this.w !== this.sprite.width) {
            this.w = this.sprite.width;
        }

        if (this.h !== this.sprite.height) {
            this.h = this.sprite.height;
        }

        const wRatio = Game.MASTER_CONTAINER.w / this.w;
        const hRatio = Game.MASTER_CONTAINER.h / this.h;
        const ratio = Math.max(wRatio, hRatio);

        this.sprite.scale.set(ratio);

        this.container.x = (Game.MASTER_CONTAINER.w - this.w * ratio) / 2;
        this.container.y = (Game.MASTER_CONTAINER.h - this.h * ratio) / 2;

        this.mask.clear().rect(0, 0, this.w * ratio, this.h * ratio).fill({ color: 0x000000, alpha: Game.ALPHA });
    }

    static updateSize() {
        if (Game.EMIT_STACK.length === 0) return;
        this.manuallyUpdateSize();
    }

    static async setBG() {
        const texture = await PIXI.Assets.load({ src: this.src, loadParser: "loadTextures" });
        this.sprite.texture = texture;

        this.manuallyUpdateSize();

        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        this.changeStrength(currentLocalStorage.background.blur);
    }
}
