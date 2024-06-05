import { HitSound } from "./HitSound";
import { Beatmap } from "./Beatmap";
import { Clamp, binarySearchNearest } from "./Utils";
import * as PIXI from "pixi.js";
import * as TWEEN from "@tweenjs/tween.js";
import { Game } from "./Game";
import { Component } from "./WindowManager";

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

    static EMIT_CHANGE = false;

    constructor(timingPoint, idx) {
        this.timingPoint = timingPoint;
        this.idx = idx;
        this.graphics = new PIXI.Graphics();
        this.obj = new PIXI.Container();
        this.obj.y = 40 * devicePixelRatio * this.idx;
        this.obj.cullable = true;
        this.obj.eventMode = "none";

        this.marker = new PIXI.Graphics()
            .roundRect(
                90 * devicePixelRatio,
                5 * devicePixelRatio,
                TimingPanel.WIDTH - 105 * devicePixelRatio,
                30 * devicePixelRatio,
                5 * devicePixelRatio
            )
            .fill(0x1b1b1b);

        this.indicator = new PIXI.Graphics()
            .roundRect(95 * devicePixelRatio, 10 * devicePixelRatio, 5 * devicePixelRatio, 20 * devicePixelRatio, 5 * devicePixelRatio)
            .fill(this.timingPoint.beatstep ? 0xf5425a : 0x42f560);

        let currentTime = timingPoint.time;
        const isNeg = currentTime < 0;
        if (currentTime < 0) currentTime *= -1;

        const minute = Math.floor(currentTime / 60000);
        const second = Math.floor((currentTime - minute * 60000) / 1000);
        const mili = currentTime - minute * 60000 - second * 1000;

        const timestamp = `${isNeg ? "-" : ""}${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}:${mili
            .toFixed(0)
            .padStart(3, "0")}`;

        this.timestamp = new PIXI.Text({
            text: timestamp,
            // renderMode: "canvas",
            style: {
                fontFamily: "Torus",
                fontWeight: 400,
                fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
                fill: 0xffffff,
            },
        });

        this.timestamp.x = 10 * devicePixelRatio;
        this.timestamp.y = 20 * devicePixelRatio;
        this.timestamp.anchor.set(0, 0.5);

        this.value = new PIXI.Text({
            text: `${(timingPoint.beatstep ? 60000 / timingPoint.beatstep : timingPoint.svMultiplier).toFixed(2)}${
                timingPoint.beatstep ? " BPM" : "x"
            }`,
            // renderMode: "canvas",
            style: {
                fontFamily: "Torus",
                fontWeight: 500,
                fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
                fill: 0xffffff,
            },
        });

        this.value.x = 120 * devicePixelRatio;
        this.value.y = 20 * devicePixelRatio;
        this.value.anchor.set(0, 0.5);

        this.obj.addChild(this.graphics);
        this.obj.addChild(this.marker);
        this.obj.addChild(this.indicator);
        this.obj.addChild(this.timestamp);
        this.obj.addChild(this.value);
        // TimingPanel.stage.addChild(this.obj);

        this.sample = new PIXI.Text({
            text: `${HitSound.HIT_SAMPLES[timingPoint.sampleSet][0].toUpperCase()}${timingPoint.sampleIdx !== 0 ? ":C" + timingPoint.sampleIdx : ""}`,
            // renderMode: "canvas",
            style: {
                fontFamily: "Torus",
                fontWeight: 500,
                fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
                fill: 0xffffff,
            },
        });
        this.sample.x = 210 * devicePixelRatio;
        this.sample.y = 20 * devicePixelRatio;
        this.sample.anchor.set(0, 0.5);

        this.volume = new PIXI.Text({
            text: `${timingPoint.sampleVol}%`,
            // renderMode: "canvas",
            style: {
                fontFamily: "Torus",
                fontWeight: 500,
                fontSize: TimingPoint.FONT_SIZE * devicePixelRatio,
                fill: 0xffffff,
            },
        });
        this.volume.x = 270 * devicePixelRatio;
        this.volume.y = 20 * devicePixelRatio;
        this.volume.anchor.set(0, 0.5);

        this.obj.addChild(this.sample);
        this.obj.addChild(this.volume);
    }

    changeColor() {
        const bg = Game.COLOR_PALETTES.primary4;
        const bgDark = Game.COLOR_PALETTES.primary1;
        const accent = Game.COLOR_PALETTES.accent1;

        this.marker
            .clear()
            .roundRect(
                90 * devicePixelRatio,
                5 * devicePixelRatio,
                TimingPanel.WIDTH - 105 * devicePixelRatio,
                30 * devicePixelRatio,
                5 * devicePixelRatio
            )
            .fill(this.timingPoint.isKiai ? accent : bg);

        this.value.style.fill = this.timingPoint.isKiai ? bgDark : 0xffffff;
        this.sample.style.fill = this.timingPoint.isKiai ? bgDark : 0xffffff;
        this.volume.style.fill = this.timingPoint.isKiai ? bgDark : 0xffffff;
    }

    resize() {
        this.changeColor();

        if (Game.DEVE_RATIO !== devicePixelRatio) {
            this.indicator
                .clear()
                .roundRect(95 * devicePixelRatio, 10 * devicePixelRatio, 5 * devicePixelRatio, 20 * devicePixelRatio, 5 * devicePixelRatio)
                .fill(this.timingPoint.beatstep ? 0xf5425a : 0x42f560);

            this.timestamp.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
            this.timestamp.x = 10 * devicePixelRatio;
            this.timestamp.y = 20 * devicePixelRatio;

            this.value.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
            this.value.x = 120 * devicePixelRatio;
            this.value.y = 20 * devicePixelRatio;

            this.sample.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
            this.sample.x = 210 * devicePixelRatio;
            this.sample.y = 20 * devicePixelRatio;

            this.volume.style.fontSize = TimingPoint.FONT_SIZE * devicePixelRatio;
            this.volume.x = 270 * devicePixelRatio;
            this.volume.y = 20 * devicePixelRatio;

            this.obj.y = 40 * devicePixelRatio * this.idx - TimingPanel.SCROLLED;
        }
    }

    update() {
        this.obj.y = 40 * devicePixelRatio * this.idx - TimingPanel.SCROLLED;

        this.graphics.clear();

        if (this.idx === TimingPanel.CURRENT_SV_IDX) {
            const bg = Game.COLOR_PALETTES.primary5;

            this.graphics.roundRect(0, 0, TimingPanel.WIDTH - 10 * devicePixelRatio, 40 * devicePixelRatio, 5 * devicePixelRatio).fill(bg);
        }
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

    static CURRENT_SV_IDX = 0;

    static MASTER_CONTAINER;
    static SIZE_Y = 0;
    static ON_ANIM = false;

    static init() {
        this.MASTER_CONTAINER = new Component(0, 70, 370 * window.devicePixelRatio, Game.APP.renderer.height - 100);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        this.MASTER_CONTAINER.padding = 15;
        this.MASTER_CONTAINER.alpha = 1;
        this.MASTER_CONTAINER.borderRadius = 10;

        this.WIDTH = this.MASTER_CONTAINER.w;
        this.HEIGHT = this.MASTER_CONTAINER.h;

        this._size_x = 0;

        this.stage = this.MASTER_CONTAINER.container;
        this.stage.hitArea = new PIXI.Rectangle(0, 0, this.WIDTH, this.HEIGHT);

        this.stage.on("wheel", (e) => {
            let scrolled = this.SCROLLED;
            scrolled = Clamp(scrolled + e.deltaY, 0, this.MAX_HEIGHT - this.HEIGHT);

            const tween = new TWEEN.Tween({ scrolled: this.SCROLLED }, false)
                .to({ scrolled }, 100)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((object) => {
                    this.SCROLLED = object.scrolled;
                    this.EMIT_CHANGE = true;
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

        this.forceResize();
        this.forceUpdate();

        // globalThis.__PIXI_RENDERER__ = this.renderer;
        // globalThis.__PIXI_STAGE__ = this.stage;
    }

    static scrollTo(timestamp) {
        if (!Game.BEATMAP_FILE?.beatmapRenderData?.objectsController) return;

        let foundIndex = binarySearchNearest(this.POINTS, timestamp, (point, time) => {
            if (point.timingPoint.time < time) return -1;
            if (point.timingPoint.time > time) return 1;
            return 0;
        });

        while (foundIndex > 0 && this.POINTS[foundIndex].timingPoint.time > timestamp) foundIndex--;

        this.CURRENT_SV_IDX = foundIndex;

        let rate = this.SCROLLED;
        if (40 * devicePixelRatio * foundIndex - this.SCROLLED < 0) rate = 40 * devicePixelRatio * foundIndex;
        if (40 * devicePixelRatio * foundIndex - this.SCROLLED > this.HEIGHT - 40 * devicePixelRatio)
            rate = 40 * devicePixelRatio * foundIndex - (this.HEIGHT - 40 * devicePixelRatio);

        this.forceUpdate();

        if (rate === this.SCROLLED) return;

        const tween = new TWEEN.Tween({ rate: this.SCROLLED }, false)
            .to({ rate }, 50)
            .easing(TWEEN.Easing.Quintic.Out)
            .onUpdate((object) => {
                this.SCROLLED = object.rate;
                this.EMIT_CHANGE = true;
            })
            .start();

        tween.onComplete = () => TWEEN.remove(tween);
        TWEEN.add(tween);
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

        if (this.SCROLLED - deltaY > this.MAX_HEIGHT - this.HEIGHT || this.SCROLLED - deltaY < 0) {
            window.scrollBy(0, -deltaY / devicePixelRatio);
        }

        this.SCROLLED = Clamp(this.SCROLLED - deltaY, 0, this.MAX_HEIGHT - this.HEIGHT);
        this.EMIT_CHANGE = true;

        const deltaT = performance.now() - this.TOUCH_LAST_TIMESTAMP;

        if (deltaT !== 0) this.TOUCH_VELOCITY = deltaY / deltaT;

        this.TOUCH_LAST_TIMESTAMP = performance.now();
    }

    static handleTouchUp(e) {
        this.IS_TOUCHING = false;

        const currentTimestamp = performance.now();
        this.TOUCH_VELOCITY = this.TOUCH_VELOCITY * Clamp(1 - (currentTimestamp - this.TOUCH_LAST_TIMESTAMP) / 200, 0, 1);

        const predicted = this.TOUCH_VELOCITY * 300;
        const startScroll = this.SCROLLED;
        
        let previousScroll = 0;
        this.TOUCH_TWEEN = new TWEEN.Tween({ predicted: 0 }, false)
            .to({ predicted: predicted }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate((object) => {
                this.SCROLLED = Clamp(startScroll - object.predicted, 0, this.MAX_HEIGHT - this.HEIGHT);
                this.EMIT_CHANGE = true;

                if (startScroll - object.predicted > this.MAX_HEIGHT - this.HEIGHT || startScroll - object.predicted < 0) {
                    window.scrollBy(0, -(object.predicted - previousScroll));
                }

                previousScroll = object.predicted;
            })
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
        this.EMIT_CHANGE = true;
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
            .roundRect(0, 0, 5 * devicePixelRatio, this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT))
            .fill({ color: 0xaaaaaa, alpha: this.MAX_HEIGHT <= this.HEIGHT ? 0 : 1 });
        this.POINTS = [];
        this.SCROLLED = 0;
        Beatmap.timingPointsList.forEach((point, idx) => {
            const p = new TimingPoint(point, idx);
            this.POINTS.push(p);
        });
    }

    static get SIZE_X() {
        return this._size_x;
    }

    static set SIZE_X(val) {
        this._size_x = val;
        this.EMIT_CHANGE = true;
    }

    static forceResize() {
        if (innerWidth / innerHeight < 1) {
            if (Game.SHOW_TIMING_PANEL && !this.ON_ANIM) this.SIZE_X = Game.WRAPPER.h * 0.75;

            this.MASTER_CONTAINER.x = 0;
            this.MASTER_CONTAINER.y = Game.APP.renderer.height - Game.WRAPPER.h * 0.75 * (this.SIZE_X / (Game.WRAPPER.h * 0.75));
            this.MASTER_CONTAINER.w = Game.APP.renderer.width;
            this.MASTER_CONTAINER.h = this.SIZE_X;

            this.scrollTo(Game.BEATMAP_FILE?.audioNode?.getCurrentTime() ?? 0);
        } else {
            if (Game.SHOW_TIMING_PANEL && !this.ON_ANIM) this.SIZE_X = 400 * devicePixelRatio;

            this.MASTER_CONTAINER.x = Game.APP.renderer.width - this.SIZE_X;
            this.MASTER_CONTAINER.y = !Game.IS_FULLSCREEN ? 70 * devicePixelRatio : 0;
            this.MASTER_CONTAINER.w = 400 * devicePixelRatio;
            this.MASTER_CONTAINER.h = Game.APP.renderer.height - (!Game.IS_FULLSCREEN ? 70 * devicePixelRatio : 0) - this.SIZE_Y * devicePixelRatio;

            if (Game.IS_FULLSCREEN) this.MASTER_CONTAINER.borderRadius = 0;
            else this.MASTER_CONTAINER.borderRadius = 10;
        }

        this.MASTER_CONTAINER.redraw();

        // }

        if (this.MASTER_CONTAINER.color !== Game.COLOR_PALETTES.primary3) this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        if (
            this.WIDTH === this.MASTER_CONTAINER.w - this.MASTER_CONTAINER.padding * 2 &&
            this.HEIGHT === this.MASTER_CONTAINER.h - this.MASTER_CONTAINER.padding * 2 &&
            Game.DEVE_RATIO === devicePixelRatio
        )
            return;

        this.EMIT_CHANGE = true;

        this.WIDTH = this.MASTER_CONTAINER.w - this.MASTER_CONTAINER.padding * 2;
        this.HEIGHT = this.MASTER_CONTAINER.h - this.MASTER_CONTAINER.padding * 2;
        // this.renderer.resize(this.WIDTH, this.HEIGHT);

        this.stage.hitArea = new PIXI.Rectangle(0, 0, this.WIDTH, this.HEIGHT);

        this.MAX_HEIGHT = 40 * devicePixelRatio * Beatmap.timingPointsList.length;

        this.scrollbar
            .clear()
            .roundRect(0, 0, 5 * devicePixelRatio, this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT))
            .fill({ color: 0xaaaaaa, alpha: this.MAX_HEIGHT <= this.HEIGHT ? 0 : 1 });

        if (Game.DEVE_RATIO !== devicePixelRatio) {
            this.POINTS.forEach((point) => point.resize());
        }
    }

    static resize() {
        // if (innerWidth / innerHeight < 1) {
        //     this.MASTER_CONTAINER.x = 0;
        //     this.MASTER_CONTAINER.y = Game.WRAPPER.h * 0.3;
        //     this.MASTER_CONTAINER.w = Game.WRAPPER.w;
        //     this.MASTER_CONTAINER.h = Game.WRAPPER.h * 0.7;
        // } else {
        if (Game.EMIT_STACK.length === 0) return;
        this.forceResize();
        // this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
    }

    static forceUpdate() {
        if (!Game.SHOW_TIMING_PANEL) return;
        this.stage.removeChildren();
        this.stage.addChild(this.MASTER_CONTAINER.mask);

        let idx = Math.floor(this.SCROLLED / (40 * devicePixelRatio));
        while (idx < this.POINTS.length && 40 * devicePixelRatio * idx - this.SCROLLED < this.HEIGHT) {
            if (idx < 0) {
                idx++;
                continue;
            }

            const point = this.POINTS[idx++];

            this.stage.addChild(point.obj);
            point.resize();
            point.update();
        }

        this.stage.addChild(this.scrollbar);

        this.scrollbar.x = this.WIDTH - 5 * devicePixelRatio;
        this.scrollbar.y = (this.HEIGHT - this.HEIGHT * (this.HEIGHT / this.MAX_HEIGHT)) * (this.SCROLLED / (this.MAX_HEIGHT - this.HEIGHT));
    }

    static update(time) {
        this.resize();
        if (!this.EMIT_CHANGE) return;
        this.forceUpdate();
        this.EMIT_CHANGE = false;
    }
}
