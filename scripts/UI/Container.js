import * as PIXI from "pixi.js";
import { Text } from "./Text";

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
        this._child = undefined;

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
        this._child = child;

        if (child instanceof Text) {
            this.content.addChild(child.sprite);
            return;
        }

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
        if (!this._width) return (this._child?.width ?? 0) + this.paddingX * 2;
        return this._width;
    }

    set width(val) {
        if (val === this._width) return;
        this._width = val;
        this.update();
    }

    get height() {
        if (!this._height) return (this._child?.height ?? 0) + this.paddingY * 2;
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
            this.content.x = (this.width - (this._child?.width ?? 0)) / 2;
            this.content.y = (this.height - (this._child?.height ?? 0)) / 2;
        }

        this.background.clear().roundRect(0, 0, this.width, this.height, this.borderRadius).fill({ color: this.color, alpha: this.alpha });
    }
}
