import * as PIXI from "pixi.js"

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
