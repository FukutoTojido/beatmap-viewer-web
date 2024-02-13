import * as PIXI from "pixi.js";
import { Game } from "./Game";
import { Component } from "./WindowManager";
import * as TWEEN from "@tweenjs/tween.js";
import bezier from "bezier-easing";
import { TimingPanel } from "./TimingPanel";
import { MetadataPanel } from "./SidePanel";

export function toggleTimingPanel() {
    TimingPanel.ON_ANIM = true;
    
    let result = {
        game: 0,
        timing: 0,
        metadata: 0,
    };

    if (!Game.SHOW_TIMING_PANEL) {
        result = {
            game: (innerWidth < innerHeight) ? 0 : 400,
            timing: (innerWidth < innerHeight) ? Game.WRAPPER.h * 0.75 : 400 * devicePixelRatio,
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
        }).onComplete(() => {
            TimingPanel.ON_ANIM = false;
        })
        .start();
}

export class BPM {
    static BPM_TEXT;
    static SV_TEXT;

    static init() {
        this.MASTER_CONTAINER = new Component(
            110 * devicePixelRatio,
            Game.WRAPPER.h - 60 * devicePixelRatio,
            180 * devicePixelRatio,
            60 * devicePixelRatio
        );
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
            this.MASTER_CONTAINER.y = Game.STATS.container.y + Game.STATS.container.height;
            this.MASTER_CONTAINER.w = Game.WRAPPER.w / 2;
        } else {
            this.MASTER_CONTAINER.x = 110 * devicePixelRatio;
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60 * devicePixelRatio;
            this.MASTER_CONTAINER.w = 180 * devicePixelRatio;
        }
        this.MASTER_CONTAINER.h = 60 * devicePixelRatio;

        this.BPM_TEXT.x = this.MASTER_CONTAINER.w / 2 - 5 * devicePixelRatio;
        this.BPM_TEXT.y = this.MASTER_CONTAINER.h / 2;
        this.BPM_TEXT.style.fontSize = 16 * devicePixelRatio;
        this.BPM_TEXT.resolution = devicePixelRatio;

        this.FLAIR.clear()
            .roundRect(
                this.MASTER_CONTAINER.w / 2 + 5 * devicePixelRatio,
                this.MASTER_CONTAINER.h / 2 - 10 * devicePixelRatio,
                50 * devicePixelRatio,
                20 * devicePixelRatio
            )
            .fill(0x9beea7);

        this.SV_TEXT.x = this.MASTER_CONTAINER.w / 2 + 5 * devicePixelRatio + 25 * devicePixelRatio;
        this.SV_TEXT.y = this.MASTER_CONTAINER.h / 2;
        this.SV_TEXT.style.fontSize = 12 * devicePixelRatio;
        this.SV_TEXT.resolution = devicePixelRatio;
    }

    static update() {
        if (Game.EMIT_STACK.length === 0) return;
        this.forceUpdate();
    }
}
