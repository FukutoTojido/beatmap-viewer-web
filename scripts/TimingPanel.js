import * as PIXI from "pixi.js";

class TimingPoint {
    
}

export class TimingPanel {
    static renderer;
    static stage;

    static WIDTH;
    static HEIGHT;

    static init() {
        const { width, height } = getComputedStyle(document.querySelector(".timingPanel"));

        this.WIDTH = parseInt(width) * window.devicePixelRatio;
        this.HEIGHT = parseInt(height) * window.devicePixelRatio;

        this.renderer = new PIXI.Renderer({
            width: this.WIDTH,
            height: this.HEIGHT,
            backgroundColor: 0x88c0d0,
            // backgroundAlpha: 0,
            antialias: true,
            autoDensity: true,
        });
        document.querySelector(".timingPanel").append(this.renderer.view);
        this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;

        this.stage = new PIXI.Container();
    }

    static resize() {
        let { width, height } = getComputedStyle(document.querySelector(".timingPanel"));

        width = parseInt(width) * window.devicePixelRatio;
        height = parseInt(height) * window.devicePixelRatio;

        if (width === 0) width = parseInt(getComputedStyle(document.querySelector("body")).width) * window.devicePixelRatio;

        if (this.WIDTH === width && this.HEIGHT === height) return;

        this.WIDTH = width;
        this.HEIGHT = height;
        this.renderer.resize(this.WIDTH, this.HEIGHT);

        this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
    }

    static update(time) {
        this.resize();
    }
}
