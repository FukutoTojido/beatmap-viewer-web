const originalTime = new Date().getTime();
const axios = window.axios;

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        };
        reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
}

const scaleFactor = 1080 / 480;
const textureScaleFactor = (1080 / 768) ** 2;

const hitCircleSize = 2 * (54.4 - 4.48 * 4);
const sliderBorderThickness = 8;
const sliderAccuracy = 0.005;
const sliderSnaking = true;
const sliderBorderColor = "#ffffff";

const sampleHitCircle = document.querySelector("#sampleHitCircle");
const sampleHitCircleOverlay = document.querySelector("#sampleHitCircleOverlay");
const sampleApproachCircle = document.querySelector("#sampleApproachCircle");
const sampleSliderB = document.querySelector("#sampleSliderB");

toDataUrl("./static/hitcircle@2x.png", (base64) => {
    document.querySelector("#hitCircleSVG").style.backgroundImage = `url("${base64}")`;
    document.querySelector("#hitCircleColor").style.webkitMaskImage = `url("${base64}")`;
});

toDataUrl("./static/hitcircleOverlay@2x.png", (base64) => {
    document.querySelector("#hitCircleOverlay").style.backgroundImage = `url("${base64}")`;
});

toDataUrl("./static/approachcircle@2x.png", (base64) => {
    document.querySelector("#approachCircleSVG").style.backgroundImage = `url("${base64}")`;
    document.querySelector("#approachCircleColor").style.webkitMaskImage = `url("${base64}")`;
});

const canvas = document.querySelector("#canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const approachRate = 9.3;
let preempt;
let fadeIn;

let isPlaying = true;
const debugPosition = 179066;
const mapId = 3694755;
const playbackRate = 1;

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
            Math.round(this.positionX - ((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round(this.positionY - ((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate),
            Math.round((hitCircleSize + 5) * textureScaleFactor * approachRateExpandRate)
        );

        pseudoCtx.globalCompositeOperation = "source-atop";
        pseudoCtx.fillStyle = colour;
        pseudoCtx.rect(0, 0, window.innerWidth, window.innerHeight);
        pseudoCtx.fill();

        return pseudoCanvas;
    }

    draw(opacity, trol, expandRate, preemptRate, colour, colourObject) {
        const normalizedExpandRate = opacity >= 0 ? 1 : 1 + (1 - expandRate) * 0.5;
        const approachRateExpandRate = opacity >= 0 ? -3 * Math.min(preemptRate, 1) + 4 : 0;

        // const pseudoCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
        // const pseudoCtx = pseudoCanvas.getContext("2d");

        ctx.beginPath();
        ctx.globalAlpha = opacity >= 0 ? opacity : expandRate >= 0 ? expandRate : 0;

        // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        // console.log(colourObject);

        ctx.drawImage(
            colourObject.approachCircle,
            Math.round(
                this.positionX - ((hitCircleSize + 12) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2
            ),
            Math.round(
                this.positionY - ((hitCircleSize + 12) * textureScaleFactor * approachRateExpandRate - hitCircleSize * textureScaleFactor) / 2
            ),
            Math.round((hitCircleSize + 10) * textureScaleFactor * approachRateExpandRate),
            Math.round((hitCircleSize + 10) * textureScaleFactor * approachRateExpandRate)
        );

        ctx.drawImage(
            colourObject.hitCircle,
            Math.round(this.positionX - ((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round(this.positionY - ((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate - hitCircleSize * textureScaleFactor) / 2),
            Math.round((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate),
            Math.round((hitCircleSize + 10) * textureScaleFactor * normalizedExpandRate)
        );

        // const approachCircleCanvas = this.drawApproachCircle(approachRateExpandRate, colour);

        // ctx.drawImage(approachCircleCanvas, 0, 0);

        // console.log(colour);

        // ctx.drawImage(pseudoCanvas, 0, 0);
        ctx.globalAlpha = 1;
        ctx.closePath();
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
            ? Math.round(positionX - (hitCircleSize * textureScaleFactor) / 2)
            : Math.round(positionX * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2 - (hitCircleSize * textureScaleFactor) / 2);
        this.positionY = isSliderHead
            ? Math.round(positionY - (hitCircleSize * textureScaleFactor) / 2)
            : Math.round(positionY * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2 - (hitCircleSize * textureScaleFactor) / 2);

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
    baseSliderVelocity;
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
    repeat;
    sliderAccuracy;

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
        // console.log(this.initialSliderLen / this.initialSliderVelocity);
        ctx.beginPath();
        const pseudoCanvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        ctx.globalAlpha = Math.abs(opacity);

        pseudoCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        const endPosition = Math.min(Math.ceil((this.initialSliderLen / this.sliderLen) * this.angleList.length - 1), this.angleList.length - 1);
        // if (opacity < 0) {
        //     pseudoCtx.moveTo(this.angleList.at(endPosition).x, this.angleList.at(endPosition).y);
        //     pseudoCtx.lineTo(this.angleList.at(endPosition - 1).x, this.angleList.at(endPosition - 1).y);
        //     pseudoCtx.lineJoin = "round";
        //     pseudoCtx.lineCap = "round";

        //     pseudoCtx.lineWidth = Math.round(hitCircleSize * textureScaleFactor);
        //     pseudoCtx.strokeStyle = colour;
        //     pseudoCtx.stroke();

        //     pseudoCtx.lineWidth = Math.round((hitCircleSize - sliderBorderThickness) * textureScaleFactor);
        //     pseudoCtx.strokeStyle = `rgb(0 0 0 / .9)`;
        //     pseudoCtx.stroke();
        // }

        // console.log(1 / this.sliderAccuracy, this.angleList);
        pseudoCtx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            // console.log(idx / this.angleList.length, this.initialSliderLen / this.sliderLen, this.sliderLen);
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            // console.log("a");
            if (sliderSnaking && opacity >= 0 && idx / endPosition > Math.abs(opacity)) return;

            // console.log((percentage - 1) * this.repeat + 1);
            if (!(sliderSnaking && opacity < 0 && (percentage - 1) * this.repeat + 1 < 0)) {
                if (this.repeat % 2 === 0 && idx / (endPosition - 1) >= 1 - ((percentage - 1) * this.repeat + 1)) return;
                if (this.repeat % 2 !== 0 && idx / (endPosition - 1) <= (percentage - 1) * this.repeat + 1) {
                    pseudoCtx.moveTo(point.x, point.y);
                    return;
                }
            }

            pseudoCtx.lineTo(point.x, point.y);

            // pseudoCtx.save();
            // pseudoCtx.arc(point.x, point.y, 20, 0, Math.PI * 2, false);
            // pseudoCtx.fillStyle = "red";
            // pseudoCtx.fill();
            // pseudoCtx.restore();
        });

        pseudoCtx.lineJoin = "round";
        pseudoCtx.lineCap = "round";

        pseudoCtx.lineWidth = Math.round(hitCircleSize * textureScaleFactor);
        pseudoCtx.strokeStyle = colour;
        pseudoCtx.stroke();

        pseudoCtx.lineWidth = Math.round((hitCircleSize - sliderBorderThickness) * textureScaleFactor);
        pseudoCtx.strokeStyle = `rgb(0 0 0 / .9)`;
        pseudoCtx.stroke();

        ctx.drawImage(pseudoCanvas, 0, 0);
        ctx.globalAlpha = 1;
        ctx.closePath();
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

    draw(opacity, percentage, hitCircleExpandRate, preemptRate, colour, colourObject) {
        this.drawBorder(opacity, percentage, colour);
        this.hitCircle.draw(opacity, 0, hitCircleExpandRate, preemptRate, colour, colourObject);
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
        // console.log(this.breakPoints);

        const calculatedAngleLength = this.breakPoints
            .map((bP, idx) => {
                if (idx === this.breakPoints.length - 1) return;

                const sectionAngleList = [];
                let sectionLength = 0;

                for (var i = 0; i < 1; i += this.sliderAccuracy) {
                    const pCurrent =
                        pointArr.length !== 3
                            ? this.bezier(
                                  i,
                                  bP === 0
                                      ? pointArr.slice(this.breakPoints[idx], this.breakPoints[idx + 1] + 1)
                                      : pointArr.slice(this.breakPoints[idx] + 1, this.breakPoints[idx + 1] + 1)
                              )
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

                    if (i < 1 - this.sliderAccuracy) {
                        const pNext =
                            pointArr.length !== 3
                                ? this.bezier(
                                      i + sliderAccuracy,
                                      bP === 0
                                          ? pointArr.slice(this.breakPoints[idx], this.breakPoints[idx + 1] + 1)
                                          : pointArr.slice(this.breakPoints[idx] + 1, this.breakPoints[idx + 1] + 1)
                                  )
                                : {
                                      x:
                                          centerX +
                                          (pointArr[0].x - centerX) * Math.cos(innerAngle * (i + this.sliderAccuracy)) -
                                          (pointArr[0].y - centerY) * Math.sin(innerAngle * (i + this.sliderAccuracy)),
                                      y:
                                          centerY +
                                          (pointArr[0].x - centerX) * Math.sin(innerAngle * (i + this.sliderAccuracy)) +
                                          (pointArr[0].y - centerY) * Math.cos(innerAngle * (i + this.sliderAccuracy)),
                                  };

                        sectionLength += Math.sqrt((pCurrent.x - pNext.x) ** 2 + (pCurrent.y - pNext.y) ** 2) / scaleFactor;
                        sectionAngleList.push({
                            x: pCurrent.x,
                            y: pCurrent.y,
                            angle: Math.atan2(pNext.y - pCurrent.y, pNext.x - pCurrent.x) - Math.PI / 2,
                        });
                    }
                }

                this.sliderLen += sectionLength;

                return {
                    angleList: sectionAngleList,
                    sliderLen: sectionLength,
                };
            })
            .filter((section) => section);

        calculatedAngleLength.forEach((section) => {
            const increment = this.sliderLen / section.sliderLen;
            // console.log(section);
            // console.log(increment);

            const reducedArr = [];

            for (let i = 0; i < section.angleList.length; i += increment) {
                reducedArr.push(section.angleList[Math.floor(i)]);
            }

            // if (this.startTime + preempt === 179067) {
            //     console.log(section);
            //     console.log(reducedArr);
            //     // console.log(increment);
            // }

            this.angleList.push(...reducedArr);
        });

        // if (this.startTime + preempt === 179067) console.log(this.startTime + preempt, this.angleList, calculatedAngleLength);

        this.angleList = this.angleList.filter((s) => s);

        this.sliderLen = 0;
        this.angleList.forEach((point, idx) => {
            if (idx === this.angleList.length - 1) return;
            this.sliderLen += Math.sqrt((this.angleList[idx + 1].x - point.x) ** 2 + (this.angleList[idx + 1].y - point.y) ** 2) / scaleFactor;
        });

        // if (this.startTime + preempt === 179067) console.log(this.sliderLen);
        // console.log(this.angleList);
    }

    constructor(pointLists, sliderType, initialSliderLen, initialSliderVelocity, baseSliderVelocity, beatStep, time, isNewCombo, repeat) {
        // const canvas = document.createElement("canvas");
        const pointArr = pointLists.split("|").map((point) => {
            return {
                x: Math.round(point.split(":")[0] * scaleFactor + (window.innerWidth - 512 * scaleFactor) / 2),
                y: Math.round(point.split(":")[1] * scaleFactor + (window.innerHeight - 384 * scaleFactor) / 2),
            };
        });

        this.pointArr = pointArr;
        this.hitCircle = new HitCircle(pointArr[0].x, pointArr[0].y, time, true);
        this.initialSliderLen = initialSliderLen;
        this.initialSliderVelocity = initialSliderVelocity;
        this.sliderAccuracy = sliderAccuracy / Math.sqrt(initialSliderLen / baseSliderVelocity);
        // console.log(1 / this.sliderAccuracy);

        this.baseSliderVelocity = baseSliderVelocity;
        this.beatStep = parseFloat(beatStep);

        this.startTime = time - preempt;
        this.endTime = time + (initialSliderLen / initialSliderVelocity) * beatStep + 240;

        this.getAngleList(pointArr);
        // this.time = time;

        this.isNewCombo = isNewCombo;
        this.repeat = repeat;
        // this.draw(0.5);

        // console.log((this.initialSliderLen / this.intialSliderVelocity) * this.beatStep);
        // console.log(time, (this.initialSliderLen / this.intialSliderVelocity) * this.beatStep + 300);

        // console.log("a");
    }
}

class ObjectsList {
    hitCirclesList;
    slidersList;
    objectsList;
    drawTime;
    coloursList;
    currentColor;
    coloursObject;

    compare(a, b) {
        if (a.time < b.time) {
            return -1;
        }
        if (a.time > b.time) {
            return 1;
        }
        return 0;
    }

    createHitCircleColour(colour) {
        hitCircleColor.style.backgroundColor = colour;
        const base64 = window.btoa(new XMLSerializer().serializeToString(sampleHitCircle));
        const hitCircleImgData = `data:image/svg+xml;base64,${base64}`;
        const hitCircleImg = new Image();
        hitCircleImg.src = hitCircleImgData;

        approachCircleColor.style.backgroundColor = colour;
        const base64_2 = window.btoa(new XMLSerializer().serializeToString(sampleApproachCircle));
        const approachCircleImgData = `data:image/svg+xml;base64,${base64_2}`;
        const approachCircleImg = new Image();
        approachCircleImg.src = approachCircleImgData;

        return {
            hitCircle: hitCircleImg,
            approachCircle: approachCircleImg,
        };
    }

    constructor(hitCirclesList, slidersList, coloursList) {
        this.hitCirclesList = hitCirclesList;
        this.slidersList = slidersList;
        this.objectsList = hitCirclesList.concat(slidersList).sort(this.compare);
        this.coloursList = coloursList;
        this.currentColor = 1 % this.coloursList.length;

        this.objectsList = this.objectsList.map((object, idx) => {
            if (object.obj.isNewCombo && idx !== 0) this.currentColor = (this.currentColor + 1) % this.coloursList.length;
            return {
                ...object,
                colour: this.coloursList[this.currentColor],
                colourObject: this.createHitCircleColour(this.coloursList[this.currentColor]),
            };
        });
        // console.log(this.objectsList);
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
                        object.colour,
                        object.colourObject
                    );
                }
            });

        if (isPlaying)
            window.requestAnimationFrame((currentTime) => {
                const timestampNext = (currentTime - this.drawTime) * playbackRate;
                return this.draw(timestampNext);
            });
    }

    render() {
        this.drawTime = new Date().getTime() - originalTime;
        window.requestAnimationFrame((currentTime) => {
            const timestamp = (currentTime - this.drawTime) * playbackRate;
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
        audio.src = "./audio5.mp3";
        audio.volume = 0.1;
        audio.mute = "true";
        audio.playbackRate = playbackRate;

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

const beatmapRender = async () => {
    const beatmapData = (await axios.get(`https://tryz.vercel.app/api/b/${mapId}`)).data;
    document.body.style.backgroundImage = `url(${beatmapData.covers["cover@2x"]})`;
    const rawBeatmap = (await axios.get(`https://tryz.vercel.app/api/b/${mapId}/osu`)).data;
    // const rawBeatmap = (await axios.get("https://tryz.vercel.app/api/b/2412642/osu")).data;

    const audio = new Audio();
    const cursor = new Cursor();
    // console.log(cursor.delay);
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
// testSlider8.draw(1, 0, 1, 1, "red");

// const testSlider9 = new Slider("120:384|266:359|207:284|364:261", "B", 274.049991636658, 174 * 0.35, 60000 / 182, 1000);
// testSlider9.draw(1);
