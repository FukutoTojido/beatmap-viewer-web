function generateSprites(diameter) {
    selectedHitCircleTemplate = HitObjectSprite.createSprite("SELECTED_HIT_CIRCLE", diameter);
    hitCircleTemplate = HitObjectSprite.createSprite("HIT_CIRCLE", diameter);
    hitCircleLegacyTemplate = HitObjectSprite.createSprite("HIT_CIRCLE_LEGACY", diameter);
    hitCircleOverlayTemplate = HitObjectSprite.createSprite("HIT_CIRCLE_OVERLAY", diameter);
    hitCircleOverlayLegacyTemplate = HitObjectSprite.createSprite("HIT_CIRCLE_OVERLAY_LEGACY", diameter);
    approachCircleTemplate = HitObjectSprite.createSprite("APPROACH_CIRCLE", diameter);
    sliderBallTemplate = HitObjectSprite.createSprite("SLIDER_BALL", diameter);
}

class Beatmap {
    objectsList;
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

    constructor(rawBeatmap, delay) {
        // Get Approach Rate
        if (rawBeatmap.split("\r\n").filter((line) => line.includes("ApproachRate:")).length === 0) {
            Beatmap.stats.approachRate = parseFloat(
                rawBeatmap
                    .split("\r\n")
                    .filter((line) => line.includes("OverallDifficulty:"))
                    .shift()
                    .replaceAll("OverallDifficulty:", "")
            );
        } else {
            Beatmap.stats.approachRate = parseFloat(
                rawBeatmap
                    .split("\r\n")
                    .filter((line) => line.includes("ApproachRate:"))
                    .shift()
                    .replaceAll("ApproachRate:", "")
            );
        }

        // Get Circle Size
        Beatmap.stats.circleSize = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("CircleSize:"))
                .shift()
                .replaceAll("CircleSize:", "")
        );

        // Get Circle Size
        Beatmap.stats.HPDrainRate = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("HPDrainRate:"))
                .shift()
                .replaceAll("HPDrainRate:", "")
        );

        // Get Stack Leniency
        Beatmap.stats.stackLeniency = rawBeatmap.includes("StackLeniency: ")
            ? parseFloat(
                  rawBeatmap
                      .split("\r\n")
                      .filter((line) => line.includes("StackLeniency: "))
                      .shift()
                      .replaceAll("StackLeniency: ", "")
              )
            : 0.7;

        // Get Slider Tick Rate
        Beatmap.stats.sliderTickRate = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("SliderTickRate:"))
                .shift()
                .replaceAll("SliderTickRate:", "")
        );

        // Get Overall Difficulty
        Beatmap.stats.overallDifficulty = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("OverallDifficulty:"))
                .shift()
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
        generateSprites(Beatmap.stats.circleDiameter);

        stackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize - 5)) / 5)) / 2;
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

        beatsteps = beatStepsList;

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
                    sampleSet: parseInt(params[3]),
                    sampleIdx: parseInt(params[4]),
                    sampleVol: parseInt(params[5]),
                };
            });

        // console.log(beatStepsList, timingPointsList);
        const coloursList = (
            rawBeatmap.indexOf("[Colours]") !== -1
                ? rawBeatmap
                      .slice(colourPosition, hitObjectsPosition - "[HitObjects]\r\n".length)
                      .split("\r\n")
                      .filter((line) => line !== "" && line.match(/Combo[0-9]+\s:\s/g))
                      .map((colour) => `rgb(${colour.replaceAll(colour.match(/Combo[0-9]+\s:\s/g)[0], "")})`)
                : ["rgb(235,64,52)", "rgb(235,192,52)", "rgb(52,235,101)", "rgb(52,125,235)"]
        ).map((colour) =>
            parseInt(
                colour
                    .replaceAll("rgb(", "")
                    .replaceAll(")", "")
                    .split(",")
                    .map((val) => parseInt(val).toString(16).padStart(2, "0"))
                    .join(""),
                16
            )
        );
        // console.log(coloursList);

        colorsLength = coloursList.length;
        // console.log(colorsLength);
        SliderTexture = newTexture(coloursList);
        SelectedTexture = selectedTexture();

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

        // console.log(objectLists);
        const hitsampleEnum = ["", "normal", "soft", "drum"];
        const hitsoundEnum = ["hitwhistle", "hitfinish", "hitclap"];

        const hitCircleList = objectLists
            .map((object) => {
                const params = object.split(",");

                const currentSVMultiplier =
                    timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2]) !== undefined
                        ? timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2])
                        : timingPointsList[0];

                if (params[3] === "12") {
                    const startTime = parseInt(params[2]);
                    const endTime = parseInt(params[5]);

                    let hitsoundList = ["hitnormal"];
                    const sampleSet =
                        params[6] !== undefined && params[5] !== ""
                            ? params[6].split(":")[0] !== "0"
                                ? hitsampleEnum[params[6].split(":")[0]]
                                : hitsampleEnum[currentSVMultiplier.sampleSet]
                            : hitsampleEnum[currentSVMultiplier.sampleSet];
                    const additional =
                        params[6] !== undefined && params[5] !== ""
                            ? params[6].split(":")[1] !== "0"
                                ? hitsampleEnum[params[6].split(":")[1]]
                                : sampleSet
                            : sampleSet;
                    // console.log(parseInt(params[3]).toString(2)[2]);
                    parseInt(params[4])
                        .toString(2)
                        .padStart(4, "0")
                        .split("")
                        .reverse()
                        .slice(1)
                        .forEach((flag, idx) => {
                            if (flag === "1") hitsoundList.push(hitsoundEnum[idx]);
                        });

                    hitsoundList = hitsoundList.map((hs) =>
                        hs === "hitnormal"
                            ? `${sampleSet}-${hs}${currentSVMultiplier.sampleIdx}`
                            : `${additional}-${hs}${currentSVMultiplier.sampleIdx}`
                    );

                    // console.log(startTime, endTime, hitsoundList);

                    return {
                        obj: new Spinner(startTime, endTime),
                        time: startTime,
                        endTime,
                        hitsounds: new HitSample(hitsoundList, currentSVMultiplier.sampleVol / 100),
                        raw: object,
                    };
                }

                if (params[5] === undefined || !["L", "P", "B", "C"].includes(params[5][0])) {
                    let hitsoundList = ["hitnormal"];
                    const sampleSet =
                        params[5] !== undefined && params[5] !== ""
                            ? params[5].split(":")[0] !== "0"
                                ? hitsampleEnum[params[5].split(":")[0]]
                                : hitsampleEnum[currentSVMultiplier.sampleSet]
                            : hitsampleEnum[currentSVMultiplier.sampleSet];
                    const additional =
                        params[5] !== undefined && params[5] !== ""
                            ? params[5].split(":")[1] !== "0"
                                ? hitsampleEnum[params[5].split(":")[1]]
                                : sampleSet
                            : sampleSet;
                    // console.log(parseInt(params[3]).toString(2)[2]);
                    parseInt(params[4])
                        .toString(2)
                        .padStart(4, "0")
                        .split("")
                        .reverse()
                        .slice(1)
                        .forEach((flag, idx) => {
                            if (flag === "1") hitsoundList.push(hitsoundEnum[idx]);
                        });

                    hitsoundList = hitsoundList.map((hs) =>
                        hs === "hitnormal"
                            ? `${sampleSet}-${hs}${currentSVMultiplier.sampleIdx}`
                            : `${additional}-${hs}${currentSVMultiplier.sampleIdx}`
                    );
                    // console.log(hitsoundList);

                    return {
                        obj: new HitCircle(
                            params[0],
                            params[1],
                            parseInt(params[2]),
                            false,
                            ("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1
                        ),
                        time: parseInt(params[2]) + delay,
                        endTime: parseInt(params[2]) + delay,
                        hitsounds: new HitSample(hitsoundList, currentSVMultiplier.sampleVol / 100),
                        raw: object,
                    };
                }
            })
            .filter((o) => o);
        const slidersList = objectLists
            .map((object) => {
                const params = object.split(",");

                const currentSVMultiplier =
                    timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2]) !== undefined
                        ? timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2])
                        : timingPointsList[0];

                const currentbeatStep =
                    beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2]) + delay) !== undefined
                        ? beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2]) + delay).beatstep
                        : beatStepsList[0].beatstep;
                // console.log(("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1);

                // console.log(initialSliderVelocity, currentSVMultiplier.svMultiplier);
                if (params[5] !== undefined && ["L", "P", "B", "C"].includes(params[5][0])) {
                    const calculatedEndTime =
                        parseInt(params[2]) + ((params[6] * params[7]) / currentSVMultiplier.svMultiplier / initialSliderVelocity) * currentbeatStep;
                    // console.log(params[2], calculatedEndTime);

                    const sliderEndSVMultiplier =
                        timingPointsList.findLast((timingPoint) => timingPoint.time <= calculatedEndTime) !== undefined
                            ? timingPointsList.findLast((timingPoint) => timingPoint.time <= calculatedEndTime)
                            : timingPointsList[0];

                    let headHitsoundList = ["hitnormal"];
                    let tailHitsoundList = ["hitnormal"];
                    let reverseList = [];

                    if (params[8] === undefined) {
                        const defaultHeadSampleSet = hitsampleEnum[currentSVMultiplier.sampleSet];
                        const defaultTailSampleSet = hitsampleEnum[sliderEndSVMultiplier.sampleSet];

                        parseInt(params[4])
                            .toString(2)
                            .padStart(4, "0")
                            .split("")
                            .reverse()
                            .slice(1)
                            .forEach((flag, idx) => {
                                if (flag === "1") {
                                    headHitsoundList.push(hitsoundEnum[idx]);
                                    tailHitsoundList.push(hitsoundEnum[idx]);
                                }
                            });

                        headHitsoundList = headHitsoundList.map((hs) => `${defaultHeadSampleSet}-${hs}`);
                        tailHitsoundList = tailHitsoundList.map((hs) => `${defaultTailSampleSet}-${hs}`);
                        for (let i = 0; i < parseInt(params[6]) - 1; i++) {
                            reverseList.push(new HitSample(headHitsoundList));
                        }
                    } else {
                        const headHs = params[8].split("|")[0];
                        const tailHs = params[8].split("|").at(-1);

                        let headSs = {
                            default: "normal",
                            additional: "normal",
                        };
                        let tailSs = {
                            default: "normal",
                            additional: "normal",
                        };

                        if (params[9] !== undefined) {
                            const defaultHeadSampleSet =
                                params[9].split("|")[0].split(":")[0] !== "0"
                                    ? hitsampleEnum[params[9].split("|")[0].split(":")[0]]
                                    : hitsampleEnum[currentSVMultiplier.sampleSet];

                            const defaultTailSampleSet =
                                params[9].split("|").at(-1).split(":")[0] !== "0"
                                    ? hitsampleEnum[params[9].split("|").at(-1).split(":")[0]]
                                    : hitsampleEnum[sliderEndSVMultiplier.sampleSet];

                            headSs = {
                                default: defaultHeadSampleSet,
                                additional:
                                    params[9].split("|")[0].split(":")[1] !== "0"
                                        ? hitsampleEnum[params[9].split("|")[0].split(":")[1]]
                                        : defaultHeadSampleSet,
                            };

                            tailSs = {
                                default: defaultTailSampleSet,
                                additional:
                                    params[9].split("|").at(-1).split(":")[1] !== "0"
                                        ? hitsampleEnum[params[9].split("|").at(-1).split(":")[1]]
                                        : defaultTailSampleSet,
                            };
                        }

                        parseInt(headHs)
                            .toString(2)
                            .padStart(4, "0")
                            .split("")
                            .reverse()
                            .slice(1)
                            .forEach((flag, idx) => {
                                if (flag === "1") {
                                    headHitsoundList.push(hitsoundEnum[idx]);
                                }
                            });

                        parseInt(tailHs)
                            .toString(2)
                            .padStart(4, "0")
                            .split("")
                            .reverse()
                            .slice(1)
                            .forEach((flag, idx) => {
                                if (flag === "1") {
                                    tailHitsoundList.push(hitsoundEnum[idx]);
                                }
                            });

                        headHitsoundList = headHitsoundList.map((hs) =>
                            hs === "hitnormal"
                                ? `${headSs.default}-${hs}${currentSVMultiplier.sampleIdx}`
                                : `${headSs.additional}-${hs}${currentSVMultiplier.sampleIdx}`
                        );
                        tailHitsoundList = tailHitsoundList.map((hs) =>
                            hs === "hitnormal"
                                ? `${tailSs.default}-${hs}${sliderEndSVMultiplier.sampleIdx}`
                                : `${tailSs.additional}-${hs}${sliderEndSVMultiplier.sampleIdx}`
                        );

                        const reverseHs = params[8].split("|").slice(1, -1);
                        // console.log(params[2], reverseHs);
                        reverseList = reverseHs.map((edge, idx) => {
                            const calculatedTime =
                                parseInt(params[2]) +
                                (((idx + 1) * params[7]) / currentSVMultiplier.svMultiplier / initialSliderVelocity) * currentbeatStep;

                            const edgeSVMultiplier =
                                timingPointsList.findLast((timingPoint) => timingPoint.time <= calculatedTime) !== undefined
                                    ? timingPointsList.findLast((timingPoint) => timingPoint.time <= calculatedTime)
                                    : timingPointsList[0];
                            let hitsoundList = ["hitnormal"];

                            let ss = {
                                default: "normal",
                                additional: "normal",
                            };

                            if (params[9] !== undefined) {
                                const defaultSampleSet =
                                    params[9].split("|")[idx + 1].split(":")[0] !== "0"
                                        ? hitsampleEnum[params[9].split("|")[idx + 1].split(":")[0]]
                                        : hitsampleEnum[edgeSVMultiplier.sampleSet];

                                ss = {
                                    default: defaultSampleSet,
                                    additional:
                                        params[9].split("|")[idx + 1].split(":")[1] !== "0"
                                            ? hitsampleEnum[params[9].split("|")[idx + 1].split(":")[1]]
                                            : defaultSampleSet,
                                };
                            }

                            parseInt(edge)
                                .toString(2)
                                .padStart(4, "0")
                                .split("")
                                .reverse()
                                .slice(1)
                                .forEach((flag, idx) => {
                                    if (flag === "1") {
                                        hitsoundList.push(hitsoundEnum[idx]);
                                    }
                                });

                            hitsoundList = hitsoundList.map((hs) =>
                                hs === "hitnormal"
                                    ? `${ss.default}-${hs}${edgeSVMultiplier.sampleIdx}`
                                    : `${ss.additional}-${hs}${edgeSVMultiplier.sampleIdx}`
                            );

                            return new HitSample(hitsoundList, edgeSVMultiplier.sampleVol / 100);
                        });
                    }

                    // console.log(parseInt(params[2]), headHitsoundList, tailHitsoundList);
                    const sliderObj = new Slider(
                        `${params[0]}:${params[1]}|${params[5].slice(2)}`,
                        params[5][0],
                        parseFloat(params[7]),
                        currentSVMultiplier.svMultiplier,
                        initialSliderVelocity,
                        beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])) !== undefined
                            ? beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])).beatstep
                            : beatStepsList[0].beatstep,
                        parseInt(params[2]),
                        ("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1,
                        parseInt(params[6])
                    );

                    const endTime =
                        parseInt(params[2]) +
                        delay +
                        ((sliderObj.sliderLength * sliderObj.repeat) / currentSVMultiplier.svMultiplier / sliderObj.baseSV) * currentbeatStep;

                    return {
                        obj: sliderObj,
                        time: parseInt(params[2]) + delay,
                        endTime: endTime,
                        hitsounds: {
                            sliderHead: new HitSample(headHitsoundList, currentSVMultiplier.sampleVol / 100),
                            sliderTail: new HitSample(tailHitsoundList, sliderEndSVMultiplier.sampleVol / 100),
                            sliderReverse: reverseList,
                        },
                        raw: object,
                    };
                }
            })
            .filter((s) => s);

        this.objectsList = new ObjectsList(hitCircleList, slidersList, coloursList, breakPeriods);

        // Ported from Lazer
        let extendedEndIndex = this.objectsList.objectsList.length - 1;
        let extendedStartIndex = 0;
        const stackDistance = 3;

        // console.log(this.objectsList);

        for (let i = extendedEndIndex; i > 0; i--) {
            let n = i;
            let currentObj = this.objectsList.objectsList[i];

            if (currentObj.obj.stackHeight != 0) continue;

            if (currentObj.obj instanceof HitCircle) {
                while (--n >= 0) {
                    const nObj = this.objectsList.objectsList[n];
                    const endTime = nObj.endTime;

                    if (currentObj.time - endTime > stackThreshold) break;
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
                            const jObj = this.objectsList.objectsList[j];

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
                    const nObj = this.objectsList.objectsList[n];
                    // console.log(nObj);
                    if (currentObj.time - nObj.time > stackThreshold) break;

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
        }

        this.objectsList.objectsList.forEach((o) => {
            if (o.obj instanceof Slider) {
                o.obj.reInitialize();
                o.obj.hitCircle.stackHeight = o.obj.stackHeight;
            }
        });

        const drainTime =
            (this.objectsList.objectsList.at(-1).obj.time -
                (breakPeriods.reduce((accumulated, curr) => accumulated + (curr[1] - curr[0]), 0) + this.objectsList.objectsList.at(0).obj.time)) /
            1000;

        Beatmap.difficultyMultiplier = Math.round(
            ((Beatmap.stats.HPDrainRate +
                Beatmap.stats.circleSize +
                Beatmap.stats.overallDifficulty +
                Clamp((this.objectsList.objectsList.length / drainTime) * 8, 0, 16)) /
                38) *
                5
        );

        // this.objectsList.objectsList.reverse().forEach((currentObj, i) => {
        //     let stackBaseIndex = i;
        //     const stackHeight = objectLists.filter((object, idx) => {
        //         const inParams = object.split(",");
        //         return idx > i && parseInt(inParams[2]) - endTime <= stackThreshold && params[0] === inParams[0] && params[1] === inParams[1];
        //     }).length;
        //     // console.log(parseInt(params[2]), stackHeight);
        //     const x = Math.round(parseInt(params[0]) + stackOffset * stackHeight);
        //     const y = Math.round(parseInt(params[1]) + stackOffset * stackHeight);
        //     return [x, y, ...params.slice(2)].join(",");
        // });
    }

    calculateDistance(vec1, vec2) {
        const xDistance = vec1[0] - vec2[0];
        const yDistance = vec1[1] - vec2[1];
        return Math.sqrt(xDistance ** 2 + yDistance ** 2);
    }

    render() {
        this.objectsList.render();
    }
}
