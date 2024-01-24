import * as PIXI from "pixi.js";
import { Component } from "./WindowManager";
import { Game } from "./Game";

export class Container {
    constructor() {
        this.container = new PIXI.Container();
        this.content = new PIXI.Container();
        this.background = new PIXI.Graphics();

        this._paddingX = 0;
        this._paddingY = 0;
        this._color = 0x000000;
        this._alpha = 0;
        this._borderRadius = 0;

        this._x = 0;
        this._y = 0;

        this._width = undefined;
        this._height = undefined;

        this.container.addChild(this.background, this.content);
        this.container.x = 0;
        this.container.y = 0;

        this.placeItemsCenter = false;
    }

    addChild(child) {
        this.content.addChild(child);
    }

    get paddingX() {
        return this._paddingX * devicePixelRatio;
    }

    set paddingX(val) {
        this._paddingX = val;
        this.update();
    }

    get paddingY() {
        return this._paddingY * devicePixelRatio;
    }

    set paddingY(val) {
        this._paddingY = val;
        this.update();
    }

    get color() {
        return this._color;
    }

    set color(val) {
        this._color = val;
        this.alpha = 1;
        this.update();
    }

    get alpha() {
        return this._alpha;
    }

    set alpha(val) {
        this._alpha = val;
        this.update();
    }

    get width() {
        if (!this._width) return this.content.width + this.paddingX * 2;
        return this._width;
    }

    set width(val) {
        if (val === this._width) return;
        this._width = val;
        this.update();
    }

    get height() {
        if (!this._height) return this.content.height + this.paddingY * 2;
        return this._height;
    }

    set height(val) {
        if (val === this._height) return;
        this._height = val;
        this.update();
    }

    get x() {
        return this._x;
    }

    set x(val) {
        if (val === this._x) return;
        this._x = val;
        this.update();
    }

    get y() {
        return this._y;
    }

    set y(val) {
        if (val === this._y) return;
        this._y = val;
        this.update();
    }

    get borderRadius() {
        return this._borderRadius * devicePixelRatio;
    }

    set borderRadius(val) {
        if (val === this._borderRadius) return;
        this._borderRadius = val;
        this.update();
    }

    update() {
        this.container.x = this.x;
        this.container.y = this.y;

        if (!this.placeItemsCenter) {
            this.content.x = this.paddingX;
            this.content.y = this.paddingY;
        } else {
            this.content.x = (this.width - this.content.width) / 2;
            this.content.y = (this.height - this.content.height) / 2;
        }

        this.background.clear().roundRect(0, 0, this.width, this.height, this.borderRadius).fill({ color: this.color, alpha: this.alpha });
    }
}

export class FlexBox {
    container;
    children = [];

    constructor() {
        this.container = new PIXI.Container();
        this._gap = 0;
        this._flexDirection = "column";
        this._justifyContent = "center";
    }

    addChild(...children) {
        this.children.push(...children);
        this.container.addChild(...children);
        this.update();
    }

    get gap() {
        return this._gap * devicePixelRatio;
    }

    set gap(val) {
        this._gap = val;
        this.update();
    }

    get flexDirection() {
        return this._flexDirection;
    }

    set flexDirection(val) {
        if (!["row", "column"].includes(val)) return;
        this._flexDirection = val;
        this.update();
    }

    get justifyContent() {
        return this._justifyContent;
    }

    set justifyContent(val) {
        this._justifyContent = val;
        this.update();
    }

    get width() {
        return this.container.width;
    }

    get height() {
        return this.container.height;
    }

    get x() {
        return this.container.x;
    }

    set x(val) {
        this.container.x = val;
    }

    get y() {
        return this.container.y;
    }

    set y(val) {
        this.container.y = val;
    }

    getLargestChildFactor(factor) {
        return Math.max(...this.children.map((child) => child[factor]));
    }

    update() {
        const _static = this.flexDirection === "column" ? "y" : "x";
        const dynamic = this.flexDirection === "column" ? "x" : "y";
        const plusfactor = this.flexDirection === "column" ? "width" : "height";
        const centerFactor = this.flexDirection === "column" ? "height" : "width";

        this.children.forEach((child, idx, arr) => {
            if (this.justifyContent === "center") child[_static] = Math.ceil((this.getLargestChildFactor(centerFactor) - child[centerFactor]) * 0.5);
            if (this.justifyContent === "start") child[_static] = 0;

            if (idx === 0) {
                child[dynamic] = 0;
                return;
            }

            child[dynamic] = arr[idx - 1][dynamic] + arr[idx - 1][plusfactor] + this.gap;
        });
    }
}

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

        this.CSSprite = new PIXI.Text({
            text: `CS ${this._CS}`,
            // renderMode: "html",
            style: this.style,
        });
        this.ARSprite = new PIXI.Text({
            text: `AR ${this._AR}`,
            // renderMode: "html",
            style: this.style,
        });
        this.ODSprite = new PIXI.Text({
            text: `OD ${this._OD}`,
            // renderMode: "html",
            style: this.style,
        });
        this.HPSprite = new PIXI.Text({
            text: `HP ${this._HP}`,
            // renderMode: "html",
            style: this.style,
        });
        this.SRSprite = new PIXI.Text({
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
        this.flex.addChild(this.CSSprite, this.ARSprite, this.ODSprite, this.HPSprite, this.srContainer.container);

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
