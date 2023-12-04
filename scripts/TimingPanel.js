import { HitSound } from "./HitSound";
import { Beatmap } from "./Beatmap";
import { Clamp, binarySearchNearest } from "./Utils";
import * as PIXI from "pixi.js";
import * as TWEEN from "@tweenjs/tween.js";

class TimingPoint {
    obj;
    marker;
    indicator;
    timingPoint;

    time;
    value;
    sample;
    volume;

    idx;

    static FONT_SIZE = 13;

    constructor(timingPoint, idx) {
        this.timingPoint = timingPoint;
        this.idx = idx;
        this.obj = new PIXI.Container();
        this.obj.y = 40 * devicePixelRatio * this.idx;
        this.obj.cullable = true;
        this.obj.eventMode = "none";

        this.marker = new PIXI.Graphics()
            .beginFill(0x1b1b1b)
            .drawRoundedRect(
                90 * devicePixelRatio,
                5 * devicePixelRatio,
                TimingPanel.WIDTH - 95 * devicePixelRatio,
                30 * devicePixelRatio,
                5 * devicePixelRatio
            );

        this.indicator = new PIXI.Graphics()
            .beginFill(this.timingPoint.beatstep ? 0xf5425a : 0x42f560)
            .drawRoundedRect(95 * devicePixelRatio, 10 * devicePixelRatio, 5 * devicePixelRatio, 20 * devicePixelRatio, 5 * devicePixelRatio);

        let currentTime = timingPoint.time;
        const isNeg = currentTime < 0;
        if (currentTime < 0) currentTime *= -1;

        const minute = Math.floor(currentTime / 60000);
        const second = Math.floor((currentTime - minute * 60000) / 1000);
        const mili = currentTime - minute * 60000 - second * 1000;

        const timestamp = `${isNeg ? "-" : ""}${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}:${mili
            .toFixed(0)
            .padStart(3, "0")}`;

        this.timestamp = new PIXI.Text(timestamp, {
            fontFamily: "Torus",
            fontWeight: 400,
            fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
            fill: 0xffffff,
        });

        this.timestamp.x = 10 * devicePixelRatio;
        this.timestamp.y = 20 * devicePixelRatio;
        this.timestamp.anchor.set(0, 0.5);

        this.value = new PIXI.Text(
            `${(timingPoint.beatstep ? 60000 / timingPoint.beatstep : timingPoint.svMultiplier).toFixed(2)}${timingPoint.beatstep ? " BPM" : "x"}`,
            {
                fontFamily: "Torus",
                fontWeight: 500,
                fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
                fill: 0xffffff,
            }
        );

        this.value.x = 120 * devicePixelRatio;
        this.value.y = 20 * devicePixelRatio;
        this.value.anchor.set(0, 0.5);

        this.obj.addChild(this.marker);
        this.obj.addChild(this.indicator);
        this.obj.addChild(this.timestamp);
        this.obj.addChild(this.value);
        // TimingPanel.stage.addChild(this.obj);

        this.sample = new PIXI.Text(
            `${HitSound.HIT_SAMPLES[timingPoint.sampleSet][0].toUpperCase()}${timingPoint.sampleIdx !== 0 ? ":C" + timingPoint.sampleIdx : ""}`,
            {
                fontFamily: "Torus",
                fontWeight: 500,
                fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
                fill: 0xffffff,
            }
        );
        this.sample.x = 210 * devicePixelRatio;
        this.sample.y = 20 * devicePixelRatio;
        this.sample.anchor.set(0, 0.5);

        this.volume = new PIXI.Text(`${timingPoint.sampleVol}%`, {
            fontFamily: "Torus",
            fontWeight: 500,
            fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
            fill: 0xffffff,
        });
        this.volume.x = 280 * devicePixelRatio;
        this.volume.y = 20 * devicePixelRatio;
        this.volume.anchor.set(0, 0.5);

        this.obj.addChild(this.sample);
        this.obj.addChild(this.volume);
    }

    changeColor() {
        const rootCSS = document.querySelector(":root");
        const bg = parseInt(rootCSS.style.getPropertyValue("--primary-4").slice(1), 16);

        this.marker
            .clear()
            .beginFill(bg)
            .drawRoundedRect(
                90 * devicePixelRatio,
                5 * devicePixelRatio,
                TimingPanel.WIDTH - 95 * devicePixelRatio,
                30 * devicePixelRatio,
                5 * devicePixelRatio
            );
    }

    resize() {
        this.changeColor();

        this.indicator
            .clear()
            .beginFill(this.timingPoint.beatstep ? 0xf5425a : 0x42f560)
            .drawRoundedRect(95 * devicePixelRatio, 10 * devicePixelRatio, 5 * devicePixelRatio, 20 * devicePixelRatio, 5 * devicePixelRatio);

        this.timestamp.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
        this.timestamp.x = 10 * devicePixelRatio;
        this.timestamp.y = 20 * devicePixelRatio;

        this.value.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
        this.value.x = 120 * devicePixelRatio;
        this.value.y = 20 * devicePixelRatio;

        this.obj.y = 40 * devicePixelRatio * this.idx - TimingPanel.SCROLLED;

        this.sample.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
        this.sample.x = 210 * devicePixelRatio;
        this.sample.y = 20 * devicePixelRatio;

        this.volume.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
        this.volume.x = 280 * devicePixelRatio;
        this.volume.y = 20 * devicePixelRatio;
    }

    update() {
        this.obj.y = 40 * devicePixelRatio * this.idx - TimingPanel.SCROLLED;
    }
}

export class TimingPanel {
    static renderer;
    static stage;
    static scrollbar;

    static WIDTH;
    static HEIGHT;

    static POINTS = [];
    static SCROLL_RATE = 0;

    static SCROLLED = 0;
    static MAX_HEIGHT = 0;

    static TWEEN_LIST = [];

    static IS_DRAGGING = false;
    static START_Y = -1;
    static DELTA_Y_LOCAL = 0;

    static IS_TOUCHING = false;
    static START_Y_TOUCH = -1;
    static TOUCH_VELOCITY = 0;
    static TOUCH_LAST_TIMESTAMP = 0;
    static TOUCH_TWEEN = null;

    static init() {
        const { width, height } = getComputedStyle(document.querySelector(".timingPanel"));

        this.WIDTH = parseInt(width) * window.devicePixelRatio;
        this.HEIGHT = parseInt(height) * window.devicePixelRatio;

        this.renderer = new PIXI.Renderer({
            width: this.WIDTH,
            height: this.HEIGHT,
            backgroundColor: 0xffffff,
            backgroundAlpha: 0,
            antialias: true,
            autoDensity: true,
        });
        document.querySelector(".timingPanel").append(this.renderer.view);
        this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;

        this.stage = new PIXI.Container();
        this.stage.hitArea = new PIXI.Rectangle(0, 0, this.WIDTH, this.HEIGHT);

        this.stage.on("wheel", (e) => {
            let scrolled = this.SCROLLED;
            scrolled = Clamp(scrolled + e.deltaY, 0, this.MAX_HEIGHT - this.HEIGHT);

            const tween = new TWEEN.Tween({ scrolled: this.SCROLLED }, false)
                .to({ scrolled }, 100)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((object) => {
                    this.SCROLLED = object.scrolled;
                })
                .start();

            tween.onComplete = () => TWEEN.remove(tween);
            TWEEN.add(tween);
        });

        this.stage.eventMode = "static";
        this.stage.on("touchstart", (e) => this.handleTouchDown(e));
        this.stage.on("globaltouchmove", (e) => this.handleTouchMove(e));
        this.stage.on("touchend", (e) => this.handleTouchUp(e));
        this.stage.on("touchendoutside", (e) => this.handleTouchUp(e));

        this.scrollbar = new PIXI.Graphics();

        this.scrollbar.eventMode = "static";
        this.scrollbar.on("mousedown", (e) => this.handleMouseDown(e));
        this.scrollbar.on("globalmousemove", (e) => this.handleMouseMove(e));
        this.scrollbar.on("mouseup", (e) => this.handleMouseUp(e));
        this.scrollbar.on("mouseupoutside", (e) => this.handleMouseUp(e));

        this.stage.addChild(this.scrollbar);

        globalThis.__PIXI_RENDERER__ = this.renderer;
        globalThis.__PIXI_STAGE__ = this.stage;
    }

    static handleTouchDown(e) {
        this.IS_TOUCHING = true;
        this.START_Y_TOUCH = e.global.y;
        this.TOUCH_LAST_TIMESTAMP = performance.now();

        if (this.TOUCH_TWEEN) this.TOUCH_TWEEN.stop();
    }

    static handleTouchMove(e) {
        if (!this.IS_TOUCHING) return;

        const deltaY = e.global.y - this.START_Y_TOUCH;

        this.START_Y_TOUCH = e.global.y;
        this.SCROLLED = Clamp(this.SCROLLED - deltaY, 0, this.MAX_HEIGHT - this.HEIGHT);

        this.TOUCH_VELOCITY = deltaY / (performance.now() - this.TOUCH_LAST_TIMESTAMP);
        this.TOUCH_LAST_TIMESTAMP = performance.now();
    }

    static handleTouchUp(e) {
        this.IS_TOUCHING = false;

        const predicted = this.TOUCH_VELOCITY * 200;
        this.TOUCH_TWEEN = new TWEEN.Tween({ predicted: this.SCROLLED }, false)
            .to({ predicted: Clamp(this.SCROLLED - predicted, 0, this.MAX_HEIGHT - this.HEIGHT) }, 200)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate((object) => (this.SCROLLED = object.predicted))
            .start();

        this.TOUCH_TWEEN.onComplete = () => {
            TWEEN.remove(this.TOUCH_TWEEN);
            this.TOUCH_TWEEN = null;
        };

        this.TOUCH_TWEEN.onStop = () => {
            TWEEN.remove(this.TOUCH_TWEEN);
            this.TOUCH_TWEEN = null;
        };

        TWEEN.add(this.TOUCH_TWEEN);

        this.START_Y_TOUCH = -1;
        this.TOUCH_VELOCITY = 0;
        this.TOUCH_LAST_TIMESTAMP = 0;
    }

    static handleMouseDown(e) {
        this.IS_DRAGGING = true;
        this.START_Y = e.global.y;
        this.DELTA_Y_LOCAL = this.scrollbar.toLocal(e.global).y;
    }

    static handleMouseMove(e) {
        if (!this.IS_DRAGGING) return;
        const deltaY =
            ((e.global.y - this.START_Y) / (this.HEIGHT - this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT))) * (this.MAX_HEIGHT - this.HEIGHT);

        const scrollBarHeight = this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT);
        this.START_Y = Clamp(e.global.y, this.DELTA_Y_LOCAL, this.HEIGHT + this.DELTA_Y_LOCAL - scrollBarHeight);

        this.SCROLLED = Clamp(this.SCROLLED + deltaY, 0, this.MAX_HEIGHT - this.HEIGHT);
    }

    static handleMouseUp(e) {
        this.IS_DRAGGING = false;
        this.START_Y = -1;
        this.DELTA_Y_LOCAL = 0;
    }

    static initTimingPoints() {
        this.MAX_HEIGHT = 40 * devicePixelRatio * Beatmap.timingPointsList.length;
        this.scrollbar
            .clear()
            .beginFill(0xaaaaaa)
            .drawRoundedRect(0, 0, 5 * devicePixelRatio, this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT));
        Beatmap.timingPointsList.forEach((point, idx) => {
            this.POINTS.push(new TimingPoint(point, idx));
        });
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

        this.stage.hitArea = new PIXI.Rectangle(0, 0, this.WIDTH, this.HEIGHT);
        this.MAX_HEIGHT = 40 * devicePixelRatio * Beatmap.timingPointsList.length;

        this.scrollbar
            .clear()
            .beginFill(0xeeeeee)
            .drawRoundedRect(0, 0, 5 * devicePixelRatio, this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT));

        this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
    }

    static update(time) {
        this.resize();

        this.stage.removeChildren();

        let idx = Math.floor(TimingPanel.SCROLLED / (40 * devicePixelRatio));
        while (idx < this.POINTS.length && 40 * devicePixelRatio * idx - TimingPanel.SCROLLED < this.HEIGHT) {
            const point = this.POINTS[idx++];

            this.stage.addChild(point.obj);
            point.resize();
            point.update();
        }

        this.stage.addChild(this.scrollbar);
        this.scrollbar.x = this.WIDTH - 5 * devicePixelRatio;
        this.scrollbar.y = (this.HEIGHT - this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT)) * (this.SCROLLED / (this.MAX_HEIGHT - this.HEIGHT));

        this.renderer.render(this.stage);
    }
}
