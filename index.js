const axios = window.axios;

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const scaleFactor = 1080 / 480;
const textureScaleFactor = (1080 / 768) ** 2;
const hitCircleSize = 2 * (54.4 - 4.48 * 4);
const sliderBorderThickness = 5;

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
    defaultLen = (hitCircleSize / 2 - 4) * textureScaleFactor;
    accuracy = 0.0025; //this'll give the 400 bezier segments
    sliderLen = 0;
    initialSliderLen;
    intialSliderVelocity;
    beatStep;

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

    // drawBody(ctx, angleList) {
    //     const capAccuracy = 0.01;

    //     // ctx.lineCap = "square";
    //     ctx.lineWidth = 2 * textureScaleFactor;

    //     angleList.forEach((point, idx) => {
    //         const startX = point.x - this.defaultLen * Math.cos(point.angle);
    //         const startY = point.y - this.defaultLen * Math.sin(point.angle);

    //         const endX = point.x + this.defaultLen * Math.cos(point.angle);
    //         const endY = point.y + this.defaultLen * Math.sin(point.angle);

    //         ctx.beginPath();

    //         const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    //         gradient.addColorStop(0.0, "black");
    //         gradient.addColorStop(0.5, "rgb(51.1, 51.1, 51.1)");
    //         gradient.addColorStop(1.0, "black");
    //         ctx.strokeStyle = gradient;

    //         ctx.moveTo(startX, startY);
    //         ctx.lineTo(endX, endY);
    //         ctx.stroke();
    //         ctx.closePath();
    //     });

    //     const capHeadX = -Math.cos(Math.PI / 2 + angleList[0].angle) * this.defaultLen + angleList[0].x;
    //     const capHeadY = -Math.sin(Math.PI / 2 + angleList[0].angle) * this.defaultLen + angleList[0].y;

    //     const capEndX = Math.cos(Math.PI / 2 + angleList.at(-1).angle) * this.defaultLen + angleList.at(-1).x;
    //     const capEndY = Math.sin(Math.PI / 2 + angleList.at(-1).angle) * this.defaultLen + angleList.at(-1).y;

    //     // ctx.beginPath();
    //     // ctx.arc(capHeadX, capHeadY, 20, 0, 2 * Math.PI, false);
    //     // ctx.fillStyle = "blue";
    //     // ctx.fill();
    //     // ctx.closePath();

    //     // ctx.beginPath();
    //     // ctx.arc(capEndX, capEndY, 20, 0, 2 * Math.PI, false);
    //     // ctx.fillStyle = "blue";
    //     // ctx.fill();
    //     // ctx.closePath();

    //     for (let i = 0; i < 1; i += capAccuracy) {
    //         const pointX = -Math.cos(Math.PI / 2 + angleList[0].angle) * this.defaultLen * i + angleList[0].x;
    //         const pointY = -Math.sin(Math.PI / 2 + angleList[0].angle) * this.defaultLen * i + angleList[0].y;

    //         const startX = pointX - this.defaultLen * Math.sqrt(1 - i * i) * Math.cos(angleList[0].angle);
    //         const startY = pointY - this.defaultLen * Math.sqrt(1 - i * i) * Math.sin(angleList[0].angle);

    //         const endX = pointX + this.defaultLen * Math.sqrt(1 - i * i) * Math.cos(angleList[0].angle);
    //         const endY = pointY + this.defaultLen * Math.sqrt(1 - i * i) * Math.sin(angleList[0].angle);

    //         ctx.beginPath();

    //         const currentRadius = Math.sqrt(1 - i * i) * 51;
    //         const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    //         gradient.addColorStop(0.0, "black");
    //         gradient.addColorStop(0.5, `rgb(${currentRadius}, ${currentRadius}, ${currentRadius})`);
    //         gradient.addColorStop(1.0, "black");
    //         ctx.strokeStyle = gradient;

    //         ctx.moveTo(startX, startY);
    //         ctx.lineTo(endX, endY);
    //         ctx.stroke();
    //         ctx.closePath();
    //     }

    //     for (let i = 0; i < 1; i += capAccuracy) {
    //         const pointX = Math.cos(Math.PI / 2 + angleList.at(-1).angle) * this.defaultLen * i + angleList.at(-1).x;
    //         const pointY = Math.sin(Math.PI / 2 + angleList.at(-1).angle) * this.defaultLen * i + angleList.at(-1).y;

    //         const startX = pointX - this.defaultLen * Math.sqrt(1 - i * i) * Math.cos(angleList.at(-1).angle);
    //         const startY = pointY - this.defaultLen * Math.sqrt(1 - i * i) * Math.sin(angleList.at(-1).angle);

    //         const endX = pointX + this.defaultLen * Math.sqrt(1 - i * i) * Math.cos(angleList.at(-1).angle);
    //         const endY = pointY + this.defaultLen * Math.sqrt(1 - i * i) * Math.sin(angleList.at(-1).angle);

    //         ctx.beginPath();

    //         const currentRadius = Math.sqrt(1 - i * i) * 51;
    //         const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    //         gradient.addColorStop(0.0, "black");
    //         gradient.addColorStop(0.5, `rgb(${currentRadius}, ${currentRadius}, ${currentRadius})`);
    //         gradient.addColorStop(1.0, "black");
    //         ctx.strokeStyle = gradient;

    //         ctx.moveTo(startX, startY);
    //         ctx.lineTo(endX, endY);
    //         ctx.stroke();
    //         ctx.closePath();
    //     }
    // }

    draw(ctx, pointLists) {
        if (pointLists.length !== 3) {
            ctx.beginPath();
            ctx.moveTo(pointLists[0].x, pointLists[0].y);

            this.breakPoints.push(0);
            for (let i = 0; i < pointLists.length - 1; i++) {
                if (pointLists[i].x === pointLists[i + 1].x && pointLists[i].y === pointLists[i + 1].y) this.breakPoints.push(i);
            }
            this.breakPoints.push(pointLists.length - 1);

            for (let z = 0; z < this.breakPoints.length - 1; z++) {
                for (var i = 0; i < 1; i += this.accuracy) {
                    const pCurrent = this.bezier(i, pointLists.slice(this.breakPoints[z], this.breakPoints[z + 1] + 1));

                    if (i < 1 - this.accuracy) {
                        const pNext = this.bezier(i + this.accuracy, pointLists.slice(this.breakPoints[z], this.breakPoints[z + 1] + 1));
                        this.sliderLen += Math.sqrt((pCurrent.x - pNext.x) ** 2 + (pCurrent.y - pNext.y) ** 2) / scaleFactor;
                        this.angleList.push({
                            x: pCurrent.x,
                            y: pCurrent.y,
                            angle: Math.atan2(pNext.y - pCurrent.y, pNext.x - pCurrent.x) - Math.PI / 2,
                        });
                    }
                }
            }

            // console.log(this.sliderLen);
            // console.log(this.angleList);

            this.angleList.forEach((point, idx) => {
                // console.log(idx / this.angleList.length, this.initialSliderLen / this.sliderLen, this.sliderLen);
                if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
                ctx.lineTo(point.x, point.y);
            });

            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(pointLists[0].x, pointLists[0].y);
            this.angleList.forEach((point, idx) => {
                if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineWidth = (hitCircleSize - sliderBorderThickness) * textureScaleFactor;
            ctx.strokeStyle = "black";
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(pointLists[0].x, pointLists[0].y);
            this.angleList.forEach((point, idx) => {
                if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineWidth = hitCircleSize * textureScaleFactor * 0.3;
            ctx.filter = "blur(30px)";
            ctx.strokeStyle = "#333";
            ctx.stroke();
            ctx.filter = "none";
            ctx.closePath();

            ctx.fillStyle = "red";

            pointLists.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.closePath();
            });

            // console.log(this.angleList);
            // this.drawBody(ctx, this.angleList);
            // console.log(this.sliderLen, this.initialSliderLen);
            return;
        }

        const lengthAB = Math.sqrt((pointLists[0].x - pointLists[1].x) ** 2 + (pointLists[0].y - pointLists[1].y) ** 2);
        const lengthBC = Math.sqrt((pointLists[1].x - pointLists[2].x) ** 2 + (pointLists[1].y - pointLists[2].y) ** 2);
        const lengthAC = Math.sqrt((pointLists[0].x - pointLists[2].x) ** 2 + (pointLists[0].y - pointLists[2].y) ** 2);

        const angleA = Math.acos((lengthAB ** 2 + lengthAC ** 2 - lengthBC ** 2) / (2 * lengthAB * lengthAC));
        const angleB = Math.acos((lengthAB ** 2 + lengthBC ** 2 - lengthAC ** 2) / (2 * lengthAB * lengthBC));
        const angleC = Math.acos((lengthAC ** 2 + lengthBC ** 2 - lengthAB ** 2) / (2 * lengthAC * lengthBC));

        const radius = lengthAB / (2 * Math.sin(angleC));
        let innerAngle = -Math.acos((2 * radius ** 2 - lengthAC ** 2) / (2 * radius ** 2));

        const upper = pointLists[2].x - pointLists[0].x;
        const lower = pointLists[2].y - pointLists[0].y;

        const angleIndex = lower / upper;
        const b = pointLists[0].y - angleIndex * pointLists[0].x;

        // console.log(lengthAB, lengthAC, lengthBC);
        // console.log(angleA, angleB, angleC);
        // console.log(radius);
        // console.log((innerAngle * 180) / Math.PI);
        // console.log(upper, lower);
        // console.log(`${angleIndex}x + ${b}`);
        // console.log(angleIndex * pointLists[1].x + b, pointLists[1].y);
        // console.log(upper * (pointLists[1].y - (angleIndex * pointLists[1].x + b)));

        if (upper === 0 && pointLists[1].x > pointLists[0].x) innerAngle *= -1;
        if (upper * (pointLists[1].y - (angleIndex * pointLists[1].x + b)) < 0) innerAngle *= -1;

        // console.log((innerAngle * 180) / Math.PI);

        const centerX =
            (pointLists[0].x * Math.sin(2 * angleA) + pointLists[1].x * Math.sin(2 * angleB) + pointLists[2].x * Math.sin(2 * angleC)) /
            (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));
        const centerY =
            (pointLists[0].y * Math.sin(2 * angleA) + pointLists[1].y * Math.sin(2 * angleB) + pointLists[2].y * Math.sin(2 * angleC)) /
            (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));

        ctx.beginPath();
        ctx.moveTo(pointLists[0].x, pointLists[0].y);
        for (let i = 0; i < 1; i += this.accuracy) {
            const pCurrent = {
                x: centerX + (pointLists[0].x - centerX) * Math.cos(innerAngle * i) - (pointLists[0].y - centerY) * Math.sin(innerAngle * i),
                y: centerY + (pointLists[0].x - centerX) * Math.sin(innerAngle * i) + (pointLists[0].y - centerY) * Math.cos(innerAngle * i),
            };

            if (i < 1 - this.accuracy) {
                const pNext = {
                    x:
                        centerX +
                        (pointLists[0].x - centerX) * Math.cos(innerAngle * (i + this.accuracy)) -
                        (pointLists[0].y - centerY) * Math.sin(innerAngle * (i + this.accuracy)),
                    y:
                        centerY +
                        (pointLists[0].x - centerX) * Math.sin(innerAngle * (i + this.accuracy)) +
                        (pointLists[0].y - centerY) * Math.cos(innerAngle * (i + this.accuracy)),
                };
                this.sliderLen += Math.sqrt((pCurrent.x - pNext.x) ** 2 + (pCurrent.y - pNext.y) ** 2) / scaleFactor;
                this.angleList.push({
                    x: pCurrent.x,
                    y: pCurrent.y,
                    angle: Math.atan2(pNext.y - pCurrent.y, pNext.x - pCurrent.x) - Math.PI / 2,
                });
            }
        }

        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            ctx.lineTo(point.x, point.y);
        });

        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(pointLists[0].x, pointLists[0].y);
        this.angleList.forEach((point, idx) => {
            // console.log(idx / this.angleList.length, this.initialSliderLen / this.sliderLen, this.sliderLen);
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = (hitCircleSize - sliderBorderThickness) * textureScaleFactor;
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(pointLists[0].x, pointLists[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineWidth = hitCircleSize * textureScaleFactor * 0.3;
        ctx.filter = "blur(30px)";
        ctx.strokeStyle = "#333";
        ctx.stroke();
        ctx.filter = "none";
        ctx.closePath();

        // this.drawBody(ctx, this.angleList);

        // console.log(this.angleList);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2, false);
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = "red";

        pointLists.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
        });

        ctx.beginPath();
        ctx.moveTo((window.innerWidth - 512 * scaleFactor) / 2, angleIndex * ((window.innerWidth - 512 * scaleFactor) / 2) + b);
        ctx.lineTo(innerWidth, angleIndex * window.innerWidth + b);
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    constructor(pointLists, sliderType, initialSliderLen, intialSliderVelocity, beatStep, time) {
        const canvas = document.createElement("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext("2d");
        ctx.lineWidth = hitCircleSize * textureScaleFactor;
        ctx.strokeStyle = "rgb(50, 50, 50)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const pointArr = pointLists.split("|").map((point) => {
            return {
                x: point.split(":")[0] * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2,
                y: point.split(":")[1] * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2,
            };
        });

        this.initialSliderLen = initialSliderLen;
        this.intialSliderVelocity = intialSliderVelocity;
        this.beatStep = beatStep;
        this.domObject = canvas;
        this.draw(ctx, pointArr);

        // console.log((this.initialSliderLen / this.intialSliderVelocity) * this.beatStep);
        // console.log(time, (this.initialSliderLen / this.intialSliderVelocity) * this.beatStep + 300);
    }

    render() {
        document.body.insertBefore(this.domObject, document.querySelector("#main"));
        this.domObject.classList.add("fadeIn");

        setTimeout(() => {
            this.domObject.classList.remove("fadeIn");
            this.domObject.classList.add("fadeOutSlider");

            setTimeout(() => {
                document.body.removeChild(this.domObject);
            }, 100);
        }, (this.initialSliderLen / this.intialSliderVelocity) * this.beatStep + 300);
    }

    renderWithoutFadeOut() {
        document.body.insertBefore(this.domObject, document.querySelector("#main"));
        this.domObject.classList.add("fadeIn");
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
                            params[2]
                        ),
                        time: params[2] - 300 + delay,
                    };
                }
            })
            .filter((s) => s);

        this.hitCircleList = hitCircleList;
        this.slidersList = slidersList;
    }

    render() {
        this.hitCircleList.forEach((obj) =>
            setTimeout(() => {
                obj.obj.render();
            }, obj.time)
        );

        this.slidersList.forEach((obj) =>
            setTimeout(() => {
                obj.obj.render();
            }, obj.time)
        );
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

// const testSlider7 = new Slider("343:214|327:272|327:272|340:318|340:318|321:379", "B", "180", "180", "300");
// testSlider7.renderWithoutFadeOut();

// const testSlider8 = new Slider(
//     "270:170|260:137|222:125|223:132|146:101|179:-49|355:-27|411:167|274:208|274:208|212:227|131:136|82:256|86:259|65:317|1:312|1:312|79:319|79:319|87:326|87:326|168:334|168:334|177:328|177:328|252:336|252:336|256:306|281:287|281:287|279:321|296:354|331:357|331:357|463:367|463:367|318:341|358:129|516:143|539:230|484:274|484:274|517:230|473:162|477:224|405:146|474:79|474:79|466:58|466:58|386:46|386:46|370:53|370:53|27:2|27:2|91:12|110:47|68:47|124:126|181:102",
//     "B",
//     "2542",
//     200 * 0.41,
//     60000 / 180
// );
// testSlider8.renderWithoutFadeOut();

// const testSlider9 = new Slider("120:384|266:359|207:284|364:261", "B", 274.049991636658, 174 * 0.35, 60000 / 182);
// testSlider9.render();
