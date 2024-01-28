import * as PIXI from "pixi.js";

export class Text {
    constructor({ text, renderMode, style }) {
        this._text = text;

        this._sprite = new PIXI.Text({
            text: this.text,
            renderMode: renderMode ?? "canvas",
            style: style,
        });

        this._metrics = PIXI.CanvasTextMetrics.measureText(text, style);

        this._x = 0;
        this._y = 0;
    }

    get text() {
        return this._text;
    }

    set text(val) {
        if (this._text === val) return;
        
        this._text = val;
        this._sprite.text = val;
        this._metrics = PIXI.CanvasTextMetrics.measureText(val, this._sprite.style);
        this._resize();
    }

    get sprite() {
        return this._sprite;
    }

    get style() {
        return this._sprite.style;
    }

    get width() {
        return this._metrics.width;
    }

    get height() {
        return this._metrics.height;
    }

    get x() {
        return this._x;
    }

    set x(val) {
        if (this._x === val) return;
        this._x = val;
        this.update();
    }

    get y() {
        return this._y;
    }

    set y(val) {
        if (this._y === val) return;
        this._y = val;
        this.update();
    }

    _resize() {
        this._metrics = PIXI.CanvasTextMetrics.measureText(this.text, this.style);
    }

    update() {
        this._resize();
        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }
}
