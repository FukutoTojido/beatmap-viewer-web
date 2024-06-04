import * as PIXI from "pixi.js";
import { Component } from "./WindowManager";
import { Game } from "./Game";
import { fullscreenToggle, go, playToggle } from "./ProgressBar";
import { toggleMetadataPanel } from "./SidePanel";
import { Container } from "./UI/Container";
import { FlexBox } from "./UI/FlexBox";
import { BPM } from "./BPM";

export class Button {
    isAlt = false;
    container;

    async init(x, y, imgURL, altImgURL) {
        this.x = x;
        this.y = y;
        this._color = Game.COLOR_PALETTES.primary2;
        this.imgURL = imgURL;
        this.altImgURL = altImgURL ?? imgURL;

        this.texture = await PIXI.Assets.load(this.imgURL);
        this.altTexture = altImgURL ? await PIXI.Assets.load(this.altImgURL) : this.texture;

        this.sprite = new PIXI.Sprite(this.texture);
        this.sprite.scale.set(this.imgURL === "static/info.png" ? 1 : 0.75);
        this.sprite.anchor.set(0.5);
        this.sprite.x = 30 * devicePixelRatio;
        this.sprite.y = 30 * devicePixelRatio;

        this._onclick = () => {};

        this.container = new PIXI.Container();
        this.graphics = new PIXI.Graphics();
        // this.graphics.x = this.x;
        // this.graphics.y = this.y;

        this.redraw();

        this.container.eventMode = "dynamic";
        this.container.on("mouseenter", () => (this.color = Game.COLOR_PALETTES.primary3));
        this.container.on("mouseleave", () => (this.color = Game.COLOR_PALETTES.primary2));

        this.container.addChild(this.graphics, this.sprite);
    }

    constructor() {}

    get color() {
        return this._color;
    }

    set color(val) {
        this._color = val;
        this.redraw();
    }

    get onclick() {
        return this._onclick;
    }

    get width() {
        return 60 * devicePixelRatio;
    }

    get height() {
        return 60 * devicePixelRatio;
    }

    set onclick(fn) {
        this.container.on("click", (e) => {
            fn(e);
            this.redraw();
        });
        this.container.on("tap", (e) => {
            fn(e);
            this.redraw();
        });
        this._onclick = fn;
    }

    redraw() {
        this.graphics
            .clear()
            .rect(0, 0, 60 * devicePixelRatio, 60 * devicePixelRatio)
            .fill(this.color);

        this.container.x = this.x * devicePixelRatio;
        this.container.y = this.y * devicePixelRatio;

        this.sprite.scale.set(devicePixelRatio * (this.imgURL === "static/info.png" ? 1 : 0.75));
        this.sprite.x = 30 * devicePixelRatio;
        this.sprite.y = 30 * devicePixelRatio;
    }
}

export class PlayContainer {
    static async init() {
        this.MASTER_CONTAINER = new Container();
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary2;
        this.MASTER_CONTAINER.alpha = 1;
        this.MASTER_CONTAINER.placeItemsCenter = true;

        this.flex = new FlexBox();

        this.playButton = new Button();
        await this.playButton.init(120, 0, "static/play.svg", "static/pause.svg");
        this.playButton.onclick = () => playToggle();

        this.prevButton = new Button();
        await this.prevButton.init(60, 0, "static/step-back.svg");
        this.prevButton.onclick = () => go(null, false);

        this.nextButton = new Button();
        await this.nextButton.init(180, 0, "static/step-forward.svg");
        this.nextButton.onclick = () => go(null, true);

        this.infoButton = new Button();
        await this.infoButton.init(0, 0, "static/info.svg");
        this.infoButton.onclick = () => toggleMetadataPanel();

        this.flex.addChild(this.infoButton.container);
        this.flex.addChild(this.prevButton.container);
        this.flex.addChild(this.playButton.container);
        this.flex.addChild(this.nextButton.container);

        this.MASTER_CONTAINER.addChild(this.flex.container);

        this.forceUpdate();
    }

    static forceUpdate() {
        if (!this.MASTER_CONTAINER) return;

        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.x = 0;
            this.MASTER_CONTAINER.y = BPM.MASTER_CONTAINER.y + BPM.MASTER_CONTAINER.h;
            this.MASTER_CONTAINER.width = Game.WRAPPER.w;
        } else {
            this.MASTER_CONTAINER.x = 290 * devicePixelRatio;
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60 * devicePixelRatio;
            this.MASTER_CONTAINER.width = 240 * devicePixelRatio;
        }

        this.MASTER_CONTAINER.container.h = 60 * devicePixelRatio;

        this.playButton.redraw();
        this.prevButton.redraw();
        this.nextButton.redraw();
        this.infoButton.redraw();

        this.MASTER_CONTAINER.update();
    }

    static update() {
        if (Game.IS_FULLSCREEN) {
            this.MASTER_CONTAINER.container.visible = Game.IS_HOVERING_PROGRESS;
        } else {
            this.MASTER_CONTAINER.container.visible = true;
        }

        if (Game.EMIT_STACK.length === 0) return;
        this.forceUpdate();
    }
}

export class FullscreenButton {
    static async init() {
        this.obj = new Button();
        await this.obj.init(Game.MASTER_CONTAINER.w - 60, Game.WRAPPER.h - 60 * devicePixelRatio, "static/maximize.svg", "static/minimize.svg");
        this.obj.onclick = () => fullscreenToggle();
        this.obj.container.label = "Fullscreen Button";
    }

    static redraw() {
        if (Game.IS_FULLSCREEN) {
            this.obj.container.visible = Game.IS_HOVERING_PROGRESS;
        } else {
            this.obj.container.visible = true;
        }

        if (Game.EMIT_STACK.length === 0) return;
        if (!this.obj) return;

        this.obj.x = Game.MASTER_CONTAINER.w - 60;

        if (innerWidth / innerHeight < 1) {
            this.obj.y = PlayContainer.MASTER_CONTAINER.y + PlayContainer.MASTER_CONTAINER.height;
        } else {
            this.obj.y = Game.WRAPPER.h - 60 * devicePixelRatio;
        }

        this.obj.redraw();
    }
}
