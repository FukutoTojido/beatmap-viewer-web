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
        this.masterContainer.on("mousedown", () => {
            console.log("ALI")
        })

        this.redraw();
    }

    get x() {
        return this._x;
    }

    set x(val) {
        this._x = val;
        this.updatePosition();
    }

    get y() {
        return this._y;
    }

    set y(val) {
        this._y = val;
        this.updatePosition();
    }

    get w() {
        return this._w;
    }

    set w(val) {
        this._w = val;
        this.redraw();
    }

    get h() {
        return this._h;
    }

    set h(val) {
        this._h = val;
        this.redraw();
    }

    get borderRadius() {
        return this._borderRadius;
    }

    set borderRadius(val) {
        this._borderRadius = val;
        this.redraw();
    }

    get padding() {
        return this._padding;
    }

    set padding(val) {
        this._padding = val;

        this.updatePosition();
        this.redraw();
    }

    get color() {
        return this._color;
    }

    set color(val) {
        this._color = val;
        this.redraw();
    }

    get alpha() {
        return this._alpha;
    }

    set alpha(val) {
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
        this.paddingMask
            .clear()
            .beginFill(0x000000, 0.01)
            .drawRoundedRect(0, 0, this._w + this._padding * 2, this._h + this._padding * 2, this._borderRadius);
        this.background
            .clear()
            .beginFill(this._color, this._alpha)
            .drawRoundedRect(0, 0, this._w + this._padding * 2, this._h + this._padding * 2, this._borderRadius);
        this.mask.clear().beginFill(0x000000, 0.01).drawRoundedRect(0, 0, this._w, this._h, 0);
    }
}
