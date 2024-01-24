import * as PIXI from "pixi.js";

export class Component {
    masterContainer;
    container;
    mask;
    paddingMask;

    constructor(x, y, w, h, color = 0x000000, alpha = 0, borderRadius = 0) {
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._borderRadius = borderRadius;
        this._color = color;
        this._alpha = alpha;
        this._padding = 0;
        this._borderBox = true;
        this.overflow = "hidden";

        this.masterContainer = new PIXI.Container();
        this.masterContainer.x = this._x;
        this.masterContainer.y = this._y;

        this.paddingMask = new PIXI.Graphics();
        this.masterContainer.addChild(this.paddingMask);
        this.masterContainer.mask = this.paddingMask;

        this.background = new PIXI.Graphics();
        this.masterContainer.addChild(this.background);

        this.container = new PIXI.Container();
        this.container.x = this._padding;
        this.container.y = this._padding;

        this.mask = new PIXI.Graphics();
        this.container.addChild(this.mask);
        this.container.mask = this.mask;

        this.container.eventMode = "static";

        this.masterContainer.addChild(this.container);
        this.masterContainer.eventMode = "dynamic";

        this.redraw();
    }

    get x() {
        return this._x;
    }

    set x(val) {
        if (val === this._x) return;
        this._x = val;
        this.updatePosition();
    }

    get y() {
        return this._y;
    }

    set y(val) {
        if (val === this._y) return;
        this._y = val;
        this.updatePosition();
    }

    get w() {
        return this._w;
    }

    set w(val) {
        if (val === this._w) return;

        this._w = val;
        this.redraw();
    }

    get h() {
        return this._h;
    }

    set h(val) {
        if (val === this._h) return;

        this._h = val;
        this.redraw();
    }

    get borderRadius() {
        return this._borderRadius * devicePixelRatio;
    }

    set borderRadius(val) {
        if (val === this._borderRadius) return;

        this._borderRadius = val;
        this.redraw();
    }

    get padding() {
        return this._padding * devicePixelRatio;
    }

    set padding(val) {
        if (val === this._padding) return;
        this._padding = val;

        this.updatePosition();
        this.redraw();
    }

    get borderBox() {
        return this._borderBox;
    }

    set borderBox(val) {
        if (val === this._borderBox) return;
        this._borderBox = val;
        this.redraw();
    }

    get color() {
        return this._color;
    }

    set color(val) {
        if (val === this._color) return;

        this._color = val;
        this.redraw();
    }

    get alpha() {
        return this._alpha;
    }

    set alpha(val) {
        if (val === this._alpha) return;

        this._alpha = val;
        this.redraw();
    }

    resize(w, h) {
        this._w = w ?? this._w;
        this._h = h ?? this._h;

        this.redraw();
    }

    updatePosition() {
        this.masterContainer.x = this._x;
        this.masterContainer.y = this._y;

        this.container.x = this._padding;
        this.container.y = this._padding;
    }

    redraw() {
        this.container.x = this.padding;
        this.container.y = this.padding;

        if (this.borderBox) {
            this.paddingMask.clear().roundRect(0, 0, this._w, this._h, this.borderRadius).fill({ color: 0x000000, alpha: 0.01 });
            this.background.clear().roundRect(0, 0, this._w, this._h, this.borderRadius).fill({ color: this._color, alpha: this._alpha });
            this.mask
                .clear()
                .roundRect(0, 0, this._w - this.padding * 2, this._h - this.padding * 2, 0)
                .fill({ color: 0x000000, alpha: 0.01 });

            return;
        }

        this.paddingMask
            .clear()
            .roundRect(0, 0, this._w + this.padding * 2, this._h + this.padding * 2, this.borderRadius)
            .fill({ color: 0x000000, alpha: 0.01 });
        this.background
            .clear()
            .roundRect(0, 0, this._w + this.padding * 2, this._h + this.padding * 2, this.borderRadius)
            .fill({ color: this._color, alpha: this._alpha });
        this.mask.clear().roundRect(0, 0, this._w, this._h, 0).fill({ color: 0x000000, alpha: 0.01 });

        if (this.overflow === "hidden") {
            this.container.mask = this.mask;
        }

        if (this.overflow === "visible") {
            this.container.mask = undefined;
        }
    }
}
