class ScoreParser {
    static BLOB;
    static REPLAY_DATA;
    static CURSOR_DATA;
    static MODS;
    static IS_OLD_VER;
    static EVAL_LIST = [];
    static MOD_MULTIPLIER;

    static maxCombo = 0;
    static comboPortion = 0;
    static maxComboPortion = 0;

    static INPUT_LIST = ["SMOKE", "K2", "K1", "M2", "M1"];
    static MOD_LIST = [
        "NoFail",
        "Easy",
        "TouchDevice",
        "Hidden",
        "HardRock",
        "SuddenDeath",
        "DoubleTime",
        "Relax",
        "HalfTime",
        "Nightcore",
        "Flashlight",
        "Autoplay",
        "SpunOut",
        "Autopilot",
        "Perfect",
        "Key4",
        "Key5",
        "Key6",
        "Key7",
        "Key8",
        "FadeIn",
        "Random",
        "Cinema",
        "Target",
        "Key9",
        "KeyCoop",
        "Key1",
        "Key3",
        "Key2",
        "ScoreV2",
        "Mirror",
    ];

    static modsMultiplierList = {
        V1: {
            NoFail: 0.5,
            Easy: 0.5,
            HalfTime: 0.3,
            HardRock: 1.06,
            Hidden: 1.06,
            DoubleTime: 1.12,
            Flashlight: 1.12,
        },
        V2: {
            NoFail: 1,
            Easy: 0.5,
            HalfTime: 0.3,
            HardRock: 1.1,
            Hidden: 1.06,
            DoubleTime: 1.2,
            Flashlight: 1.12,
        },
    };

    async getMapData(md5) {
        return (await axios.get(`https://tryz.vercel.app/api/h/${md5}`)).data;
    }

    getIsOldVersion(version) {
        let versionString = version.toString();
        const year = parseInt(versionString.match(/.{1,4}/g)?.[0] ?? "0");
        const month = parseInt(versionString.match(/.{1,4}/g)?.[1].match(/.{1,2}/g)?.[0] ?? "0");
        const day = parseInt(versionString.match(/.{1,4}/g)?.[1].match(/.{1,2}/g)?.[1] ?? "0");

        if (year <= 2019 && month < 5 && day < 10) return true;
        return false;
    }

    static eval() {
        let currentObjIdx = 0;
        let currentInputIdx = 1;
        ScoreParser.EVAL_LIST = [];

        while (currentInputIdx < ScoreParser.CURSOR_DATA.length) {
            if (currentObjIdx >= beatmapFile.beatmapRenderData.objectsList.objectsList.length) break;

            const currentObj = beatmapFile.beatmapRenderData.objectsList.objectsList[currentObjIdx].obj;
            const currentInput = ScoreParser.CURSOR_DATA[currentInputIdx];

            if (ScoreParser.EVAL_LIST.at(-1)?.time === currentObj.time) {
                currentObjIdx++;
                continue;
            }

            const val = currentObj.eval(currentInputIdx);

            if (val === null) {
                currentInputIdx++;
                continue;
            }

            ScoreParser.EVAL_LIST.push({
                time: currentObj.time,
                eval: val.val,
                sv2Eval: val.valV2,
                inputTime: val.val === 0 ? null : val.inputTime,
                type: currentObj.constructor.name,
                checkPointState: val.checkPointState,
                bonus: val.bonus,
                bonusV2: val.bonusV2,
                delta: val.delta,
            });

            if (val.val === 0) {
                if (currentObj instanceof HitCircle) {
                    currentObj.hitTime = currentObj.time + 240 + 1;
                    currentObj.endTime = currentObj.time + Beatmap.hitWindows.MEH;
                }

                if (currentObj instanceof Slider) {
                    currentObj.hitTime = currentObj.time + currentObj.sliderTime + 240 + 1;
                    currentObj.hitCircle.hitTime = currentObj.hitCircle.endTime + 1;
                    currentObj.hitCircle.endTime = currentObj.hitCircle.time + Beatmap.hitWindows.MEH;
                }
            } else {
                if (!(currentObj instanceof Spinner)) {
                    currentObj.hitTime = val.inputTime;
                }
            }

            if (!(currentObj instanceof Spinner)) {
                let judgementTime = currentObj.hitTime;

                if (currentObj instanceof HitCircle && currentObj.hitTime > currentObj.endTime) {
                    judgementTime = currentObj.endTime;
                }

                if (currentObj instanceof Slider) {
                    judgementTime = currentObj.time + currentObj.sliderTime * currentObj.repeat;
                }

                const pos =
                    currentObj instanceof HitCircle
                        ? {
                              x: currentObj.originalX,
                              y: currentObj.originalY,
                          }
                        : {
                              x: currentObj.realTrackPoints.at(-1).x,
                              y: currentObj.realTrackPoints.at(-1).y,
                          };

                const obj = new Judgement(judgementTime, ScoreParser.MODS.includes("ScoreV2") ? val.valV2 : val.val, currentObj.stackHeight, pos);
                beatmapFile.beatmapRenderData.objectsList.judgementList.push(obj);
            }

            currentInputIdx++;
            currentObjIdx++;
        }

        // console.log(ScoreParser.EVAL_LIST.filter((evl) => evl.type === "Slider" && evl.checkPointState.some((checkpoint) => checkpoint.eval !== 1)));
    }

    static calculateScore() {
        let combo = 0;
        let maxCombo = 0;
        // console.log(this.map.difficultyMultiplier, this.map.modMultiplier);

        const filtered = ScoreParser.EVAL_LIST.filter((input) => input.delta !== undefined).map((input) =>
            ApplyModsToTime(input.delta, ScoreParser.MODS)
        );
        const deltaSum = filtered.reduce((prev, curr) => prev + curr, 0);
        const avg = deltaSum / filtered.length;

        const deltaSquaredSum = filtered.reduce((prev, curr) => prev + (curr - avg) ** 2, 0);
        const UR = Fixed(Math.sqrt(deltaSquaredSum / (filtered.length - 1)) * 10, 2);

        const modMultiplier = !ScoreParser.MODS.includes("ScoreV2") ? ScoreParser.MOD_MULTIPLIER.V1 : ScoreParser.MOD_MULTIPLIER.V2;

        const data = ScoreParser.EVAL_LIST.reduce(
            (accumulated, hitData) => {
                if (hitData.type !== "Slider") {
                    maxCombo++;
                    if (hitData.eval === 0) {
                        combo = 0;
                        accumulated.acc.V1.h0++;
                        accumulated.acc.V2.h0++;
                        return accumulated;
                    }

                    const score = Math.round(hitData.eval * (1 + (Math.max(0, combo - 1) * Beatmap.difficultyMultiplier * modMultiplier) / 25));

                    // console.log(hitData.time, hitData.eval, Beatmap.difficultyMultiplier, ScoreParser.MOD_MULTIPLIER);

                    combo++;
                    if (combo > ScoreParser.maxCombo) ScoreParser.maxCombo = combo;

                    if (hitData.eval === 300) {
                        accumulated.acc.V1.h300++;
                        accumulated.acc.V2.h300++;
                    }

                    if (hitData.eval === 100) {
                        accumulated.acc.V1.h100++;
                        accumulated.acc.V2.h100++;
                    }

                    if (hitData.eval === 50) {
                        accumulated.acc.V1.h50++;
                        accumulated.acc.V2.h50++;
                    }

                    // console.log(hitData.time, combo, maxCombo, hitData.eval, this.comboPortion, this.maxComboPortion)

                    ScoreParser.comboPortion += hitData.eval * (1 + combo / 10);
                    ScoreParser.maxComboPortion += 300 * (1 + maxCombo / 10);

                    // console.log(hitData.time, score);
                    // console.log(hitData.time, combo);

                    return {
                        V1: accumulated.V1 + score,
                        V1_S: accumulated.V1_S + score,
                        acc: accumulated.acc,
                        bonus: accumulated.bonus + (hitData.bonus ?? 0),
                        bonusV2: accumulated.bonusV2 + (hitData.bonusV2 ?? 0),
                    };
                }

                let tickScore = 0,
                    repeatScore = 0,
                    headScore = 0,
                    tailScore = 0;

                let valV1 = hitData.eval;
                let valV2 = hitData.sv2Eval;

                let tempMaxCombo = maxCombo;
                hitData.checkPointState
                    .filter((checkPoint) => checkPoint.type !== "Slider Tick")
                    .forEach((checkPoint) => {
                        tempMaxCombo++;
                        ScoreParser.maxComboPortion += 30 * (1 + tempMaxCombo / 10);
                    });
                hitData.checkPointState
                    .filter((checkPoint) => checkPoint.type === "Slider Tick")
                    .forEach((checkPoint) => {
                        tempMaxCombo++;
                        ScoreParser.maxComboPortion += 10 * (1 + tempMaxCombo / 10);
                    });

                hitData.checkPointState.forEach((checkPoint) => {
                    maxCombo++;
                    if (checkPoint.eval === 1) {
                        combo++;
                        switch (checkPoint.type) {
                            case "Slider Head":
                                headScore += 30;
                                ScoreParser.comboPortion += 30 * (1 + combo / 10);
                                break;
                            case "Slider Tick":
                                tickScore += 10;
                                ScoreParser.comboPortion += 10 * (1 + combo / 10);
                                break;
                            case "Slider Repeat":
                                repeatScore += 30;
                                ScoreParser.comboPortion += 30 * (1 + combo / 10);
                                break;
                            case "Slider End":
                                tailScore += 30;
                                ScoreParser.comboPortion += 30 * (1 + combo / 10);
                        }

                        // console.log({ comboPortion: this.comboPortion, max: this.maxComboPortion })

                        if (valV2 < 50) valV2 = 50;
                        if (combo > ScoreParser.maxCombo) ScoreParser.maxCombo = combo;
                    } else {
                        if (checkPoint.type !== "Slider End") {
                            combo = 0;
                            if (valV2 > 50) valV2 = 50;
                        } else {
                            if (valV1 > 100) valV1 = 100;
                            if (valV2 > 100) valV2 = 100;
                        }
                    }
                });

                const sliderScoreV1 = Math.round(
                    valV1 * (1 + (Math.max(0, combo - 1) * Beatmap.difficultyMultiplier * modMultiplier) / 25) +
                        headScore +
                        tickScore +
                        repeatScore +
                        tailScore
                );

                const sliderScoreV2 = Math.round(
                    valV2 * (1 + (Math.max(0, combo - 1) * Beatmap.difficultyMultiplier * modMultiplier) / 25) +
                        headScore +
                        tickScore +
                        repeatScore +
                        tailScore
                );

                if (valV1 === 300) accumulated.acc.V1.h300++;
                if (valV2 === 300) accumulated.acc.V2.h300++;
                if (valV1 === 100) accumulated.acc.V1.h100++;
                if (valV2 === 100) accumulated.acc.V2.h100++;
                if (valV1 === 50) accumulated.acc.V1.h50++;
                if (valV2 === 50) accumulated.acc.V2.h50++;
                if (valV1 === 0) accumulated.acc.V1.h0++;
                if (valV2 === 0) accumulated.acc.V2.h0++;

                ScoreParser.comboPortion += valV2 * (1 + combo / 10);
                ScoreParser.maxComboPortion += 300 * (1 + maxCombo / 10);

                // console.log(valV2)
                // console.log({ comboPortion: this.comboPortion, max: this.maxComboPortion })

                // if (valV1 !== valV2)
                //     console.log(hitData.time, valV1, valV2)

                // console.log(hitData.time, combo);
                // if (hitData.time === 9596) console.log(hitData.time, hitData);
                // if (hitData.checkPointState.some((checkpoint) => checkpoint.eval !== 1)) console.log(hitData.time, hitData);

                return {
                    V1: accumulated.V1 + sliderScoreV1,
                    V1_S: accumulated.V1_S + sliderScoreV2,
                    acc: accumulated.acc,
                    bonus: accumulated.bonus,
                    bonusV2: accumulated.bonusV2,
                };
            },
            {
                V1: 0,
                V1_S: 0,
                acc: {
                    V1: {
                        h300: 0,
                        h100: 0,
                        h50: 0,
                        h0: 0,
                    },
                    V2: {
                        h300: 0,
                        h100: 0,
                        h50: 0,
                        h0: 0,
                    },
                },
                bonus: 0,
                bonusV2: 0,
            }
        );

        const accV1 =
            (data.acc.V1.h300 + data.acc.V1.h100 / 3 + data.acc.V1.h50 / 6) /
            (data.acc.V1.h300 + data.acc.V1.h100 + data.acc.V1.h50 + data.acc.V1.h0);
        const accV2 =
            (data.acc.V2.h300 + data.acc.V2.h100 / 3 + data.acc.V2.h50 / 6) /
            (data.acc.V2.h300 + data.acc.V2.h100 + data.acc.V2.h50 + data.acc.V2.h0);
        const V2 = Math.round(700000 * (data.V1_S / Beatmap.maxScore) + 300000 * accV2 ** 10);
        const V2_new = Math.round(700000 * (ScoreParser.comboPortion / ScoreParser.maxComboPortion) + 300000 * accV2 ** 10);

        // console.log(this.comboPortion)
        // console.log(this.maxComboPortion)
        // console.log(700000 * (this.comboPortion / this.maxComboPortion))

        // console.log(`SCORE_V1 / MAX_SCORE_V1 RATIO:`.padEnd(30, " "), Fixed((data.V1 / Beatmap.maxScore) * 100, 2));
        // console.log(`COMBO_P / MAX_COMBO_P RATIO:`.padEnd(30, " "), Fixed((ScoreParser.comboPortion / ScoreParser.maxComboPortion) * 100, 2));

        const score = {
            ...data,
            accV1,
            accV2,
            UR,
            V2,
            V2_new,
        };

        const calcDiff =
            (ScoreParser.MODS.includes("ScoreV2") ? score.V2_new + score.bonusV2 : score.V1 + score.bonus) - ScoreParser.REPLAY_DATA.score;
        const expectedBonus = (ScoreParser.MODS.includes("ScoreV2") ? score.bonusV2 : score.bonus) - calcDiff;

        console.log(`MAX_COMBO:`.padEnd(15), ScoreParser.maxCombo, "/", Beatmap.maxCombo);
        console.log(`ACC_V1:`.padEnd(15), Fixed(score.accV1 * 100, 2));
        console.log(`└─────`.padEnd(15, "─"), `${score.acc.V1.h300} / ${score.acc.V1.h100} / ${score.acc.V1.h50} / ${score.acc.V1.h0}`);
        console.log(`ACC_V2:`.padEnd(15), Fixed(score.accV2 * 100, 2));
        console.log(`└─────`.padEnd(15, "─"), `${score.acc.V2.h300} / ${score.acc.V2.h100} / ${score.acc.V2.h50} / ${score.acc.V2.h0}`);
        console.log(`UNSTABLE_RATE:`.padEnd(15), score.UR);
        console.log(`CALC_DIFF:`.padEnd(15), calcDiff);
        console.log(``.padEnd(30, "="));

        if (!ScoreParser.MODS.includes("ScoreV2")) {
            console.log(`SCORE_V1 (from replay):`.padEnd(50), ScoreParser.REPLAY_DATA.score);
            console.log(`SCORE_V1 (calculated):`.padEnd(50), score.V1 + score.bonus);
            console.log(`SCORE_V1 (slider accuracy evaluated):`.padEnd(50), score.V1_S + score.bonus);
            console.log(`SCORE_V2 (old method):`.padEnd(50), Math.round(score.V2 * ScoreParser.MOD_MULTIPLIER.V2) + score.bonusV2);
            console.log(`SCORE_V2 (calculated):`.padEnd(50), Math.round(score.V2_new * ScoreParser.MOD_MULTIPLIER.V2) + score.bonusV2);
            console.log(`SPINNER_BONUS (expected):`.padEnd(50), expectedBonus);
            console.log(`SPINNER_BONUS (calculated):`.padEnd(50), score.bonus);
        } else {
            console.log(`SCORE_V1 (calculated):`.padEnd(50), score.V1 + score.bonus);
            console.log(`SCORE_V1 (slider accuracy evaluated):`.padEnd(50), score.V1_S + score.bonus);
            console.log(`SCORE_V2 (calculated):`.padEnd(50), Math.round(score.V2_new * ScoreParser.MOD_MULTIPLIER.V2) + score.bonusV2);
            console.log(`SCORE_V2 (from replay):`.padEnd(50), ScoreParser.REPLAY_DATA.score);
            console.log(`SPINNER_BONUS (expected):`.padEnd(50), expectedBonus);
            console.log(`SPINNER_BONUS (calculated):`.padEnd(50), score.bonusV2);
        }
    }

    async getReplayData() {
        // Convert Blob to ArrayBuffer to Buffer
        document.querySelector(".loading").style.display = "";
        document.querySelector(".loading").style.opacity = 1;
        document.querySelector("#loadingText").innerText = `Parsing Score`;

        const arr_buf = await new Response(ScoreParser.BLOB).arrayBuffer();
        const buf = buffer.Buffer.from(arr_buf);

        // Get Replay Data
        const replay = new Replay(buf);
        const replayData = await replay.deserialize();
        ScoreParser.REPLAY_DATA = replayData;
        ScoreParser.IS_OLD_VER = this.getIsOldVersion(replayData.version);

        // Get Cursor Data
        let timestamp = 0;
        ScoreParser.CURSOR_DATA = replayData.replayData
            .split(",")
            .filter((data) => data !== "")
            .map((data, idx) => {
                const nodes = data.split("|");

                if (nodes[0] === "-12345")
                    return {
                        time: 0,
                        x: 0,
                        y: 0,
                        inputArray: [],
                        idx,
                    };

                timestamp += parseFloat(nodes[0]);
                return {
                    time: timestamp,
                    x: parseFloat(nodes[1]),
                    y: parseFloat(nodes[2]),
                    inputArray: parseInt(nodes[3])
                        .toString(2)
                        .padStart(5, "0")
                        .split("")
                        .reduce((prev, curr, idx) => (curr === "1" && idx !== 0 ? prev.concat([ScoreParser.INPUT_LIST[idx]]) : prev), []),
                    idx,
                };
            });

        ScoreParser.MODS = ScoreParser.REPLAY_DATA.mods
            .toString(2)
            .padStart(31, "0")
            .split("")
            .reduce((accumulated, current, idx) => {
                if (current === "1") accumulated.push(ScoreParser.MOD_LIST[ScoreParser.MOD_LIST.length - 1 - idx]);
                return accumulated;
            }, []);

        mods.HD = ScoreParser.MODS.includes("Hidden");
        mods.HR = ScoreParser.MODS.includes("HardRock");
        mods.EZ = ScoreParser.MODS.includes("Easy");
        mods.DT = ScoreParser.MODS.includes("DoubleTime") || ScoreParser.MODS.includes("Nightcore");
        mods.HT = ScoreParser.MODS.includes("HalfTime");

        

        document.querySelector("#HD").checked = ScoreParser.MODS.includes("Hidden");
        document.querySelector("#HR").checked = ScoreParser.MODS.includes("HardRock");
        document.querySelector("#EZ").checked = ScoreParser.MODS.includes("Easy");
        document.querySelector("#DT").checked = ScoreParser.MODS.includes("DoubleTime") || ScoreParser.MODS.includes("Nightcore");
        document.querySelector("#HT").checked = ScoreParser.MODS.includes("HalfTime");

        const DTMultiplier = !mods.DT ? 1 : 1.5;
        const HTMultiplier = !mods.HT ? 1 : 0.75;
        playbackRate = 1 * DTMultiplier * HTMultiplier;

        const mapData = await this.getMapData(ScoreParser.REPLAY_DATA.md5map);
        submitMap(false, mapData.beatmap_id);

        ScoreParser.MOD_MULTIPLIER = ScoreParser.MODS.reduce(
            (prev, curr) => {
                return {
                    V1: prev.V1 * (ScoreParser.modsMultiplierList.V1[curr] ?? 1),
                    V2: prev.V2 * (ScoreParser.modsMultiplierList.V2[curr] ?? 1),
                };
            },
            {
                V1: 1,
                V2: 1,
            }
        );
        // console.log(ScoreParser.REPLAY_DATA, ScoreParser.CURSOR_DATA, ScoreParser.MODS);
    }

    constructor(blob) {
        ScoreParser.BLOB = blob;
        ScoreParser.REPLAY_DATA = null;
        ScoreParser.CURSOR_DATA = null;
        ScoreParser.EVAL_LIST = [];

        ScoreParser.comboPortion = 0;
        ScoreParser.maxComboPortion = 0;
        ScoreParser.maxCombo = 0;
    }
}
