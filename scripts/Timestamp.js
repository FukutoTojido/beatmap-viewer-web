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

        this.MASTER_CONTAINER = new Component(0, Game.APP.renderer.height - 60, 110, 60);
        this.MASTER_CONTAINER.alpha = 1;
        
        this.stage = this.MASTER_CONTAINER.container;

        this.WIDTH = 120;
        this.HEIGHT = 60;

        const timeContainer = new PIXI.Container();
        const minutes = new PIXI.Container();
        const seconds = new PIXI.Container();
        const miliseconds = new PIXI.Container();

        for (let i = 0; i < 2; i++) {
            const digit = this.createDigit(i * 9);
            minutes.addChild(digit);
            this.digits.minutes.push(digit);
        }
        minutes.addChild(this.createDigit(16, "colon"));

        for (let i = 0; i < 2; i++) {
            const digit = this.createDigit(i * 9);
            seconds.addChild(digit);
            this.digits.seconds.push(digit);
        }
        seconds.addChild(this.createDigit(16, "colon"));

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

        this.stage.addChild(timeContainer);
    }

    static update(time) {
        const currentDigits = parseTime(time);
        const lastDigits = parseTime(ObjectsController.time);

        currentDigits.miliseconds.forEach((val, idx) => {
            if (val === lastDigits.miliseconds[idx]) return;
            this.digits.miliseconds[idx].text = val;
        });

        currentDigits.seconds.forEach((val, idx) => {
            if (val === lastDigits.seconds[idx]) return;
            this.digits.seconds[idx].text = val;
        });

        currentDigits.minutes.forEach((val, idx) => {
            if (val === lastDigits.minutes[idx]) return;
            this.digits.minutes[idx].text = val;
        });

        // this.renderer.render(this.stage);
    }
}
