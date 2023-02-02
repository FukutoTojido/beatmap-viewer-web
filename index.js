const originalTime = new Date().getTime();
const axios = window.axios;

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const scaleFactor = 1080 / 480;
const textureScaleFactor = (1080 / 768) ** 2;

const hitCircleSize = 2 * (54.4 - 4.48 * 4);
const sliderBorderThickness = 6;
const sliderAccuracy = 0.0025;

const canvas = document.querySelector("#canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");
ctx.lineJoin = "round";
ctx.lineCap = "round";

const approachTime = 2000;
const approachRate = 10;

class HitCircle {
    domObject;

    constructor(positionX, positionY) {
        const hit = document.createElement("div");
        hit.classList.add("hitCircle");
        hit.style.left = `${positionX * scaleFactor - (hitCircleSize * textureScaleFactor) / 2}px`;
        hit.style.top = `${positionY * scaleFactor - (hitCircleSize * textureScaleFactor) / 2}px`;
        hit.style.width = `${hitCircleSize * textureScaleFactor}px`;
        hit.style.height = `${hitCircleSize * textureScaleFactor}px`;

        this.domObject = hit;
    }

    render() {
        document.querySelector("#main").appendChild(this.domObject);
        this.domObject.classList.add("fadeIn");

        setTimeout(() => {
            this.domObject.classList.remove("fadeIn");
            this.domObject.classList.add("fadeOut");

            setTimeout(() => {
                document.querySelector("#main").removeChild(this.domObject);
            }, 100);
        }, 450);
    }

    renderWithoutFadeOut() {
        document.querySelector("#main").appendChild(this.domObject);
        this.domObject.classList.add("fadeIn");
    }
}

class Slider {
    domObject;
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

    drawBorder(opacity) {
        ctx.beginPath();
        ctx.moveTo(this.angleList[0].x, this.angleList[0].y);
        ctx.lineWidth = hitCircleSize * textureScaleFactor;
        ctx.strokeStyle = `rgb(50, 50, 50, ${opacity})`;
        this.angleList.forEach((point, idx) => {
            // console.log(idx / this.angleList.length, this.initialSliderLen / this.sliderLen, this.sliderLen);
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.closePath();
    }

    drawBody1(opacity) {
        ctx.beginPath();
        ctx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = (hitCircleSize - sliderBorderThickness) * textureScaleFactor;
        ctx.strokeStyle = `rgb(0 0 0 / ${opacity})`;
        ctx.stroke();
        ctx.closePath();
    }

    drawBody2(opacity) {
        ctx.beginPath();
        ctx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = hitCircleSize * textureScaleFactor * 0.4;
        ctx.filter = "blur(30px)";
        ctx.strokeStyle = `rgb(50 50 50 / ${opacity})`;
        ctx.stroke();
        ctx.filter = "none";
        ctx.closePath();
    }

    drawBody3(opacity) {
        ctx.beginPath();
        ctx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = hitCircleSize * textureScaleFactor * 0.03;
        ctx.filter = "blur(10px)";
        ctx.strokeStyle = `rgb(68 68 68 / ${opacity})`;
        ctx.stroke();
        ctx.filter = "none";
        ctx.closePath();
    }

    draw(opacity) {
        this.drawBorder(opacity);
        this.drawBody1(opacity);
        this.drawBody2(opacity);
        this.drawBody3(opacity);
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
            innerAngle =
                (upper === 0 && pointArr[1].x > pointArr[0].x) || upper * (pointArr[1].y - (angleIndex * pointArr[1].x + b)) < 0
                    ? Math.acos((2 * radius ** 2 - lengthAC ** 2) / (2 * radius ** 2))
                    : -Math.acos((2 * radius ** 2 - lengthAC ** 2) / (2 * radius ** 2));

            upper = pointArr[2].x - pointArr[0].x;
            lower = pointArr[2].y - pointArr[0].y;

            angleIndex = lower / upper;
            b = pointArr[0].y - angleIndex * pointArr[0].x;

            centerX =
                (pointArr[0].x * Math.sin(2 * angleA) + pointArr[1].x * Math.sin(2 * angleB) + pointArr[2].x * Math.sin(2 * angleC)) /
                (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));
            centerY =
                (pointArr[0].y * Math.sin(2 * angleA) + pointArr[1].y * Math.sin(2 * angleB) + pointArr[2].y * Math.sin(2 * angleC)) /
                (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));
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

    constructor(pointLists, sliderType, initialSliderLen, initialSliderVelocity, beatStep, time) {
        // const canvas = document.createElement("canvas");
        const pointArr = pointLists.split("|").map((point) => {
            return {
                x: point.split(":")[0] * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2,
                y: point.split(":")[1] * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2,
            };
        });

        this.initialSliderLen = initialSliderLen;
        this.initialSliderVelocity = initialSliderVelocity;
        this.beatStep = parseFloat(beatStep);
        this.domObject = canvas;
        this.getAngleList(pointArr);
        // this.time = time;
        switch (true) {
            case approachRate < 5:
                this.preempt = 1200 - (600 * (5 - approachRate)) / 5;
                break;
            case approachRate === 5:
                this.preempt = 0;
                break;
            case approachRate > 5:
                this.preempt = 1200 - (750 * (approachRate - 5)) / 5;
        }

        this.startTime = time - this.preempt;
        this.endTime = time + (initialSliderLen / initialSliderVelocity) * beatStep + this.preempt;

        // this.draw(0.5);

        // console.log((this.initialSliderLen / this.intialSliderVelocity) * this.beatStep);
        // console.log(time, (this.initialSliderLen / this.intialSliderVelocity) * this.beatStep + 300);
    }

    render() {
        // document.body.insertBefore(this.domObject, document.querySelector("#main"));
        // this.domObject.classList.add("fadeIn");
        // setTimeout(() => {
        //     this.domObject.classList.remove("fadeIn");
        //     this.domObject.classList.add("fadeOutSlider");
        //     setTimeout(() => {
        //         document.body.removeChild(this.domObject);
        //     }, 100);
        // }, (this.initialSliderLen / this.intialSliderVelocity) * this.beatStep + 300);
    }

    renderWithoutFadeOut() {
        // document.body.insertBefore(this.domObject, document.querySelector("#main"));
        // this.domObject.classList.add("fadeIn");
    }
}

class SlidersList {
    slidersList;
    drawTime;

    constructor(slidersList) {
        this.slidersList = slidersList;
    }

    draw(currentTime) {
        const elapsed = currentTime - this.drawTime;

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.slidersList
            .filter((slider) => slider.obj.startTime < elapsed && slider.obj.endTime > elapsed)
            .forEach((slider) => {
                if (elapsed >= slider.obj.startTime) {
                    const opacity =
                        elapsed < slider.obj.endTime - 240
                            ? (elapsed - slider.obj.startTime) / slider.obj.preempt
                            : 1 - (elapsed - (slider.obj.endTime - 240)) / 240;

                    slider.obj.draw(opacity);
                }
            });

        window.requestAnimationFrame((currentTime) => this.draw(currentTime));
    }

    render() {
        this.drawTime = new Date().getTime() - originalTime;
        window.requestAnimationFrame((currentTime) => this.draw(currentTime));
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
    hitCircleList;
    slidersList;

    constructor(rawBeatmap, delay) {
        const difficultyPosition = rawBeatmap.indexOf("[Difficulty]") + "[Difficulty]\r\n".length;
        const initialSliderVelocity = rawBeatmap.slice(difficultyPosition).split("\r\n")[4].replace("SliderMultiplier:", "") * 100;

        const timingPosition = rawBeatmap.indexOf("[TimingPoints]") + "[TimingPoints]\r\n".length;
        const beatStep = rawBeatmap.slice(timingPosition).split("\r\n")[0].split(",")[1];

        const colourPosition = rawBeatmap.indexOf("[Colours]");
        const timingPointsList = rawBeatmap
            .slice(timingPosition, colourPosition)
            .split("\r\n")
            .filter((timingPoint) => timingPoint !== "")
            .map((timingPoint) => {
                const params = timingPoint.split(",");
                return {
                    time: parseInt(params[0]),
                    svMultiplier: params[1] > 0 ? 1 : parseFloat(((-1 / params[1]) * 100).toFixed(2)),
                };
            });

        // console.log(timingPointsList);

        const hitObjectsPosition = rawBeatmap.indexOf("[HitObjects]") + "[HitObjects]\r\n".length;
        const objectLists = rawBeatmap
            .slice(hitObjectsPosition)
            .split("\r\n")
            .filter((s) => s !== "");

        const hitCircleList = objectLists.map((object) => {
            const params = object.split(",");
            return {
                obj: new HitCircle(params[0], params[1]),
                time: params[2] - 300 + delay,
            };
        });

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
                            parseInt(params[2])
                        ),
                        time: params[2] - 300 + delay,
                    };
                }
            })
            .filter((s) => s);

        this.hitCircleList = hitCircleList;
        this.slidersList = new SlidersList(slidersList);
    }

    render() {
        this.hitCircleList.forEach((obj) =>
            setTimeout(() => {
                obj.obj.render();
            }, obj.time)
        );

        this.slidersList.render();

        // this.slidersList.forEach((obj) =>
        //     setTimeout(() => {
        //         obj.obj.render();
        //     }, obj.time)
        // );
    }
}

const beatmapRender = async () => {
    const rawBeatmap = (await axios.get("https://tryz.vercel.app/api/b/2412642/osu")).data;

    const audio = new Audio();
    // const cursor = new Cursor();
    const beatmap = new Beatmap(rawBeatmap, 0);

    document.body.addEventListener("click", () => {
        beatmap.render();
        // cursor.render();

        setTimeout(() => {
            audio.play();
        }, 0);
    });
};

document.querySelector("#main").style.width = `${512 * scaleFactor}px`;
document.querySelector("#main").style.height = `${384 * scaleFactor}px`;
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
//     const hc = new HitCircle(point[0], point[1]);
//     hc.renderWithoutFadeOut();
// });

// const testSlider = new Slider("192:301|187:344|176:384", "B", "230");
// testSlider.renderWithoutFadeOut();

// const testSlider2 = new Slider("226:262|271:264|311:284", "B", "230");
// testSlider2.renderWithoutFadeOut();

// const testSlider3 = new Slider("186:159|280:144|347:201|347:201|350:269", "B", "230");
// testSlider3.renderWithoutFadeOut();

// const testSlider4 = new Slider("329:258|385:262|449:211", "B", "230");
// testSlider4.renderWithoutFadeOut();

// const testSlider5 = new Slider("273:220|290:259|300:299", "B", "90", "180", "300");
// testSlider5.renderWithoutFadeOut();

// const testSlider6 = new Slider("273:220|300:299", "B", "45", "180", "300");
// testSlider6.renderWithoutFadeOut();

const testSlider7 = new Slider("343:214|327:272|327:272|340:318|340:318|321:379", "B", "180", "180", "300", 500);
testSlider7.renderWithoutFadeOut();

// const testSlider8 = new Slider(
//     "270:170|260:137|222:125|223:132|146:101|179:-49|355:-27|411:167|274:208|274:208|212:227|131:136|82:256|86:259|65:317|1:312|1:312|79:319|79:319|87:326|87:326|168:334|168:334|177:328|177:328|252:336|252:336|256:306|281:287|281:287|279:321|296:354|331:357|331:357|463:367|463:367|318:341|358:129|516:143|539:230|484:274|484:274|517:230|473:162|477:224|405:146|474:79|474:79|466:58|466:58|386:46|386:46|370:53|370:53|27:2|27:2|91:12|110:47|68:47|124:126|181:102",
//     "B",
//     "2542",
//     200 * 0.41,
//     60000 / 180
// );
// testSlider8.renderWithoutFadeOut();

const testSlider9 = new Slider("120:384|266:359|207:284|364:261", "B", 274.049991636658, 174 * 0.35, 60000 / 182, 1000);
testSlider9.renderWithoutFadeOut();
