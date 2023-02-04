const originalTime = new Date().getTime();
const axios = window.axios;

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const scaleFactor = 1080 / 480;
const textureScaleFactor = (1080 / 768) ** 2;

const hitCircleSize = 2 * (54.4 - 4.48 * 4);
const sliderBorderThickness = 8;
const sliderAccuracy = 0.0025;
const sliderSnaking = true;
const sliderBorderColor = "#ffffff";

const sampleHitCircle = document.querySelector("#sampleHitCircle");
const sampleHitCircleOverlay = document.querySelector("#sampleHitCircleOverlay");
const sampleApproachCircle = document.querySelector("#sampleApproachCircle");
const sampleSliderB = document.querySelector("#sampleSliderB");

const canvas = document.querySelector("#canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const approachRate = 9.3;
let preempt;
let fadeIn;
let isPlaying = true;

switch (true) {
    case approachRate < 5:
        preempt = 1200 + (600 * (5 - approachRate)) / 5;
        fadeIn = 800 + (400 * (5 - approachRate)) / 5;
        break;
    case approachRate === 5:
        preempt = 0;
        fadeIn = 500;
        break;
    case approachRate > 5:
        preempt = 1200 - (750 * (approachRate - 5)) / 5;
        fadeIn = 800 - (500 * (approachRate - 5)) / 5;
}

class HitCircle {
    startTime;
    endTime;
    positionX;
    positionY;
    isNewCombo;
    originalX;
    originalY;

    drawApproachCircle(approachRateExpandRate, colour) {
        const pseudoCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        pseudoCtx.drawImage(
            sampleApproachCircle,
            this.positionX - ((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2,
            this.positionY - ((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2,
            (hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate,
            (hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate
        );

        pseudoCtx.globalCompositeOperation = "source-atop";
        pseudoCtx.fillStyle = colour;
        pseudoCtx.rect(0, 0, window.innerWidth, window.innerHeight);
        pseudoCtx.fill();

        return pseudoCanvas;
    }

    draw(opacity, trol, expandRate, preemptRate, colour) {
        const normalizedExpandRate = opacity >= 0 ? 1 : 1 + (1 - expandRate) * 0.5;
        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 0;

        const pseudoCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        ctx.globalAlpha = opacity >= 0 ? opacity : expandRate >= 0 ? expandRate : 0;

        pseudoCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        pseudoCtx.drawImage(
            sampleHitCircle,
            this.positionX - ((hitCircleSize + 5) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2,
            this.positionY - ((hitCircleSize + 5) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2,
            (hitCircleSize + 5) * textureScaleFactor * normalizedExpandRate,
            (hitCircleSize + 5) * textureScaleFactor * normalizedExpandRate
        );
        pseudoCtx.globalCompositeOperation = "multiply";
        pseudoCtx.fillStyle = colour;
        pseudoCtx.arc(this.originalX, this.originalY, ((hitCircleSize + 2) * textureScaleFactor * normalizedExpandRate) / 2, 0, 2 * Math.PI, false);
        pseudoCtx.fill();

        pseudoCtx.globalCompositeOperation = "source-over";
        pseudoCtx.drawImage(
            sampleHitCircleOverlay,
            this.positionX - ((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2,
            this.positionY - ((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2,
            (hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate,
            (hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate
        );

        const approachCircleCanvas = this.drawApproachCircle(approachRateExpandRate, colour);

        pseudoCtx.drawImage(approachCircleCanvas, 0, 0);

        // console.log(colour);

        ctx.drawImage(pseudoCanvas, 0, 0);
        ctx.globalAlpha = 1;
    }

    constructor(positionX, positionY, time, isSliderHead, isNewCombo) {
        // const hit = document.createElement("div");
        // hit.classList.add("hitCircle");
        // hit.style.left = `${positionX * scaleFactor - (hitCircleSize * textureScaleFactor) / 2}px`;
        // hit.style.top = `${positionY * scaleFactor - (hitCircleSize * textureScaleFactor) / 2}px`;
        // hit.style.width = `${hitCircleSize * textureScaleFactor}px`;
        // hit.style.height = `${hitCircleSize * textureScaleFactor}px`;
        // this.domObject = hit;
        this.originalX = isSliderHead ? positionX : positionX * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2;
        this.originalY = isSliderHead ? positionY : positionY * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2;

        this.startTime = time - preempt;
        this.endTime = time + 240;

        this.positionX = isSliderHead
            ? positionX - (hitCircleSize * textureScaleFactor) / 2
            : positionX * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2 - (hitCircleSize * textureScaleFactor) / 2;
        this.positionY = isSliderHead
            ? positionY - (hitCircleSize * textureScaleFactor) / 2
            : positionY * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2 - (hitCircleSize * textureScaleFactor) / 2;

        this.isNewCombo = isNewCombo;
    }
}

class Slider {
    pointArr;
    angleList = [];
    breakPoints = [];
    sliderLen = 0;
    initialSliderLen;
    initialSliderVelocity;
    beatStep;
    // time;
    startTime;
    endTime;
    preempt;
    fadeIn;
    hitCircle;
    angleIndex;
    b;
    isNewCombo;

    binom(n, k) {
        var coeff = 1;
        for (var i = n - k + 1; i <= n; i++) coeff *= i;
        for (var i = 1; i <= k; i++) coeff /= i;
        return coeff;
    }

    bezier(t, plist) {
        var order = plist.length - 1;

        var y = 0;
        var x = 0;

        for (let i = 0; i <= order; i++) {
            x = x + this.binom(order, i) * Math.pow(1 - t, order - i) * Math.pow(t, i) * plist[i].x;
            y = y + this.binom(order, i) * Math.pow(1 - t, order - i) * Math.pow(t, i) * plist[i].y;
        }

        return {
            x: x,
            y: y,
        };
    }

    debug() {
        ctx.fillStyle = "red";

        this.pointArr.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
        });

        ctx.beginPath();
        ctx.moveTo(0, this.b);
        ctx.lineTo(innerWidth, this.angleIndex * window.innerWidth + this.b);
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    drawBorder(opacity, percentage, colour) {
        const pseudoCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        ctx.globalAlpha = Math.abs(opacity);

        pseudoCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        pseudoCtx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            // console.log(idx / this.angleList.length, this.initialSliderLen / this.sliderLen, this.sliderLen);
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            if (sliderSnaking && opacity >= 0 && idx / this.angleList.length > Math.abs(opacity)) return;
            if (sliderSnaking && opacity < 0 && idx / (this.angleList.length - 1) <= percentage) {
                pseudoCtx.moveTo(point.x, point.y);
                return;
            }
            pseudoCtx.lineTo(point.x, point.y);
        });

        pseudoCtx.lineJoin = "round";
        pseudoCtx.lineCap = "round";

        pseudoCtx.lineWidth = hitCircleSize * textureScaleFactor;
        pseudoCtx.strokeStyle = colour;
        pseudoCtx.stroke();

        pseudoCtx.lineWidth = (hitCircleSize - sliderBorderThickness) * textureScaleFactor;
        pseudoCtx.strokeStyle = `rgb(0 0 0 / .9)`;
        pseudoCtx.stroke();

        ctx.drawImage(pseudoCanvas, 0, 0);
        ctx.globalAlpha = 1;
    }

    drawBody1(opacity, percentage) {
        ctx.beginPath();
        ctx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            if (sliderSnaking && opacity >= 0 && idx / this.angleList.length > Math.abs(opacity)) return;
            if (sliderSnaking && opacity < 0 && idx / (this.angleList.length - 1) <= percentage) {
                ctx.moveTo(point.x, point.y);
                return;
            }
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = (hitCircleSize - sliderBorderThickness) * textureScaleFactor;
        ctx.strokeStyle = `rgb(0 0 0 / .9)`;
        ctx.stroke();
        ctx.closePath();
    }

    drawBody2(opacity, percentage) {
        ctx.beginPath();
        ctx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            if (sliderSnaking && opacity >= 0 && idx / this.angleList.length > Math.abs(opacity)) return;
            if (sliderSnaking && opacity < 0 && idx / (this.angleList.length - 1) <= percentage) {
                ctx.moveTo(point.x, point.y);
                return;
            }
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = hitCircleSize * textureScaleFactor * 0.4;
        ctx.filter = "blur(30px)";
        ctx.strokeStyle = `rgb(50 50 50)`;
        ctx.stroke();
        ctx.filter = "none";
        ctx.closePath();
    }

    drawBody3(opacity, percentage) {
        ctx.beginPath();
        ctx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            if (sliderSnaking && opacity >= 0 && idx / this.angleList.length > Math.abs(opacity)) return;
            if (sliderSnaking && opacity < 0 && idx / (this.angleList.length - 1) <= percentage) {
                ctx.moveTo(point.x, point.y);
                return;
            }
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = hitCircleSize * textureScaleFactor * 0.03;
        ctx.filter = "blur(10px)";
        ctx.strokeStyle = `rgb(68 68 68)`;
        ctx.stroke();
        ctx.filter = "none";
        ctx.closePath();
    }

    draw(opacity, percentage, hitCircleExpandRate, preemptRate, colour) {
        this.drawBorder(opacity, percentage, colour);
        this.hitCircle.draw(opacity, 0, hitCircleExpandRate, preemptRate, colour);
    }

    getAngleList(pointArr) {
        let lengthAB, lengthBC, lengthAC, angleA, angleB, angleC, radius, innerAngle, upper, lower, angleIndex, b, centerX, centerY;

        if (pointArr.length === 3) {
            lengthAB = Math.sqrt((pointArr[0].x - pointArr[1].x) ** 2 + (pointArr[0].y - pointArr[1].y) ** 2);
            lengthBC = Math.sqrt((pointArr[1].x - pointArr[2].x) ** 2 + (pointArr[1].y - pointArr[2].y) ** 2);
            lengthAC = Math.sqrt((pointArr[0].x - pointArr[2].x) ** 2 + (pointArr[0].y - pointArr[2].y) ** 2);

            angleA = Math.acos((lengthAB ** 2 + lengthAC ** 2 - lengthBC ** 2) / (2 * lengthAB * lengthAC));
            angleB = Math.acos((lengthAB ** 2 + lengthBC ** 2 - lengthAC ** 2) / (2 * lengthAB * lengthBC));
            angleC = Math.acos((lengthAC ** 2 + lengthBC ** 2 - lengthAB ** 2) / (2 * lengthAC * lengthBC));

            radius = lengthAB / (2 * Math.sin(angleC));

            upper = pointArr[2].x - pointArr[0].x;
            lower = pointArr[2].y - pointArr[0].y;
            angleIndex = lower / upper;
            b = pointArr[0].y - angleIndex * pointArr[0].x;

            innerAngle =
                (upper === 0 && pointArr[1].x > pointArr[0].x) || upper * (pointArr[1].y - (angleIndex * pointArr[1].x + b)) < 0
                    ? Math.acos((2 * radius ** 2 - lengthAC ** 2) / (2 * radius ** 2))
                    : -Math.acos((2 * radius ** 2 - lengthAC ** 2) / (2 * radius ** 2));

            centerX =
                (pointArr[0].x * Math.sin(2 * angleA) + pointArr[1].x * Math.sin(2 * angleB) + pointArr[2].x * Math.sin(2 * angleC)) /
                (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));
            centerY =
                (pointArr[0].y * Math.sin(2 * angleA) + pointArr[1].y * Math.sin(2 * angleB) + pointArr[2].y * Math.sin(2 * angleC)) /
                (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));

            this.angleIndex = angleIndex;
            this.b = b;
        }

        this.breakPoints.push(0);
        for (let i = 0; i < pointArr.length - 1; i++) {
            if (pointArr[i].x === pointArr[i + 1].x && pointArr[i].y === pointArr[i + 1].y) this.breakPoints.push(i);
        }
        this.breakPoints.push(pointArr.length - 1);

        for (let z = 0; z < this.breakPoints.length - 1; z++) {
            for (var i = 0; i < 1; i += sliderAccuracy) {
                const pCurrent =
                    pointArr.length !== 3
                        ? this.bezier(i, pointArr.slice(this.breakPoints[z], this.breakPoints[z + 1] + 1))
                        : {
                              x:
                                  centerX +
                                  (pointArr[0].x - centerX) * Math.cos(innerAngle * i) -
                                  (pointArr[0].y - centerY) * Math.sin(innerAngle * i),
                              y:
                                  centerY +
                                  (pointArr[0].x - centerX) * Math.sin(innerAngle * i) +
                                  (pointArr[0].y - centerY) * Math.cos(innerAngle * i),
                          };

                if (i < 1 - sliderAccuracy) {
                    const pNext =
                        pointArr.length !== 3
                            ? this.bezier(i + sliderAccuracy, pointArr.slice(this.breakPoints[z], this.breakPoints[z + 1] + 1))
                            : {
                                  x:
                                      centerX +
                                      (pointArr[0].x - centerX) * Math.cos(innerAngle * (i + sliderAccuracy)) -
                                      (pointArr[0].y - centerY) * Math.sin(innerAngle * (i + sliderAccuracy)),
                                  y:
                                      centerY +
                                      (pointArr[0].x - centerX) * Math.sin(innerAngle * (i + sliderAccuracy)) +
                                      (pointArr[0].y - centerY) * Math.cos(innerAngle * (i + sliderAccuracy)),
                              };

                    this.sliderLen += Math.sqrt((pCurrent.x - pNext.x) ** 2 + (pCurrent.y - pNext.y) ** 2) / scaleFactor;
                    this.angleList.push({
                        x: pCurrent.x,
                        y: pCurrent.y,
                        angle: Math.atan2(pNext.y - pCurrent.y, pNext.x - pCurrent.x) - Math.PI / 2,
                    });
                }
            }
        }
    }

    constructor(pointLists, sliderType, initialSliderLen, initialSliderVelocity, beatStep, time, isNewCombo) {
        // const canvas = document.createElement("canvas");
        const pointArr = pointLists.split("|").map((point) => {
            return {
                x: point.split(":")[0] * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2,
                y: point.split(":")[1] * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2,
            };
        });

        this.pointArr = pointArr;
        this.hitCircle = new HitCircle(pointArr[0].x, pointArr[0].y, time, true);
        this.initialSliderLen = initialSliderLen;
        this.initialSliderVelocity = initialSliderVelocity;
        this.beatStep = parseFloat(beatStep);
        this.getAngleList(pointArr);
        // this.time = time;

        this.startTime = time - preempt;
        this.endTime = time + (initialSliderLen / initialSliderVelocity) * beatStep + 240;

        this.isNewCombo = isNewCombo;

        // this.draw(0.5);

        // console.log((this.initialSliderLen / this.intialSliderVelocity) * this.beatStep);
        // console.log(time, (this.initialSliderLen / this.intialSliderVelocity) * this.beatStep + 300);
    }
}

class ObjectsList {
    hitCirclesList;
    slidersList;
    objectsList;
    drawTime;
    coloursList;
    currentColor;

    compare(a, b) {
        if (a.time < b.time) {
            return -1;
        }
        if (a.time > b.time) {
            return 1;
        }
        return 0;
    }

    constructor(hitCirclesList, slidersList, coloursList) {
        this.hitCirclesList = hitCirclesList;
        this.slidersList = slidersList;
        this.objectsList = hitCirclesList.concat(slidersList).sort(this.compare);
        this.coloursList = coloursList;
        this.currentColor = 0 % this.coloursList.length;

        this.objectsList = this.objectsList.map((object) => {
            if (object.obj.isNewCombo) this.currentColor = (this.currentColor + 1) % this.coloursList.length;
            return {
                ...object,
                colour: this.coloursList[this.currentColor],
            };
        });
        console.log(this.objectsList);
    }

    draw(timestamp) {
        // console.log(timestamp);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.objectsList
            .filter((object) => object.obj.startTime < timestamp && object.obj.endTime > timestamp)
            .reverse()
            .forEach((object) => {
                if (timestamp >= object.obj.startTime) {
                    const opacity =
                        timestamp < object.obj.startTime + preempt
                            ? (timestamp - object.obj.startTime) / fadeIn
                            : (timestamp - (object.obj.endTime - 240)) / 240 - 1;

                    object.obj.draw(
                        opacity,
                        (timestamp - (object.obj.startTime + preempt)) / (object.obj.endTime - 240 - (object.obj.startTime + preempt)),
                        1 - (timestamp - (object.obj.startTime + preempt)) / 240,
                        (timestamp - object.obj.startTime) / preempt,
                        object.colour
                    );
                }
            });

        if (isPlaying)
            window.requestAnimationFrame((currentTime) => {
                const timestampNext = currentTime - this.drawTime;
                return this.draw(timestampNext);
            });
    }

    render() {
        this.drawTime = new Date().getTime() - originalTime + 500;
        window.requestAnimationFrame((currentTime) => {
            const timestamp = currentTime - this.drawTime;
            return this.draw(timestamp);
        });
    }
}

class Cursor {
    aggregateReplayData = [];
    delay;

    constructor() {
        replayData.slice(2, -2).forEach((cursorPosition) => {
            const splittedData = cursorPosition.split("|");
            const cursorData = {
                timeSinceLastNote: splittedData[0],
                x: splittedData[1],
                y: splittedData[2],
            };

            if (cursorData.timeSinceLastNote < 0) this.delay = Math.abs(cursorData.timeSinceLastNote);

            this.aggregateReplayData.push({
                timeSinceLastNote:
                    cursorData.timeSinceLastNote < 0
                        ? 0
                        : parseInt(this.aggregateReplayData.at(-1).timeSinceLastNote) + parseInt(cursorData.timeSinceLastNote),
                x: splittedData[1] * scaleFactor,
                y: splittedData[2] * scaleFactor,
            });
        });
    }

    render() {
        this.aggregateReplayData.forEach((cursorData) => {
            setTimeout(() => {
                document.querySelector("#cursor").style.transform = `translateX(${cursorData.x}px) translateY(${cursorData.y}px)`;
            }, cursorData.timeSinceLastNote);
        });
    }
}

class Audio {
    audioObj;

    constructor() {
        const audio = document.createElement("audio");
        audio.src = "./audio.mp3";
        audio.volume = 0.1;
        audio.mute = "true";

        this.audioObj = audio;
        document.body.appendChild(this.audioObj);
    }

    play() {
        this.audioObj.play();
    }
}

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
                if (!["L", "P", "B", "C"].includes(params[5][0]))
                    return {
                        obj: new HitCircle(params[0], params[1], parseInt(params[2]), false, parseInt(params[3]) === 2),
                        time: parseInt(params[2]) + delay,
                    };
            })
            .filter((o) => o);
        const slidersList = objectLists
            .slice(0, -1)
            .map((object) => {
                const params = object.split(",");
                const currentSVMultiplier = timingPointsList.findLast((timingPoint) => timingPoint.time <= params[2]);

                // console.log(initialSliderVelocity * currentSVMultiplier.svMultiplier);
                if (["L", "P", "B", "C"].includes(params[5][0])) {
                    return {
                        obj: new Slider(
                            `${params[0]}:${params[1]}|${params[5].slice(2)}`,
                            params[5][0],
                            params[6] * params[7],
                            initialSliderVelocity * currentSVMultiplier.svMultiplier,
                            beatStep,
                            parseInt(params[2]),
                            parseInt(params[3]) === 2
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
            this.objectsList.draw(15000);
        }
    }
}

const beatmapRender = async () => {
    // const rawBeatmap = (await axios.get("https://tryz.vercel.app/api/b/3574847/osu")).data;
    const rawBeatmap = (await axios.get("https://tryz.vercel.app/api/b/2412642/osu")).data;

    const audio = new Audio();
    // const cursor = new Cursor();
    const beatmap = new Beatmap(rawBeatmap, 0);

    document.body.addEventListener("click", () => {
        if (isPlaying) audio.play();
        beatmap.render();
        // cursor.render();
    });
};
document.querySelector("#cursorContainer").style.width = `${512 * scaleFactor}px`;
document.querySelector("#cursorContainer").style.height = `${384 * scaleFactor}px`;

beatmapRender();

const hcLists = [
    [246, 217],
    [199, 198],
    [149, 200],
    [105, 224],
    [75, 264],
];
// hcLists.forEach((point) => {
//     const hc = new HitCircle(point[0], point[1], 0);
//     hc.draw(1);
// });

const sldrLists = ["208:144|176:96|192:16", "304:144|336:96|320:16", "304:240|336:288|320:368", "208:240|176:288|192:368"];
// sldrLists.forEach((sl) => {
//     const sldr = new Slider(sl, "B", 115, 230, 60000 / 170, 0);
//     sldr.draw(-1, 0.2, 0.2);
// });

// const testSlider = new Slider("192:301|187:344|176:384", "B", "230");
// testSlider.draw(1);

// const testSlider2 = new Slider("226:262|271:264|311:284", "B", "230");
// testSlider2.draw(1);

// const testSlider3 = new Slider("186:159|280:144|347:201|347:201|350:269", "B", "230");
// testSlider3.draw(1);

// const testSlider4 = new Slider("329:258|385:262|449:211", "B", "230");
// testSlider4.draw(1);

// const testSlider5 = new Slider("273:220|290:259|300:299", "B", "90", "180", "300");
// testSlider5.draw(1);

// const testSlider6 = new Slider("273:220|300:299", "B", "45", "180", "300");
// testSlider6.draw(1);

// const testSlider7 = new Slider("343:214|327:272|327:272|340:318|340:318|321:379", "B", "180", "180", "300", 500);
// testSlider7.draw(1);

// const testSlider8 = new Slider(
//     "270:170|260:137|222:125|223:132|146:101|179:-49|355:-27|411:167|274:208|274:208|212:227|131:136|82:256|86:259|65:317|1:312|1:312|79:319|79:319|87:326|87:326|168:334|168:334|177:328|177:328|252:336|252:336|256:306|281:287|281:287|279:321|296:354|331:357|331:357|463:367|463:367|318:341|358:129|516:143|539:230|484:274|484:274|517:230|473:162|477:224|405:146|474:79|474:79|466:58|466:58|386:46|386:46|370:53|370:53|27:2|27:2|91:12|110:47|68:47|124:126|181:102",
//     "B",
//     "2542",
//     200 * 0.41,
//     60000 / 180
// );
// testSlider8.draw(1);

// const testSlider9 = new Slider("120:384|266:359|207:284|364:261", "B", 274.049991636658, 174 * 0.35, 60000 / 182, 1000);
// testSlider9.draw(1);
