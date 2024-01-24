import { Beatmap } from "./Beatmap.js";
import { Clamp } from "./Utils.js";
import { setAudioTime } from "./ProgressBar.js";
import { Game } from "./Game.js";
import * as PIXI from "pixi.js";
import { Component } from "./WindowManager.js";
import { PlayContainer } from "./PlayButtons.js";

export class ProgressBar {
    static renderer;
    static stage;
    static container;
    static line;
    static thumb;
    static timeline;
    static timelineObjs = [];

    static WIDTH;
    static HEIGHT;

    static TIMELINE_WIDTH;
    static TIMELINE_HEIGHT;

    static PERCENTAGE = 0;
    static IS_DRAGGING = false;
    static IS_HOVERING = false;

    static initLine() {
        this.line = new PIXI.Graphics()
            .setStrokeStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                color: 0x88c0d0,
            })
            .moveTo(0, this.HEIGHT / 2)
            .lineTo(this.WIDTH - 80 * window.devicePixelRatio, this.HEIGHT / 2)
            .stroke();
    }

    static initThumb() {
        this.thumb = new PIXI.Graphics()
            .setStrokeStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                alignment: 0,
                color: 0x88c0d0,
            })
            .roundRect(
                -20 * window.devicePixelRatio,
                -5 * window.devicePixelRatio,
                40 * window.devicePixelRatio,
                10 * window.devicePixelRatio,
                10 * window.devicePixelRatio
            )
            .fill(0x171a1f).stroke()
            .setStrokeStyle()
            .circle(0, 0, 2)
            .fill(0x88c0d0);
        this.thumb.y = this.HEIGHT / 2;

        // this.thumb.interactive = true;
        this.thumb.eventMode = "static";

        this.thumb.on("mouseenter", (e) => {
            this.restyle(true);
        });

        this.thumb.on("mouseleave", (e) => {
            if (!this.IS_DRAGGING) this.restyle();
        });
    }

    static initContainer() {
        this.container = new PIXI.Container();

        this.container.addChild(this.line);
        this.container.addChild(this.thumb);
        this.container.x = 40 * window.devicePixelRatio;
        this.container.hitArea = new PIXI.Rectangle(-40 * window.devicePixelRatio, 0, this.WIDTH, this.HEIGHT);
        // this.container.interactive = true;
        this.container.eventMode = "static";

        this.container.on("mousedown", (e) => {
            this.handleMouseDown(e);
        });
        this.container.on("mousemove", (e) => {
            this.handleMouseMove(e);
        });
        this.container.on("mouseup", (e) => {
            this.handleMouseUp(e);
        });
        this.container.on("mouseleave", (e) => {
            if (!this.IS_DRAGGING) return;
            this.handleMouseUp(e);
        });

        this.container.on("touchstart", (e) => {
            this.handleMouseDown(e);
        });
        this.container.on("touchmove", (e) => {
            this.handleMouseMove(e);
        });
        this.container.on("touchend", (e) => {
            this.handleMouseUp(e);
        });

        this.stage.addChild(this.container);
    }

    static initTimingPoints() {
        this.timeline.clear();
        this.timeline.x = 40 * devicePixelRatio;
        this.timeline.y = 10 * devicePixelRatio;

        if (!Game.BEATMAP_FILE?.audioNode) return;

        const fullTime = Game.BEATMAP_FILE.audioNode.duration;
        const width = this.WIDTH - 80 * window.devicePixelRatio;
        const height = this.HEIGHT / 2 - 10 * devicePixelRatio;

        Beatmap.timingPointsList
            .toSorted((a, b) => {
                if (a.time > b.time) return 1;
                if (a.time < b.time) return -1;
                if (a.beatstep) return 1;
                if (b.beatstep) return -1;
                return 0;
            })
            .forEach((point, idx, arr) => {
                const x = (point.time / fullTime) * width;
                const xNext = ((arr[idx + 1]?.time ?? Game.BEATMAP_FILE.audioNode.duration) / fullTime) * width;

                this.timeline
                    .setStrokeStyle({
                        width: 1 * devicePixelRatio,
                        color: point.beatstep ? 0xf5425a : 0x42f560,
                        alpha: 0.6,
                    })
                    .moveTo(x, 0)
                    .lineTo(x, height).stroke();

                if (!point.isKiai) return;

                this.timeline
                    .setStrokeStyle({
                        alpha: 0
                    })
                    .rect(x, height / 2, xNext - x, height)
                    .fill({ color: 0xf58d42, alpha: 0.4 }).stroke();
            });
    }

    static init() {
        this.WIDTH = Game.MASTER_CONTAINER.w - (110 + 360 + 60) * devicePixelRatio;
        this.HEIGHT = 60 * devicePixelRatio;

        this.MASTER_CONTAINER = new Component((110 + 360 + 60) * devicePixelRatio, Game.WRAPPER.h - 60 * devicePixelRatio, this.WIDTH, this.HEIGHT);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary1;
        this.MASTER_CONTAINER.alpha = 1;

        this.stage = this.MASTER_CONTAINER.container;

        this.timeline = new PIXI.Graphics();
        this.timeline.x = 40 * devicePixelRatio;
        this.timeline.y = 10 * devicePixelRatio;
        this.stage.addChildAt(this.timeline, 0);

        this.initLine();
        this.initThumb();
        this.initContainer();
    }

    static handleMouseDown(e) {
        this.IS_DRAGGING = true;

        let { x } = this.container.toLocal(e.global);
        let width = this.WIDTH - 80 * window.devicePixelRatio;

        const percentage = Clamp(x / width, 0, 1);
        setAudioTime(percentage);

        this.restyle(true);
    }

    static handleMouseMove(e) {
        if (!this.IS_DRAGGING) return;

        let { x } = this.container.toLocal(e.global);
        let width = this.WIDTH - 80 * window.devicePixelRatio;

        const percentage = Clamp(x / width, 0, 1);
        setAudioTime(percentage);
    }

    static handleMouseUp(e) {
        this.IS_DRAGGING = false;
        this.restyle();
    }

    static resize() {
        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.x = 0;
            this.MASTER_CONTAINER.y = PlayContainer.MASTER_CONTAINER.y + PlayContainer.MASTER_CONTAINER.height;
            this.MASTER_CONTAINER.w = Game.WRAPPER.w;
        } else {
            this.MASTER_CONTAINER.x = (110 + 360 + 60) * devicePixelRatio;
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60 * devicePixelRatio;
            this.MASTER_CONTAINER.w = Game.MASTER_CONTAINER.w - (110 + 360 + 60) * devicePixelRatio;
        }

        this.MASTER_CONTAINER.h = 60 * devicePixelRatio;

        // let { width, height } = getComputedStyle(document.querySelector(".progressBarContainer"));

        const width = this.MASTER_CONTAINER.w;
        const height = this.MASTER_CONTAINER.h;

        // if (width === 0) width = parseInt(getComputedStyle(document.querySelector("body")).width) * window.devicePixelRatio;

        if (this.WIDTH === width && this.HEIGHT === height) return;

        this.WIDTH = width;
        this.HEIGHT = height;
        // this.renderer.resize(this.WIDTH, this.HEIGHT);

        // this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
        this.restyle();
        this.initTimingPoints();

        this.thumb.y = this.HEIGHT / 2;

        this.container.x = 40 * window.devicePixelRatio;
        this.container.hitArea = new PIXI.Rectangle(-40 * window.devicePixelRatio, 0, this.WIDTH, this.HEIGHT);
    }

    static restyle(isHover) {
        let bgColor = Game.COLOR_PALETTES.primary1;
        let accentColor = Game.COLOR_PALETTES.accent1;

        if (!bgColor) bgColor = 0x171a1f;
        if (!accentColor) accentColor = 0x88c0d0;

        this.line
            .clear()
            .setStrokeStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                color: accentColor,
            })
            .moveTo(0, this.HEIGHT / 2)
            .lineTo(this.WIDTH - 80 * window.devicePixelRatio, this.HEIGHT / 2).stroke();

        this.thumb
            .clear()
            .setStrokeStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                alignment: 0,
                color: accentColor,
            })
            .roundRect(
                -20 * window.devicePixelRatio,
                -5 * window.devicePixelRatio,
                40 * window.devicePixelRatio,
                10 * window.devicePixelRatio,
                10 * window.devicePixelRatio
            )
            .fill(isHover ? accentColor : bgColor).stroke()
            .setStrokeStyle()
            .circle(0, 0, 2)
            .fill(isHover ? bgColor : accentColor);
    }

    static update(time) {
        this.resize();

        if (Game.BEATMAP_FILE?.audioNode?.buf) {
            this.thumb.x = (time / (Game.BEATMAP_FILE?.audioNode?.buf.duration * 1000)) * (this.WIDTH - 80 * window.devicePixelRatio);
        }

        // this.renderer.render(this.stage);
    }
}
