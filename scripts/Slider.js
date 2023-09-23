class Slider {
    originalArr = [];
    angleList = [];
    initialSliderLen;
    initialSliderVelocity;
    baseSliderVelocity;
    beatStep;
    startTime;
    endTime;
    preempt;
    fadeIn;
    isNewCombo;
    hitCircle;
    repeat;
    tempCanvasWidth;
    reverseArrow;
    sliderType;
    endPosition;
    stackHeight = 0;
    tempStackHeight = 0;
    time;
    SliderMesh;
    obj;
    selected;
    SliderSelectedMesh;
    angleE;
    angleS;
    sliderBall;
    tempModsHR = mods.HR;
    tempModsEZ = mods.EZ;
    tempW = w;
    tempH = h;

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
        if (this.tempModsEZ !== mods.EZ || this.tempModsHR !== mods.HR || this.tempW !== w || this.tempH !== h) {
            this.tempModsEZ = mods.EZ;
            this.tempModsHR = mods.HR;
            this.tempW = w;
            this.tempH = h;
            this.reInitialize();
            this.sliderBall.texture = sliderBallTemplate;
        }

        this.selected.alpha = 1;
    }

    drawBorder(timestamp, opacity, percentage, colourIdx, colour, opacityHD) {
        // console.log(this.time, opacity, percentage);
        const HRMultiplier = !mods.HR ? 1 : 1.3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * circleSize);
        const currentStackOffset = (-6.4 * (1 - (0.7 * (circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        if (this.tempModsEZ !== mods.EZ || this.tempModsHR !== mods.HR || this.tempW !== w || this.tempH !== h) {
            this.tempModsEZ = mods.EZ;
            this.tempModsHR = mods.HR;
            this.tempW = w;
            this.tempH = h;
            this.reInitialize();
            this.sliderBall.texture = sliderBallTemplate;
        }

        this.SliderMesh.alpha = Clamp(
            timestamp < this.time
                ? Math.abs(opacity)
                : !mods.HD
                ? timestamp > this.endTime - 239
                    ? sliderAppearance.snaking
                        ? 0
                        : 1 - (timestamp - (this.endTime - 239)) / 240
                    : 1
                : 1 - (timestamp - this.time) / (this.endTime - 239 - this.time),
            0,
            1
        );
        // this.obj.alpha = opacity < 0 && Math.abs(opacity) < 1 ? Math.max(Math.abs(opacity) - 0.5, 0) : Math.abs(opacity);

        if (sliderAppearance.snaking)
            if (!(opacity < 0)) {
                this.SliderMesh.startt = 0;
                this.SliderMesh.endt = Clamp(opacity * 2, 0, 1);
            } else {
                if (this.repeat % 2 === 0) {
                    this.SliderMesh.startt = 0;
                    this.SliderMesh.endt = 1 - Clamp((percentage - 1) * this.repeat + 1, 0, 1);
                } else {
                    this.SliderMesh.startt = Clamp((percentage - 1) * this.repeat + 1, 0, 1);
                    this.SliderMesh.endt = 1;
                }
            }
        else {
            this.SliderMesh.startt = 0;
            this.SliderMesh.endt = 1;
        }

        if (this.repeat > 1) {
            if (!(opacity < 0)) {
                this.reverseArrow.x = ((this.angleList.at(-1).x + this.stackHeight * currentStackOffset) * w) / 512;
                this.reverseArrow.y =
                    (((!mods.HR ? this.angleList.at(-1).y : 384 - this.angleList.at(-1).y) + this.stackHeight * currentStackOffset) * w) / 512;
                // this.reverseArrow.alpha = Math.abs(opacity);
                this.reverseArrow.rotation = this.angleE + (!mods.HR ? 0 : Math.PI * 2 - this.angleE * 2);

                if (opacity * 2 < 0.8 && sliderAppearance.snaking) {
                    this.reverseArrow.alpha = 0;
                } else {
                    this.reverseArrow.alpha = Math.abs(opacity);
                }
            } else {
                const currentRepeat = Math.floor(percentage * this.repeat);
                if (currentRepeat < this.repeat - 1)
                    if (currentRepeat % 2 === 0) {
                        this.reverseArrow.x = ((this.angleList.at(-1).x + this.stackHeight * currentStackOffset) * w) / 512;
                        this.reverseArrow.y =
                            (((!mods.HR ? this.angleList.at(-1).y : 384 - this.angleList.at(-1).y) + this.stackHeight * currentStackOffset) * w) /
                            512;
                        this.reverseArrow.rotation = this.angleE + (!mods.HR ? 0 : Math.PI * 2 - this.angleE * 2);
                        this.reverseArrow.alpha = Math.abs(opacity);
                    } else {
                        this.reverseArrow.x = ((this.angleList[0].x + this.stackHeight * currentStackOffset) * w) / 512;
                        this.reverseArrow.y =
                            (((!mods.HR ? this.angleList[0].y : 384 - this.angleList[0].y) + this.stackHeight * currentStackOffset) * w) / 512;
                        this.reverseArrow.rotation = this.angleS + (!mods.HR ? 0 : Math.PI * 2 - this.angleS * 2);
                        this.reverseArrow.alpha = Math.abs(opacity);
                    }
                else {
                    this.reverseArrow.alpha = 0;
                }
            }

            const offset = this.time % this.beatStep;
            const revExpand = (timestamp - offset - Math.floor((timestamp - offset) / this.beatStep) * this.beatStep) / this.beatStep;
            const revExpandRate = (1 - Clamp(Math.abs(revExpand), 0, 1)) * 0.7 + 0.8;
            this.reverseArrow.scale.set(((revExpandRate * circleModScale * w) / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * circleSize));
        }

        if (opacity < 0) {
            const currentRepeat = Math.floor(percentage * this.repeat);
            const repeatPercentage = (percentage - currentRepeat / this.repeat) * this.repeat;
            const pos =
                currentRepeat % 2 === 0
                    ? Math.ceil((this.angleList.length - 1) * repeatPercentage)
                    : Math.ceil((this.angleList.length - 1) * (1 - repeatPercentage));

            if (currentRepeat < this.repeat) {
                this.sliderBall.x = ((this.angleList[pos].x + this.stackHeight * currentStackOffset) * w) / 512;
                this.sliderBall.y =
                    (((!mods.HR ? this.angleList[pos].y : 384 - this.angleList[pos].y) + this.stackHeight * currentStackOffset) * w) / 512;
            }

            this.sliderBall.alpha = timestamp > this.endTime - 240 ? 0 : Math.abs(opacity);
        } else {
            this.sliderBall.alpha = 0;
            this.sliderBall.x = ((this.angleList[0].x + this.stackHeight * currentStackOffset) * w) / 512;
            this.sliderBall.y = (((!mods.HR ? this.angleList[0].y : 384 - this.angleList[0].y) + this.stackHeight * currentStackOffset) * w) / 512;
        }

        this.sliderBall.scale.set(circleModScale);
        // this.sliderBall.tint = colour;

        // console.log(currentStackOffset * this.stackHeight);

        this.SliderMesh.tintid = colourIdx + (!sliderAppearance.legacy ? 0 : 2 ** Math.ceil(Math.log2(colorsLength)));
    }

    draw(
        timestamp,
        opacity,
        percentage,
        hitCircleExpandRate,
        preemptRate,
        colour,
        colourIdx,
        comboIdx,
        currentScaleFactor,
        sliderStackHeight,
        opacityHD
    ) {
        this.drawBorder(timestamp, opacity, percentage, colourIdx, colour, opacityHD);
        this.hitCircle.draw(
            timestamp,
            opacity,
            0,
            hitCircleExpandRate,
            preemptRate,
            colour,
            colourIdx,
            comboIdx,
            currentScaleFactor,
            this.stackHeight,
            opacityHD
        );
    }

    reInitialize() {
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * circleSize);
        const inverse = mods.HR ? -1 : 1;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        let w_z = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
        let h_z = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

        if (w_z / 512 > h_z / 384) w_z = (h_z / 384) * 512;
        else h_z = (w_z / 512) * 384;

        const dx = (2 * w) / document.querySelector("canvas").width / 512;
        const dy = (inverse * (-2 * h)) / document.querySelector("canvas").height / 384;

        const transform = {
            dx: dx,
            ox: -1 + (2 * offsetX) / document.querySelector("canvas").width + dx * this.stackHeight * currentStackOffset,
            dy: dy,
            oy: inverse * (1 - (2 * offsetY) / document.querySelector("canvas").height) + inverse * dy * this.stackHeight * currentStackOffset,
        };

        this.sliderGeometryContainer.initiallize((hitCircleSize / 2) * circleModScale, transform)

        // this.SliderMesh.initiallize((hitCircleSize / 2) * circleModScale, transform, false);
        // this.selected.initiallize((hitCircleSize / 2) * circleModScale, transform, true);
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

        lengthAB = Math.sqrt((pointArr[0].x - pointArr[1].x) ** 2 + (pointArr[0].y - pointArr[1].y) ** 2);
        lengthBC = Math.sqrt((pointArr[1].x - pointArr[2].x) ** 2 + (pointArr[1].y - pointArr[2].y) ** 2);
        lengthAC = Math.sqrt((pointArr[0].x - pointArr[2].x) ** 2 + (pointArr[0].y - pointArr[2].y) ** 2);

        angleA = Math.acos(Clamp((lengthAB ** 2 + lengthAC ** 2 - lengthBC ** 2) / (2 * lengthAB * lengthAC), -1, 1));
        angleB = Math.acos(Clamp((lengthAB ** 2 + lengthBC ** 2 - lengthAC ** 2) / (2 * lengthAB * lengthBC), -1, 1));
        angleC = Math.acos(Clamp((lengthAC ** 2 + lengthBC ** 2 - lengthAB ** 2) / (2 * lengthAC * lengthBC), -1, 1));

        radius = Clamp(lengthAB / (2 * Math.sin(angleC)), 0, Number.MAX_SAFE_INTEGER);

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
                ? Math.asin(Clamp(lengthAC / (2 * radius), 0, 1)) * 2
                : Math.PI * 2 - Math.asin(Clamp(lengthAC / (2 * radius), 0, 1)) * 2;
        // console.log(this.time, centerX, centerY, angleIndex, b, radius, absoluteAngle, pointArr[1], lengthAC / (2 * radius));

        if (upper === 0) {
            if (lower === 0) {
                const firstHalf = this.generatePointsList([pointArr[0], pointArr[1]]);
                const secondHalf = this.generatePointsList([pointArr[1], pointArr[2]]);
                return {
                    points: firstHalf.points.concat(secondHalf.points),
                    length: firstHalf.length + secondHalf.length,
                };
            }

            const middle_start = Math.round((pointArr[1].x - pointArr[0].x) * 1000) / 1000;
            const center_start = Math.round((centerX - pointArr[0].x) * 1000) / 1000;

            if (middle_start < 0 && center_start >= 0) innerAngle = (lower > 0 ? -1 : 1) * absoluteAngle;
            if (middle_start > 0 && center_start <= 0) innerAngle = (lower > 0 ? 1 : -1) * absoluteAngle;
            if (middle_start > 0 && center_start >= 0) innerAngle = (lower > 0 ? -1 : 1) * Math.abs(Math.PI * 2 - absoluteAngle);
            if (middle_start < 0 && center_start <= 0) innerAngle = (lower > 0 ? 1 : -1) * Math.abs(Math.PI * 2 - absoluteAngle);
            if (middle_start == 0 && center_start == 0) {
                pointArr.splice(1, 1);
                return this.generatePointsList(pointArr);
            }

            // console.log("z", this.time, innerAngle, middle_start, center_start, centerX);
        } else {
            const projectile = {
                x: pointArr[1].x,
                y: pointArr[1].x * angleIndex + b,
            };

            if (this.time === 130364) console.log(projectile);
            if (this.Dist(projectile, pointArr[1]) < 0.1) {
                pointArr.splice(1, 1);
                return this.generatePointsList(pointArr);
            }
            innerAngle = upper * (pointArr[1].y - (angleIndex * pointArr[1].x + b)) < 0 ? absoluteAngle : -absoluteAngle;
        }

        // if (upper === 0) console.log(this.startTime, pointArr[2].y - pointArr[0].y, absoluteAngle);
        // console.log(this.time, (absoluteAngle * 180) / Math.PI, (innerAngle * 180) / Math.PI, upper, lower, angleIndex, b);

        const points = [];
        let length = 0;

        // console.log(this.time, innerAngle, centerX, centerY, pointArr[0]);
        for (let i = 0; i < 1; i += sliderAccuracy) {
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

        // console.log(this.time, calculatedAngle.length, sliced.at(-1));

        // if (this.time === 130364) console.log(calculatedAngleLength);

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
        this.repeat = repeat;

        this.isNewCombo = isNewCombo;

        this.baseSliderVelocity = baseSliderVelocity;
        this.beatStep = parseFloat(beatStep);

        this.time = time;
        this.startTime = time - preempt;
        this.endTime = time + (initialSliderLen / initialSliderVelocity) * beatStep + 240;

        this.angleList = this.getAngleList(originalArr);

        // this.draw(0.5);
        // console.log(this.repeat % 2);

        if (this.repeat > 1) {
            const deltaXE = this.angleList.at(-1).x - this.angleList.at(-2).x;
            const deltaYE = this.angleList.at(-1).y - this.angleList.at(-2).y;
            const tanE = Math.abs(deltaYE / deltaXE);

            const deltaXS = this.angleList[0].x - this.angleList[1].x;
            const deltaYS = this.angleList[0].y - this.angleList[1].y;
            const tanS = Math.abs(deltaYS / deltaXS);

            let angleE = deltaXE >= 0 ? (Math.atan(tanE) * 180) / Math.PI : 180 - (Math.atan(tanE) * 180) / Math.PI;
            angleE = (((deltaYE >= 0 ? angleE : -angleE) + 180) * Math.PI) / 180;

            let angleS = deltaXS >= 0 ? (Math.atan(tanS) * 180) / Math.PI : 180 - (Math.atan(tanS) * 180) / Math.PI;
            angleS = (((deltaYS >= 0 ? angleS : -angleS) + 180) * Math.PI) / 180;

            this.angleE = angleE;
            this.angleS = angleS;

            const revEndSprite = Sprite.from("static/reversearrow@2x.png");
            revEndSprite.scale.set((w / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * circleSize));
            revEndSprite.anchor.set(0.5);
            revEndSprite.alpha = 0;

            this.reverseArrow = revEndSprite;
        }

        // console.log(this.time, this.angleList);

        let w_z = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
        let h_z = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

        if (w_z / 512 > h_z / 384) w_z = (h_z / 384) * 512;
        else h_z = (w_z / 512) * 384;

        // this.SliderMesh = new SliderMesh(this.angleList, hitCircleSize / 2, 0);
        // this.SliderMesh.initiallize(
        //     hitCircleSize / 2,
        //     {
        //         dx: (2 * w_z) / document.querySelector("canvas").width / 512,
        //         ox: -1 + (2 * offsetX) / document.querySelector("canvas").width,
        //         dy: (-2 * h_z) / document.querySelector("canvas").height / 384,
        //         oy: 1 - (2 * offsetY) / document.querySelector("canvas").height,
        //     },
        //     false
        // );

        // this.selected = new SliderMesh(this.angleList, hitCircleSize / 2, 0);
        // this.selected.initiallize(
        //     hitCircleSize / 2,
        //     {
        //         dx: (2 * w_z) / document.querySelector("canvas").width / 512,
        //         ox: -1 + (2 * offsetX) / document.querySelector("canvas").width,
        //         dy: (-2 * h_z) / document.querySelector("canvas").height / 384,
        //         oy: 1 - (2 * offsetY) / document.querySelector("canvas").height,
        //     },
        //     true
        // );

        this.sliderGeometryContainer = new SliderGeometryContainers(this.angleList, hitCircleSize / 2, 0);
        this.SliderMesh = this.sliderGeometryContainer.sliderContainer;
        this.selected = this.sliderGeometryContainer.selSliderContainer;

        this.SliderMeshContainer = new Container();
        this.SliderMeshContainer.addChild(this.SliderMesh);

        const sliderBall = new Sprite(sliderBallTemplate);
        sliderBall.x = (this.angleList[0].x * w) / 512;
        sliderBall.y = (this.angleList[0].y * w) / 512;
        sliderBall.anchor.set(0.5);
        this.sliderBall = sliderBall;

        const SliderContainer = new Container();
        SliderContainer.addChild(this.SliderMeshContainer);

        if (this.reverseArrow) {
            SliderContainer.addChild(this.reverseArrow);
        }

        SliderContainer.addChild(this.sliderBall);
        SliderContainer.addChild(this.hitCircle.obj);

        this.obj = SliderContainer;
        // this.obj.alpha = 0.0;
    }
}
