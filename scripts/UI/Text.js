import * as PIXI from "pixi.js";

export class Text {
    constructor({ text, style }) {
        this._text = text;

        this._sprite = new PIXI.Text({
            text: this.text,
            style: style,
        });

        this._metrics = PIXI.CanvasTextMetrics.measureText(text, style);
    }

    get text() {
        return this._text;
    }

    set text(val) {
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

    _resize() {
        this._metrics = PIXI.CanvasTextMetrics.measureText(this.text, this.style);
    }

    update() {
        this._resize();
    }
}
