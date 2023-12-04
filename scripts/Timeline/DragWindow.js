import { Timeline } from "./Timeline.js";
import { binarySearch } from "../Utils.js";
import { Game } from "../Game.js";
import * as PIXI from "pixi.js";

export class TimelineDragWindow {
    isDragging = false;
    obj;
    dragWindow;

    startTimestamp;
    endTimestamp;

    isObjectSelecting = false;

    currentX = null;

    checkObjectsInWindow() {
        const selectedList = [];

        if (this.startTimestamp && this.endTimestamp) {
            const objList = Game.BEATMAP_FILE.beatmapRenderData.objectsController.objectsList;
            const compareFunc = (element, _) => {
                let startTime = this.startTimestamp;
                let endTime = this.endTimestamp;

                if (startTime > endTime) {
                    endTime = startTime;
                    startTime = this.endTimestamp;
                }

                if (element.obj.endTime < startTime) return -1;
                if (element.obj.time > endTime) return 1;
                return 0;
            };
            const foundIndex = binarySearch(objList, null, compareFunc);

            if (foundIndex !== -1) {
                let start = foundIndex - 1;
                let end = foundIndex + 1;

                while (start >= 0 && compareFunc(objList[start], null) === 0) {
                    selectedList.push(objList[start]);
                    start--;
                }

                selectedList.reverse();
                selectedList.push(objList[foundIndex]);

                while (end <= objList.length - 1 && compareFunc(objList[end], null) === 0) {
                    selectedList.push(objList[end]);
                    end++;
                }
            }
        }

        if (!this.isObjectSelecting) Game.SELECTED = selectedList.map((o) => o.obj.time);
    }

    constructor() {
        this.obj = new PIXI.Graphics().beginFill(0xffffff, 0.01).drawRect(0, 0, Timeline.WIDTH, Timeline.HEIGHT);
        // this.obj.interactive = true;
        this.obj.eventMode = "static"

        this.dragWindow = new PIXI.Graphics().drawRect(0, 0, 0, 0);
        this.obj.addChild(this.dragWindow);

        this.obj.on("mousedown", (e) => {
            if (!Game.BEATMAP_FILE) return;
            if (this.isObjectSelecting) return;

            const { x, y } = this.obj.toLocal(e.global);
            const center = Timeline.WIDTH / 2;
            const currentTime = Game.BEATMAP_FILE.audioNode.getCurrentTime();

            this.startTimestamp = currentTime - ((center - x) / Timeline.ZOOM_DISTANCE) * 500;
            this.isDragging = true;
        });

        this.obj.on("mousemove", (e) => this.handleDraggingEvent(e));
        this.obj.on("wheel", (e) => this.handleDraggingEvent(e));

        this.obj.on("mouseup", (e) => this.handleEndEvent(e));
        this.obj.on("touchstart", (e) => this.handleEndEvent(e));
        this.obj.on("mouseleave", (e) => this.handleLeaveEvent(e));
    }

    handleDraggingEvent(e) {
        if (!this.isDragging) return;

        const { x, y } = this.obj.toLocal(e.global);
        const center = Timeline.WIDTH / 2;
        const currentTime = Game.BEATMAP_FILE.audioNode.getCurrentTime();

        this.endTimestamp = currentTime - ((center - x) / Timeline.ZOOM_DISTANCE) * 500;
        this.currentX = x;

        this.checkObjectsInWindow();
    }

    handleEndEvent(e) {
        this.checkObjectsInWindow();

        this.startTimestamp = null;
        this.endTimestamp = null;

        this.isObjectSelecting = false;

        this.isDragging = false;
        this.currentX = -1;
    }

    handleLeaveEvent(e) {
        if (!this.isDragging) return;
        this.checkObjectsInWindow();

        this.startTimestamp = null;
        this.endTimestamp = null;

        this.isObjectSelecting = false;

        this.isDragging = false;
        this.currentX = -1;
    }

    resize() {
        this.obj.clear().beginFill(0xffffff, 0.01).drawRect(0, 0, Timeline.WIDTH, Timeline.HEIGHT);
    }

    draw(timestamp) {
        if (!this.startTimestamp || !this.endTimestamp) {
            this.dragWindow.clear();
            return;
        }

        const center = Timeline.WIDTH / 2;

        if (this.isDragging && this.currentX) {
            this.endTimestamp = timestamp - ((center - this.currentX) / Timeline.ZOOM_DISTANCE) * 500;
            this.checkObjectsInWindow();
        }

        let startTime = this.startTimestamp;
        let endTime = this.endTimestamp;

        if (startTime > endTime) {
            endTime = startTime;
            startTime = this.endTimestamp;
        }

        const deltaStart = timestamp - startTime;
        const deltaEnd = timestamp - endTime;

        const xStart = Math.max(center - (deltaStart / 500) * Timeline.ZOOM_DISTANCE, 0);
        const xEnd = center - (deltaEnd / 500) * Timeline.ZOOM_DISTANCE;

        this.dragWindow
            .clear()
            .beginFill(0xffffff, 0.2)
            .drawRect(xStart, 0, xEnd - xStart, Timeline.HEIGHT);
    }
}
