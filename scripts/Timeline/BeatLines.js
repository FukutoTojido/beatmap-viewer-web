class BeatTick {
    obj;

    constructor() {
        this.obj = new PIXI.Sprite(Timeline.beatLines.tickTexture);
        this.obj.anchor.set(0.5, 1);
        Timeline.beatLines.obj.addChild(this.obj);
    }

    draw(denominator, index, step, delta) {
        const center = Timeline.WIDTH / 2;

        this.obj.tint = BeatLines.BEAT_LINE_COLOR[denominator] ?? 0x929292;

        this.obj.x = center + index * step - delta;
        this.obj.y = Timeline.HEIGHT;

        if (denominator !== 1) this.obj.scale.set(1, 0.5);
    }

    drawLine(lineTime, type, timestamp) {
        const center = Timeline.WIDTH / 2;
        const delta = timestamp - lineTime;

        this.obj.tint = type === "beatStep" ? 0xe34653 : 0x1bcc20;

        this.obj.x = center - (delta / 500) * Timeline.ZOOM_DISTANCE;
        this.obj.y = Timeline.HEIGHT;
        this.obj.alpha = 0.9;

        this.obj.scale.set(1, 3);
    }
}

class GreenLineInfo {
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

        const svText = new PIXI.Text(`${this.greenLine.svMultiplier.toFixed(2)}x`, {
            fontFamily: "Torus",
            fontSize: 12,
            fontWeight: 500,
            align: "center",
            tint: 0x161616,
        });

        let { width: svWidth, height: svHeight } = svText;
        svWidth += 10;
        svHeight += 3;

        this.sv = new PIXI.Graphics().beginFill(0x89f0a3).drawRoundedRect(-svWidth / 2, 0, svWidth, svHeight, 10);
        this.sv.addChild(svText);
        this.sv.cullable = true;

        svText.x = 0;
        svText.y = 1;
        svText.anchor.set(0.5, 0);

        this.sv.y = 0;

        let custom = this.greenLine.sampleIdx != 0 ? `:C${this.greenLine.sampleIdx}` : "";
        const sampleText = new PIXI.Text(`${HitSound.HIT_SAMPLES[this.greenLine.sampleSet][0].toUpperCase()}${custom} ${this.greenLine.sampleVol}`, {
            fontFamily: "Torus",
            fontSize: 12,
            fontWeight: 500,
            tint: 0x161616,
        });

        sampleText.x = 0;
        sampleText.anchor.set(0.5);

        let { width: sampleWidth, height: sampleHeight } = sampleText;
        sampleWidth += 10;
        sampleHeight += 3;

        sampleText.y = -sampleHeight / 2;

        this.sample = new PIXI.Graphics().beginFill(0xfaff75).drawRoundedRect(-sampleWidth / 2, -sampleHeight, sampleWidth, sampleHeight, 10);
        this.sample.addChild(sampleText);
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

class BeatLines {
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
        this.obj = new PIXI.Container();
        this.createTickTexture();
    }

    createTickTexture() {
        const graphic = new PIXI.Graphics().beginFill(0xffffff).drawRect(0, 0, 2, 40).endFill();

        const { width, height } = graphic;

        const renderTexture = PIXI.RenderTexture.create({
            width: width,
            height: height,
            multisample: PIXI.MSAA_QUALITY.MEDIUM,
        });

        Timeline.APP.renderer.render(graphic, {
            renderTexture,
            transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
        });

        Timeline.APP.renderer.framebuffer.blit();
        graphic.destroy(true);

        this.tickTexture = renderTexture;
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
        const { beatstep: currentBeatStep, time: offset } =
            Beatmap.beatStepsList.findLast((timingPoint) => timingPoint.time < timestamp) ?? Beatmap.beatStepsList[0];
        const range = (Timeline.WIDTH / 2 / Timeline.ZOOM_DISTANCE) * 500;

        const beatStepList = this.getLineInRange(timestamp, range, "beatStepsList");
        const timingPointList = this.getLineInRange(timestamp, range, "timingPointsList");

        const snap = parseInt(beatsnap);
        const dividedStep = currentBeatStep / snap;

        const relativePosition = timestamp - offset;
        const relativeTickPassed = Math.round(relativePosition / dividedStep);
        const nearestTick = offset + relativeTickPassed * dividedStep;

        // console.log(whiteTicksNum);
        const step = dividedStep * (Timeline.ZOOM_DISTANCE / 500);
        const delta = (timestamp - nearestTick) * (Timeline.ZOOM_DISTANCE / 500);
        const ticksNumber = Math.floor(range / dividedStep);

        while (this.ticks.length < ticksNumber * 2 + 1 + beatStepList.length + timingPointList.length) {
            this.ticks.push(new BeatTick());
        }

        while (this.ticks.length > ticksNumber * 2 + 1 + beatStepList.length + timingPointList.length) {
            const sprite = this.ticks.pop();

            if (!sprite) break;
            this.obj.removeChild(sprite.obj);
            sprite.obj.destroy();
        }

        let idxCount = 0;
        for (let i = -ticksNumber; i <= ticksNumber; i++) {
            const tickTime = nearestTick + i * dividedStep - offset;
            const whiteTickPassed = Math.round(tickTime / currentBeatStep);
            const nearestWhiteTick = offset + whiteTickPassed * currentBeatStep;
            let denominator = Math.round(currentBeatStep / Math.abs(nearestWhiteTick - (nearestTick + i * dividedStep)));

            if (snap === 5 || snap === 10) denominator = 5;
            if (denominator > 48) denominator = 1;

            this.ticks[i + ticksNumber].draw(denominator, i, step, delta);

            idxCount++;
        }

        for (let i = 0; i < timingPointList.length; i++) {
            this.ticks[i + idxCount].drawLine(timingPointList[i].time, "timingPoint", timestamp);
        }
        idxCount += timingPointList.length;

        for (let i = 0; i < beatStepList.length; i++) {
            this.ticks[i + idxCount].drawLine(beatStepList[i].time, "beatStep", timestamp);
        }

        this.drawList.forEach((line) => {
            this.obj.removeChild(line.sv);
            this.obj.removeChild(line.sample);
        });

        this.drawList = GreenLineInfo.findGreenLineInRange(timestamp);
        this.drawList.forEach((line) => {
            this.obj.addChild(line.sv);
            this.obj.addChild(line.sample);
            line.draw(timestamp);
        });
    }
}
