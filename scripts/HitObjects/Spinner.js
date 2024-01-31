import { Game } from "../Game.js";
import { Beatmap } from "../Beatmap.js";
import { ObjectsController } from "./ObjectsController.js";
import { Clamp, ApplyModsToTime, TranslateToZero } from "../Utils.js";
import { ScoreParser } from "../ScoreParser.js";
import * as PIXI from "pixi.js";

export class Spinner {
    time;
    endTime;
    obj;
    approachCircle;

    hitSounds;

    comboIdx = 1;
    colourIdx = -1;
    colourHaxedIdx = -1;

    playHitsound(timestamp) {
        if (!Game.BEATMAP_FILE.audioNode.isPlaying) return;
        if (timestamp < this.endTime || ObjectsController.lastTimestamp >= this.endTime) return;

        if (!ScoreParser.REPLAY_DATA) {
            this.hitSounds.play();
            return;
        }

        // Will reimplement later for optimization
        const evaluation = ScoreParser.EVAL_LIST.find((evaluation) => evaluation.time === this.time);
        if (evaluation) this.hitSounds.play();
    }

    draw(timestamp) {
        this.obj.x = 256 * Game.SCALE_RATE;
        this.obj.y = 192 * Game.SCALE_RATE;
        this.playHitsound(timestamp);

        if (timestamp < this.time) {
            let currentAR = Clamp(Beatmap.stats.approachRate * (Game.MODS.HR ? 1.4 : 1) * (Game.MODS.EZ ? 0.5 : 1), 0, 10);
            const currentFadeIn = currentAR < 5 ? 800 + (400 * (5 - currentAR)) / 5 : currentAR > 5 ? 800 - (500 * (currentAR - 5)) / 5 : 800;

            this.obj.alpha = 1 - Math.min(1, Math.max(0, (this.time - timestamp) / currentFadeIn));
            this.approachCircle.scale.set(1.0 * Game.SCALE_RATE);
            return;
        }

        if (this.time <= timestamp && timestamp <= this.hitTime) {
            const scale = 1 - Math.max(0, Math.min(1, (timestamp - this.time) / (this.hitTime - this.time)));
            this.approachCircle.scale.set(scale * Game.SCALE_RATE);
            this.obj.alpha = 1;
            return;
        }

        if (timestamp > this.hitTime) {
            this.obj.alpha = 1 - Math.min(1, Math.max(0, (timestamp - this.hitTime) / 240));
            this.approachCircle.scale.set(0.0 * Game.SCALE_RATE);
            return;
        }
    }

    eval(inputIdx) {
        const stat = [];
        const duration = this.hitTime - this.time;

        let velocityOnPaper = 0; // Don't ask me. I'm trolling.
        let velocityCurrent = 0;

        let zeroCount = 0;

        let rotationCount = 0;
        let scoringRotationCount = 0;
        let previousRotationCount = 0;

        let previousAngle;

        let bonus = 0;
        let bonusV2 = 0;
        let rpm = 0;

        const OD = Beatmap.stats.overallDifficulty;
        const RPS = Beatmap.difficultyRange(OD, 3, 5, 7.5);
        const requiredSpins = Math.floor((duration / 1000) * RPS);
        const minSpins = !ScoreParser.IS_OLD_VER ? Math.max(0, requiredSpins / 4) : requiredSpins;
        const fullSpin = !ScoreParser.IS_OLD_VER ? requiredSpins : requiredSpins + 1;
        const maxAccel = 0.00008 + Math.max(0, (5000 - duration) / 1000 / 2000);

        let totalScoreFrameVariance = 0;

        let idx = inputIdx;

        while (ScoreParser.CURSOR_DATA[idx].time < this.hitTime) {
            if (ScoreParser.CURSOR_DATA[idx].time < this.time) {
                idx++;
                continue;
            }

            const currInput = TranslateToZero(ScoreParser.CURSOR_DATA[idx]);
            const currentAngle = Math.atan2(currInput.y, currInput.x);

            let timeDiff = currInput.time - ScoreParser.CURSOR_DATA[idx - 1].time;
            if (ScoreParser.CURSOR_DATA[idx - 1].time === 0) timeDiff = 100 / 6;

            const maxAccelThisFrame = ApplyModsToTime(maxAccel * timeDiff, ScoreParser.MODS);

            if (velocityOnPaper > velocityCurrent) {
                const accel = maxAccelThisFrame;
                velocityCurrent += Math.min(velocityOnPaper - velocityCurrent, accel);
            } else {
                const accel = -maxAccelThisFrame;
                velocityCurrent += Math.max(velocityOnPaper - velocityCurrent, accel);
            }

            velocityCurrent = Clamp(velocityCurrent, -0.05, 0.05);

            const decay1 = 0.9 ** ((timeDiff / 100) * 6);
            rpm = rpm * decay1 + (((1 - decay1) * Math.abs(velocityCurrent) * 1000) / (2 * Math.PI)) * 60;

            previousAngle = !previousAngle ? (ScoreParser.IS_OLD_VER ? 0 : currentAngle) : previousAngle;

            let delta = currentAngle - previousAngle;

            const mPI = -Math.PI;

            if (delta < mPI) {
                delta = 2 * Math.PI + currentAngle - previousAngle;
            } else if (-delta < mPI) {
                delta = -2 * Math.PI - previousAngle + currentAngle;
            }

            const decay = 0.9 ** ((timeDiff / 100) * 6);
            totalScoreFrameVariance = decay * totalScoreFrameVariance + (1 - decay) * timeDiff;

            // I seriously don't know a shit about this
            if (delta === 0) {
                zeroCount++;

                if (zeroCount < 2) {
                    velocityOnPaper /= 3;
                } else {
                    velocityOnPaper = 0;
                }
            } else {
                zeroCount = 0;

                if (currInput.inputArray.length === 0 || currInput.time < this.time) delta = 0;
                if (Math.abs(delta) < Math.PI) {
                    // This is too insane up until this point
                    // Alright so this is like the mininum velocity due to the time delta should be at least 16.67ms
                    // velocityOnPaper = (delta / 100) * 6;
                    // velocityOnPaper = delta / timeDiff;

                    if (ApplyModsToTime(totalScoreFrameVariance, ScoreParser.MODS) > (100 / 6) * 1.04) {
                        if (timeDiff > 0) {
                            velocityOnPaper = delta / ApplyModsToTime(totalScoreFrameVariance, ScoreParser.MODS);
                        } else {
                            velocityOnPaper = 0;
                        }
                    } else {
                        velocityOnPaper = delta / (100 / 6);
                    }
                } else {
                    velocityOnPaper = 0;
                }
            }

            previousAngle = currentAngle;

            // console.log(currInput.time, rotationCount, velocityOnPaper, velocityCurrent);

            const rotated = velocityCurrent * timeDiff;
            const rotatedByRPM = ((rpm * timeDiff) / 60000) * (Math.PI * 2);
            rotationCount += Math.min(1, Math.abs(rotated / Math.PI));
            // rotationCount += Math.min(1, Math.abs(rotatedByRPM / Math.PI));

            if (Math.floor(rotationCount) == previousRotationCount) {
                // console.log(currInput.time, rotationCount, velocityOnPaper, velocityCurrent, motherFucker);
                stat.push({
                    time: currInput.time,
                    delta: Math.abs((delta * 180) / Math.PI),
                    rotationCount,
                    result: 0,
                    rpm,
                    rotated,
                    rotatedByRPM,
                    diff: Math.abs(rotated) - Math.abs(rotatedByRPM),
                });
                idx++;
                continue;
            }

            scoringRotationCount++;

            let currentResult = 0;
            let currentResultV2 = 0;

            if (scoringRotationCount > requiredSpins + 3 && (scoringRotationCount - (requiredSpins + 3)) % 2 === 0) {
                currentResult += 1100;
                currentResultV2 += 600;
            } else if (scoringRotationCount > 1 && scoringRotationCount % 2 === 0) {
                currentResult += 100;
                currentResultV2 += 100;
            }

            // console.log(currInput.time, rotationCount, velocityOnPaper, velocityCurrent, motherFucker, currentResult);
            stat.push({
                time: currInput.time,
                delta: Math.abs((delta * 180) / Math.PI),
                rotationCount,
                result: currentResult,
                rpm,
                rotated,
                rotatedByRPM,
                diff: Math.abs(rotated) - Math.abs(rotatedByRPM),
            });

            previousRotationCount = Math.floor(rotationCount);

            bonus += currentResult;
            bonusV2 += currentResultV2;

            idx++;
        }

        // console.table(stat);
        let val = 0;

        if (!ScoreParser.IS_OLD_VER) {
            val = scoringRotationCount < minSpins ? 0 : scoringRotationCount > fullSpin ? 300 : scoringRotationCount > fullSpin - 1 ? 100 : 50;
        } else {
            val =
                minSpins === 0
                    ? 300
                    : scoringRotationCount < minSpins
                    ? 0
                    : scoringRotationCount > fullSpin
                    ? 300
                    : scoringRotationCount > fullSpin - 2
                    ? 100
                    : 50;
        }

        return {
            val,
            valV2: val,
            bonus,
            bonusV2,
            inputTime: -1,
        };
    }

    constructor(startTime, endTime, hitSounds) {
        this.time = startTime;
        this.hitTime = endTime;
        this.killTime = endTime + 240;
        this.endTime = endTime;

        const container = new PIXI.Container();

        const approachCircleContainer = new PIXI.Container();
        const approachCircle = new PIXI.Graphics()
            .setStrokeStyle({
                width: 2,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .circle(0, 0, 192)
            .stroke();

        approachCircleContainer.addChild(approachCircle);

        const spinner = new PIXI.Graphics()
            .setStrokeStyle({
                width: 2,
                color: 0xffffff,
                alpha: 1,
                cap: "round",
                alignment: 0,
            })
            .circle(0, 0, 5)
            .stroke();

        container.addChild(approachCircleContainer);
        container.addChild(spinner);
        container.x = (256 * Game.WIDTH) / 512;
        container.y = (192 * Game.WIDTH) / 512;

        this.obj = container;
        this.approachCircle = approachCircleContainer;
        this.hitSounds = hitSounds
    }

    get approachCircleObj() {
        return null;
    }
}
