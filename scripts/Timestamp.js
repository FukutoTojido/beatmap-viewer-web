import { ObjectsController } from "./HitObjects/ObjectsController.js";
import { parseTime } from "./ProgressBar.js";
import * as PIXI from "pixi.js";
import { Component } from "./WindowManager.js";
import { Game } from "./Game.js";

export class Timestamp {
    static renderer;
    static stage;

    static WIDTH;
    static HEIGHT;

    static MASTER_CONTAINER;

    static digits = {
        minutes: [],
        seconds: [],
        miliseconds: [],
    };

    static createDigit(x = 0, type = "digit") {
        const digit = new PIXI.BitmapText(type === "digit" ? `0` : ":", {
            fontName: "Torus",
            fontSize: 16,
            align: "center",
        });

        digit.anchor.set(0.5);
        digit.x = x;
        digit.y = type === "digit" ? this.HEIGHT / 2 : this.HEIGHT / 2 - 1;

        return digit;
    }

    static init() {
        // this.renderer = new PIXI.Renderer({ width: 110, height: 60, backgroundColor: 0x4c566a, antialias: true, autoDensity: true });
        // document.querySelector("#timeContainer").append(this.renderer.view);

        this.MASTER_CONTAINER = new Component(0, Game.WRAPPER.h - 60 * devicePixelRatio, 110 * devicePixelRatio, 60 * devicePixelRatio);
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary4;
        this.MASTER_CONTAINER.alpha = 1;

        this.MASTER_CONTAINER.masterContainer.on("mouseenter", () => {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary5;
        });

        this.MASTER_CONTAINER.masterContainer.on("mouseleave", () => {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary4;
        });

        this.stage = this.MASTER_CONTAINER.container;

        this.WIDTH = 120 * devicePixelRatio;
        this.HEIGHT = 60 * devicePixelRatio;

        const timeContainer = new PIXI.Container();
        const minutes = new PIXI.Container();
        const seconds = new PIXI.Container();
        const miliseconds = new PIXI.Container();

        this.colons = [];

        for (let i = 0; i < 2; i++) {
            const digit = this.createDigit(i * 9);
            minutes.addChild(digit);
            this.digits.minutes.push(digit);
        }

        this.colons.push(this.createDigit(16, "colon"));
        minutes.addChild(this.colons.at(-1));

        for (let i = 0; i < 2; i++) {
            const digit = this.createDigit(i * 9);
            seconds.addChild(digit);
            this.digits.seconds.push(digit);
        }

        this.colons.push(this.createDigit(16, "colon"));
        seconds.addChild(this.colons.at(-1));

        for (let i = 0; i < 3; i++) {
            const digit = this.createDigit(i * 9);
            miliseconds.addChild(digit);
            this.digits.miliseconds.push(digit);
        }

        minutes.x = 0;
        seconds.x = 24;
        miliseconds.x = 48;

        timeContainer.addChild(minutes, seconds, miliseconds);
        timeContainer.x = 23;

        this.minutes = minutes;
        this.seconds = seconds;
        this.miliseconds = miliseconds;
        this.timeContainer = timeContainer;

        this.stage.addChild(timeContainer);
    }

    static update(time) {
        this.MASTER_CONTAINER.x = 0;
        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.y = Game.STATS.container.y + Game.STATS.container.height;
            this.MASTER_CONTAINER.w = Game.WRAPPER.w / 2;
            this.timeContainer.x = (this.MASTER_CONTAINER.w - this.timeContainer.width) / 2;
        } else {
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60 * devicePixelRatio;
            this.MASTER_CONTAINER.w = 110 * devicePixelRatio;
            this.timeContainer.x = 23 * devicePixelRatio;
        }
        this.MASTER_CONTAINER.h = 60 * devicePixelRatio;

        this.WIDTH = 120 * devicePixelRatio;
        this.HEIGHT = 60 * devicePixelRatio;

        const currentDigits = parseTime(time);
        const lastDigits = parseTime(ObjectsController.time);

        this.minutes.x = 0;
        this.seconds.x = 24 * devicePixelRatio;
        this.miliseconds.x = 48 * devicePixelRatio;

        currentDigits.miliseconds.forEach((val, idx) => {
            if (val === lastDigits.miliseconds[idx]) return;
            this.digits.miliseconds[idx].text = val;
            this.digits.miliseconds[idx].x = 9 * idx * devicePixelRatio;
            this.digits.miliseconds[idx].y = this.HEIGHT / 2;
            this.digits.miliseconds[idx].fontSize = 16 * devicePixelRatio;
        });

        currentDigits.seconds.forEach((val, idx) => {
            if (val === lastDigits.seconds[idx]) return;
            this.digits.seconds[idx].text = val;
            this.digits.seconds[idx].x = 9 * idx * devicePixelRatio;
            this.digits.seconds[idx].y = this.HEIGHT / 2;
            this.digits.seconds[idx].fontSize = 16 * devicePixelRatio;
        });

        currentDigits.minutes.forEach((val, idx) => {
            if (val === lastDigits.minutes[idx]) return;
            this.digits.minutes[idx].text = val;
            this.digits.minutes[idx].x = 9 * idx * devicePixelRatio;
            this.digits.minutes[idx].y = this.HEIGHT / 2;
            this.digits.minutes[idx].fontSize = 16 * devicePixelRatio;
        });

        this.colons.forEach((colon) => {
            colon.x = 16 * devicePixelRatio;
            colon.y = this.HEIGHT / 2 - 1 * devicePixelRatio;
            colon.fontSize = 16 * devicePixelRatio;
        });

        // this.renderer.render(this.stage);
    }
}
