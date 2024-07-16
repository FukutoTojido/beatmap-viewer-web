import { TimelineDragWindow } from "./DragWindow.js";
import { BeatLines } from "./BeatLines.js";
import { binarySearch } from "../Utils.js";
import { Game } from "../Game.js";
import { Component } from "../WindowManager.js";
import * as PIXI from "pixi.js";
import { TimelineZoomer } from "./Zoomer.js";
import { TimelineHitCircle } from "./HitCircle.js";

export class Timeline {
    static obj;
    static hitArea;
    static centerLine;
    static beatLines;
    static APP;
    static WIDTH;
    static HEIGHT;
    static ZOOM_DISTANCE = 200;
    static LOOK_AHEAD = 300;
    static DRAW_LIST = [];
    static SHOW_GREENLINE = false;
    static MASTER_CONTAINER;
    static BASE_CONTAINER;
    static ZOOMER;

    static HEIGHT_REDUCTION = 0;

    static async init() {
        Timeline.HEIGHT_REDUCTION = !Game.IS_FULLSCREEN ? 0 : 60 ;
        Timeline.MASTER_CONTAINER = new Component(0, 0, Game.APP.renderer.width, 60  - Timeline.HEIGHT_REDUCTION);
        Timeline.MASTER_CONTAINER.color = 0x000000;
        Timeline.MASTER_CONTAINER.alpha = 0.5;
        // Timeline.MASTER_CONTAINER.borderRadius = 10;

        Timeline.WIDTH = Timeline.MASTER_CONTAINER.w;
        Timeline.HEIGHT = Timeline.MASTER_CONTAINER.h;

        Timeline.BASE_CONTAINER = new PIXI.Container();
        Timeline.BASE_CONTAINER.x = 40 ;

        Timeline.MASTER_CONTAINER.container.addChild(Timeline.BASE_CONTAINER);

        Timeline.hitArea = new TimelineDragWindow();
        Timeline.BASE_CONTAINER.addChild(Timeline.hitArea.obj);
        // Timeline.APP.stage.addChild(Timeline.hitArea.obj);

        Timeline.obj = new PIXI.Container();
        Timeline.BASE_CONTAINER.addChild(Timeline.obj);
        // Timeline.APP.stage.addChild(Timeline.obj);

        Timeline.ZOOMER = new TimelineZoomer();
        await Timeline.ZOOMER.init();
        Timeline.MASTER_CONTAINER.container.addChild(Timeline.ZOOMER.container);

        Timeline.centerLine = new PIXI.Graphics()
            .setStrokeStyle({
                width: 1,
                color: 0xffffff,
                alignment: 1,
            })
            .moveTo(-1, 0)
            .lineTo(-1, 1)
            .moveTo(+1, 0)
            .lineTo(+1, 1)
            .stroke();
        Timeline.BASE_CONTAINER.addChild(Timeline.centerLine);

        Timeline.beatLines = new BeatLines();
        Timeline.BASE_CONTAINER.addChild(Timeline.beatLines.obj);

        Game.WORKER.postMessage({
            type: "range",
            range: (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500 + Timeline.LOOK_AHEAD,
        });
    }

    static resize() {
        if (Game.IS_FULLSCREEN && Game.EMIT_STACK.length === 0) return;

        if (innerWidth / innerHeight < 1) {
            if (Timeline.MASTER_CONTAINER.w !== Game.APP.renderer.width) Timeline.MASTER_CONTAINER.w = Game.APP.renderer.width;
        } else {
            if (Timeline.MASTER_CONTAINER.w !== Game.APP.renderer.width - (Game.REDUCTION / 400) * 410 )
                Timeline.MASTER_CONTAINER.w = Game.APP.renderer.width - (Game.REDUCTION / 400) * 410 ;
        }

        Timeline.MASTER_CONTAINER.h = 60  - Timeline.HEIGHT_REDUCTION;

        // if (Game.IS_FULLSCREEN) Timeline.MASTER_CONTAINER.h = 0;

        Timeline.BASE_CONTAINER.x = 40 ;
        Timeline.ZOOMER.draw();

        // if (innerWidth / innerHeight < 1) {
        //     Timeline.MASTER_CONTAINER.borderRadius = 0;
        // } else {
        //     Timeline.MASTER_CONTAINER.borderRadius = 10;
        // }

        Timeline.MASTER_CONTAINER.redraw();

        if (Timeline.WIDTH === Timeline.MASTER_CONTAINER.w && Timeline.HEIGHT === Timeline.MASTER_CONTAINER.h) return;

        Timeline.WIDTH = Timeline.MASTER_CONTAINER.w;
        Timeline.HEIGHT = Timeline.MASTER_CONTAINER.h;

        Game.WORKER.postMessage({
            type: "range",
            range: (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500 + Timeline.LOOK_AHEAD,
        });

        Timeline.hitArea.resize();
    }

    static updateOrder({ removed, addBack, addTop }) {
        const objList = Game.BEATMAP_FILE.beatmapRenderData.objectsController.objectsList;

        removed.forEach((object) => {
            Timeline.hitArea.obj.removeChild(objList[object.idx].timelineObject.obj);
        });

        addBack.forEach((object) => {
            Timeline.hitArea.obj.addChildAt(objList[object.idx].timelineObject.obj, 0);
        });

        addTop.forEach((object) => {
            Timeline.hitArea.obj.addChild(objList[object.idx].timelineObject.obj);
        });
    }

    static draw(timestamp) {
        if (Game.IS_FULLSCREEN) return;
        if (!Game.BEATMAP_FILE?.beatmapRenderData?.objectsController.objectsList) return;
        Timeline.beatLines.draw(timestamp);
        Timeline.hitArea.draw(timestamp);
        Timeline.centerLine.x = Timeline.WIDTH / 2;
        Timeline.centerLine.scale.set(1, Timeline.HEIGHT);

        const objList = Game.BEATMAP_FILE.beatmapRenderData.objectsController.objectsList;

        this.DRAW_LIST.forEach((object) => {
            objList[object.idx]?.timelineObject?.draw(timestamp);
        });
    }

    static destruct() {
        if (!Game.BEATMAP_FILE?.beatmapRenderData) return;
        const objList = Game.BEATMAP_FILE.beatmapRenderData.objectsController.objectsList;

        this.DRAW_LIST.forEach((object) => {
            objList[object.idx].timelineObject?.removeSelfFromContainer(Timeline.hitArea.obj);
            objList[object.idx].timelineObject?.obj.destroy();
        });

        this.DRAW_LIST.length = 0;
    }
}
