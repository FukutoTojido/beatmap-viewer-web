class Slider {
    originalArr = [];
    pointArr = [];
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
    tempCanvasWidth;

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

    drawBorder(opacity, percentage, colour, currentScaleFactor) {
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        let currentHitCircleSize = 2 * (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier);
        let currentSliderBorderThickness = (currentHitCircleSize * (236 - 190)) / 2 / 256 / 2;

        if (currentScaleFactor !== tempScaleFactor || this.tempCanvasWidth !== canvas.width) {
            tempScaleFactor = currentScaleFactor;
            // console.log(tempScaleFactor, "->", currentScaleFactor);
            tempScaleFactor = currentScaleFactor;
            this.tempCanvasWidth = canvas.width;
            const newPointArr = this.originalArr.map((point) => {
                return {
                    x: point.x * currentScaleFactor + (canvas.width - 512 * currentScaleFactor) / 2,
                    y: point.y * currentScaleFactor + (canvas.height - 384 * currentScaleFactor) / 2,
                };
            });

            this.getAngleList(newPointArr, currentScaleFactor);
        }

        // console.log(this.angleList, canvas);

        ctx.beginPath();
        const pseudoCanvas = new OffscreenCanvas(canvas.width, canvas.height);
        const pseudoCtx = pseudoCanvas.getContext("2d");

        ctx.globalAlpha = Math.abs(opacity);

        pseudoCtx.clearRect(0, 0, canvas.width, canvas.height);
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

        pseudoCtx.moveTo(this.angleList[0].x, this.angleList[0].y);
        this.angleList.forEach((point, idx) => {
            if (idx / this.angleList.length > this.initialSliderLen / this.sliderLen) return;
            if (sliderSnaking && opacity >= 0 && idx / endPosition > Math.abs(opacity)) return;

            if (!(sliderSnaking && opacity < 0 && (percentage - 1) * this.repeat + 1 < 0)) {
                if (this.repeat % 2 === 0 && idx / endPosition >= 1 - ((percentage - 1) * this.repeat + 1)) return;
                if (this.repeat % 2 !== 0 && idx / endPosition <= (percentage - 1) * this.repeat + 1) {
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

        pseudoCtx.lineWidth = currentHitCircleSize * currentScaleFactor * (118 / 128);
        pseudoCtx.strokeStyle = colour;
        pseudoCtx.stroke();

        pseudoCtx.lineWidth = (currentHitCircleSize - currentSliderBorderThickness * 2.5) * currentScaleFactor * (118 / 128);
        pseudoCtx.strokeStyle = `rgb(0 0 0 / 0.85)`;
        pseudoCtx.stroke();

        // pseudoCtx.globalCompositeOperation = "source-out";

        // pseudoCtx.globalCompositeOperation = "source-over";
        // pseudoCtx.lineWidth = (hitCircleSize - sliderBorderThickness * 2.5) * currentScaleFactor * (118 / 128);
        // pseudoCtx.strokeStyle = `rgb(0 0 0 / 0.8)`;
        // pseudoCtx.stroke();

        if (opacity < 0 && percentage >= 0 && percentage <= 1) {
            const step = 1 / this.repeat;
            const innerPercentage = (percentage * this.repeat) % 1;
            const repeatIndex = Math.floor(percentage / step);

            const endPosition = Math.min(Math.ceil((this.initialSliderLen / this.sliderLen) * this.angleList.length - 1), this.angleList.length - 1);

            const sliderBallPosition = this.angleList.findLast((point, idx) =>
                repeatIndex % 2 == 0 ? idx / endPosition <= innerPercentage : idx / endPosition <= 1 - innerPercentage
            );

            // console.log(innerPercentage, percentage, repeatIndex);

            if (sliderBallPosition !== undefined) {
                pseudoCtx.beginPath();
                pseudoCtx.lineWidth = currentSliderBorderThickness * currentScaleFactor * (118 / 128) * 1.2;
                pseudoCtx.strokeStyle = "white";
                pseudoCtx.arc(
                    sliderBallPosition.x,
                    sliderBallPosition.y,
                    (currentHitCircleSize * currentScaleFactor * (118 / 128)) / 2 -
                        (currentSliderBorderThickness * currentScaleFactor * (118 / 128) * 1.2) / 2,
                    0,
                    Math.PI * 2,
                    false
                );
                pseudoCtx.stroke();
                pseudoCtx.closePath();
            }
        }

        ctx.drawImage(pseudoCanvas, 0, 0);
        ctx.globalAlpha = 1;
        ctx.closePath();
    }

    draw(opacity, percentage, hitCircleExpandRate, preemptRate, colour, colourObject, currentScaleFactor) {
        this.drawBorder(opacity, percentage, colour, currentScaleFactor);
        this.hitCircle.draw(opacity, 0, hitCircleExpandRate, preemptRate, colour, colourObject, currentScaleFactor);
    }

    getAngleList(pointArr, ascaleFactor) {
        this.angleList = [];
        this.breakPoints = [];

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

            // innerAngle =
            //     (upper === 0 && pointArr[1].x > pointArr[0].x) || upper * (pointArr[1].y - (angleIndex * pointArr[1].x + b)) < 0
            //         ? Math.acos((2 * radius ** 2 - lengthAC ** 2) / (2 * radius ** 2))
            //         : -Math.acos((2 * radius ** 2 - lengthAC ** 2) / (2 * radius ** 2));

            centerX =
                (pointArr[0].x * Math.sin(2 * angleA) + pointArr[1].x * Math.sin(2 * angleB) + pointArr[2].x * Math.sin(2 * angleC)) /
                (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));
            centerY =
                (pointArr[0].y * Math.sin(2 * angleA) + pointArr[1].y * Math.sin(2 * angleB) + pointArr[2].y * Math.sin(2 * angleC)) /
                (Math.sin(2 * angleA) + Math.sin(2 * angleB) + Math.sin(2 * angleC));

            const absoluteAngle =
                (pointArr[1].y - (angleIndex * pointArr[1].x + b)) * (centerY - (angleIndex * centerX + b)) < 0
                    ? Math.asin(lengthAC / (2 * radius)) * 2
                    : Math.PI * 2 - Math.asin(lengthAC / (2 * radius)) * 2;

            innerAngle =
                (upper === 0 && pointArr[1].x > pointArr[0].x) || upper * (pointArr[1].y - (angleIndex * pointArr[1].x + b)) < 0
                    ? absoluteAngle
                    : -absoluteAngle;

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

                        sectionLength += Math.sqrt((pCurrent.x - pNext.x) ** 2 + (pCurrent.y - pNext.y) ** 2) / ascaleFactor;
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
            this.sliderLen += Math.sqrt((this.angleList[idx + 1].x - point.x) ** 2 + (this.angleList[idx + 1].y - point.y) ** 2) / ascaleFactor;
        });

        if (!isPlaying && this.startTime + preempt === debugPosition) {
            console.log(this.angleList);
            console.log(this.sliderLen);
            console.log(innerAngle);
        }
    }

    constructor(pointLists, sliderType, initialSliderLen, initialSliderVelocity, baseSliderVelocity, beatStep, time, isNewCombo, repeat) {
        // const canvas = document.createElement("canvas");
        const originalArr = pointLists.split("|").map((point) => {
            return {
                x: point.split(":")[0],
                y: point.split(":")[1],
            };
        });

        const pointArr = pointLists.split("|").map((point) => {
            return {
                x: point.split(":")[0] * scaleFactor + (canvas.width - 512 * scaleFactor) / 2,
                y: point.split(":")[1] * scaleFactor + (canvas.height - 384 * scaleFactor) / 2,
            };
        });

        this.originalArr = originalArr;
        this.pointArr = pointArr;
        this.hitCircle = new HitCircle(originalArr[0].x, originalArr[0].y, time, false);
        this.initialSliderLen = initialSliderLen;
        this.initialSliderVelocity = initialSliderVelocity;
        this.sliderAccuracy = sliderAccuracy / (initialSliderLen / baseSliderVelocity);
        // console.log(1 / this.sliderAccuracy);

        this.baseSliderVelocity = baseSliderVelocity;
        this.beatStep = parseFloat(beatStep);

        this.startTime = time - preempt;
        this.endTime = time + (initialSliderLen / initialSliderVelocity) * beatStep + 240;

        const preTime = new Date().getTime();
        this.getAngleList(pointArr, scaleFactor);
        const postTime = new Date().getTime();
        // console.log(time, preTime, postTime, postTime - preTime);
        // this.time = time;

        this.isNewCombo = isNewCombo;
        this.repeat = repeat;
        // this.draw(0.5);

        // console.log((this.initialSliderLen / this.intialSliderVelocity) * this.beatStep);
        // console.log(time, (this.initialSliderLen / this.intialSliderVelocity) * this.beatStep + 300);

        // console.log("a");
    }
}
