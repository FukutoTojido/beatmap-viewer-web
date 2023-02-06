class Beatmap {
    objectsList;

    constructor(rawBeatmap, delay) {
        const difficultyPosition = rawBeatmap.indexOf("[Difficulty]") + "[Difficulty]\r\n".length;
        const timingPosition = rawBeatmap.indexOf("[TimingPoints]") + "[TimingPoints]\r\n".length;
        const colourPosition = rawBeatmap.indexOf("[Colours]") + "[Colours]\r\n".length;
        const hitObjectsPosition = rawBeatmap.indexOf("[HitObjects]") + "[HitObjects]\r\n".length;

        const initialSliderVelocity = rawBeatmap.slice(difficultyPosition).split("\r\n")[4].replace("SliderMultiplier:", "") * 100;
        const beatStep = rawBeatmap.slice(timingPosition).split("\r\n")[0].split(",")[1];
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
            .filter((line) => line !== "")
            .map((colour) => `rgb(${colour.replaceAll(colour.match(/Combo[0-9]+\s:\s/g)[0], "")})`);
        const objectLists = rawBeatmap
            .slice(hitObjectsPosition)
            .split("\r\n")
            .filter((s) => s !== "");
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
            .slice(0, -1)
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
                            beatStep,
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
