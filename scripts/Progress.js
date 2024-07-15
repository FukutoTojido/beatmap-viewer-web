import { Beatmap } from "./Beatmap.js";
import { Clamp } from "./Utils.js";
import { setAudioTime } from "./ProgressBar.js";
import { Game } from "./Game.js";
import * as PIXI from "pixi.js";
import { Component } from "./WindowManager.js";
import { PlayContainer } from "./PlayButtons.js";
import vertexSrc from "./Shaders/Progress/TimingPoint.vert?raw";
import fragmentSrc from "./Shaders/Progress/TimingPoint.frag?raw";
import gpuSrc from "./Shaders/Progress/TimingPoint.wgsl?raw";

export class ProgressBar {
    static renderer;
    static stage;
    static container;
    static line;
    static thumb;
    static timeline;
    static breakKiai;
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
            .fill(0x2e3440)
            .stroke()
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
            Game.IS_SEEKING = true;
            this.handleMouseDown(e);
        });
        this.container.on("mousemove", (e) => {
            this.handleMouseMove(e);
        });
        this.container.on("mouseup", (e) => {
            Game.IS_SEEKING = false;
            this.handleMouseUp(e);
        });
        this.container.on("mouseleave", (e) => {
            Game.IS_SEEKING = false;
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

    static initBreakKiai() {
        this.stage.addChildAt(this.breakKiai, 1);
        this.breakKiai.x = 40 * devicePixelRatio;
        this.breakKiai.y = this.HEIGHT / 3;

        const fullTime = Game.BEATMAP_FILE.audioNode.duration;
        const width = this.WIDTH - 80 * window.devicePixelRatio;
        const height = this.HEIGHT / 3;

        this.breakKiai.clear();
        Beatmap.breakPeriods.forEach((period) => {
            const startX = (period[0] / fullTime) * width;
            const endX = (period[1] / fullTime) * width;

            this.breakKiai.rect(startX, 0, endX - startX, height).fill({ color: 0xffffff, alpha: 0.5 });
        });

        for (let i = 0; i < Beatmap.kiaiList.length; i += 2) {
            const startX = (Beatmap.kiaiList[i].time / fullTime) * width;
            const endX = (Beatmap.kiaiList[i + 1].time / fullTime) * width;

            this.breakKiai.rect(startX, 0, endX - startX, height).fill({ color: 0xd87b0f, alpha: 0.5 });
        }
    }

    static initTimingPoints() {
        this.timeline.x = 40 * devicePixelRatio;
        this.timeline.y = 10 * devicePixelRatio;

        if (!Game.BEATMAP_FILE?.audioNode) return;

        const fullTime = Game.BEATMAP_FILE.audioNode.duration;
        const width = this.WIDTH - 80 * window.devicePixelRatio;
        const height = this.HEIGHT / 2 - 10 * devicePixelRatio;

        const positionsBuffer = [];
        const colorBuffer = [];

        Beatmap.timingPointsList.forEach((point, idx) => {
            const x = (point.time / fullTime) * width;
            const color = point.beatstep ? [0.96, 0.26, 0.35] : [0.26, 0.96, 0.38];

            positionsBuffer.push(...[x, 0, x, height / 2]);
            colorBuffer.push(...[...color, ...color]);
        });

        const geometry = new PIXI.Geometry({
            attributes: {
                aPosition: positionsBuffer,
                aColor: colorBuffer,
            },
            topology: "line-list",
        });

        this.timeline.geometry = geometry;
    }

    static reinitPoints() {
        this.stage.removeChild(this.timeline);

        this.timeline = new PIXI.Mesh({
            geometry: new PIXI.Geometry({
                attributes: {
                    aPosition: [0, 0, 1, 0],
                    aColor: [1, 0, 0, 1, 1, 1],
                },
                topology: "line-list",
            }),
            shader: PIXI.Shader.from({
                gl: PIXI.GlProgram.from({
                    vertex: vertexSrc,
                    fragment: fragmentSrc,
                }),
                gpu: PIXI.GpuProgram.from({
                    vertex: {
                        source: gpuSrc,
                        entryPoint: "vsMain",
                    },
                    fragment: {
                        source: gpuSrc,
                        entryPoint: "fsMain",
                    },
                }),
            }),
        });
        this.timeline.x = 40 * devicePixelRatio;
        this.timeline.y = 10 * devicePixelRatio;
        this.stage.addChildAt(this.timeline, 0);
    }

    static init() {
        this.WIDTH = Game.MASTER_CONTAINER.w - (110 + 360 + 60 + 60) * devicePixelRatio;
        this.HEIGHT = 60 * devicePixelRatio;

        this.MASTER_CONTAINER = new Component((110 + 360 + 60) * devicePixelRatio, Game.WRAPPER.h - 60 * devicePixelRatio, this.WIDTH, this.HEIGHT);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary2;
        this.MASTER_CONTAINER.alpha = 1;

        this.stage = this.MASTER_CONTAINER.container;

        const gpu = PIXI.GpuProgram.from({
            vertex: {
                source: gpuSrc,
                entryPoint: "vsMain",
            },
            fragment: {
                source: gpuSrc,
                entryPoint: "fsMain",
            },
        });
        gpu.autoAssignGlobalUniforms = true;
        gpu.autoAssignLocalUniforms = true;

        this.timeline = new PIXI.Mesh({
            geometry: new PIXI.Geometry({
                attributes: {
                    aPosition: [0, 0, 1, 0],
                    aColor: [1, 0, 0, 1, 1, 1],
                },
                topology: "line-list",
            }),
            shader: PIXI.Shader.from({
                gl: PIXI.GlProgram.from({
                    vertex: vertexSrc,
                    fragment: fragmentSrc,
                }),
                gpu,
            }),
        });
        this.timeline.x = 40 * devicePixelRatio;
        this.timeline.y = 10 * devicePixelRatio;
        this.stage.addChildAt(this.timeline, 0);

        this.breakKiai = new PIXI.Graphics();
        this.stage.addChildAt(this.breakKiai, 1);

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

    static forceResize() {
        if (!this.MASTER_CONTAINER) return;

        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.x = 0;
            this.MASTER_CONTAINER.y = PlayContainer.MASTER_CONTAINER.y + PlayContainer.MASTER_CONTAINER.height;
            this.MASTER_CONTAINER.w = Game.WRAPPER.w;
        } else {
            this.MASTER_CONTAINER.x = (110 + 360 + 60) * devicePixelRatio;
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60 * devicePixelRatio;
            this.MASTER_CONTAINER.w = Game.MASTER_CONTAINER.w - (110 + 360 + 60 + 60) * devicePixelRatio;
        }

        this.MASTER_CONTAINER.h = 60 * devicePixelRatio;

        const width = this.MASTER_CONTAINER.w;
        const height = this.MASTER_CONTAINER.h;

        if (this.WIDTH === width && this.HEIGHT === height) return;

        this.WIDTH = width;
        this.HEIGHT = height;

        this.restyle();
        if (Game.DEVE_RATIO !== devicePixelRatio) this.reinitPoints();
        this.initTimingPoints();
        this.initBreakKiai();

        this.thumb.y = this.HEIGHT / 2;

        this.container.x = 40 * window.devicePixelRatio;
        this.container.hitArea = new PIXI.Rectangle(-40 * window.devicePixelRatio, 0, this.WIDTH, this.HEIGHT);
    }

    static resize() {
        if (Game.IS_FULLSCREEN) {
            this.MASTER_CONTAINER.masterContainer.visible = Game.IS_HOVERING_PROGRESS;
        } else {
            this.MASTER_CONTAINER.masterContainer.visible = true;
        }

        if (Game.EMIT_STACK.length === 0) return;
        this.forceResize();
    }

    static restyle(isHover) {
        let bgColor = Game.COLOR_PALETTES.primary2;
        let accentColor = Game.COLOR_PALETTES.accent1;

        if (!bgColor) bgColor = 0x2e3440;
        if (!accentColor) accentColor = 0x88c0d0;

        this.line
            .clear()
            .setStrokeStyle({
                width: 4 * window.devicePixelRatio,
                cap: "round",
                color: accentColor,
            })
            .moveTo(0, this.HEIGHT / 2)
            .lineTo(this.WIDTH - 80 * window.devicePixelRatio, this.HEIGHT / 2)
            .stroke();

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
            .fill(isHover ? accentColor : bgColor)
            .stroke()
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
