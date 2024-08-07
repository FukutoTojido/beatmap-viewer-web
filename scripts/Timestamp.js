import { ObjectsController } from "./HitObjects/ObjectsController.js";
import { parseTime } from "./ProgressBar.js";
import * as PIXI from "pixi.js";
import { Component } from "./WindowManager.js";
import { Game } from "./Game.js";
import { Beatmap } from "./Beatmap.js";
import { Timeline } from "./Timeline/Timeline.js";

export function closePopup() {
    const popup = document.querySelector(".seekTo");

    popup.classList.remove("popupAnim");
    popup.classList.add("popoutAnim");
    popup.close();
}

export function openPopup() {
    const popup = document.querySelector(".seekTo");

    popup.classList.remove("popoutAnim");
    popup.classList.add("popupAnim");
    popup.show();
}

export function showPopup() {
    const popup = document.querySelector(".seekTo");
    const timeInput = document.querySelector("#jumpToTime");
    timeInput.blur();

    if (!popup.open) {
        if (Game.BEATMAP_FILE?.audioNode) {
            const currentTime = Game.BEATMAP_FILE.audioNode.getCurrentTime();

            const minute = Math.floor(currentTime / 60000);
            const second = Math.floor((currentTime - minute * 60000) / 1000);
            const mili = currentTime - minute * 60000 - second * 1000;

            timeInput.value = `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}:${mili.toFixed(0).padStart(3, "0")}`;

            const origin = window.location.origin;
            const currentTimestamp = Game.BEATMAP_FILE !== undefined ? Game.BEATMAP_FILE.audioNode.getCurrentTime() : 0;
            const mapId = Beatmap.CURRENT_MAPID || "";
            document.querySelector("#previewURL").value = `${origin}${
                !origin.includes("github.io") ? "" : "/beatmap-viewer-how"
            }?b=${mapId}&t=${currentTimestamp}`;
        }

        openPopup();
        return;
    }

    closePopup();
}

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

    static EMIT_CHANGE = false;

    static createDigit(x = 0, type = "digit") {
        const digit = new PIXI.BitmapText({
            text: type === "digit" ? `0` : ":",
            // renderMode: "bitmap",
            style: {
                fontFamily: "Torus16",
                fontSize: 16 ,
                align: "center",
                fontWeight: 400,
            },
        });

        digit.anchor.set(0.5);
        digit.x = x;
        digit.y = type === "digit" ? this.HEIGHT / 2 : this.HEIGHT / 2 - 1;

        return digit;
    }

    static init() {
        // this.renderer = new PIXI.Renderer({ width: 110, height: 60, backgroundColor: 0x4c566a, antialias: true, autoDensity: true });
        // document.querySelector("#timeContainer").append(this.renderer.view);

        this.MASTER_CONTAINER = new Component(0, Game.WRAPPER.h - 60 , 110 , 60 );
        this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary4;
        this.MASTER_CONTAINER.alpha = 1;

        this.MASTER_CONTAINER.masterContainer.on("mouseenter", () => {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary5;
        });

        this.MASTER_CONTAINER.masterContainer.on("mouseleave", () => {
            this.MASTER_CONTAINER.color = Game.COLOR_PALETTES.primary4;
        });

        this.stage = this.MASTER_CONTAINER.container;

        this.WIDTH = 120 ;
        this.HEIGHT = 60 ;

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
        seconds.x = 24 ;
        miliseconds.x = 48 ;

        timeContainer.addChild(minutes, seconds, miliseconds);
        timeContainer.x = 23;

        this.minutes = minutes;
        this.seconds = seconds;
        this.miliseconds = miliseconds;
        this.timeContainer = timeContainer;

        this.stage.addChild(timeContainer);
        this.rePosition();

        this.MASTER_CONTAINER.masterContainer.on("click", () => {
            showPopup();
        });

        this.MASTER_CONTAINER.masterContainer.on("tap", () => {
            showPopup();
        });
    }

    static rePosition() {
        if (!this.MASTER_CONTAINER) return;

        this.MASTER_CONTAINER.x = 0;
        if (innerWidth / innerHeight < 1) {
            this.MASTER_CONTAINER.y = Game.STATS.container.y + Game.STATS.container.height + 60 - Timeline.HEIGHT_REDUCTION;
            this.MASTER_CONTAINER.w = Game.WRAPPER.w / 2;
            this.timeContainer.x = (this.MASTER_CONTAINER.w - this.timeContainer.width) / 2;
        } else {
            this.MASTER_CONTAINER.y = Game.WRAPPER.h - 60 ;
            this.MASTER_CONTAINER.w = 110 ;
            this.timeContainer.x = 23 ;
        }
        this.MASTER_CONTAINER.h = 60 ;

        this.WIDTH = 120 ;
        this.HEIGHT = 60 ;

        this.minutes.x = 0;
        this.seconds.x = 24 ;
        this.miliseconds.x = 48 ;

        this.colons.forEach((colon) => {
            colon.x = 16 ;
            colon.y = this.HEIGHT / 2 - 1 ;
            colon.style.fontSize = 16 ;
        });

        this.digits.minutes.forEach((digit, idx) => {
            digit.x = 9 * idx ;
            digit.y = this.HEIGHT / 2;
            digit.style.fontSize = 16 ;
        });

        this.digits.seconds.forEach((digit, idx) => {
            digit.x = 9 * idx ;
            digit.y = this.HEIGHT / 2;
            digit.style.fontSize = 16 ;
        });

        this.digits.miliseconds.forEach((digit, idx) => {
            digit.x = 9 * idx ;
            digit.y = this.HEIGHT / 2;
            digit.style.fontSize = 16 ;
        });
    }

    static forceUpdate(time) {
        const currentDigits = parseTime(time);
        const lastDigits = parseTime(ObjectsController.lastTimestamp ?? 0);

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

        if (!this.EMIT_CHANGE) return;
        this.rePosition();
    }

    static update(time) {
        if (Game.IS_FULLSCREEN) {
            this.MASTER_CONTAINER.masterContainer.visible = Game.IS_HOVERING_PROGRESS;
        } else {
            this.MASTER_CONTAINER.masterContainer.visible = true;
        }
        
        if (Game.EMIT_STACK.length !== 0) this.EMIT_CHANGE = true;

        this.forceUpdate(time);
        this.EMIT_CHANGE = false;
        // this.renderer.render(this.stage);
    }
}
