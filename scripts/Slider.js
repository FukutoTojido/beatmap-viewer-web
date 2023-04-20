class Slider {
    originalArr = [];
    pointArr = [];
    angleList = [];
    originalAngleList = [];
    originalBreakPoints = [];
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
    reverseArrow;
    headReverseArrow;
    sliderType;
    endPosition;
    INITIAL_CALCULATED_RATIO;
    STEP;
    minX;
    minY;
    maxX;
    maxY;
    stackHeight = 0;
    time;
    SliderMesh;
    obj;

    binom(n, k) {
        if (k < 0 || k > n) return 0;
        if (k == 0 || k == n) return 1;

        var coeff = 1;
        for (var i = 0; i < k; i++) coeff = (coeff * (n - i)) / (i + 1);

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

    drawSelected() {
        this.hitCircle.drawSelected(this.stackHeight);

        if (!this.minX || !this.minY) return;

        const currentScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);

        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;

        const inverse = mods.HR ? -1 : 1;
        let currentHitCircleSize = 2 * (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier);
        let currentSliderBorderThickness = !sliderAppearance.legacy
            ? (currentHitCircleSize * (236 - 140)) / 2 / 256 / 2
            : (currentHitCircleSize * (236 - 190)) / 2 / 256 / 2;

        const objectSize = currentHitCircleSize * currentScaleFactor * (236 / 272);

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

            this.angleList = this.getAngleList(newPointArr, currentScaleFactor).angleList;

            this.minX = this.angleList.reduce((prev, curr) => (prev.x >= curr.x ? curr : prev)).x;
            this.minY = this.angleList.reduce((prev, curr) => (prev.y >= curr.y ? curr : prev)).y;
            this.maxX = this.angleList.reduce((prev, curr) => (prev.x <= curr.x ? curr : prev)).x;
            this.maxY = this.angleList.reduce((prev, curr) => (prev.y <= curr.y ? curr : prev)).y;
        }

        ctx.beginPath();
        const sliderOffset = (objectSize * 128) / 118;
        const shiftOffsetX = -this.minX + sliderOffset / 2;
        const shiftOffsetY = -this.minY + sliderOffset / 2;

        const pseudoCanvas = new OffscreenCanvas(this.maxX - this.minX + sliderOffset, this.maxY - this.minY + sliderOffset);
        const pseudoCtx = pseudoCanvas.getContext("2d");
        pseudoCtx.lineJoin = "round";
        pseudoCtx.lineCap = "round";

        pseudoCtx.beginPath();
        pseudoCtx.moveTo(this.angleList[0].x + shiftOffsetX, this.angleList[0].y + shiftOffsetY);

        const endPosition = Math.min(
            Math.ceil((this.initialSliderLen / this.repeat / this.sliderLen) * this.angleList.length - 1),
            this.angleList.length - 1
        );

        this.angleList.forEach((point, idx) => {
            const currentPointFullLengthRatio = idx / this.angleList.length;
            if (currentPointFullLengthRatio > this.INITIAL_CALCULATED_RATIO) return;

            pseudoCtx.lineTo(point.x + shiftOffsetX, point.y + shiftOffsetY);
        });

        pseudoCtx.lineWidth = (currentHitCircleSize - currentSliderBorderThickness * 2.5) * currentScaleFactor;
        pseudoCtx.strokeStyle = `rgb(0 0 0 / 1)`;
        pseudoCtx.stroke();

        pseudoCtx.globalCompositeOperation = "source-out";

        pseudoCtx.lineWidth = objectSize * (128 / 118);
        pseudoCtx.strokeStyle = `rgb(255, 123, 0)`;
        pseudoCtx.stroke();

        pseudoCtx.globalCompositeOperation = "source-over";
        pseudoCtx.closePath();

        // console.log(minX, minY)
        ctx.drawImage(
            pseudoCanvas,
            this.minX - sliderOffset / 2 + stackOffset * this.stackHeight * currentScaleFactor,
            this.minY - sliderOffset / 2 + inverse * stackOffset * this.stackHeight * currentScaleFactor
        );
        ctx.closePath();
    }

    drawBorder(opacity, percentage, colour, currentScaleFactor) {
        // console.log(this.time, opacity, percentage);
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const inverse = mods.HR ? -1 : 1;

        let currentHitCircleSize = 2 * (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier);
        let currentSliderBorderThickness = !sliderAppearance.legacy
            ? (currentHitCircleSize * (236 - 140)) / 2 / 256 / 2
            : (currentHitCircleSize * (236 - 170)) / 2 / 256 / 2;

        const objectSize = currentHitCircleSize;

        this.SliderMesh.alpha = Math.max(
            Math.min(opacity < 0 && Math.abs(opacity) < 1 ? Math.max(Math.abs(opacity) - 0.5, 0) : Math.abs(opacity), 1),
            0
        );
        // this.obj.alpha = opacity < 0 && Math.abs(opacity) < 1 ? Math.max(Math.abs(opacity) - 0.5, 0) : Math.abs(opacity);

        if (!(opacity < 0)) {
            this.SliderMesh.startt = 0;
            this.SliderMesh.endt = Math.max(Math.min(1, opacity), 0);
        } else {
            this.SliderMesh.startt = Math.min(Math.max(0, percentage), 1);
            this.SliderMesh.endt = 1;
        }

        if (opacity < 0 && Math.abs(opacity) < 1) {
        }

        if (this.repeat > 1 && percentage <= 1 - 1 / this.repeat) {
        }

        // console.log(this.startTime, percentage);

        if (opacity < 0 && percentage >= 0 && percentage <= 1) {
        }
    }

    draw(timestamp, opacity, percentage, hitCircleExpandRate, preemptRate, colour, colourIdx, comboIdx, currentScaleFactor) {
        this.drawBorder(opacity, percentage);
        // this.hitCircle.draw(
        //     timestamp,
        //     opacity,
        //     0,
        //     hitCircleExpandRate,
        //     preemptRate,
        //     colour,
        //     colourIdx,
        //     comboIdx,
        //     currentScaleFactor,
        //     this.stackHeight
        // );
    }

    createEquiDistCurve(points, actualLength, calculatedLength) {
        let rPoints = points;
        const sectionDistance = actualLength * sliderAccuracy;

        for (let i = 0; i < rPoints.length - 1; i++) {
            let distanceToNextPoint = this.Dist(rPoints[i], rPoints[i + 1]);
            // console.log(distanceToNextPoint, sectionDistance);
            while (distanceToNextPoint < sectionDistance && i + 1 < rPoints.length - 1) {
                rPoints.splice(i + 1, 1);
                distanceToNextPoint = this.Dist(rPoints[i], rPoints[i + 1]);
            }

            if (distanceToNextPoint > sectionDistance) {
                const newPoints = [];
                for (let j = 0; j < 1; j += sectionDistance / distanceToNextPoint) {
                    if (j === 0) continue;

                    const x = rPoints[i].x + ((rPoints[i + 1].x - rPoints[i].x) * sectionDistance) / distanceToNextPoint;
                    const y = rPoints[i].y + ((rPoints[i + 1].y - rPoints[i].y) * sectionDistance) / distanceToNextPoint;

                    newPoints.push({
                        x: x,
                        y: y,
                    });
                }

                rPoints = rPoints
                    .slice(0, i + 1)
                    .concat(newPoints)
                    .concat(rPoints.slice(i + 1));
            }
        }

        // console.log(limit);
        return rPoints;
    }

    Dist(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    generatePointsList(controlPointsList) {
        let pointsList = [];
        for (let i = 0; i < 1; i += sliderAccuracy) {
            pointsList.push(this.bezier(i, controlPointsList));
        }

        let length = 0;
        for (let i = 0; i < pointsList.length - 1; i++) {
            length += this.Dist(pointsList[i], pointsList[i + 1]);
        }

        pointsList = this.createEquiDistCurve(pointsList, this.initialSliderLen / this.repeat, length);

        let recalculatedLength = 0;
        for (let i = 0; i < pointsList.length - 1; i++) {
            recalculatedLength += this.Dist(pointsList[i], pointsList[i + 1]);
        }

        pointsList = pointsList.map((c, idx) => {
            return { ...c, t: idx / (pointsList.length - 1) };
        });

        // console.log(pointsList, this.initialSliderLen / this.repeat, length, recalculatedLength);
        return {
            points: pointsList,
            length: recalculatedLength,
        };
    }

    getCirclePoints(pointArr) {
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
                Math.abs(angleIndex) === Infinity || (pointArr[1].y - (angleIndex * pointArr[1].x + b)) * (centerY - (angleIndex * centerX + b)) < 0
                    ? Math.asin(lengthAC / (2 * radius)) * 2
                    : Math.PI * 2 - Math.asin(lengthAC / (2 * radius)) * 2;

            if (upper === 0) {
                innerAngle = absoluteAngle;
            } else {
                innerAngle = upper * (pointArr[1].y - (angleIndex * pointArr[1].x + b)) < 0 ? absoluteAngle : -absoluteAngle;
            }

            // if (upper === 0) console.log(this.startTime, pointArr[2].y - pointArr[0].y, absoluteAngle);

            this.angleIndex = angleIndex;
            this.b = b;
        }

        const points = [];
        let length = 0;
        for (let i = 0; i < 1; i += this.sliderAccuracy) {
            const toPush = {
                x: centerX + (pointArr[0].x - centerX) * Math.cos(innerAngle * i) - (pointArr[0].y - centerY) * Math.sin(innerAngle * i),
                y: centerY + (pointArr[0].x - centerX) * Math.sin(innerAngle * i) + (pointArr[0].y - centerY) * Math.cos(innerAngle * i),
                t: i,
            };
            if (i > 0) length += this.Dist(points.at(-1), toPush);
            points.push(toPush);
        }

        return {
            points: points,
            length: length,
        };
    }

    getAngleList(pointArr) {
        let breakPoints = [];

        breakPoints.push(0);
        for (let i = 0; i < pointArr.length - 1; i++) {
            if (this.Dist(pointArr[i], pointArr[i + 1]) === 0) breakPoints.push(i);
        }
        breakPoints.push(pointArr.length - 1);

        const calculatedAngleLength = (
            this.sliderType === "P"
                ? [this.getCirclePoints(pointArr)]
                : breakPoints.map((bP, idx) => {
                      if (idx === breakPoints.length - 1) return;

                      const calculatedPoints = this.generatePointsList(
                          bP === 0
                              ? pointArr.slice(breakPoints[idx], breakPoints[idx + 1] + 1)
                              : pointArr.slice(breakPoints[idx] + 1, breakPoints[idx + 1] + 1)
                      );

                      return calculatedPoints;
                  })
        ).filter((section) => section);

        const calculatedAngle = calculatedAngleLength
            .map((ele) => ele.points)
            .reduce((prev, curr) => prev.concat(curr), [])
            .filter((s) => s);
        const sliderLen = calculatedAngleLength.reduce((prev, curr) => prev + curr.length, 0);
        const limit = Math.floor((this.initialSliderLen / this.repeat / sliderLen) * (calculatedAngle.length - 1));

        const sliced = calculatedAngle.slice(0, limit);
        return sliced.map((coord, idx) => {
            coord.t = idx / (sliced.length - 1);
            return coord;
        });
    }

    constructor(pointLists, sliderType, initialSliderLen, initialSliderVelocity, baseSliderVelocity, beatStep, time, isNewCombo, repeat) {
        this.sliderType = sliderType;
        const originalArr = pointLists.split("|").map((point) => {
            return {
                x: point.split(":")[0],
                y: point.split(":")[1],
            };
        });

        this.originalArr = originalArr;
        this.hitCircle = new HitCircle(originalArr[0].x, originalArr[0].y, time, false);
        this.initialSliderLen = initialSliderLen;
        this.initialSliderVelocity = initialSliderVelocity;
        this.sliderAccuracy = sliderAccuracy / (initialSliderLen / baseSliderVelocity);
        this.repeat = repeat;

        this.baseSliderVelocity = baseSliderVelocity;
        this.beatStep = parseFloat(beatStep);

        this.time = time;
        this.startTime = time - preempt;
        this.endTime = time + (initialSliderLen / initialSliderVelocity) * beatStep + 240;

        this.angleList = this.getAngleList(originalArr);

        this.isNewCombo = isNewCombo;
        // this.draw(0.5);

        this.endPosition = this.angleList.length - 1;

        // console.log(this.repeat % 2);

        if (this.repeat > 1) {
            const deltaXE = this.angleList.at(-1).x - this.angleList.at(-1).x;
            const deltaYE = this.angleList.at(-1).y - this.angleList.at(-1).y;
            const tanE = Math.abs(deltaYE / deltaXE);

            const deltaXS = this.angleList[0].x - this.angleList[1].x;
            const deltaYS = this.angleList[0].y - this.angleList[1].y;
            const tanS = Math.abs(deltaYS / deltaXS);

            let angleE = deltaXE >= 0 ? (Math.atan(tanE) * 180) / Math.PI : 180 - (Math.atan(tanE) * 180) / Math.PI;
            angleE = deltaYE >= 0 ? angleE : -angleE;

            let angleS = deltaXS >= 0 ? (Math.atan(tanS) * 180) / Math.PI : 180 - (Math.atan(tanS) * 180) / Math.PI;
            angleS = deltaYS >= 0 ? angleS : -angleS;

            // console.log(time, angle, deltaX, deltaY);
            reverseArrowSVG.style.transform = `rotate(${angleE + 180}deg)`;
            const base64E = window.btoa(new XMLSerializer().serializeToString(sampleReverseArrow));
            const reverseArrowEImgData = `data:image/svg+xml;base64,${base64E}`;
            const reverseArrowEImg = new Image();
            reverseArrowEImg.src = reverseArrowEImgData;

            reverseArrowSVG.style.transform = `rotate(${angleS + 180}deg)`;
            const base64S = window.btoa(new XMLSerializer().serializeToString(sampleReverseArrow));
            const reverseArrowSImgData = `data:image/svg+xml;base64,${base64S}`;
            const reverseArrowSImg = new Image();
            reverseArrowSImg.src = reverseArrowSImgData;

            this.reverseArrow = reverseArrowEImg;
            this.headReverseArrow = reverseArrowSImg;
        }

        this.INITIAL_CALCULATED_RATIO = this.initialSliderLen / this.repeat / this.sliderLen;
        this.STEP = 1 / this.repeat;

        this.SliderMesh = new SliderMesh(this.angleList, hitCircleSize / 2, 0);
        this.SliderMesh.initiallize(
            [0x000000, 0xc8132e],
            cs,
            {
                dx: (2 * w) / parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) / 512,
                ox: -1 + (2 * offsetX) / parseInt(getComputedStyle(document.querySelector("#playerContainer")).width),
                dy: (-2 * h) / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) / 384,
                oy: 1 - (2 * offsetY) / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height),
            },
            undefined,
            0xffffff
        );

        const SliderContainer = new Container();
        SliderContainer.addChild(this.SliderMesh);

        this.obj = SliderContainer;
        // this.obj.alpha = 0.0;
    }
}
