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

    _in = [];

    static CURRENT_BPM;
    static CURRENT_SV;

    static requestID = null;
    static lastTimestamp;
    static lastRenderTime = 0;

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

        this.lastTime = performance.now();

        if (Game.DID_MOVE && Game.CURRENT_X !== -1 && Game.CURRENT_Y !== -1) {
            Game.DRAGGING_END = Game.BEATMAP_FILE.audioNode.getCurrentTime();
            handleCanvasDrag(false, true);
        }

        const currentSV = Beatmap.findNearestTimingPoint(timestamp, "timingPointsList", true);
        const currentBPM = Beatmap.findNearestTimingPoint(timestamp, "beatStepsList", true);
        const currentPoint = Beatmap.findNearestTimingPointIndex(timestamp, "mergedPoints", true);

        ObjectsController.CURRENT_BPM = currentBPM;
        ObjectsController.CURRENT_SV = currentSV;

        // const highlightH = parseFloat(getComputedStyle(document.querySelector(".highlightPoint")).height);
        // if (document.querySelector(".highlightPoint").style.transform != `translateY(${currentPoint * highlightH}px)`) {
        //     document.querySelector(".highlightPoint").style.transform = `translateY(${currentPoint * highlightH}px)`;
        //     document.querySelector(".highlightPoint").scrollIntoView({
        //         behavior: "smooth",
        //         block: "nearest",
        //     });
        // }

        if (!currentSV.isKiai && document.querySelector(".timingContainer").classList.contains("kiai")) {
            document.querySelector(".timingContainer").classList.remove("kiai");
        }

        if (currentSV.isKiai && !document.querySelector(".timingContainer").classList.contains("kiai")) {
            document.querySelector(".timingContainer").classList.add("kiai");
            document.querySelector(".timingContainer").style.animationDuration = `${currentBPM.beatstep}ms`;
            document.querySelector(".timingContainer").style.animationDelay =
                currentBPM.time >= 0 ? `${currentBPM.time % currentBPM.beatstep}ms` : `${currentBPM.time + currentBPM.beatstep}ms`;
        }

        if (document.querySelector(".BPM").textContent !== `${Fixed(60000 / currentBPM.beatstep, 2)}BPM`)
            document.querySelector(".BPM").textContent = `${Fixed(60000 / currentBPM.beatstep, 2)}BPM`;

        if (document.querySelector(".SV .multiplier").textContent !== `${currentSV.svMultiplier.toFixed(2)}x`)
            document.querySelector(".SV .multiplier").textContent = `${currentSV.svMultiplier.toFixed(2)}x`;

        const currentAR = Clamp(Beatmap.stats.approachRate * (Game.MODS.HR ? 1.4 : 1) * (Game.MODS.EZ ? 0.5 : 1), 0, 10);
        const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);

        const compareFunc = (element, value) => {
            if ((Game.SLIDER_APPEARANCE.hitAnim ? element.obj.killTime : Math.max(element.obj.killTime + 800, element.obj.killTime)) < value)
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
        }

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

        const judgements = this.judgementList.filter((judgement) => judgement.time - 200 < timestamp && judgement.time + 1800 + 200 > timestamp);

        Game.CONTAINER.removeChildren();
        Game.addToContainer([
            ...judgements,
            ...this.filtered.map((o) => o.obj).toReversed(),
            ...this.filtered
                .map((o) => o.obj.approachCircleObj)
                .filter((o) => o)
                .toReversed(),
            ...selected
                .reduce((accm, o) => {
                    if (o.obj instanceof Slider) accm.push({ obj: o.obj.hitCircle.selected }, { obj: o.obj.selectedSliderEnd });
                    accm.push({ obj: o.obj.selected });
                    return accm;
                }, [])
                .toReversed(),
        ]);

        if (this.breakPeriods.some((period) => period[0] < timestamp && period[1] > timestamp)) {
            document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${document.querySelector("#dim").value * 0.7})`;
        } else {
            document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${document.querySelector("#dim").value})`;
        }

        judgements.forEach((object) => {
            object.draw(timestamp);
        });

        this.filtered.forEach((object) => {
            selected.forEach((o) => o.obj.drawSelected());
            object.obj.draw(Math.max(timestamp, 0));
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

        Game.FPS.text = `${Math.round(Game.APP.ticker.FPS)}fps\n${Game.APP.ticker.deltaMS.toFixed(2)}ms`;

        const currentAudioTime = Game.BEATMAP_FILE?.audioNode?.getCurrentTime();

        if (currentAudioTime && Game.BEATMAP_FILE?.beatmapRenderData?.objectsController) {
            Game.BEATMAP_FILE.beatmapRenderData.objectsController.draw(currentAudioTime);
            Timeline.draw(currentAudioTime);
        }

        Timestamp.update(currentAudioTime ?? 0);
        ProgressBar.update(currentAudioTime ?? 0);
        TimingPanel.update(currentAudioTime ?? 0);
    }
}
