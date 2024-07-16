import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { Component } from "./WindowManager";
import * as TWEEN from "@tweenjs/tween.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import bezier from "bezier-easing";
import { TimingPanel } from "./TimingPanel";
import { Timeline } from "./Timeline/Timeline";
import { MetadataPanel } from "./SidePanel";
import { ObjectsController } from "./HitObjects/ObjectsController";

export function toggleTimingPanel() {
    TimingPanel.ON_ANIM = true;

    let result = {
        game: 0,
        timing: 0,
        metadata: 0,
    };

    if (!Game.SHOW_TIMING_PANEL) {
        result = {
            game: innerWidth < innerHeight ? 0 : 400,
            timing: innerWidth < innerHeight ? Game.WRAPPER.h * 0.75 : 400,
            metadata: 0,
        };

        document.querySelector(".mapBG").style.width = `calc(100% - 410px)`;
    }

    if (Game.SHOW_TIMING_PANEL) {
        result = {
            game: 0,
            timing: 0,
            metadata: 0,
        };

        document.querySelector(".mapBG").style.width = ``;
    }

    Game.SHOW_METADATA = false;
    Game.SHOW_TIMING_PANEL = !Game.SHOW_TIMING_PANEL;

    const easing = bezier(0, 0.4, 0, 1.0);

    const tween = new TWEEN.Tween({
        reduction: {
            game: Game.REDUCTION,
            timing: TimingPanel.SIZE_X,
            metadata: MetadataPanel.SIZE_X,
        },
    })
        .easing((t) => {
            return easing(t);
        })
        .to({ reduction: result }, 200)
        .onUpdate((obj) => {
            Game.REDUCTION = obj.reduction.game;
            MetadataPanel.SIZE_X = obj.reduction.metadata;
            TimingPanel.SIZE_X = obj.reduction.timing;
            TimingPanel.ON_ANIM = true;

            Game.EMIT_STACK.push(true);
        })
        .onComplete(() => {
            TimingPanel.ON_ANIM = false;
        })
        .start();
}

export class BPM {
    static BPM_TEXT;
    static SV_TEXT;

    static _IS_KIAI = false;

    static get IS_KIAI() {
        return this._IS_KIAI;
    }

    static set IS_KIAI(val) {
        this._IS_KIAI = val;

        if (val) {
            const [r3, g3, b3] =
                typeof Game.COLOR_PALETTES.primary3 === "number"
                    ? [...Object.values(d3.rgb(`#${Game.COLOR_PALETTES.primary3.toString(16).padStart(6, "0")}`)).map((val) => val / 1.0)]
                    : Game.COLOR_PALETTES.primary3
                          .slice(1)
                          .match(/.{2}/g)
                          .map((val) => parseInt(val, 16));

            const [r4, g4, b4] =
                typeof Game.COLOR_PALETTES.primary4 === "number"
                    ? [...Object.values(d3.rgb(`#${Game.COLOR_PALETTES.primary5.toString(16).padStart(6, "0")}`)).map((val) => val / 1.0)]
                    : Game.COLOR_PALETTES.primary4
                          .slice(1)
                          .match(/.{2}/g)
                          .map((val) => parseInt(val, 16));

            // console.log(r3, g3, b3);
            // console.log(r4, g4, b4);
            // console.log(ObjectsController.CURRENT_BPM.beatstep);

            this.TWEEN = new TWEEN.Tween({
                r: r4,
                g: g4,
                b: b4,
            })
                .to(
                    {
                        r: r3,
                        g: g3,
                        b: b3,
                    },
                    ObjectsController.CURRENT_BPM.beatstep
                )
                .onUpdate(({ r, g, b }) => {
                    const color = (r << 16) | (g << 8) | b;
                    this.MASTER_CONTAINER.color = color;
                })
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .repeat(Infinity)
                .start();

            return;
        }

        if (!this.TWEEN) return;

        this.TWEEN.stop();
        this.TWEEN = null;
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
    }

    static TWEEN = null;

    static init() {
        this.MASTER_CONTAINER = new Component(110, Game.WRAPPER.h - 60, 180, 60);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        this.MASTER_CONTAINER.alpha = 1;

        this.MASTER_CONTAINER.masterContainer.on("click", () => {
            toggleTimingPanel();
        });

        this.MASTER_CONTAINER.masterContainer.on("tap", () => toggleTimingPanel());

        this.MASTER_CONTAINER.masterContainer.on("mouseenter", () => {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary4;
        });

        this.MASTER_CONTAINER.masterContainer.on("mouseleave", () => {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        });

        this.BPM_TEXT = new PIXI.Text({
            text: "0BPM",
            style: {
                fontFamily: "Torus",
                fontSize: 16,
                fontWeight: 500,
                fill: 0xffffff,
            },
        });

        this.BPM_TEXT.anchor.set(1, 0.5);
        this.BPM_TEXT.x = this.MASTER_CONTAINER.w / 2 - 5;
        this.BPM_TEXT.y = this.MASTER_CONTAINER.h / 2;

        this.FLAIR = new PIXI.Graphics().roundRect(this.MASTER_CONTAINER.w / 2 + 5, this.MASTER_CONTAINER.h / 2 - 10, 50, 20).fill(0x9beea7);

        this.SV_TEXT = new PIXI.Text({
            text: "0.00x",
            style: {
                fontFamily: "Torus",
                fontSize: 12,
                fontWeight: 500,
                fill: 0x202020,
            },
        });

        this.SV_TEXT.anchor.set(0.5, 0.5);
        this.SV_TEXT.x = this.MASTER_CONTAINER.w / 2 + 5 + 25;
        this.SV_TEXT.y = this.MASTER_CONTAINER.h / 2;

        this.MASTER_CONTAINER.container.addChild(this.BPM_TEXT);
        this.MASTER_CONTAINER.container.addChild(this.FLAIR);
        this.MASTER_CONTAINER.container.addChild(this.SV_TEXT);
    }

    static forceUpdate() {
        if (!this.MASTER_CONTAINER) return;

        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.x = Game.WRAPPER.w / 2;
            this.MASTER_CONTAINER.y = Game.STATS.container.y + Game.STATS.container.height + 60 - Timeline.HEIGHT_REDUCTION;
            this.MASTER_CONTAINER.w = Game.WRAPPER.w / 2;
        } else {
            this.MASTER_CONTAINER.x = 110;
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60;
            this.MASTER_CONTAINER.w = 180;
        }
        this.MASTER_CONTAINER.h = 60;

        this.BPM_TEXT.x = this.MASTER_CONTAINER.w / 2 - 5;
        this.BPM_TEXT.y = this.MASTER_CONTAINER.h / 2;
        this.BPM_TEXT.style.fontSize = 16;
        // this.BPM_TEXT.resolution = devicePixelRatio;

        this.FLAIR.clear()
            .roundRect(this.MASTER_CONTAINER.w / 2 + 5, this.MASTER_CONTAINER.h / 2 - 10, 50, 20)
            .fill(0x9beea7);

        this.SV_TEXT.x = this.MASTER_CONTAINER.w / 2 + 5 + 25;
        this.SV_TEXT.y = this.MASTER_CONTAINER.h / 2;
        this.SV_TEXT.style.fontSize = 12;
        // this.SV_TEXT.resolution = devicePixelRatio;
    }

    static update() {
        if (Game.IS_FULLSCREEN) {
            this.MASTER_CONTAINER.masterContainer.visible = Game.IS_HOVERING_PROGRESS;
        } else {
            this.MASTER_CONTAINER.masterContainer.visible = true;
        }

        if (Game.EMIT_STACK.length === 0) return;
        this.forceUpdate();
    }
}
