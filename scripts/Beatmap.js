class Beatmap {
    objectsList;

    constructor(rawBeatmap, delay) {
        if (rawBeatmap.split("\r\n").filter((line) => line.includes("ApproachRate:")).length === 0) {
            approachRate = parseFloat(
                rawBeatmap
                    .split("\r\n")
                    .filter((line) => line.includes("OverallDifficulty:"))
                    .shift()
                    .replaceAll("OverallDifficulty:", "")
            );
        } else {
            approachRate = parseFloat(
                rawBeatmap
                    .split("\r\n")
                    .filter((line) => line.includes("ApproachRate:"))
                    .shift()
                    .replaceAll("ApproachRate:", "")
            );
        }

        circleSize = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("CircleSize:"))
                .shift()
                .replaceAll("CircleSize:", "")
        );
        stackLeniency = rawBeatmap.includes("StackLeniency: ")
            ? parseFloat(
                  rawBeatmap
                      .split("\r\n")
                      .filter((line) => line.includes("StackLeniency: "))
                      .shift()
                      .replaceAll("StackLeniency: ", "")
              )
            : 0.7;

        hitCircleSize = 2 * (54.4 - 4.48 * circleSize);
        sliderBorderThickness = (hitCircleSize * (236 - 190)) / 2 / 256;

        // console.log(hitCircleSize, sliderBorderThickness);

        preempt = approachRate < 5 ? 1200 + (600 * (5 - approachRate)) / 5 : approachRate > 5 ? 1200 - (750 * (approachRate - 5)) / 5 : 1200;
        fadeIn = approachRate < 5 ? 800 + (400 * (5 - approachRate)) / 5 : approachRate > 5 ? 800 - (500 * (approachRate - 5)) / 5 : 800;
        stackOffset = (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2;
        stackThreshold = preempt * stackLeniency;

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
                };
            });

        // console.log(beatStepsList, timingPointsList);
        const coloursList =
            rawBeatmap.indexOf("[Colours]") !== -1
                ? rawBeatmap
                      .slice(colourPosition, hitObjectsPosition - "[HitObjects]\r\n".length)
                      .split("\r\n")
                      .filter((line) => line !== "" && line.match(/Combo[0-9]+\s:\s/g))
                      .map((colour) => `rgb(${colour.replaceAll(colour.match(/Combo[0-9]+\s:\s/g)[0], "")})`)
                : ["#eb4034", "#ebc034", "#34eb65", "#347deb"];
        let objectLists = rawBeatmap
            .slice(hitObjectsPosition)
            .split("\r\n")
            .filter((s) => s !== "");
        objectLists = objectLists.map((currentObj, i) => {
            const params = currentObj.split(",");
            let endTime;

            if (params[5] === undefined || !["L", "P", "B", "C"].includes(params[5][0])) endTime = parseInt(params[2]);
            if (params[5] !== undefined && ["L", "P", "B", "C"].includes(params[5][0])) {
                const currentbeatStep =
                    beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])) !== undefined
                        ? beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])).beatstep
                        : beatStepsList[0].beatstep;
                const currentSVMultiplier =
                    timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2]) !== undefined
                        ? timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2])
                        : timingPointsList[0];
                const initialSliderLen = params[6] * params[7];

                endTime = parseInt(params[2]) + (initialSliderLen / initialSliderVelocity) * currentSVMultiplier.svMultiplier * currentbeatStep;
            }

            const stackHeight = objectLists.filter((object, idx) => {
                const inParams = object.split(",");
                return idx > i && parseInt(inParams[2]) - endTime <= stackThreshold && params[0] === inParams[0] && params[1] === inParams[1];
            }).length;

            // console.log(parseInt(params[2]), stackHeight);

            const x = Math.round(parseInt(params[0]) + stackOffset * stackHeight);
            const y = Math.round(parseInt(params[1]) + stackOffset * stackHeight);
            return [x, y, ...params.slice(2)].join(",");
        });

        // console.log(objectLists);
        const hitsampleEnum = ["normal", "normal", "soft", "drum"];
        const hitsoundEnum = ["hitwhistle", "hitfinish", "hitclap"];

        const hitCircleList = objectLists
            .map((object) => {
                const params = object.split(",");

                if ((params[5] === undefined || !["L", "P", "B", "C"].includes(params[5][0])) && params[3] !== "12") {
                    let hitsoundList = ["hitnormal"];
                    const sampleSet = hitsampleEnum[params[5].split(":")[0]];
                    const additional = hitsampleEnum[params[5].split(":")[1]];
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

                    hitsoundList = hitsoundList.map((hs) => (hs === "hitnormal" ? `${sampleSet}-${hs}` : `${additional}-${hs}`));
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
                        hitsounds: new HitSample(hitsoundList),
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
                // console.log(("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1);

                // console.log(initialSliderVelocity, currentSVMultiplier.svMultiplier);
                if (params[5] !== undefined && ["L", "P", "B", "C"].includes(params[5][0])) {
                    let headHitsoundList = ["hitnormal"];
                    let tailHitsoundList = ["hitnormal"];

                    if (params[8] === undefined) {
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

                        headHitsoundList = headHitsoundList.map((hs) => `normal-${hs}`);
                        tailHitsoundList = tailHitsoundList.map((hs) => `normal-${hs}`);
                    } else {
                        const headHs = params[8].split("|")[0];
                        const tailHs = params[8].split("|").at(-1);

                        let headSs = {
                            default: hitsampleEnum[params[9].split("|")[0].split(":")[0]],
                            additional: hitsampleEnum[params[9].split("|")[0].split(":")[1]],
                        };

                        let tailSs = {
                            default: hitsampleEnum[params[9].split("|").at(-1).split(":")[0]],
                            additional: hitsampleEnum[params[9].split("|").at(-1).split(":")[1]],
                        };

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
                                    headHitsoundList.push(hitsoundEnum[idx]);
                                }
                            });

                        headHitsoundList = headHitsoundList.map((hs) =>
                            hs === "hitnormal" ? `${headSs.default}-${hs}` : `${headSs.additional}-${hs}`
                        );
                        tailHitsoundList = tailHitsoundList.map((hs) =>
                            hs === "hitnormal" ? `${tailSs.default}-${hs}` : `${tailSs.additional}-${hs}`
                        );
                    }

                    // console.log(headHitsoundList, tailHitsoundList);

                    return {
                        obj: new Slider(
                            `${params[0]}:${params[1]}|${params[5].slice(2)}`,
                            params[5][0],
                            params[6] * params[7],
                            initialSliderVelocity * currentSVMultiplier.svMultiplier,
                            initialSliderVelocity,
                            beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])) !== undefined
                                ? beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])).beatstep
                                : beatStepsList[0].beatstep,
                            parseInt(params[2]),
                            ("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1,
                            parseInt(params[6])
                        ),
                        time: parseInt(params[2]) + delay,
                        hitsounds: {
                            sliderHead: new HitSample(headHitsoundList),
                            sliderTail: new HitSample(tailHitsoundList),
                        },
                    };
                }
            })
            .filter((s) => s);

        this.objectsList = new ObjectsList(hitCircleList, slidersList, coloursList);
        // console.log(this.objectsList);
    }

    render() {
        this.objectsList.render();
    }
}
