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

    constructor(x, y, w, h, imgURL) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.graphics = new PIXI.Graphics().beginFill(Game.COLOR_PALETTES.primary3).drawRect(x, y, w, h);
        this.graphics.eventMode = "static";

        this.graphics.on("mouseenter", () => (this.isHover = true));
        this.graphics.on("mouseleave", () => (this.isHover = false));

        if (imgURL) {
            const texture = PIXI.Texture.from(imgURL);
            const sprite = new PIXI.Sprite(texture);
            this.graphics.addChild(sprite);

            sprite.anchor.set(0.5);
            sprite.x = this.x + this.w / 2;
            sprite.y = this.y + this.h / 2;
            sprite.width = this.h - 10;
            sprite.height = this.h - 10;
        }
    }

    setOnClick(fn) {
        this.graphics.on("click", fn);
    }

    draw(timestamp) {
        this.graphics
            .clear()
            .beginFill(!this.isHover ? Game.COLOR_PALETTES.primary3 : Game.COLOR_PALETTES.primary4)
            .drawRect(this.x, this.y, this.w, this.h);
    }
}

export class TimelineZoomer {
    graphics;
    zoomIn;
    zoomOut;

    constructor() {
        this.graphics = new PIXI.Graphics().beginFill(Game.COLOR_PALETTES.primary3).drawRect(0, 0, 40, Timeline.HEIGHT);

        this.zoomIn = new Button(0, 0, 40, Timeline.MASTER_CONTAINER.h / 2, "static/plus.png");
        this.zoomOut = new Button(0, Timeline.MASTER_CONTAINER.h / 2, 40, Timeline.MASTER_CONTAINER.h / 2, "static/minus.png");

        this.graphics.addChild(this.zoomIn.graphics);
        this.graphics.addChild(this.zoomOut.graphics);

        this.zoomIn.setOnClick(() => {
            Timeline.ZOOM_DISTANCE = Clamp(Timeline.ZOOM_DISTANCE + 1 * 20, 20, 800);
        });

        this.zoomOut.setOnClick(() => {
            Timeline.ZOOM_DISTANCE = Clamp(Timeline.ZOOM_DISTANCE - 1 * 20, 20, 800);
        });
    }

    draw(timestamp) {
        this.zoomIn.draw(timestamp);
        this.zoomOut.draw(timestamp);
    }
}
