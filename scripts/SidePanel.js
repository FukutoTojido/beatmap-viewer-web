import { Game } from "./Game";
import * as TWEEN from "@tweenjs/tween.js";
import { Component } from "./WindowManager";
import { TimingPanel } from "./TimingPanel";
import bezier from "bezier-easing";
import { Container } from "./UI/Container";
import { FlexBox } from "./UI/FlexBox";
import { Text } from "./UI/Text";
import * as PIXI from "pixi.js";
import { Clamp } from "./Utils";

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
            metadata: innerWidth < innerHeight ? Game.WRAPPER.h * 0.75 : 400 * devicePixelRatio,
        };

        document.querySelector(".mapBG").style.width = `calc(100% - 410px)`;
    }

    if (Game.SHOW_METADATA) {
        result = {
            game: 0,
            timing: 0,
            metadata: 0,
        };
        document.querySelector(".mapBG").style.width = ``;
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
    static SCROLL_RATE = 0;

    static IS_TOUCHING = false;
    static START_Y_TOUCH = -1;
    static TOUCH_VELOCITY = 0;
    static TOUCH_LAST_TIMESTAMP = 0;
    static TOUCH_TWEEN = null;

    static SCROLLED = 0;

    static init() {
        this.MASTER_CONTAINER = new Component(0, 70, 370 * window.devicePixelRatio, Game.APP.renderer.height - 100);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
        this.MASTER_CONTAINER.padding = 15;
        this.MASTER_CONTAINER.alpha = 1;
        this.MASTER_CONTAINER.borderRadius = 10;
        this.MASTER_CONTAINER.masterContainer.on("touchstart", (e) => {
            this.IS_TOUCHING = true;
            this.START_Y_TOUCH = e.global.y;
            this.TOUCH_LAST_TIMESTAMP = performance.now();

            if (this.TOUCH_TWEEN) this.TOUCH_TWEEN.stop();
        });

        this.MASTER_CONTAINER.masterContainer.on("touchmove", (e) => {
            if (!this.IS_TOUCHING) return;

            const heightDiff = Math.max(0, this.flex.height - this.container.height + this.container.paddingY * devicePixelRatio);
            const deltaY = e.global.y - this.START_Y_TOUCH;

            this.START_Y_TOUCH = e.global.y;

            if (this.SCROLLED - deltaY > heightDiff || this.SCROLLED - deltaY < 0) {
                window.scrollBy(0, -deltaY / devicePixelRatio);
            }

            this.SCROLLED = Clamp(this.SCROLLED - deltaY, 0, heightDiff);
            this.flex.y = -this.SCROLLED;

            const deltaT = performance.now() - this.TOUCH_LAST_TIMESTAMP;

            if (deltaT !== 0) this.TOUCH_VELOCITY = deltaY / deltaT;

            this.TOUCH_LAST_TIMESTAMP = performance.now();
        });

        this.MASTER_CONTAINER.masterContainer.on("touchend", (e) => {
            this.IS_TOUCHING = false;
            const heightDiff = Math.max(0, this.flex.height - this.container.height + this.container.paddingY * devicePixelRatio);

            const currentTimestamp = performance.now();
            this.TOUCH_VELOCITY = this.TOUCH_VELOCITY * Clamp(1 - (currentTimestamp - this.TOUCH_LAST_TIMESTAMP) / 200, 0, 1);

            const predicted = this.TOUCH_VELOCITY * 300;
            const startScroll = this.SCROLLED;

            let previousScroll = 0;
            this.TOUCH_TWEEN = new TWEEN.Tween({ predicted: 0 }, false)
                .to({ predicted: predicted }, 300)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate((object) => {
                    this.SCROLLED = Clamp(startScroll - object.predicted, 0, heightDiff);
                    this.flex.y = -this.SCROLLED;

                    if (
                        (startScroll - object.predicted > heightDiff || startScroll - object.predicted < 0) &&
                        startScroll > 0 &&
                        startScroll < heightDiff
                    ) {
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

            this.MASTER_CONTAINER.x = Game.APP.renderer.width - this.SIZE_X;
            this.MASTER_CONTAINER.y = !Game.IS_FULLSCREEN ? 70 * devicePixelRatio : 0;
            this.MASTER_CONTAINER.w = 400 * devicePixelRatio;
            this.MASTER_CONTAINER.h = Game.APP.renderer.height - (!Game.IS_FULLSCREEN ? 70 * devicePixelRatio : 0) - this.SIZE_Y * devicePixelRatio;
        }

        if (
            this.WIDTH === this.MASTER_CONTAINER.w - this.MASTER_CONTAINER.padding * 2 &&
            this.HEIGHT === this.MASTER_CONTAINER.h - this.MASTER_CONTAINER.padding * 2
        )
            return;

        this.WIDTH = this.MASTER_CONTAINER.w;
        this.HEIGHT = this.MASTER_CONTAINER.h;

        if (Game.IS_FULLSCREEN) this.MASTER_CONTAINER.borderRadius = 0;
        else this.MASTER_CONTAINER.borderRadius = 10;
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
