import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { imageToBase64 } from "./Utils";

export class Background {
    container;
    sprite;
    mask;

    blob;

    static init() {
        this.container = new PIXI.Container();
        this.sprite = new PIXI.Sprite();
        this.mask = new PIXI.Graphics();

        this.mask.rect(0, 0, Game.MASTER_CONTAINER.w, Game.MASTER_CONTAINER.h);

        this.container.addChild(this.mask, this.sprite);
        this.container.mask = this.mask;

        this._src = null;
    }

    static get src() {
        return this._src;
    }

    static set src(val) {
        this._src = val;
        this.setBG();
    }

    static async setBG() {
        // console.log(this.src);
        // const texture = await PIXI.Assets.load(this.src);
    }

}