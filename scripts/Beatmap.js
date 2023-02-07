class Beatmap {
    objectsList;

    constructor(rawBeatmap, delay) {
        approachRate = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("ApproachRate:"))
                .shift()
                .replaceAll("ApproachRate:", "")
        );
        circleSize = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("CircleSize:"))
                .shift()
                .replaceAll("CircleSize:", "")
        );
        stackLeniency = parseFloat(
            rawBeatmap
                .split("\r\n")
                .filter((line) => line.includes("StackLeniency: "))
                .shift()
                .replaceAll("StackLeniency: ", "")
        );

        hitCircleSize = 2 * (54.4 - 4.48 * circleSize);
        preempt = approachRate < 5 ? 1200 + (600 * (5 - approachRate)) / 5 : approachRate > 5 ? 1200 - (750 * (approachRate - 5)) / 5 : 0;
        fadeIn = approachRate < 5 ? 800 + (400 * (5 - approachRate)) / 5 : approachRate > 5 ? 800 - (500 * (approachRate - 5)) / 5 : 500;
        stackOffset = (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2;
        stackThreshold = preempt * stackLeniency;

        // console.log(approachRate, circleSize, stackLeniency, stackThreshold);

        const difficultyPosition = rawBeatmap.indexOf("[Difficulty]") + "[Difficulty]\r\n".length;
        const timingPosition = rawBeatmap.indexOf("[TimingPoints]") + "[TimingPoints]\r\n".length;
        const colourPosition = rawBeatmap.indexOf("[Colours]") + "[Colours]\r\n".length;
        const hitObjectsPosition = rawBeatmap.indexOf("[HitObjects]") + "[HitObjects]\r\n".length;

        const initialSliderVelocity = rawBeatmap.slice(difficultyPosition).split("\r\n")[4].replace("SliderMultiplier:", "") * 100;
        const beatStepsList = rawBeatmap
            .slice(timingPosition, colourPosition - "[Colours]\r\n".length)
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
            .slice(timingPosition, colourPosition - "[Colours]\r\n".length)
            .split("\r\n")
            .filter((timingPoint) => timingPoint !== "")
            .map((timingPoint) => {
                const params = timingPoint.split(",");
                return {
                    time: parseInt(params[0]),
                    svMultiplier: params[1] > 0 ? 1 : parseFloat(((-1 / params[1]) * 100).toFixed(2)),
                };
            });
        const coloursList = rawBeatmap
            .slice(colourPosition, hitObjectsPosition - "[HitObjects]\r\n".length)
            .split("\r\n")
            .filter((line) => line !== "" && line.match(/Combo[0-9]+\s:\s/g))
            .map((colour) => `rgb(${colour.replaceAll(colour.match(/Combo[0-9]+\s:\s/g)[0], "")})`);
        let objectLists = rawBeatmap
            .slice(hitObjectsPosition)
            .split("\r\n")
            .filter((s) => s !== "");
        objectLists = objectLists.map((currentObj, i) => {
            const params = currentObj.split(",");
            let endTime;

            if (!["L", "P", "B", "C"].includes(params[5][0])) endTime = parseInt(params[2]);
            if (["L", "P", "B", "C"].includes(params[5][0])) {
                const currentbeatStep = beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])).beatstep;
                const currentSVMultiplier = timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2]);
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
        const hitCircleList = objectLists
            .map((object) => {
                const params = object.split(",");
                // console.log(parseInt(params[3]).toString(2)[2]);
                if (!["L", "P", "B", "C"].includes(params[5][0]))
                    return {
                        obj: new HitCircle(
                            params[0],
                            params[1],
                            parseInt(params[2]),
                            false,
                            ("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1
                        ),
                        time: parseInt(params[2]) + delay,
                    };
            })
            .filter((o) => o);
        const slidersList = objectLists
            .map((object) => {
                const params = object.split(",");
                const currentSVMultiplier = timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2]);
                // console.log(("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1);

                // console.log(initialSliderVelocity * currentSVMultiplier.svMultiplier);
                if (["L", "P", "B", "C"].includes(params[5][0])) {
                    return {
                        obj: new Slider(
                            `${params[0]}:${params[1]}|${params[5].slice(2)}`,
                            params[5][0],
                            params[6] * params[7],
                            initialSliderVelocity * currentSVMultiplier.svMultiplier,
                            initialSliderVelocity,
                            beatStepsList.findLast((timingPoint) => timingPoint.time <= parseInt(params[2])).beatstep,
                            parseInt(params[2]),
                            ("00000000" + parseInt(params[3]).toString(2)).substr(-8).split("").reverse().join("")[2] == 1,
                            parseInt(params[6])
                        ),
                        time: parseInt(params[2]) + delay,
                    };
                }
            })
            .filter((s) => s);

        this.objectsList = new ObjectsList(hitCircleList, slidersList, coloursList);
    }

    render() {
        if (isPlaying) {
            this.objectsList.render();
        } else {
            this.objectsList.draw(debugPosition);
        }
    }
}
