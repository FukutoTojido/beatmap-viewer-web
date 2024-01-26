import * as PIXI from "pixi.js";
import { Component } from "./WindowManager";
import { Game } from "./Game";
import { Container } from "./UI/Container";
import { FlexBox } from "./UI/FlexBox";
import { Text } from "./UI/Text";

export class Stats {
    container;
    flex;

    constructor() {
        this._CS = 0;
        this._AR = 0;
        this._OD = 0;
        this._HP = 0;
        this._SR = 0;
        this.style = {
            fontFamily: "Torus",
            fontWeight: 500,
            fontSize: 12,
            fill: 0xffffff,
        };

        this.CSSprite = new Text({
            text: `CS ${this._CS}`,
            // renderMode: "html",
            style: this.style,
        });
        this.ARSprite = new Text({
            text: `AR ${this._AR}`,
            // renderMode: "html",
            style: this.style,
        });
        this.ODSprite = new Text({
            text: `OD ${this._OD}`,
            // renderMode: "html",
            style: this.style,
        });
        this.HPSprite = new Text({
            text: `HP ${this._HP}`,
            // renderMode: "html",
            style: this.style,
        });
        this.SRSprite = new Text({
            text: `${this._SR}★`,
            // renderMode: "html",
            style: this.style,
        });

        this.srContainer = new Container();
        this.srContainer.addChild(this.SRSprite);
        this.srContainer.color = 0x2e2825;
        this.srContainer.paddingX = 10;
        this.srContainer.paddingY = 5;
        this.srContainer.borderRadius = 20;

        this.flex = new FlexBox();
        this.flex.gap = 20;
        this.flex.addChild(this.CSSprite.sprite, this.ARSprite.sprite, this.ODSprite.sprite, this.HPSprite.sprite, this.srContainer.container);

        this.container = new Container();
        this.container.paddingX = 15;
        this.container.paddingY = 5;
        this.container.color = Game.COLOR_PALETTES.primary2;
        this.container.borderRadius = 20;
        this.container.placeItemsCenter = true;

        this.container.addChild(this.flex.container);

        this.update();
    }

    get CS() {
        return this._CS;
    }

    set CS(val) {
        this._CS = val;
        this.CSSprite.text = `CS ${val}`;
        this.update();
    }

    get AR() {
        return this._AR;
    }

    set AR(val) {
        this._AR = val;
        this.ARSprite.text = `AR ${val}`;
        this.update();
    }

    get OD() {
        return this._OD;
    }

    set OD(val) {
        this._OD = val;
        this.ODSprite.text = `OD ${val}`;
        this.update();
    }

    get HP() {
        return this._HP;
    }

    set HP(val) {
        this._HP = val;
        this.HPSprite.text = `HP ${val}`;
        this.update();
    }

    get SR() {
        return this._SR;
    }

    set SR(val) {
        this._SR = val;
        this.SRSprite.text = `${val}★`;
        this.update();
    }

    update() {
        this.CSSprite.style.fontSize = 12 * devicePixelRatio;
        this.ARSprite.style.fontSize = 12 * devicePixelRatio;
        this.ODSprite.style.fontSize = 12 * devicePixelRatio;
        this.HPSprite.style.fontSize = 12 * devicePixelRatio;
        this.SRSprite.style.fontSize = 12 * devicePixelRatio;

        this.CSSprite.update();
        this.ARSprite.update();
        this.ODSprite.update();
        this.HPSprite.update();
        this.SRSprite.update();

        this.srContainer.update();
        this.flex.update();

        if (innerWidth / innerHeight < 1) {
            this.container.x = 0;
            this.container.y = Game.INFO.MASTER_CONTAINER.y + Game.INFO.MASTER_CONTAINER.h + Game.INFO.MASTER_CONTAINER.padding * 2;
            this.container.borderRadius = 0;
            this.container.width = Game.WRAPPER.w;
            this.flex.gap = 40;
        } else {
            this.container.width = undefined;
            this.container.x = Game.WRAPPER.w - this.container.width - 10 * devicePixelRatio;
            this.container.y = 10 * devicePixelRatio;
            this.container.borderRadius = 20;
            this.flex.gap = 20;
        }

        this.container.update();
    }
}
