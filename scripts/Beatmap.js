const HIT_SAMPLES = ["", "normal", "soft", "drum"];
const HIT_SOUNDS = ["hitwhistle", "hitfinish", "hitclap"];

class Beatmap {
    objectsController;
    static SAMPLE_SET = "Normal";
    static COLORS = Skinning.DEFAULT_COLORS;

    static difficultyMultiplier = 1;
    static stats = {
        approachRate: 5,
        circleSize: 5,
        HPDrainRate: 5,
        overallDifficulty: 5,
        stackLeniency: 7,
        circleDiameter: (2 * (54.4 - 4.48 * 5) * 236) / 256,
        preempt: 1200,
        fadeIn: 800,
        sliderTickRate: 1,
        radius: 54.4 - 4.48 * 5,
        stackOffset: (-6.4 * (1 - (0.7 * (5 - 5)) / 5)) / 2,
    };

    static moddedStats = {
        approachRate: 5,
        circleSize: 5,
        HPDrainRate: 5,
        overallDifficulty: 5,
        stackLeniency: 7,
        circleDiameter: (2 * (54.4 - 4.48 * 5) * 236) / 256,
        preempt: 1200,
        fadeIn: 800,
        sliderTickRate: 1,
        radius: 54.4 - 4.48 * 5,
        stackOffset: (-6.4 * (1 - (0.7 * (5 - 5)) / 5)) / 2,
    };

    static difficultyRange(val, min, mid, max) {
        if (val > 5) return mid + ((max - mid) * (val - 5)) / 5;
        if (val < 5) return mid - ((mid - min) * (5 - val)) / 5;
        return mid;
    }

    static hitWindows = {
        GREAT: 80,
        OK: 140,
        MEH: 200,
    };

    static beatStepsList = [];
    static timingPointsList = [];

    static updateModdedStats() {
        const HRMul = !mods.HR ? 1 : 1.4;
        const EZMul = !mods.EZ ? 1 : 0.5;
        const HRMulCS = !mods.HR ? 1 : 1.3;

        const circleSize = Math.min(Beatmap.stats.circleSize * HRMulCS * EZMul, 10);
        const approachRate = Math.min(Beatmap.stats.approachRate * HRMul * EZMul, 10);
        const HPDrainRate = Math.min(Beatmap.stats.HPDrainRate * HRMul * EZMul, 10);
        const overallDifficulty = Math.min(Beatmap.stats.overallDifficulty * HRMul * EZMul, 10);

        Beatmap.moddedStats = {
            ...Beatmap.stats,
            circleSize,
            approachRate,
            HPDrainRate,
            overallDifficulty,
            preempt: Beatmap.difficultyRange(approachRate, 1800, 1200, 450),
            fadeIn: Beatmap.difficultyRange(approachRate, 1200, 800, 300),
            radius: 54.4 - 4.48 * circleSize,
            stackOffset: (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2,
        };
    }

    static updateStats() {
        const { circleSize, approachRate } = Beatmap.stats;

        Beatmap.stats = {
            ...Beatmap.stats,
            preempt: Beatmap.difficultyRange(approachRate, 1800, 1200, 450),
            fadeIn: Beatmap.difficultyRange(approachRate, 1200, 800, 300),
            radius: 54.4 - 4.48 * circleSize,
            stackOffset: (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2,
        };
    }

    static constructSpinner(params, currentSVMultiplier) {
        const parameters = params.map((p) => (p === "" || !p ? null : p));
        const startTime = parseInt(parameters[2]);
        const endTime = parseInt(parameters[5]);
        const hitSoundIdx = parameters[4];
        const hitSampleIdx = parameters.at(-1);

        const samples = HitSound.GetName(hitSampleIdx, hitSoundIdx, currentSVMultiplier);
        const hitsounds = new HitSample(samples, currentSVMultiplier.sampleVol / 100);
        return {
            obj: new Spinner(startTime, endTime, hitsounds),
            hitsounds,
        };
    }

    static constructSlider(params, timingPoints, beatSteps, initialSliderVelocity) {
        const hitSoundIdx = parseInt(params[4]);
        const time = parseInt(params[2]);
        const svStart = Beatmap.findNearestTimingPoint(time, "timingPointsList");

        const { beatstep: beatStep } = Beatmap.findNearestTimingPoint(time, "beatStepsList");
        const slides = parseInt(params[6]);
        const length = parseFloat(params[7]);
        const endTime = time + ((slides * length) / svStart.svMultiplier / initialSliderVelocity) * beatStep;
        const svEnd = Beatmap.findNearestTimingPoint(endTime, "timingPointsList");

        const edgeSounds = params[8];
        const edgeSets = params[9];
        const defaultSetIdx = /^\d:\d.*/g.test(params.at(-1)) ? params.at(-1) : "0:0";

        const headSamples = HitSound.GetName(edgeSets?.split("|")[0] ?? defaultSetIdx, edgeSounds?.split("|")[0] ?? hitSoundIdx, svStart);
        const endSamples = HitSound.GetName(edgeSets?.split("|").at(-1) ?? defaultSetIdx, edgeSounds?.split("|").at(-1) ?? hitSoundIdx, svEnd);

        const reversesSamples = [...Array(slides - 1)].map((_, idx) => {
            const reverseTime = time + (((idx + 1) * length) / svStart.svMultiplier / initialSliderVelocity) * beatStep;
            const sv = Beatmap.findNearestTimingPoint(reverseTime, "timingPointsList");

            const samples = HitSound.GetName(edgeSets?.split("|")[idx + 1] ?? defaultSetIdx, edgeSounds?.split("|")[idx + 1] ?? hitSoundIdx, sv);
            return new HitSample(samples, sv.sampleVol / 100);
        });

        const [x, y, , type] = params;
        const anchors = params[5].slice(2);
        const sliderType = params[5][0];

        const defaultSet = {
            normal: parseInt(defaultSetIdx.split(":")[0]),
            additional: parseInt(defaultSetIdx.split(":")[1]),
            hitSoundIdx
        };

        const { normalSet: defaultSample } = HitSound.GetHitSample(defaultSetIdx, svStart);
        const sliderSlide = new HitSample([`${defaultSample}-sliderslide${svStart.sampleIdx}`], svStart.sampleVol / 100);
        const sliderWhistle = new HitSample([`${defaultSample}-sliderwhistle${svStart.sampleIdx}`], svStart.sampleVol / 100);

        const hitsounds = {
            sliderHead: new HitSample(headSamples, svStart.sampleVol / 100),
            sliderTail: new HitSample(endSamples, svEnd.sampleVol / 100),
            sliderReverse: reversesSamples,
            sliderSlide,
            sliderWhistle,
            defaultSet,
        };

        const obj = new Slider(
            `${x}:${y}|${anchors}`,
            sliderType,
            length,
            svStart.svMultiplier,
            initialSliderVelocity,
            beatStep,
            time,
            slides,
            hitsounds
        );

        return {
            obj,
            hitsounds,
        };
    }

    static constructHitCircle(params, currentSVMultiplier) {
        const parameters = params.map((p) => (p === "" || !p ? null : p));
        const [x, y, time, type, hitSoundIdx, ...rest] = parameters;
        const hitSampleIdx = rest.at(-1);

        const samples = HitSound.GetName(hitSampleIdx, hitSoundIdx, currentSVMultiplier);
        if (parseInt(time) === 208128) {
            console.log(currentSVMultiplier, samples);
        }

        const hitsounds = new HitSample(samples, currentSVMultiplier.sampleVol / 100);

        return {
            obj: new HitCircle(x, y, parseInt(time), hitsounds),
            hitsounds,
        };
    }

    static findNearestTimingPoint(time, type) {
        let foundIndex = binarySearchNearest(Beatmap[type], time, (point, time) => {
            if (point.time < time + 2) return -1;
            if (point.time > time + 2) return 1;
            return 0;
        });

        while (foundIndex > 0 && Beatmap[type][foundIndex].time > time + 2) foundIndex--;

        if (Beatmap[type][foundIndex].time > time + 2) return Beatmap[type][0];
        return Beatmap[type][foundIndex];
    }

    constructor(rawBeatmap, delay) {
        // Get Approach Rate
        if (rawBeatmap.split("\r\n").filter((line) => line.includes("ApproachRate:")).length === 0) {
            Beatmap.stats.approachRate = parseFloat(
                rawBeatmap
                    .split("\r\n")
                    .filter((line) => line.includes("OverallDifficulty:"))
                    .at(0)
                    .replaceAll("OverallDifficulty:", "")
            );
        } else {
            Beatmap.stats.approachRate = parseFloat(
                rawBeatmap
                    .split("\r\n")
                    .filter((line) => line.includes("ApproachRate:"))
                    .at(0)
                    .replaceAll("ApproachRate:", "")
            );
        }

        // Get Circle Size
        Beatmap.stats.circleSize = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("CircleSize:"))
                .at(0)
                .replaceAll("CircleSize:", "")
        );

        // Get Circle Size
        Beatmap.stats.HPDrainRate = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("HPDrainRate:"))
                .at(0)
                .replaceAll("HPDrainRate:", "")
        );

        // Get Stack Leniency
        Beatmap.stats.stackLeniency = rawBeatmap.includes("StackLeniency: ")
            ? parseFloat(
                  rawBeatmap
                      .split("\r\n")
                      .filter((line) => line.includes("StackLeniency: "))
                      .at(0)
                      .replaceAll("StackLeniency: ", "")
              )
            : 0.7;

        // Get Stack Leniency
        Beatmap.SAMPLE_SET = rawBeatmap.includes("SampleSet: ")
            ? rawBeatmap
                  .split("\r\n")
                  .filter((line) => line.includes("SampleSet: "))
                  .at(0)
                  .replaceAll("SampleSet: ", "")
            : "Normal";

        // Get Slider Tick Rate
        Beatmap.stats.sliderTickRate = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("SliderTickRate:"))
                .at(0)
                .replaceAll("SliderTickRate:", "")
        );

        // Get Overall Difficulty
        Beatmap.stats.overallDifficulty = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("OverallDifficulty:"))
                .at(0)
                .replaceAll("OverallDifficulty:", "")
        );

        const HRMultiplier = !mods.HR ? 1 : 1.3;
        const EZMultiplier = !mods.EZ ? 1 : 0.5;

        Beatmap.hitWindows = {
            GREAT: Math.floor(80 - 6 * Clamp(Beatmap.stats.overallDifficulty * HRMultiplier * EZMultiplier, 0, 10)),
            OK: Math.floor(140 - 8 * Clamp(Beatmap.stats.overallDifficulty * HRMultiplier * EZMultiplier, 0, 10)),
            MEH: Math.floor(200 - 10 * Clamp(Beatmap.stats.overallDifficulty * HRMultiplier * EZMultiplier, 0, 10)),
        };

        Beatmap.stats.circleDiameter = (2 * (54.4 - 4.48 * Beatmap.stats.circleSize) * 236) / 256;

        stackThreshold = Beatmap.stats.preempt * Beatmap.stats.stackLeniency;

        // console.log(approachRate, circleSize, stackLeniency, stackThreshold);

        const difficultyPosition = rawBeatmap.indexOf("[Difficulty]") + "[Difficulty]\r\n".length;
        const timingPosition = rawBeatmap.indexOf("[TimingPoints]") + "[TimingPoints]\r\n".length;
        const colourPosition = rawBeatmap.indexOf("[Colours]") + "[Colours]\r\n".length;
        const hitObjectsPosition = rawBeatmap.indexOf("[HitObjects]") + "[HitObjects]\r\n".length;

        const initialSliderVelocity =
            parseFloat(
                rawBeatmap
                    .slice(difficultyPosition)
                    .split("\r\n")
                    [rawBeatmap.split("\r\n").filter((line) => line.includes("ApproachRate:")).length === 0 ? 3 : 4].replace("SliderMultiplier:", "")
            ) * 100;
        // console.log(initialSliderVelocity);
        const beatStepsList = rawBeatmap
            .slice(
                timingPosition,
                rawBeatmap.indexOf("[Colours]") !== -1 ? colourPosition - "[Colours]\r\n".length : hitObjectsPosition - "[HitObjects]\r\n".length
            )
            .split("\r\n")
            .filter((timingPoint) => {
                const params = timingPoint.split(",");
                return timingPoint !== "" && params[1] > 0;
            })
            .map((timingPoint) => {
                const params = timingPoint.split(",");
                return {
                    time: parseInt(params[0]),
                    beatstep: parseFloat(params[1]),
                };
            });

        Beatmap.beatStepsList = beatStepsList;

        const timingPointsList = rawBeatmap
            .slice(
                timingPosition,
                rawBeatmap.indexOf("[Colours]") !== -1 ? colourPosition - "[Colours]\r\n".length : hitObjectsPosition - "[HitObjects]\r\n".length
            )
            .split("\r\n")
            .filter((timingPoint) => timingPoint !== "")
            .map((timingPoint) => {
                const params = timingPoint.split(",");
                return {
                    time: parseInt(params[0]),
                    svMultiplier: params[1] > 0 ? 1 : parseFloat(((-1 / params[1]) * 100).toFixed(2)),
                    sampleSet: parseInt(params[3] ?? "0"),
                    sampleIdx: parseInt(params[4] ?? "0"),
                    sampleVol: parseInt(params[5] ?? "100"),
                };
            });

        Beatmap.timingPointsList = timingPointsList;

        // console.log(beatStepsList, timingPointsList);
        let coloursList =
            rawBeatmap.indexOf("[Colours]") !== -1
                ? rawBeatmap
                      .slice(colourPosition, hitObjectsPosition - "[HitObjects]\r\n".length)
                      .split("\r\n")
                      .filter((line) => line !== "" && line.match(/Combo[0-9]+\s:\s/g))
                      .map((colour) => `rgb(${colour.replaceAll(colour.match(/Combo[0-9]+\s:\s/g)[0], "")})`)
                      .map((colour) =>
                          parseInt(
                              colour
                                  .replaceAll("rgb(", "")
                                  .replaceAll(")", "")
                                  .split(",")
                                  .map((val) => parseInt(val).toString(16).padStart(2, "0"))
                                  .join(""),
                              16
                          )
                      )
                : [];

        if (coloursList.length === 0) coloursList = Skinning.DEFAULT_COLORS;

        Beatmap.COLORS = Skinning.DEFAULT_COLORS;
        Beatmap.COLORS = coloursList;
        // console.log(coloursList);

        SliderTexture = newTexture(coloursList);
        SelectedTexture = newTexture();

        const breakPeriods = rawBeatmap
            .split("\r\n")
            .filter((line) => /^2,[0-9]+,[0-9]+$/g.test(line))
            .map((line) =>
                line
                    .split(",")
                    .slice(1)
                    .map((time) => parseInt(time))
            );
        // console.log(breakPeriods);

        let objectLists = rawBeatmap
            .slice(hitObjectsPosition)
            .split("\r\n")
            .filter((s) => s !== "");

        let combo = 1;
        let colorIdx = 1;
        let colorHaxedIdx = 1;

        let start = performance.now();
        const parsedHitObjects = objectLists
            .map((object, idx) => {
                const params = object.split(",");
                const time = parseInt(params[2]);
                let currentSVMultiplier = Beatmap.findNearestTimingPoint(time, "timingPointsList");

                let returnObject;
                let timelineObject = null;

                const typeBit = parseInt(params[3])
                    .toString(2)
                    .padStart(8, "0")
                    .split("")
                    .reverse()
                    .map((bit) => (bit === "1" ? true : false));
                const colorHax = parseInt(parseInt(params[3]).toString(2).padStart(8, "0").split("").reverse().slice(4, 7).reverse().join(""), 2);

                if (typeBit[0]) {
                    returnObject = Beatmap.constructHitCircle(params, currentSVMultiplier);
                    timelineObject = new TimelineHitCircle(returnObject.obj);
                }
                if (typeBit[1]) {
                    returnObject = Beatmap.constructSlider(params, timingPointsList, beatStepsList, initialSliderVelocity);
                    timelineObject = new TimelineSlider(returnObject.obj);
                }
                if (typeBit[3]) returnObject = Beatmap.constructSpinner(params, currentSVMultiplier);

                if (typeBit[2] && idx !== 0) {
                    combo = 1;
                    colorIdx++;
                    colorHaxedIdx++;
                }

                if (colorHax !== 0 && typeBit[2]) {
                    colorHaxedIdx += colorHax;
                }

                returnObject.obj.comboIdx = combo;
                returnObject.obj.colourIdx = colorIdx;
                returnObject.obj.colourHaxedIdx = colorHaxedIdx;

                if (returnObject.obj instanceof Slider) {
                    returnObject.obj.hitCircle.comboIdx = combo;
                    returnObject.obj.hitCircle.colourIdx = colorIdx;
                    returnObject.obj.hitCircle.colourHaxedIdx = colorHaxedIdx;
                }

                combo++;

                return {
                    ...returnObject,
                    timelineObject,
                };
            })
            .filter((o) => o);
        console.log(`Took: ${performance.now() - start}ms to finish objects construction.`);

        start = performance.now();
        this.objectsController = new ObjectsController(parsedHitObjects, coloursList, breakPeriods);
        console.log(`Took: ${performance.now() - start}ms to finish objectsController construction.`);

        // Ported from Lazer
        let extendedEndIndex = this.objectsController.objectsList.length - 1;
        let extendedStartIndex = 0;
        const stackDistance = 3;

        // console.log(this.objectsController);

        for (let i = extendedEndIndex; i > 0; i--) {
            let n = i;
            let currentObj = this.objectsController.objectsList[i];

            if (currentObj.obj.stackHeight != 0) continue;

            if (currentObj.obj instanceof HitCircle) {
                while (--n >= 0) {
                    const nObj = this.objectsController.objectsList[n];
                    const endTime = nObj.obj.endTime;

                    if (currentObj.obj.time - endTime > stackThreshold) break;
                    if (n < extendedStartIndex) {
                        nObj.obj.stackHeight = 0;
                        extendedStartIndex = n;
                    }

                    // console.log(nObj.time);

                    if (
                        nObj.obj instanceof Slider &&
                        this.calculateDistance(
                            [nObj.obj.angleList.at(-1).x, nObj.obj.angleList.at(-1).y],
                            [parseInt(currentObj.obj.originalX), parseInt(currentObj.obj.originalY)]
                        ) < stackDistance
                    ) {
                        let offset = currentObj.obj.stackHeight - nObj.obj.stackHeight + 1;

                        for (let j = n + 1; j <= i; j++) {
                            const jObj = this.objectsController.objectsList[j];

                            if (
                                this.calculateDistance(
                                    [nObj.obj.angleList.at(-1).x, nObj.obj.angleList.at(-1).y],
                                    jObj.obj instanceof Slider
                                        ? [jObj.obj.angleList.at(0).x, jObj.obj.angleList.at(0).y]
                                        : [parseInt(jObj.obj.originalX), parseInt(jObj.obj.originalY)]
                                )
                            ) {
                                jObj.obj.stackHeight -= offset;
                            }
                        }

                        break;
                    }

                    if (
                        this.calculateDistance(
                            nObj.obj instanceof Slider
                                ? [nObj.obj.angleList.at(0).x, nObj.obj.angleList.at(0).y]
                                : [parseInt(nObj.obj.originalX), parseInt(nObj.obj.originalY)],
                            [parseInt(currentObj.obj.originalX), parseInt(currentObj.obj.originalY)]
                        ) < stackDistance
                    ) {
                        nObj.obj.stackHeight = currentObj.obj.stackHeight + 1;
                        currentObj = nObj;
                    }
                }
            } else if (currentObj.obj instanceof Slider) {
                while (--n >= 0) {
                    // console.log(currentObj);
                    const nObj = this.objectsController.objectsList[n];
                    // console.log(nObj);
                    if (currentObj.obj.time - nObj.obj.time > stackThreshold) break;

                    if (
                        this.calculateDistance(
                            nObj.obj instanceof Slider
                                ? [nObj.obj.angleList.at(-1).x, nObj.obj.angleList.at(-1).y]
                                : [parseInt(nObj.obj.originalX), parseInt(nObj.obj.originalY)],
                            currentObj.obj instanceof Slider
                                ? [currentObj.obj.angleList.at(0).x, currentObj.obj.angleList.at(0).y]
                                : [parseInt(currentObj.obj.originalX), parseInt(currentObj.obj.originalY)]
                        ) < stackDistance
                    ) {
                        nObj.obj.stackHeight = currentObj.obj.stackHeight + 1;
                        currentObj = nObj;
                    }
                }
            }

            Beatmap.updateStats();
            Beatmap.updateModdedStats();
        }

        this.objectsController.slidersList.forEach((o) => {
            o.obj.hitCircle.stackHeight = o.obj.stackHeight;
        });

        const drainTime =
            (this.objectsController.objectsList.at(-1).obj.time -
                (breakPeriods.reduce((accumulated, curr) => accumulated + (curr[1] - curr[0]), 0) +
                    this.objectsController.objectsList.at(0).obj.time)) /
            1000;

        Beatmap.difficultyMultiplier = Math.round(
            ((Beatmap.stats.HPDrainRate +
                Beatmap.stats.circleSize +
                Beatmap.stats.overallDifficulty +
                Clamp((this.objectsController.objectsList.length / drainTime) * 8, 0, 16)) /
                38) *
                5
        );
    }

    calculateDistance(vec1, vec2) {
        const xDistance = vec1[0] - vec2[0];
        const yDistance = vec1[1] - vec2[1];
        return Math.sqrt(xDistance ** 2 + yDistance ** 2);
    }

    render() {
        this.objectsController.render();
    }
}
