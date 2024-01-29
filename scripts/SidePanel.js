import { Game } from "./Game";
import * as TWEEN from "@tweenjs/tween.js";
import { Component } from "./WindowManager";
import { TimingPanel } from "./TimingPanel";
import bezier from "bezier-easing";
import { Container } from "./UI/Container";
import { FlexBox } from "./UI/FlexBox";
import { Text } from "./UI/Text";
import * as PIXI from "pixi.js";

export function toggleMetadataPanel() {
    MetadataPanel.ON_ANIM = true;

    let result = {
        game: 0,
        timing: 0,
        metadata: 0,
    };

    if (!Game.SHOW_METADATA) {
        result = {
            game: innerWidth < innerHeight ? 0 : 400,
            timing: 0,
            metadata: innerWidth < innerHeight ? Game.WRAPPER.h * 0.75 : 400,
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
            MetadataPanel.ON_ANIM = true;

            Game.EMIT_STACK.push(true);
        })
        .onComplete(() => {
            MetadataPanel.ON_ANIM = false;
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

    static CONTAINERS = {
        artist: null,
        romanized_artist: null,
        title: null,
        romanized_title: null,
        difficulty_name: null,
        source: null,
        tag: null,
    };

    static container;

    static ON_ANIM = false;

    static init() {
        this.MASTER_CONTAINER = new Component(0, 70, 370 * window.devicePixelRatio, Game.APP.renderer.height - 100);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        this.MASTER_CONTAINER.padding = 15;
        this.MASTER_CONTAINER.alpha = 1;
        this.MASTER_CONTAINER.borderRadius = 10;
        this.MASTER_CONTAINER.masterContainer.on("touchstart", (e) => {
            Game.START_DRAG_Y = e.global.y;
            Game.IS_DRAGSCROLL = true;
        });

        this.MASTER_CONTAINER.masterContainer.on("touchmove", (e) => {
            if (!Game.IS_DRAGSCROLL) return;

            const delta = e.global.y - Game.START_DRAG_Y;
            window.scrollBy(0, -delta / devicePixelRatio);
            Game.START_DRAG_Y = e.global.y;
        });

        this.MASTER_CONTAINER.masterContainer.on("touchend", (e) => {
            Game.START_DRAG_Y = 0;
            Game.IS_DRAGSCROLL = false;
        });

        this.WIDTH = this.MASTER_CONTAINER.w;
        this.HEIGHT = this.MASTER_CONTAINER.h;

        this.flex = new FlexBox();
        this.flex.flexDirection = "row";
        this.flex.gap = 20;
        this.flex.justifyContent = "start";

        this.container = new Container();
        this.container.paddingX = 20;
        this.container.paddingY = 20;
        this.container.color = Game.COLOR_PALETTES.primary2;
        this.container.borderRadius = 10;

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
            fontWeight: 400,
            wordWrap: true,
        };

        Object.keys(this.LABEL).forEach((label) => {
            this.LABEL[label] = new Text({
                text: label.replaceAll("_", " "),
                style: labelStyle,
            });
            this[label.toUpperCase()] = new Text({ text: "", style: contentStyle });
            this.CONTAINERS[label] = new FlexBox();
            this.CONTAINERS[label].flexDirection = "row";
            this.CONTAINERS[label].justifyContent = "start";
            this.CONTAINERS[label].gap = 6;

            this.CONTAINERS[label].addChild(this.LABEL[label].sprite, this[label.toUpperCase()].sprite);
            this.flex.addChild(this.CONTAINERS[label].container);
            this.container.addChild(this.flex.container);
        });

        this.MASTER_CONTAINER.container.addChild(this.container.container);
        this.forceUpdate();
    }

    static get artist() {
        return this._artist;
    }

    static set artist(val) {
        this._artist = val;
        this.ARTIST.text = val;
        this.forceUpdate();
    }

    static get romanized_artist() {
        return this._romanized_artist;
    }

    static set romanized_artist(val) {
        this._romanized_artist = val;
        this.ROMANIZED_ARTIST.text = val;
        this.forceUpdate();
    }

    static get title() {
        return this._title;
    }

    static set title(val) {
        this._title = val;
        this.TITLE.text = val;
        this.forceUpdate();
    }

    static get romanized_title() {
        return this._romanized_title;
    }

    static set romanized_title(val) {
        this._romanized_title = val;
        this.ROMANIZED_TITLE.text = val;
        this.forceUpdate();
    }

    static get difficulty_name() {
        return this._difficulty_name;
    }

    static set difficulty_name(val) {
        this._difficulty_name = val;
        this.DIFFICULTY_NAME.text = val;
        this.forceUpdate();
    }

    static get source() {
        return this._source;
    }

    static set source(val) {
        this._source = val;
        this.SOURCE.text = val;
        this.forceUpdate();
    }

    static get tag() {
        return this._tag;
    }

    static set tag(val) {
        this._tag = val;
        this.TAG.text = val;
    }

    static resize() {
        if (innerWidth / innerHeight < 1) {
            if (Game.SHOW_METADATA && !this.ON_ANIM) this.SIZE_X = Game.WRAPPER.h * 0.75;
            this.MASTER_CONTAINER.x = 0;
            this.MASTER_CONTAINER.y = Game.APP.renderer.height - Game.WRAPPER.h * 0.75 * (this.SIZE_X / (Game.WRAPPER.h * 0.75));
            this.MASTER_CONTAINER.w = Game.APP.renderer.width;
            this.MASTER_CONTAINER.h = this.SIZE_X;
        } else {
            if (Game.SHOW_METADATA && !this.ON_ANIM) this.SIZE_X = 400 * devicePixelRatio;

            this.MASTER_CONTAINER.x = Game.APP.renderer.width - this.SIZE_X * devicePixelRatio;
            this.MASTER_CONTAINER.y = 70 * devicePixelRatio;
            this.MASTER_CONTAINER.w = 400 * devicePixelRatio;
            this.MASTER_CONTAINER.h = Game.APP.renderer.height - 70 * devicePixelRatio - this.SIZE_Y * devicePixelRatio;
        }

        if (
            this.WIDTH === this.MASTER_CONTAINER.w - this.MASTER_CONTAINER.padding * 2 &&
            this.HEIGHT === this.MASTER_CONTAINER.h - this.MASTER_CONTAINER.padding * 2
        )
            return;

        this.WIDTH = this.MASTER_CONTAINER.w;
        this.HEIGHT = this.MASTER_CONTAINER.h;
    }

    static forceUpdate() {
        this.resize();

        this.container.width = this.MASTER_CONTAINER.w - this.MASTER_CONTAINER.padding * 2;
        this.container.height = this.MASTER_CONTAINER.h - this.MASTER_CONTAINER.padding * 2;

        Object.keys(this.LABEL).forEach((label) => {
            this.LABEL[label].style.wordWrapWidth = this.container.width - this.container.paddingX * 2;
            this[label.toUpperCase()].style.wordWrapWidth = this.container.width - this.container.paddingX * 2;

            this.LABEL[label].style.fontSize = 12 * devicePixelRatio;
            this[label.toUpperCase()].style.fontSize = 16 * devicePixelRatio;

            this.LABEL[label].update();
            this[label.toUpperCase()].update();

            this.CONTAINERS[label].update();
            this.flex.update();
        });

        // this.flex.update();
        this.container.update();
        this.MASTER_CONTAINER.redraw();
    }

    static update() {
        if (Game.EMIT_STACK.length === 0) return;
        this.forceUpdate();
    }
}
