import { TimelineDragWindow } from "./DragWindow.js";
import { BeatLines } from "./BeatLines.js";
import { binarySearch } from "../Utils.js";
import { Game } from "../Game.js";
import { Component } from "../WindowManager.js";
import * as PIXI from "pixi.js";
import { TimelineZoomer } from "./Zoomer.js";

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

    static init() {
        Timeline.MASTER_CONTAINER = new Component(0, 0, Game.APP.renderer.width, 60);
        Timeline.MASTER_CONTAINER.color = 0x000000;
        Timeline.MASTER_CONTAINER.alpha = 0.5;
        Timeline.MASTER_CONTAINER.borderRadius = 10;

        Timeline.WIDTH = Timeline.MASTER_CONTAINER.w;
        Timeline.HEIGHT = Timeline.MASTER_CONTAINER.h;

        Timeline.BASE_CONTAINER = new PIXI.Container();
        Timeline.BASE_CONTAINER.x = 40;

        Timeline.MASTER_CONTAINER.container.addChild(Timeline.BASE_CONTAINER);

        // Timeline.APP = new PIXI.Application({
        //     width: Timeline.WIDTH,
        //     height: Timeline.HEIGHT,
        //     antialias: true,
        //     autoDensity: true,
        //     backgroundAlpha: 0,
        // });
        // Timeline.APP.renderer = Game.APP.renderer;

        Timeline.hitArea = new TimelineDragWindow();
        Timeline.BASE_CONTAINER.addChild(Timeline.hitArea.obj);
        // Timeline.APP.stage.addChild(Timeline.hitArea.obj);

        Timeline.obj = new PIXI.Container();
        Timeline.BASE_CONTAINER.addChild(Timeline.obj);
        // Timeline.APP.stage.addChild(Timeline.obj);

        Timeline.ZOOMER = new TimelineZoomer();
        Timeline.MASTER_CONTAINER.container.addChild(Timeline.ZOOMER.graphics);

        Timeline.centerLine = new PIXI.Graphics()
            .lineStyle({
                width: 1,
                color: 0xffffff,
                alignment: 1,
            })
            .moveTo(-1, 0)
            .lineTo(-1, 1)
            .moveTo(+1, 0)
            .lineTo(+1, 1);
        Timeline.BASE_CONTAINER.addChild(Timeline.centerLine);
        // Timeline.APP.stage.addChild(Timeline.centerLine);

        Timeline.beatLines = new BeatLines();
        Timeline.BASE_CONTAINER.addChild(Timeline.beatLines.obj);
        // Timeline.APP.stage.addChild(Timeline.beatLines.obj);

        // Timeline.APP.view.style.transform = `scale(${1 / window.devicePixelRatio})`;

        // document.querySelector(".timeline").appendChild(Timeline.APP.view);
        // globalThis.__PIXI_APP__ = Timeline.APP;
    }

    static resize() {
        // let { width, height } = getComputedStyle(document.querySelector(".timeline"));
        // width = parseInt(width) * window.devicePixelRatio;
        // height = parseInt(height) * window.devicePixelRatio;
        if (Timeline.MASTER_CONTAINER.w !== Game.APP.renderer.width) Timeline.MASTER_CONTAINER.w = Game.APP.renderer.width;
        if (Timeline.WIDTH === Timeline.MASTER_CONTAINER.w && Timeline.HEIGHT === Timeline.MASTER_CONTAINER.h) return;

        Timeline.WIDTH = Timeline.MASTER_CONTAINER.w;
        Timeline.HEIGHT = Timeline.MASTER_CONTAINER.h;

        // Timeline.APP.renderer.resize(Timeline.WIDTH, Timeline.HEIGHT);
        // Timeline.APP.view.style.transform = `scale(${1 / window.devicePixelRatio})`;

        Timeline.hitArea.resize();
    }

    static draw(timestamp) {
        if (!Game.BEATMAP_FILE?.beatmapRenderData?.objectsController.objectsList) return;
        Timeline.beatLines.draw(timestamp);
        Timeline.hitArea.draw(timestamp);
        Timeline.centerLine.x = Timeline.WIDTH / 2;
        Timeline.centerLine.scale.set(1, Timeline.HEIGHT);
        Timeline.ZOOMER.draw(timestamp);

        const objList = Game.BEATMAP_FILE.beatmapRenderData.objectsController.objectsList;

        const range = (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500 + Timeline.LOOK_AHEAD;

        const drawList = [];
        const compareFunc = (element, value) => {
            if (element.obj.endTime < value - range) return -1;
            if (element.obj.time > value + range) return 1;
            return 0;
        };
        const foundIndex = binarySearch(objList, timestamp, compareFunc);

        if (foundIndex !== -1) {
            let start = foundIndex - 1;
            let end = foundIndex + 1;

            while (start >= 0 && compareFunc(objList[start], timestamp) === 0) {
                drawList.push(objList[start]);
                start--;
            }

            drawList.reverse();
            drawList.push(objList[foundIndex]);

            while (end <= objList.length - 1 && compareFunc(objList[end], timestamp) === 0) {
                drawList.push(objList[end]);
                end++;
            }
        }
        this.DRAW_LIST.forEach((o) => {
            o.timelineObject?.removeSelfFromContainer(Timeline.hitArea.obj);
        });
        this.DRAW_LIST = drawList;

        drawList.toReversed().forEach((o) => {
            if (!o.timelineObject) return;
            o.timelineObject.addSelfToContainer(Timeline.hitArea.obj);
            o.timelineObject.draw(timestamp);
        });
    }

    static destruct() {
        const removedChildren = Timeline.obj.removeChildren();
        removedChildren.forEach((e) => e.destroy());
    }
}
