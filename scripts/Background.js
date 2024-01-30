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

        this._blob = null;
    }

    static get blob() {
        return this.blob;
    }

    static set blob(val) {
        this._blob = val;
        this.setBG();
    }

    static async setBG() {
        const base64 = await imageToBase64(this.src);
        // const texture = await PIXI.Assets.load(base64);
        // console.log(texture);
    }

}