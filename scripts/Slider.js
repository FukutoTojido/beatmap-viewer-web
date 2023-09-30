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

    repeat;

    sliderType;

    endPosition;

    stackHeight = 0;

    time;
    hitTime;

    SliderMesh;
    SliderSelectedMesh;

    obj;
    selected;

    hitCircle;
    reverseArrow;
    sliderBall;

    angleE;
    angleS;

    tempModsHR = mods.HR;
    tempModsEZ = mods.EZ;
    tempW = Game.WIDTH;
    tempH = Game.HEIGHT;

    colour;
    colourIdx;
    comboIdx;

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
        if (this.tempModsEZ !== mods.EZ || this.tempModsHR !== mods.HR || this.tempW !== Game.WIDTH || this.tempH !== Game.HEIGHT) {
            this.tempModsEZ = mods.EZ;
            this.tempModsHR = mods.HR;
            this.tempW = Game.WIDTH;
            this.tempH = Game.HEIGHT;
            this.reInitialize();
            this.sliderBall.texture = sliderBallTemplate;
        }

        this.selected.alpha = 1;
    }

    drawBorder(timestamp) {
        // console.log(this.time, opacity, percentage);

        // Calculate object radius on HR / EZ toggle
        const HRMultiplier = !mods.HR ? 1 : 1.3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * Beatmap.stats.circleSize);
        const currentStackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        // Re-scale on playfield size change / on HR / EZ toggle
        if (this.tempModsEZ !== mods.EZ || this.tempModsHR !== mods.HR || this.tempW !== Game.WIDTH || this.tempH !== Game.HEIGHT) {
            this.tempModsEZ = mods.EZ;
            this.tempModsHR = mods.HR;
            this.tempW = Game.WIDTH;
            this.tempH = Game.HEIGHT;
            this.reInitialize();
            this.sliderBall.texture = sliderBallTemplate;
        }

        // Calculate current timing stats
        const currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);
        const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);
        const currentFadeIn = Beatmap.difficultyRange(currentAR, 1200, 800, 300);
        const fadeOutTime = 240;

        // Calculate object opacity
        let currentOpacity = 0;
        if (!mods.HD) {
            if (timestamp < this.hitTime) {
                currentOpacity = (timestamp - (this.time - currentPreempt)) / currentFadeIn;
            } else if (timestamp > this.endTime - (fadeOutTime - 1)) {
                if (sliderAppearance.snaking) {
                    currentOpacity = 0;
                } else {
                    currentOpacity = 1 - (timestamp - (this.endTime - (fadeOutTime - 1))) / fadeOutTime;
                }
            } else {
                currentOpacity = 1;
            }
        } else {
            if (timestamp < this.hitTime) {
                currentOpacity = (timestamp - (this.time - currentPreempt)) / currentFadeIn;
            } else {
                currentOpacity = 1 - (timestamp - this.time) / (this.endTime - (fadeOutTime - 1) - this.time);
            }
        }
        currentOpacity = Clamp(currentOpacity, 0, 1);
        this.SliderMesh.alpha = currentOpacity;

        // Calculate object progress percentage
        const currentPercentage = (timestamp - this.time) / (this.endTime - fadeOutTime - this.time);

        // Set object snaking section
        if (sliderAppearance.snaking)
            if (timestamp < this.time) {
                this.SliderMesh.startt = 0;
                this.SliderMesh.endt = Clamp(currentOpacity * 2, 0, 1);
            } else if (timestamp >= this.hitTime) {
                if (this.repeat % 2 === 0) {
                    this.SliderMesh.startt = 0;
                    this.SliderMesh.endt = 1 - Clamp((currentPercentage - 1) * this.repeat + 1, 0, 1);
                } else {
                    this.SliderMesh.startt = Clamp((currentPercentage - 1) * this.repeat + 1, 0, 1);
                    this.SliderMesh.endt = 1;
                }
            } else {
                this.SliderMesh.startt = 0;
                this.SliderMesh.endt = 1;
            }

        // Set reverse arrow properties
        if (this.repeat > 1) {
            if (timestamp < this.time) {
                // Set reverse arrow position
                this.reverseArrow.x = ((this.angleList.at(-1).x + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
                this.reverseArrow.y =
                    (((!mods.HR ? this.angleList.at(-1).y : 384 - this.angleList.at(-1).y) + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;

                // Set reverse arrow rotation
                this.reverseArrow.rotation = this.angleE + (!mods.HR ? 0 : Math.PI * 2 - this.angleE * 2);

                // Show reverse arrow when slider is snaking in at 40%
                if (currentOpacity * 2 < 0.8 && sliderAppearance.snaking) {
                    this.reverseArrow.alpha = 0;
                } else {
                    this.reverseArrow.alpha = currentOpacity;
                }
            } else {
                const currentRepeat = Math.floor(currentPercentage * this.repeat);
                if (currentRepeat < this.repeat - 1) {
                    if (currentRepeat % 2 === 0) {
                        // Set reverse arrow properties at slider end
                        this.reverseArrow.x = ((this.angleList.at(-1).x + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
                        this.reverseArrow.y =
                            (((!mods.HR ? this.angleList.at(-1).y : 384 - this.angleList.at(-1).y) + this.stackHeight * currentStackOffset) * Game.WIDTH) /
                            512;
                        this.reverseArrow.rotation = this.angleE + (!mods.HR ? 0 : Math.PI * 2 - this.angleE * 2);
                    } else {
                        // Set reverse arrow properties at slider head
                        this.reverseArrow.x = ((this.angleList[0].x + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
                        this.reverseArrow.y =
                            (((!mods.HR ? this.angleList[0].y : 384 - this.angleList[0].y) + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
                        this.reverseArrow.rotation = this.angleS + (!mods.HR ? 0 : Math.PI * 2 - this.angleS * 2);
                    }

                    // Set reverse arrow opacity (although it is kinda pointless?)
                    this.reverseArrow.alpha = currentOpacity;
                } else {
                    // Hide reverse arrow if this is the last iteration of repeat
                    this.reverseArrow.alpha = 0;
                }
            }

            const offset = this.time % this.beatStep;
            const revExpand = (timestamp - offset - Math.floor((timestamp - offset) / this.beatStep) * this.beatStep) / this.beatStep;
            const revExpandRate = (1 - Clamp(Math.abs(revExpand), 0, 1)) * 0.7 + 0.8;
            this.reverseArrow.scale.set(((revExpandRate * circleModScale * Game.WIDTH) / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
        }

        if (timestamp > this.hitTime) {
            // Calculate sliderball position
            const currentRepeat = Math.floor(currentPercentage * this.repeat);
            const repeatPercentage = (currentPercentage - currentRepeat / this.repeat) * this.repeat;
            const pos =
                currentRepeat % 2 === 0
                    ? Math.ceil((this.angleList.length - 1) * repeatPercentage)
                    : Math.ceil((this.angleList.length - 1) * (1 - repeatPercentage));

            // Set sliderball position
            if (currentRepeat < this.repeat) {
                this.sliderBall.x = ((this.angleList[pos].x + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
                this.sliderBall.y =
                    (((!mods.HR ? this.angleList[pos].y : 384 - this.angleList[pos].y) + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
            }

            this.sliderBall.alpha = timestamp > this.endTime - fadeOutTime + 1 ? 0 : 1;
        } else {
            // Hide sliderball when not hitted
            this.sliderBall.alpha = 0;
            this.sliderBall.x = ((this.angleList[0].x + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
            this.sliderBall.y = (((!mods.HR ? this.angleList[0].y : 384 - this.angleList[0].y) + this.stackHeight * currentStackOffset) * Game.WIDTH) / 512;
        }

        // Set sliderball scale
        this.sliderBall.scale.set(circleModScale);
        // this.sliderBall.tint = colour;

        // Set slider color
        this.SliderMesh.tintid = this.colourIdx + (!sliderAppearance.legacy ? 0 : 2 ** Math.ceil(Math.log2(colorsLength)));
        // this.SliderMesh.tintid = !sliderAppearance.untint
        //     ? this.colourIdx + (!sliderAppearance.legacy ? 0 : 2 ** Math.ceil(Math.log2(colorsLength)))
        //     : 2 ** Math.ceil(Math.log2(colorsLength)) + colorsLength - 1;
    }

    draw(timestamp) {
        this.drawBorder(timestamp);
        this.hitCircle.draw(timestamp);
    }

    reInitialize() {
        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        const circleModScale = (54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier) / (54.4 - 4.48 * Beatmap.stats.circleSize);
        const inverse = mods.HR ? -1 : 1;
        const currentStackOffset = (-6.4 * (1 - (0.7 * (Beatmap.stats.circleSize * HRMultiplier * EZMultiplier - 5)) / 5)) / 2;

        const dx = (2 * Game.WIDTH) / Game.APP.view.width / 512;
        const dy = (inverse * (-2 * Game.HEIGHT)) / Game.APP.view.height / 384;

        const transform = {
            dx: dx,
            ox: -1 + (2 * Game.OFFSET_X) / Game.APP.view.width + dx * this.stackHeight * currentStackOffset,
            dy: dy,
            oy: inverse * (1 - (2 * Game.OFFSET_Y) / Game.APP.view.height) + inverse * dy * this.stackHeight * currentStackOffset,
        };

        this.sliderGeometryContainer.initiallize((Beatmap.stats.circleDiameter / 2) * circleModScale, transform);
    }

    createEquiDistCurve(points, actualLength, calculatedLength) {
        let rPoints = points;
        const sectionDistance = actualLength * Game.SLIDER_ACCURACY;

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
        for (let i = 0; i < 1; i += Game.SLIDER_ACCURACY) {
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
        for (let i = 0; i < 1; i += Game.SLIDER_ACCURACY) {
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
        this.initialSliderLen = initialSliderLen;
        this.initialSliderVelocity = initialSliderVelocity;
        this.repeat = repeat;

        this.isNewCombo = isNewCombo;

        this.baseSliderVelocity = baseSliderVelocity;
        this.beatStep = parseFloat(beatStep);

        this.time = time;
        this.hitTime = time;
        this.startTime = time - Beatmap.stats.preempt;
        this.endTime = time + (initialSliderLen / initialSliderVelocity) * beatStep + 240;

        this.hitCircle = new HitCircle(originalArr[0].x, originalArr[0].y, time, false);
        this.hitCircle.hitTime = this.hitTime;

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

            const revEndSprite = PIXI.Sprite.from("static/reversearrow@2x.png");
            revEndSprite.scale.set((Game.WIDTH / 1024 / (54.4 - 4.48 * 4)) * (54.4 - 4.48 * Beatmap.stats.circleSize));
            revEndSprite.anchor.set(0.5);
            revEndSprite.alpha = 0;

            this.reverseArrow = revEndSprite;
        }

        // console.log(this.time, this.angleList);

        let w_z = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
        let h_z = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

        if (w_z / 512 > h_z / 384) w_z = (h_z / 384) * 512;
        else h_z = (w_z / 512) * 384;

        this.sliderGeometryContainer = new SliderGeometryContainers(this.angleList, Beatmap.stats.circleDiameter / 2, 0);
        this.SliderMesh = this.sliderGeometryContainer.sliderContainer;
        this.selected = this.sliderGeometryContainer.selSliderContainer;

        this.SliderMeshContainer = new PIXI.Container();
        this.SliderMeshContainer.addChild(this.SliderMesh);

        const sliderBall = new PIXI.Sprite(sliderBallTemplate);
        sliderBall.x = (this.angleList[0].x * Game.WIDTH) / 512;
        sliderBall.y = (this.angleList[0].y * Game.WIDTH) / 512;
        sliderBall.anchor.set(0.5);
        this.sliderBall = sliderBall;

        const SliderContainer = new PIXI.Container();
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
