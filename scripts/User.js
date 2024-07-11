import * as PIXI from "pixi.js";
import { Game } from "./Game";

export class User {
    static container = new PIXI.Container();
    static graphics = new PIXI.Graphics();
    static username = new PIXI.Text({
        style: {
            fontFamily: "Torus",
            fontWeight: 500,
            fontSize: 16 * devicePixelRatio,
            fill: 0xffffff,
            wordWrap: true,
        },
    });
    static mods = [];
    static modsContainer = new PIXI.Container();
    static textures = {};

    static async init() {
        const metrics = PIXI.CanvasTextMetrics.measureText("a", this.username.style);
        this.username.x = 10 * devicePixelRatio;
        this.username.y = (40 * devicePixelRatio - metrics.height) / 2;

        this.container.label = "User";
        this.container.x = 10 * devicePixelRatio;
        this.container.y = Game.WRAPPER.h - 20 * devicePixelRatio;
        this.container.addChild(this.graphics, this.username, this.modsContainer);
        this.container.visible = false;

        for (const mod of [
            "DoubleTime",
            "Easy",
            "Flashlight",
            "HalfTime",
            "HardRock",
            "Hidden",
            "Nightcore",
            "NoFail",
            "Perfect",
            "ScoreV2",
            "SpunOut",
            "SuddenDeath",
        ]) {
            this.textures[mod] = await PIXI.Assets.load({ src: `/static/mods/${mod}.png`, loadParser: "loadTextures" });
        }
    }

    static forceResize() {
        let userHeight = 60 * devicePixelRatio;
        if (innerWidth / innerHeight < 1) {
            userHeight = 40 * devicePixelRatio;
            this.container.x = 10 * devicePixelRatio;
            this.container.y = Game.MASTER_CONTAINER.h + (50 - 10) * devicePixelRatio - userHeight;
        } else {
            this.container.x = 10 * devicePixelRatio;
            this.container.y = Game.APP.renderer.height - (60 + 60 + 10) * devicePixelRatio;
        }

        this.username.style = {
            fontFamily: "Torus",
            fontWeight: 500,
            fontSize: innerWidth / innerHeight < 1 ? 12 * devicePixelRatio : 16 * devicePixelRatio,
            fill: 0xffffff,
            wordWrap: true,
        };
        const metrics = PIXI.CanvasTextMetrics.measureText(this.username.text, this.username.style);
        this.username.x = 20 * devicePixelRatio;
        this.username.y = (userHeight - metrics.height) / 2;

        this.mods.forEach((sprite, idx) => {
            sprite.width = (innerWidth / innerHeight < 1 ? 21.25 : 42.5) * devicePixelRatio;
            sprite.height = (innerWidth / innerHeight < 1 ? 20 : 40) * devicePixelRatio;
            sprite.x = idx * (innerWidth / innerHeight < 1 ? 10 : 20) * devicePixelRatio;
            // sprite.y = 40 * devicePixelRatio / 2;
        });
        this.modsContainer.x = 30 * devicePixelRatio + metrics.width;
        this.modsContainer.y = (userHeight - (innerWidth / innerHeight < 1 ? 20 : 40) * devicePixelRatio) / 2;

        this.graphics
            .clear()
            .roundRect(0, 0, 40 * devicePixelRatio + metrics.width + this.modsContainer.width, userHeight, 5 * devicePixelRatio)
            .fill({ color: 0x000000, alpha: 0.5 });
    }

    static resize() {
        if (Game.EMIT_STACK.length === 0) return;
        this.forceResize();
    }

    static async updateInfo(userInfo) {
        if (!userInfo) {
            this.container.visible = false;
            return;
        }

        this.container.visible = true;

        this.username.text = userInfo.username;

        this.modsContainer.removeChildren();
        this.mods = userInfo.mods.map((mod) => {
            const sprite = new PIXI.Sprite();
            sprite.texture = this.textures[mod];
            this.modsContainer.addChild(sprite);

            return sprite;
        });

        this.forceResize();
    }
}
