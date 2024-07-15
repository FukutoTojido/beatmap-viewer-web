import * as PIXI from "pixi.js";
import { Component } from "./WindowManager";
import { Game } from "./Game";
import { Text } from "./UI/Text";
import { FlexBox } from "./UI/FlexBox";
import { Timestamp } from "./Timestamp";
import { ProgressBar } from "./Progress";
import { BPM } from "./BPM";
import { PlayContainer } from "./PlayButtons";
import { Beatmap } from "./Beatmap";

export class TitleArtist {
    onHover = false;

    constructor() {
        this._title = "";
        this._artist = "";
        this._difficulty = "";
        this._mapper = "";

        this.titleArtist = new Text({
            text: `${this._artist} - ${this._title}`,
            // renderMode: "html",
            style: {
                fontFamily: "Torus",
                fontWeight: 600,
                fontSize: 20 * devicePixelRatio,
                fill: 0xffffff,
                wordWrap: true,
            },
        });

        this.diffMapper = new Text({
            text: `Difficulty: ${this._difficulty} - Mapset by ${this._mapper} `,
            // renderMode: "html",
            style: {
                fontFamily: "Torus",
                fontWeight: 500,
                fontSize: 16 * devicePixelRatio,
                fill: 0xffffff,
                wordWrap: true,
            },
        });

        this.MASTER_CONTAINER = new Component(
            0,
            0,
            Math.max(this.titleArtist.width, this.diffMapper.width),
            this.titleArtist.height + 5 * devicePixelRatio + this.diffMapper.height
        );
        this.MASTER_CONTAINER.borderBox = false;
        this.MASTER_CONTAINER.padding = 20;
        this.MASTER_CONTAINER.container.label = "TitleArtist";

        this.flex = new FlexBox();
        this.flex.flexDirection = "row";
        this.flex.gap = 5;
        this.flex.justifyContent = "start";

        this.titleArtist.style.wordWrapWidth = Game.WRAPPER.w - this.MASTER_CONTAINER.padding * 2;
        this.diffMapper.style.wordWrapWidth = Game.WRAPPER.w - this.MASTER_CONTAINER.padding * 2;
        this.flex.addChild(this.titleArtist, this.diffMapper);

        this.MASTER_CONTAINER.overflow = "visible";
        this.MASTER_CONTAINER.container.addChild(this.flex.container);

        this.MASTER_CONTAINER.container.eventMode = "static";

        this.MASTER_CONTAINER.container.on("mouseenter", (e) => {
            if (!Beatmap.HREF) return;
            this.titleArtist.color = 0xffbb00;
            this.diffMapper.color = 0xffbb00;
        });

        this.MASTER_CONTAINER.container.on("mouseleave", (e) => {
            this.titleArtist.color = 0xffffff;
            this.diffMapper.color = 0xffffff;
        });

        this.MASTER_CONTAINER.container.on("click", (e) => {
            if (!Beatmap.HREF) return;
            open(Beatmap.HREF);
        });

        this.MASTER_CONTAINER.container.on("tap", (e) => {
            if (!Beatmap.HREF) return;
            open(Beatmap.HREF);
        });

        this.update();
    }

    get title() {
        return this._title;
    }
    set title(val) {
        this._title = val;
        this.titleArtist.text = `${this._artist} - ${this._title}`;
        this.update();
    }

    get artist() {
        return this._artist;
    }
    set artist(val) {
        this._artist = val;
        this.titleArtist.text = `${this._artist} - ${this._title}`;
        this.update();
    }

    get difficulty() {
        return this._difficulty;
    }
    set difficulty(val) {
        this._difficulty = val;
        this.diffMapper.text = `Difficulty: ${this._difficulty} - Mapset by ${this._mapper}`;
        this.update();
    }

    get mapper() {
        return this._mapper;
    }
    set mapper(val) {
        this._mapper = val;
        this.diffMapper.text = `Difficulty: ${this._difficulty} - Mapset by ${this._mapper}`;
        this.update();
    }

    resizeWidth() {
        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.w = Game.WRAPPER.w;
        } else {
            this.MASTER_CONTAINER.w = Math.max(this.titleArtist.width, this.diffMapper.width);
        }
    }

    resizeHeight() {
        this.MASTER_CONTAINER.h = this.titleArtist.height + 5 + this.diffMapper.height;
    }

    resize() {
        this.resizeWidth();
        this.resizeHeight();
    }

    update() {
        this.titleArtist.style.fontSize = 20 * devicePixelRatio;
        this.diffMapper.style.fontSize = 14 * devicePixelRatio;
        // this.diffMapper.sprite.y = 5 * devicePixelRatio + this.titleArtist.height;

        this.titleArtist.style.wordWrapWidth = Game.WRAPPER.w - this.MASTER_CONTAINER.padding * 2;
        this.diffMapper.style.wordWrapWidth = Game.WRAPPER.w - this.MASTER_CONTAINER.padding * 2;
        // this.diffMapper.sprite.y = 5 * devicePixelRatio + this.titleArtist.height;

        this.titleArtist.update();
        this.diffMapper.update();
        this.flex.update();

        this.resize();

        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
            this.MASTER_CONTAINER.alpha = 1;

            this.MASTER_CONTAINER.y = Game.MASTER_CONTAINER.h;
        } else {
            this.MASTER_CONTAINER.alpha = 0;
            this.MASTER_CONTAINER.y = 0;
        }

        this.MASTER_CONTAINER.redraw();

        if (innerWidth / innerHeight < 1) {
            const currentTime = Game.BEATMAP_FILE?.audioNode?.getCurrentTime();
            Game.STATS?.update();
            Timestamp.rePosition();
            BPM.forceUpdate();
            PlayContainer.forceUpdate();
            ProgressBar.forceResize();
        }
    }
}
