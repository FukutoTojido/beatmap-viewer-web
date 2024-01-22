import { Game } from "./Game";
import * as TWEEN from "@tweenjs/tween.js";
import { Component } from "./WindowManager";
import { TimingPanel } from "./TimingPanel";
import bezier from "bezier-easing";
import { FlexBox } from "./Stats";
import * as PIXI from "pixi.js";

export function toggleMetadataPanel() {
    let result = {
        game: 0,
        timing: 0,
        metadata: 0,
    };

    if (!Game.SHOW_METADATA) {
        result = {
            game: 400,
            timing: 0,
            metadata: 400,
        };
    }

    if (Game.SHOW_METADATA) {
        result = {
            game: 0,
            timing: 0,
            metadata: 0,
        };
    }

    Game.SHOW_TIMING_PANEL = false;
    Game.SHOW_METADATA = !Game.SHOW_METADATA;

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
        })
        .start();
}

export class MetadataPanel {
    static MASTER_CONTAINER;
    static SIZE_X = 0;
    static SIZE_Y = 0;

    static ARTIST;
    static ROMANIZED_ARTIST;
    static TITLE;
    static ROMANIZED_TITLE;
    static DIFFICULTY_NAME;
    static SOURCE;
    static TAG;

    static LABEL = {
        artist: null,
        romanized_artist: null,
        title: null,
        romanized_title: null,
        difficulty_name: null,
        source: null,
        tag: null,
    };

    static init() {
        this.MASTER_CONTAINER = new Component(0, 70, 370 * window.devicePixelRatio, Game.APP.renderer.height - 100);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        this.MASTER_CONTAINER.padding = 15;
        this.MASTER_CONTAINER.alpha = 1;
        this.MASTER_CONTAINER.borderRadius = 10;

        this.WIDTH = this.MASTER_CONTAINER.w;
        this.HEIGHT = this.MASTER_CONTAINER.h;

        this.flex = new FlexBox();
        this.flex.flexDirection = "row";
        this.flex.gap = 5;
        this.flex.justifyContent = "start";

        const contentStyle = {
            fontSize: 16,
            fontFamily: "Torus",
            fill: "white",
            fontWeight: 500,
            wordWrap: true,
        };

        const labelStyle = {
            fontSize: 12,
            fontFamily: "Torus",
            fill: "white",
            fontWeight: 300,
            wordWrap: true,
        };

        Object.keys(this.LABEL).forEach((label) => {
            this.LABEL[label] = new PIXI.Text(label.replaceAll("_", " "), labelStyle);
            this[label.toUpperCase()] = new PIXI.Text("", contentStyle);

            this.flex.addChild(this.LABEL[label], this[label.toUpperCase()]);
        });

        this.MASTER_CONTAINER.container.addChild(this.flex.container);
    }

    static resize() {
        this.MASTER_CONTAINER.x = Game.APP.renderer.width - this.SIZE_X * devicePixelRatio;
        this.MASTER_CONTAINER.y = 70 * devicePixelRatio;
        this.MASTER_CONTAINER.w = 400 * devicePixelRatio;
        this.MASTER_CONTAINER.h = Game.APP.renderer.height - 70 * devicePixelRatio - this.SIZE_Y * devicePixelRatio;

        if (this.MASTER_CONTAINER.color !== Game.COLOR_PALETTES.primary3) this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        if (
            this.WIDTH === this.MASTER_CONTAINER.w - this.MASTER_CONTAINER.padding * 2 &&
            this.HEIGHT === this.MASTER_CONTAINER.h - this.MASTER_CONTAINER.padding * 2
        )
            return;

        this.WIDTH = this.MASTER_CONTAINER.w;
        this.HEIGHT = this.MASTER_CONTAINER.h;
    }

    static update() {
        this.resize();
    }
}
