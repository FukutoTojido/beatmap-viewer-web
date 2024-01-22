import * as PIXI from "pixi.js";
import { Component } from "./WindowManager";
import { Game } from "./Game";

export class TitleArtist {
    constructor() {
        this._title = "A VERY LONG TITLE TITLE ABCDXZY";
        this._artist = "A VERY LONG ARTIST ARTIST ABSDYYLXC";
        this._difficulty = "A STUPID DIFFICULTY NAME THAT SOUNDS EDGY AF LIKE SOMETHING FROM ME OR SOME METAL MAPPERS IDK";
        this._mapper = "EEEEEEEEEEEEEEEE";

        this.titleArtist = new PIXI.Text(`${this._artist} - ${this._title}`, {
            fontFamily: "Torus",
            fontWeight: 600,
            fontSize: 20,
            fill: 0xffffff,
            wordWrap: true,
        });

        this.diffMapper = new PIXI.Text(`Difficulty: ${this._difficulty} - Mapset by ${this._mapper} `, {
            fontFamily: "Torus",
            fontWeight: 500,
            fontSize: 16,
            fill: 0xffffff,
            wordWrap: true,
        });

        this.MASTER_CONTAINER = new Component(
            0,
            0,
            Math.max(this.titleArtist.width, this.diffMapper.width),
            this.titleArtist.height + 5 * devicePixelRatio + this.diffMapper.height
        );
        this.MASTER_CONTAINER.borderBox = false;
        this.MASTER_CONTAINER.padding = 20;

        this.MASTER_CONTAINER.container.addChild(this.titleArtist, this.diffMapper);
        this.diffMapper.y = 5 * devicePixelRatio + this.titleArtist.height;

        this.MASTER_CONTAINER.overflow = "visible";
    }

    get title() {
        return this._title;
    }
    set title(val) {
        this._title = val;
        this.titleArtist.text = `${this._artist} - ${this._title}`;
        this.resize();
    }

    get artist() {
        return this._artist;
    }
    set artist(val) {
        this._artist = val;
        this.titleArtist.text = `${this._artist} - ${this._title}`;
        this.resize();
    }

    get difficulty() {
        return this._difficulty;
    }
    set difficulty(val) {
        this._difficulty = val;
        this.diffMapper.text = `Difficulty: ${this._difficulty} - Mapset by ${this._mapper}`;
        this.resize();
    }

    get mapper() {
        return this._mapper;
    }
    set mapper(val) {
        this._mapper = val;
        this.diffMapper.text = `Difficulty: ${this._difficulty} - Mapset by ${this._mapper}`;
        this.resize();
    }

    resize() {
        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.w = Game.WRAPPER.w;
        } else {
            this.MASTER_CONTAINER.w = Math.max(this.titleArtist.width, this.diffMapper.width);
        }

        this.MASTER_CONTAINER.h = this.titleArtist.height + 5 + this.diffMapper.height;
    }

    update() {
        this.titleArtist.style.fontSize = 20 * devicePixelRatio;
        this.titleArtist.style.wordWrapWidth = Game.WRAPPER.w - this.MASTER_CONTAINER.padding * 2;

        this.diffMapper.style.fontSize = 14 * devicePixelRatio;
        this.diffMapper.style.wordWrapWidth = Game.WRAPPER.w - this.MASTER_CONTAINER.padding * 2;

        this.diffMapper.y = 5 * devicePixelRatio + this.titleArtist.height;

        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary3;
            this.MASTER_CONTAINER.alpha = 1;

            this.MASTER_CONTAINER.y = Game.MASTER_CONTAINER.h;
        } else {
            this.MASTER_CONTAINER.alpha = 0;
            this.MASTER_CONTAINER.y = 0;
        }

        this.resize();
    }
}
