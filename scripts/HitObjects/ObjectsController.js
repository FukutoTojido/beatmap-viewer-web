import { Game } from "../Game.js";
import { Timestamp } from "../Timestamp.js";
import { Timeline } from "../Timeline/Timeline.js";
import { ProgressBar } from "../Progress.js";
import { Beatmap } from "../Beatmap.js";
import { HitCircle } from "./HitCircle.js";
import { Slider } from "./Slider.js";
import { Spinner } from "./Spinner.js";
import { handleCanvasDrag } from "../DragWindow.js";
import { Fixed, Clamp, binarySearch, binarySearchNearest } from "../Utils.js";
import { ScoreParser } from "../ScoreParser.js";
import { TimingPanel } from "../TimingPanel.js";
import { HitSample } from "../Audio.js";
import { MetadataPanel } from "../SidePanel.js";
import { PlayContainer } from "../PlayButtons.js";
import { BPM } from "../BPM.js";
import { frameData } from "../FPSSystem.js";
import * as TWEEN from "@tweenjs/tween.js";

export class ObjectsController {
    hitCirclesList;
    slidersList;
    objectsList;
    judgementList = [];
    drawTime;
    coloursList;
    breakPeriods;
    currentColor;
    coloursObject;
    lastTimestamp = 0;
    lastTime = 0;
    tempW = Game.WIDTH;
    tempH = Game.HEIGHT;

    filtered = [];
    selected = [];

    _in = [];

    static CURRENT_BPM;
    static CURRENT_SV;

    static requestID = null;
    static lastTimestamp = 0;
    static lastRenderTime = 0;

    static sumMS = 0;

    // static preempt = 0;

    compare(a, b) {
        if (a.obj.time < b.obj.time) {
            return -1;
        }
        if (a.obj.time > b.obj.time) {
            return 1;
        }
        return 0;
    }

    constructor(objectsList, coloursList, breakPeriods) {
        this.objectsList = objectsList.sort(this.compare);
        this.hitCirclesList = objectsList.filter((o) => o.obj instanceof HitCircle || o.obj instanceof Spinner);
        this.slidersList = objectsList.filter((o) => o.obj instanceof Slider);

        this.breakPeriods = breakPeriods;
    }

    draw(timestamp, staticDraw) {
        if (timestamp > Game.BEATMAP_FILE.audioNode.duration) {
            Game.BEATMAP_FILE.audioNode.pause();
        }

        if (Game.DID_MOVE && Game.CURRENT_X !== -1 && Game.CURRENT_Y !== -1) {
            Game.DRAGGING_END = Game.BEATMAP_FILE.audioNode.getCurrentTime();
            handleCanvasDrag(false, true);
        }

        const currentSV = Beatmap.findNearestTimingPoint(timestamp, "timingPointsList", true);
        const currentBPM = Beatmap.findNearestTimingPoint(timestamp, "beatStepsList", true);
        const currentPoint = Beatmap.findNearestTimingPointIndex(timestamp, "mergedPoints", true);

        if (JSON.stringify(ObjectsController.CURRENT_BPM) !== JSON.stringify(currentBPM)) {
            BPM.BPM_TEXT.text = `${Fixed(60000 / currentBPM.beatstep, 2)}BPM`;
            ObjectsController.CURRENT_BPM = currentBPM;
        }

        if (JSON.stringify(currentSV) !== JSON.stringify(ObjectsController.CURRENT_SV)) {
            if (ObjectsController.CURRENT_SV?.svMultiplier !== currentSV?.svMultiplier) BPM.SV_TEXT.text = `${currentSV.svMultiplier.toFixed(2)}x`;
            ObjectsController.CURRENT_SV = currentSV;
            TimingPanel.scrollTo(timestamp);
        }

        const currentAR = Clamp(Beatmap.stats.approachRate * (Game.MODS.HR ? 1.4 : 1) * (Game.MODS.EZ ? 0.5 : 1), 0, 10);
        const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);

        const compareFunc = (element, value) => {
            if (element.obj.killTime + 800 < value)
                return -1;
            if (element.obj.time - currentPreempt > value) return 1;
            return 0;
        };

        const drawList = [];
        const foundIndex = binarySearch(this.objectsList, timestamp, compareFunc);
        if (foundIndex !== -1) {
            let start = foundIndex - 1;
            let end = foundIndex + 1;

            while (start >= 0 && compareFunc(this.objectsList[start], timestamp) === 0) {
                drawList.push(this.objectsList[start]);
                start--;
            }

            drawList.reverse();
            drawList.push(this.objectsList[foundIndex]);

            while (end <= this.objectsList.length - 1 && compareFunc(this.objectsList[end], timestamp) === 0) {
                drawList.push(this.objectsList[end]);
                end++;
            }

            drawList.reverse();
        }

        this.filtered.forEach((object) => {
            if (drawList.length > 0 && object.obj.time <= drawList.at(0).obj.time && object.obj.time >= drawList.at(-1).obj.time) return;
            Game.CONTAINER.removeChild(object.obj.obj);
            if (object.obj.approachCircleObj) Game.CONTAINER.removeChild(object.obj.approachCircleObj.obj);
        });

        drawList.forEach((object) => {
            if (this.filtered.length <= 0) {
                Game.CONTAINER.addChild(object.obj.obj);
                if (object.obj.approachCircleObj) Game.CONTAINER.addChild(object.obj.approachCircleObj.obj);
                return;
            }

            if (object.obj.time > this.filtered.at(0).obj.time) {
                Game.CONTAINER.addChildAt(object.obj.obj, 0);
                if (object.obj.approachCircleObj) Game.CONTAINER.addChild(object.obj.approachCircleObj.obj);
                return;
            }

            if (object.obj.time < this.filtered.at(-1).obj.time) {
                Game.CONTAINER.addChild(object.obj.obj);
                if (object.obj.approachCircleObj) Game.CONTAINER.addChild(object.obj.approachCircleObj.obj);
                return;
            }
        });

        this.filtered = drawList;

        const selected = [];
        Game.SELECTED.forEach((time) => {
            const objIndex = binarySearch(this.objectsList, time, (element, value) => {
                if (element.obj.time === value) return 0;
                if (element.obj.time < value) return -1;
                if (element.obj.time > value) return 1;
            });

            if (objIndex === -1) return;

            const o = this.objectsList[objIndex];
            selected.push(o);
        });

        this.selected.forEach((object) => {
            if (selected.includes(object)) return;
            Game.CONTAINER.removeChild(object.obj.selected);

            if (object.obj instanceof Slider) {
                Game.CONTAINER.removeChild(object.obj.hitCircle.selected);
                Game.CONTAINER.removeChild(object.obj.selectedSliderEnd);
            }
        });

        selected.forEach((object) => {
            if (this.selected.includes(object)) return;
            Game.CONTAINER.addChild(object.obj.selected);

            if (object.obj instanceof Slider) {
                Game.CONTAINER.addChild(object.obj.hitCircle.selected);
                Game.CONTAINER.addChild(object.obj.selectedSliderEnd);
            }
        });

        this.selected = selected;

        // const judgements = this.judgementList.filter((judgement) => judgement.time - 200 < timestamp && judgement.time + 1800 + 200 > timestamp);

        // Game.CONTAINER.removeChildren();
        // Game.addToContainer([
        //     ...judgements,
        //     ...this.filtered.map((o) => o.obj).toReversed(),
        //     ...this.filtered
        //         .map((o) => o.obj.approachCircleObj)
        //         .filter((o) => o)
        //         .toReversed(),
        //     ...selected
        //         .reduce((accm, o) => {
        //             if (o.obj instanceof Slider) accm.push({ obj: o.obj.hitCircle.selected }, { obj: o.obj.selectedSliderEnd });
        //             accm.push({ obj: o.obj.selected });
        //             return accm;
        //         }, [])
        //         .toReversed(),
        // ]);

        if (this.breakPeriods.some((period) => period[0] < timestamp && period[1] > timestamp)) {
            Game.MASTER_CONTAINER.alpha = Game.ALPHA * 0.7;
        } else {
            Game.MASTER_CONTAINER.alpha = Game.ALPHA;
        }

        if (
            this.breakPeriods.some(
                (period) =>
                    period[0] < timestamp &&
                    period[1] > timestamp &&
                    (period[1] < ObjectsController.lastTimestamp || period[0] > ObjectsController.lastTimestamp)
            )
        ) {
            const alpha = Game.ALPHA;

            new TWEEN.Tween({
                alpha,
            })
                .to({ alpha: alpha * 0.7 }, 1000)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((object) => {
                    Game.MASTER_CONTAINER.alpha = object.alpha;
                })
                .start();
        } else if (
            this.breakPeriods.some(
                (period) =>
                    period[0] < ObjectsController.lastTimestamp &&
                    period[1] > ObjectsController.lastTimestamp &&
                    (period[1] < timestamp || period[0] > timestamp)
            )
        ) {
            const alpha = Game.ALPHA;

            new TWEEN.Tween({
                alpha: alpha * 0.7,
            })
                .to({ alpha }, 1000)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((object) => {
                    Game.MASTER_CONTAINER.alpha = object.alpha;
                })
                .start();
        }

        // judgements.forEach((object) => {
        //     object.draw(timestamp);
        // });

        this.filtered.forEach((object) => {
            // selected.forEach((o) => o.obj.drawSelected());
            object.obj.draw(Math.max(timestamp, 0));
        });

        this.selected.forEach((object) => {
            object.obj.drawSelected();
        });

        if (ScoreParser.CURSOR_DATA) {
            let posInfoIndex = binarySearchNearest(ScoreParser.CURSOR_DATA.slice(0, -1), timestamp, (cursorData, timestamp) => {
                if (cursorData.time < timestamp) return -1;
                if (cursorData.time > timestamp) return 1;
                return 0;
            });

            while (posInfoIndex > 0 && ScoreParser.CURSOR_DATA[posInfoIndex].time > timestamp) posInfoIndex--;

            const current = ScoreParser.CURSOR_DATA[posInfoIndex];
            const next = ScoreParser.CURSOR_DATA[posInfoIndex + 1] ?? ScoreParser.CURSOR_DATA[posInfoIndex];

            const lerp_x = current.x + Clamp((timestamp - current.time) / (next.time - current.time), 0, 1) * (next.x - current.x);
            const lerp_y = current.y + Clamp((timestamp - current.time) / (next.time - current.time), 0, 1) * (next.y - current.y);

            if (posInfoIndex !== -1) {
                // Game.CURSOR.x = Game.OFFSET_X + lerp_x * (Game.WIDTH / 512);
                // Game.CURSOR.y = Game.OFFSET_Y + lerp_y * (Game.WIDTH / 512);

                Game.CURSOR.update(posInfoIndex, lerp_x, lerp_y);
            }
        }

        ObjectsController.lastTimestamp = timestamp;
    }

    reinitializeAllSliders() {
        const start = performance.now();
        this.objectsList.forEach((o) => {
            if (o.obj instanceof Slider) o.obj.reInitialize();
        });
        console.log(`ReInitialize all sliders took: ${performance.now() - start}ms`);
    }

    static render() {
        Game.appResize();
        Timeline.resize();

        const deltaMS = performance.now() - this.lastRenderTime;
        this.lastRenderTime = performance.now();

        const currentAudioTime = Game.BEATMAP_FILE?.audioNode?.getCurrentTime();

        Timestamp.update(currentAudioTime ?? 0);

        if (currentAudioTime && Game.BEATMAP_FILE?.beatmapRenderData?.objectsController) {
            Game.BEATMAP_FILE.beatmapRenderData.objectsController.draw(currentAudioTime);
            Timeline.draw(currentAudioTime);
        }

        BPM.update(currentAudioTime ?? 0);
        PlayContainer.update(currentAudioTime ?? 0);
        ProgressBar.update(currentAudioTime ?? 0);
        TimingPanel.update(currentAudioTime ?? 0);
        MetadataPanel.update(currentAudioTime ?? 0);

        Game.EMIT_STACK.pop();

        // ObjectsController.sumMS += frameData.deltaMS;
        // if (ObjectsController.sumMS < 4) return;

        // ObjectsController.sumMS = 0;
        Game.FPS.text = `${Math.round(frameData.fps)}fps\n${frameData.deltaMS.toFixed(2)}ms`;
    }
}
