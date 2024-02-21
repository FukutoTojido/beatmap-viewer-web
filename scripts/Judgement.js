import { easeOutSine, easeOutQuint, Clamp } from "./Utils.js";
import { Game } from "./Game.js";
import { Beatmap } from "./Beatmap.js";
import * as PIXI from "pixi.js";

export class Judgement {
    val;
    pos;
    stackHeight;
    time;

    disablePerfect = null;

    static FADE_OUT_DURATION = 100;
    static ANIM_DURATION = 800;

    obj;
    text;

    static judge = {
        300: {
            text: "GREAT",
            color: 0x6cb3e6,
        },
        100: {
            text: "OK",
            color: 0x6ce083,
        },
        50: {
            text: "MEH",
            color: 0xd6d669,
        },
        0: {
            text: "MISSED",
            color: 0xf54949,
        },
    };

    constructor(time, val, stackHeight, pos) {
        this.time = time;
        this.val = val;
        this.pos = pos;
        this.stackHeight = stackHeight;

        const text = new PIXI.Text({
            text: `${Judgement.judge[val].text}`,
            style: {
                fontFamily: "Torus",
                fontSize: 10,
                fontWeight: 500,
                fill: Judgement.judge[val].color,
                align: "center",
                letterSpacing: 4,
            },
        });
        text.anchor.set(0.5);

        const judgementContainer = new PIXI.Container();
        judgementContainer.addChild(text);

        this.obj = judgementContainer;
        this.text = text;

        // const currentStackOffset = Beatmap.moddedStats.stackOffset;

        // const x = ((this.pos.x + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
        // const y = !Game.MODS.HR
        //     ? ((this.pos.y + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512
        //     : ((384 - this.pos.y + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;

        // this.obj.x = x;
        // this.obj.y = y;
        this.obj.alpha = 0;
    }

    draw(timestamp) {
        // if (this.val === 300)
        //     return;

        // const currentStackOffset = Beatmap.moddedStats.stackOffset;

        // const x = ((this.pos.x + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
        // const y = !Game.MODS.HR
        //     ? ((this.pos.y + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512
        //     : ((384 - this.pos.y + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;

        // if (this.obj.x !== x) this.obj.x = x;
        // if (this.obj.y !== y) this.obj.y = y;

        if (this.val === 300 && this.disablePerfect !== Game.SLIDER_APPEARANCE.disablePerfect) {
            this.disablePerfect = Game.SLIDER_APPEARANCE.disablePerfect;

            if (this.disablePerfect) {
                this.obj.visible = false;
                return;
            }

            this.obj.visible = true;
        }

        if (timestamp < this.time || timestamp >= this.time + Judgement.ANIM_DURATION) {
            this.obj.alpha = 0;
            return;
        }

        const t = Clamp((timestamp - this.time) / Judgement.ANIM_DURATION, 0, 1);

        if (this.val !== 0) {
            const scale = 1 + 0.4 * easeOutQuint(Clamp((timestamp - this.time) / 800, 0, 1));
            // const spacing = 4 + 1 * easeOutQuint(t);
            const alpha = 1 - t ** 5;

            this.obj.scale.set(scale);
            this.obj.alpha = alpha;
            // this.text.style.letterSpacing = spacing;
        }

        if (this.val === 0) {
            const scale = 1.6 - 0.6 * easeOutSine(Clamp((timestamp - this.time) / 100, 0, 1));
            // const spacing = 4 + 1 * easeOutQuint(t);
            const alpha = 1 - t ** 5;

            this.obj.scale.set(scale);
            this.obj.alpha = alpha;

            this.text.y = 100 * t ** 5;
            this.text.angle = 40 * t ** 5;
            // this.text.style.letterSpacing = spacing;
        }

        // if (this.time === 4715)
        //     console.log(t, alpha);
    }
}
