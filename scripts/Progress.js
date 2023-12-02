import { Beatmap } from "./Beatmap.js";
import { Clamp } from "./Utils.js";
import { setAudioTime } from "./ProgressBar.js";

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

    static PERCENTAGE = 0;
    static IS_DRAGGING = false;
    static IS_HOVERING = false;

    static initLine() {
        this.line = new PIXI.Graphics()
            .lineStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                align: 0,
                color: 0x88c0d0,
            })
            .moveTo(0, this.HEIGHT / 2)
            .lineTo(this.WIDTH - 80 * window.devicePixelRatio, this.HEIGHT / 2);
    }

    static initThumb() {
        this.thumb = new PIXI.Graphics()
            .lineStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                alignment: 1,
                color: 0x88c0d0,
            })
            .beginFill(0x171a1f)
            .drawRoundedRect(
                -20 * window.devicePixelRatio,
                -5 * window.devicePixelRatio,
                40 * window.devicePixelRatio,
                10 * window.devicePixelRatio,
                10 * window.devicePixelRatio
            )
            .endFill();
        this.thumb.y = this.HEIGHT / 2;

        this.thumb.interactive = true;

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
        this.container.interactive = true;

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
        const children = this.timeline.removeChildren();
        children.forEach((child) => child.destroy());

        this.timelineObjs = [];

        const fullTime = beatmapFile.audioNode.duration;
        const width = this.WIDTH - 80 * window.devicePixelRatio;
        const height = this.HEIGHT / 2 - 10 * devicePixelRatio;

        Beatmap.mergedPoints.forEach((point) => {
            const x = (point.time / fullTime) * width;

            const line = new PIXI.Graphics()
                .lineStyle({
                    width: 1,
                    color: point.beatstep ? 0xf5425a : 0x42f560,
                })
                .moveTo(x, 0)
                .lineTo(x, height);

            line.alpha = 0.5;

            this.timelineObjs.push(line);
        });

        this.timeline.addChild(...this.timelineObjs);
    }

    static repositionTimingPoints() {
        if (!beatmapFile?.audioNode) return;

        const fullTime = beatmapFile.audioNode.duration;
        const width = this.WIDTH - 80 * window.devicePixelRatio;
        const height = this.HEIGHT / 2 - 10 * devicePixelRatio;

        Beatmap.mergedPoints.forEach((point, idx) => {
            const x = (point.time / fullTime) * width;

            this.timelineObjs[idx]
                .clear()
                .lineStyle({
                    width: 1,
                    color: point.beatstep ? 0xf5425a : 0x42f560,
                })
                .moveTo(x, 0)
                .lineTo(x, height);
        });
    }

    static init() {
        const { width, height } = getComputedStyle(document.querySelector(".progressBarContainer"));

        this.WIDTH = parseInt(width) * window.devicePixelRatio;
        this.HEIGHT = parseInt(height) * window.devicePixelRatio;

        this.renderer = new PIXI.Renderer({
            width: this.WIDTH,
            height: this.HEIGHT,
            backgroundColor: 0x4c566a,
            backgroundAlpha: 0,
            antialias: true,
            autoDensity: true,
        });
        document.querySelector(".progressBarContainer").append(this.renderer.view);
        this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
        this.stage = new PIXI.Container();

        this.timeline = new PIXI.Container();
        this.timeline.x = 40 * devicePixelRatio;
        this.timeline.y = 10 * devicePixelRatio;
        this.stage.addChild(this.timeline);

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
        let { width, height } = getComputedStyle(document.querySelector(".progressBarContainer"));

        width = parseInt(width) * window.devicePixelRatio;
        height = parseInt(height) * window.devicePixelRatio;

        if (width === 0) width = parseInt(getComputedStyle(document.querySelector("body")).width) * window.devicePixelRatio;

        if (this.WIDTH === width && this.HEIGHT === height) return;

        this.WIDTH = width;
        this.HEIGHT = height;
        this.renderer.resize(this.WIDTH, this.HEIGHT);

        this.renderer.view.style.transform = `scale(${1 / window.devicePixelRatio})`;
        this.restyle();

        this.timeline.x = 40 * devicePixelRatio;
        this.timeline.y = 10 * devicePixelRatio;
        this.repositionTimingPoints();

        this.thumb.y = this.HEIGHT / 2;

        this.container.x = 40 * window.devicePixelRatio;
        this.container.hitArea = new PIXI.Rectangle(-40 * window.devicePixelRatio, 0, this.WIDTH, this.HEIGHT);
    }

    static restyle(isHover) {
        const rootCSS = document.querySelector(":root");
        let bgColor = parseInt(rootCSS.style.getPropertyValue("--primary-1").slice(1), 16);
        let accentColor = parseInt(rootCSS.style.getPropertyValue("--accent-1").slice(1), 16);

        if (!bgColor) bgColor = 0x171a1f;
        if (!accentColor) accentColor = 0x88c0d0;

        this.line
            .clear()
            .lineStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                align: 0,
                color: accentColor,
            })
            .moveTo(0, this.HEIGHT / 2)
            .lineTo(this.WIDTH - 80 * window.devicePixelRatio, this.HEIGHT / 2);

        this.thumb
            .clear()
            .lineStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                alignment: 1,
                color: accentColor,
            })
            .beginFill(isHover ? accentColor : bgColor)
            .drawRoundedRect(
                -20 * window.devicePixelRatio,
                -5 * window.devicePixelRatio,
                40 * window.devicePixelRatio,
                10 * window.devicePixelRatio,
                10 * window.devicePixelRatio
            )
            .endFill();
    }

    static update(time) {
        this.resize();

        if (beatmapFile?.audioNode?.buf) {
            this.thumb.x = (time / (beatmapFile?.audioNode?.buf.duration * 1000)) * (this.WIDTH - 80 * window.devicePixelRatio);
        }

        this.renderer.render(this.stage);
    }
}
