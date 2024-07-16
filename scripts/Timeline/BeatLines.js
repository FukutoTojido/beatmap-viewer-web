import { Timeline } from "./Timeline.js";
import { Beatmap } from "../Beatmap.js";
import { binarySearchNearest } from "../Utils.js";
import { ObjectsController } from "../HitObjects/ObjectsController.js";
import { HitSound } from "../HitSound.js";
import { Game } from "../Game.js";
import * as PIXI from "pixi.js";

export class GreenLineInfo {
    greenLine;
    sv;
    sample;

    static findGreenLineInRange(timestamp) {
        const upperBound = (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500 + timestamp;
        const lowerBound = ObjectsController.CURRENT_SV?.time ?? 0;

        if (upperBound < lowerBound) return [];

        let foundIndex = binarySearchNearest(Timeline.beatLines.greenLines, lowerBound, (line, value) => {
            if (line.greenLine.time < value) return -1;
            if (line.greenLine.time > value) return 1;
            return 0;
        });

        while (
            foundIndex > 0 &&
            Timeline.beatLines.greenLines[foundIndex].greenLine.time >= timestamp - (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500
        )
            foundIndex--;

        const ret = [];
        while (foundIndex < Timeline.beatLines.greenLines.length && Timeline.beatLines.greenLines[foundIndex].greenLine.time <= upperBound) {
            ret.push(Timeline.beatLines.greenLines[foundIndex++]);
        }

        return ret;
    }

    constructor(greenLine) {
        this.greenLine = greenLine;

        const svText = new PIXI.Text({
            text: `${this.greenLine.svMultiplier.toFixed(2)}x`,
            style: {
                fontFamily: "Torus",
                fontSize: 12,
                fontWeight: 500,
                align: "center",
                tint: 0x161616,
            },
        });

        let { width: svWidth, height: svHeight } = svText;
        svWidth += 10;
        svHeight += 3;

        this.sv = new PIXI.Container();
        this.svGraphics = new PIXI.Graphics().roundRect(-svWidth / 2, 0, svWidth, svHeight, 10).fill(0x89f0a3);

        this.sv.addChild(this.svGraphics, svText);
        this.sv.cullable = true;

        svText.x = 0;
        svText.y = 1;
        svText.anchor.set(0.5, 0);

        this.sv.y = 0;

        let custom = this.greenLine.sampleIdx != 0 ? `:C${this.greenLine.sampleIdx}` : "";
        const sampleText = new PIXI.Text({
            text: `${HitSound.HIT_SAMPLES[this.greenLine.sampleSet][0].toUpperCase()}${custom}`,
            style: {
                fontFamily: "Torus",
                fontSize: 12,
                fontWeight: 500,
                tint: 0x161616,
            },
        });

        sampleText.x = 0;
        sampleText.anchor.set(0.5);

        let { width: sampleWidth, height: sampleHeight } = sampleText;
        sampleWidth += 10;
        sampleHeight += 3;

        sampleText.y = -sampleHeight / 2;

        this.sample = new PIXI.Container();
        this.sampleGraphics = new PIXI.Graphics().roundRect(-sampleWidth / 2, -sampleHeight, sampleWidth, sampleHeight, 10).fill(0xfaff75);
        
        this.sample.addChild(this.sampleGraphics, sampleText);
        this.sample.cullable = true;

        this.sample.y = Timeline.HEIGHT;
    }

    draw(timestamp) {
        const center = Timeline.WIDTH / 2;
        const delta = timestamp - this.greenLine.time;

        this.sv.x = Math.max(center - (delta / 500) * Timeline.ZOOM_DISTANCE, this.sv.width / 2 + 5);

        this.sample.x = Math.max(center - (delta / 500) * Timeline.ZOOM_DISTANCE, this.sample.width / 2 + 5);
        this.sample.y = Timeline.HEIGHT;

        // this.sv.scale.set(window.devicePixelRatio);
        // this.sample.scale.set(window.devicePixelRatio);
    }
}

export class BeatLines {
    obj;
    ticks = [];
    tickTexture;
    greenLines = [];
    drawList = [];

    static BEAT_LINE_COLOR = {
        1: 0xffffff,
        2: 0xff0000,
        3: 0xb706b7,
        4: 0x3276e6,
        5: 0xe6e605,
        6: 0x843e84,
        7: 0xe6e605,
        8: 0xe6e605,
        9: 0xe6e605,
    };

    constructor() {
        this.obj = new PIXI.Graphics();
    }

    getLineInRange(time, range, type) {
        const foundIndex = binarySearchNearest(Beatmap[type], time, (point, time) => {
            if (point.time < time) return -1;
            if (point.time > time) return 1;
            return 0;
        });

        const pointList = [];
        const mid = Beatmap[type][foundIndex];

        if (mid.time >= time - range && mid.time <= time + range) pointList.push(mid);

        let start = foundIndex - 1;
        let end = foundIndex + 1;

        while (start >= 0 && Beatmap[type][start].time >= time - range && Beatmap[type][start].time <= time + range) {
            pointList.push(Beatmap[type][start--]);
        }

        while (end < Beatmap[type].length && Beatmap[type][end].time >= time - range && Beatmap[type][end].time <= time + range) {
            pointList.push(Beatmap[type][end++]);
        }

        return pointList;
    }

    draw(timestamp) {
        this.obj.clear();
        const { beatstep: currentBeatStep, time: offset } =
            Beatmap.beatStepsList.findLast((timingPoint) => timingPoint.time < timestamp) ?? Beatmap.beatStepsList[0];
        const range = (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500;

        const timingPointList = this.getLineInRange(timestamp, range, "timingPointsList").toSorted((a, b) => {
            if (a.time > b.time) return 1;
            if (a.time < b.time) return -1;
            if (a.beatstep) return 1;
            if (b.beatstep) return -1;
            return 0;
        });

        const snap = parseInt(Game.MAPPING.beatsnap);
        const dividedStep = currentBeatStep / snap;

        const relativePosition = timestamp - offset;
        const relativeTickPassed = Math.round(relativePosition / dividedStep);
        const nearestTick = offset + relativeTickPassed * dividedStep;

        const step = dividedStep * (Timeline.ZOOM_DISTANCE / 500);
        const delta = (timestamp - nearestTick) * (Timeline.ZOOM_DISTANCE / 500);
        const ticksNumber = Math.ceil(range / dividedStep);

        const center = Timeline.WIDTH / 2;

        for (let i = 0; i < timingPointList.length; i++) {
            const delta = timestamp - timingPointList[i].time;

            const x = center - (delta / 500) * Timeline.ZOOM_DISTANCE;
            const y = Timeline.HEIGHT;

            this.obj
                .setStrokeStyle({
                    width: 1,
                    color: timingPointList[i].beatstep ? 0xe34653 : 0x1bcc20,
                    alignment: 0.5,
                    alpha: 0.9,
                })
                .moveTo(x, y)
                .lineTo(x, y - 40 )
                .stroke();
        }

        for (let i = -ticksNumber; i <= ticksNumber; i++) {
            const tickTime = nearestTick + i * dividedStep - offset;
            const whiteTickPassed = Math.round(tickTime / currentBeatStep);
            const nearestWhiteTick = offset + whiteTickPassed * currentBeatStep;
            let denominator = Math.round(currentBeatStep / Math.abs(nearestWhiteTick - (nearestTick + i * dividedStep)));

            if (snap === 5 || snap === 10) denominator = 5;
            if (denominator > 48) denominator = 1;

            const x = center + i * step - delta;
            const y = Timeline.HEIGHT;
            this.obj
                .setStrokeStyle({
                    width: 1,
                    color: BeatLines.BEAT_LINE_COLOR[denominator] ?? 0x929292,
                    alignment: 0.5,
                })
                .moveTo(x, y)
                .lineTo(x, y - 10 )
                .stroke();
        }

        this.drawList.forEach((line) => {
            this.obj.removeChild(line.sv);
            this.obj.removeChild(line.sample);
        });

        this.drawList = [];
        if (!Timeline.SHOW_GREENLINE) return;

        this.drawList = GreenLineInfo.findGreenLineInRange(timestamp);
        this.drawList.forEach((line) => {
            this.obj.addChild(line.sv);
            this.obj.addChild(line.sample);
            line.draw(timestamp);
        });
    }
}
