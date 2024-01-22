import * as PIXI from "pixi.js";
import { Component } from "./WindowManager";
import { Game } from "./Game";
import { go, playToggle } from "./ProgressBar";
import { toggleMetadataPanel } from "./SidePanel";
import { Container, FlexBox } from "./Stats";
import { BPM } from "./BPM";

export class Button {
    isAlt = false;
    container;

    constructor(x, y, imgURL, altImgURL) {
        this.x = x;
        this.y = y;
        this._color = Game.COLOR_PALETTES.primary2;
        this.imgURL = imgURL;
        this.altImgURL = altImgURL ?? imgURL;

        this.texture = PIXI.Texture.from(this.imgURL);
        this.altTexture = altImgURL ? PIXI.Texture.from(this.altImgURL) : this.texture;

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
        this.container.on("click", fn);
        this.container.on("tap", fn);
        this._onclick = fn;
    }

    redraw() {
        this.graphics.clear().beginFill(this.color).drawRect(0, 0, 60 * devicePixelRatio, 60 * devicePixelRatio);

        this.container.x = this.x * devicePixelRatio;
        this.container.y = this.y * devicePixelRatio;

        this.sprite.scale.set(devicePixelRatio * (this.imgURL === "static/info.png" ? 1 : 0.75));
        this.sprite.x = 30 * devicePixelRatio;
        this.sprite.y = 30 * devicePixelRatio;
    }
}

export class PlayContainer {
    static init() {
        this.MASTER_CONTAINER = new Container();
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary2;
        this.MASTER_CONTAINER.alpha = 1;

        this.flex = new FlexBox();

        this.playButton = new Button(60, 0, "static/play.png", "static/pause.png");
        this.playButton.onclick = () => playToggle();

        this.prevButton = new Button(0, 0, "static/prev.png");
        this.prevButton.onclick = () => go(null, false);

        this.nextButton = new Button(120, 0, "static/next.png");
        this.nextButton.onclick = () => go(null, true);

        this.infoButton = new Button(180, 0, "static/info.png");
        this.infoButton.onclick = () => toggleMetadataPanel();

        this.flex.addChild(this.prevButton.container);
        this.flex.addChild(this.playButton.container);
        this.flex.addChild(this.nextButton.container);
        this.flex.addChild(this.infoButton.container);

        this.MASTER_CONTAINER.addChild(this.flex.container);
    }

    static update() {
        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.x = 0;
            this.MASTER_CONTAINER.y = BPM.MASTER_CONTAINER.y + BPM.MASTER_CONTAINER.h;
            this.MASTER_CONTAINER.width = Game.WRAPPER.w;
        } else {
            this.MASTER_CONTAINER.x = 290 * devicePixelRatio;
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60 * devicePixelRatio;
            this.MASTER_CONTAINER.width =  240 * devicePixelRatio;
        }

        this.MASTER_CONTAINER.container.h = 60 * devicePixelRatio;


        this.playButton.redraw();
        this.prevButton.redraw();
        this.nextButton.redraw();
        this.infoButton.redraw();

        this.MASTER_CONTAINER.update();
    }
}
