import * as PIXI from "pixi.js";
import { Timeline } from "./Timeline";
import { Clamp } from "../Utils";
import { Game } from "../Game";

class Button {
    x;
    y;
    w;
    h;

    isHover = false;
    container;

    async init(x, y, w, h, imgURL) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.graphics = new PIXI.Graphics().rect(0, 0, w, h).fill(Game.COLOR_PALETTES.primary3);

        this.container = new PIXI.Container();
        this.container.on("mouseenter", () => {
            this.isHover = true;
            this.draw();
        });
        this.container.on("mouseleave", () => {
            this.isHover = false;
            this.draw();
        });
        this.container.eventMode = "static";

        this.container.x = this.x;
        this.container.y = this.y;

        this.container.addChild(this.graphics);

        if (imgURL) {
            const texture = await PIXI.Assets.load(imgURL);
            const sprite = new PIXI.Sprite(texture);
            this.container.addChild(sprite);

            sprite.anchor.set(0.5);
            sprite.x = this.w / 2;
            sprite.y = this.h / 2;

            this.sprite = sprite;
        }
    }

    constructor() {}

    setOnClick(fn) {
        this.container.on("click", fn);
        this.container.on("tap", fn);
    }

    draw(timestamp) {
        this.h = Timeline.MASTER_CONTAINER.h / 2;

        this.container.x = this.x;
        this.container.y = this.y === 0 ? 0 : Timeline.MASTER_CONTAINER.h / 2;

        this.graphics
            .clear()
            .rect(0, 0, this.w * devicePixelRatio, this.h)
            .fill(!this.isHover ? Game.COLOR_PALETTES.primary3 : Game.COLOR_PALETTES.primary4);

        if (!this.sprite) return;

        this.sprite.scale.set(0.5 * devicePixelRatio);
        this.sprite.x = (this.w * devicePixelRatio) / 2;
        this.sprite.y = this.h / 2;
    }
}

export class TimelineZoomer {
    graphics;
    zoomIn;
    zoomOut;

    container;

    async init() {
        this.graphics = new PIXI.Graphics().rect(0, 0, 40, Timeline.HEIGHT).fill(Game.COLOR_PALETTES.primary3);

        this.container = new PIXI.Container();
        this.container.addChild(this.graphics);

        this.zoomIn = new Button();
        await this.zoomIn.init(0, 0, 40, Timeline.MASTER_CONTAINER.h / 2, "static/plus2.svg");

        this.zoomOut = new Button();
        await this.zoomOut.init(0, Timeline.MASTER_CONTAINER.h / 2, 40, Timeline.MASTER_CONTAINER.h / 2, "static/minus.svg");

        this.container.addChild(this.zoomIn.container);
        this.container.addChild(this.zoomOut.container);

        this.zoomIn.setOnClick(() => {
            Timeline.ZOOM_DISTANCE = Clamp(Timeline.ZOOM_DISTANCE + 1 * 20, 20, 800);
            Game.WORKER.postMessage({
                type: "range",
                range: (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500 + Timeline.LOOK_AHEAD,
            });
        });

        this.zoomOut.setOnClick(() => {
            Timeline.ZOOM_DISTANCE = Clamp(Timeline.ZOOM_DISTANCE - 1 * 20, 20, 800);
            Game.WORKER.postMessage({
                type: "range",
                range: (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500 + Timeline.LOOK_AHEAD,
            });
        });
    }

    constructor() {}

    draw(timestamp) {
        this.graphics
            .clear()
            .rect(0, 0, 40 * devicePixelRatio, Timeline.HEIGHT)
            .fill(Game.COLOR_PALETTES.primary3);
        this.zoomIn.draw(timestamp);
        this.zoomOut.draw(timestamp);
    }
}
