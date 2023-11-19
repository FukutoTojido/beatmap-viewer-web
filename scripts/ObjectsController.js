class ObjectsController {
    hitCirclesList;
    slidersList;
    objectsList;
    judgementList = [];
    drawTime;
    coloursList;
    breakPeriods;
    currentColor;
    coloursObject;
    lastTimestamp = 0;
    lastTime = 0;
    fpsArr = [];
    tempW = Game.WIDTH;
    tempH = Game.HEIGHT;

    filtered;

    _in = [];

    static requestID = null;

    // static preempt = 0;

    compare(a, b) {
        if (a.time < b.time) {
            return -1;
        }
        if (a.time > b.time) {
            return 1;
        }
        return 0;
    }

    constructor(hitCirclesList, slidersList, coloursList, breakPeriods) {
        this.hitCirclesList = hitCirclesList;
        this.slidersList = slidersList;
        this.objectsList = hitCirclesList.concat(slidersList).sort(this.compare);
        this.currentColor = 1 % coloursList.length;
        this.comboIdx = 1;

        this.objectsList = this.objectsList.map((object, idx) => {
            if (object.obj.isNewCombo && idx !== 0) {
                this.currentColor = (this.currentColor + 1) % coloursList.length;
                this.comboIdx = 1;
            }

            object.obj.colour = coloursList[this.currentColor];
            object.obj.colourIdx = this.currentColor;
            object.obj.comboIdx = this.comboIdx++;

            if (object.obj instanceof Slider) {
                object.obj.hitCircle.colour = object.obj.colour;
                object.obj.hitCircle.colourIdx = object.obj.colourIdx;
                object.obj.hitCircle.comboIdx = object.obj.comboIdx;
            }

            return {
                ...object,
                colour: object.obj.colour,
                colourIdx: object.obj.colourIdx,
                comboIdx: object.obj.comboIdx,
                idx,
            };
        });

        this.breakPeriods = breakPeriods;
    }

    draw(timestamp, staticDraw) {
        this.fpsArr.push(Math.max(0, performance.now() - this.lastTime));
        if (this.fpsArr.length > 100) {
            this.fpsArr = this.fpsArr.slice(this.fpsArr.length - 100);
        }

        Game.FPS.text = `${Math.round(
            1000 / (this.fpsArr.reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0) / this.fpsArr.length)
        )}fps\n${(this.fpsArr.reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0) / this.fpsArr.length).toFixed(2)}ms`;
        this.lastTime = performance.now();

        if (didMove && currentX !== -1 && currentY !== -1) {
            draggingEndTime = beatmapFile.audioNode.getCurrentTime();
            handleCanvasDrag(false, true);
        }

        updateTime(timestamp);
        setSliderTime();

        const currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);
        const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);

        // Experimental Algorithm, might change later
        // let _out = [];

        // this.objectsList.forEach((object, idx) => {
        //     const liveTime = {
        //         start: object.time - currentPreempt,
        //         end: sliderAppearance.hitAnim ? object.obj.endTime : Math.max(object.time + 800, object.obj.endTime),
        //     };

        //     // Timestamp in object's live time
        //     if (liveTime.start <= timestamp && liveTime.end >= timestamp) {
        //         // Do something here
        //         if (!this._in.some((obj) => obj.idx === object.idx)) this._in.push(object);
        //         return;
        //     }

        //     // Timestamp out of object's live time and was not in live time before
        //     const objIndex = this._in.findIndex((obj) => obj.idx === object.idx);
        //     if (objIndex === -1) return;

        //     // Timestamp out of object's live time and was in live time before
        //     _out.push(object);
        //     this._in.splice(objIndex, 1);
        // });

        // const _appr = this._in.map((o) => {
        //     if (o.obj instanceof HitCircle) return o.obj.approachCircleObj;
        //     if (o.obj instanceof Slider) return o.obj.hitCircle.approachCircleObj;
        // });

        const filtered = this.objectsList
            .filter(
                (object) =>
                    object.time - currentPreempt < timestamp &&
                    (sliderAppearance.hitAnim ? object.obj.endTime : Math.max(object.time + 800, object.obj.endTime)) > timestamp
            )
            .reverse();

        this.filtered = filtered;

        const approachCircleList = filtered.map((o) => o.obj.approachCircleObj);

        const selected = this.objectsList.filter((object) => selectedHitObject.includes(object.time)).reverse();
        const noSelected = this.objectsList.filter((object) => !selectedHitObject.includes(object.time)).reverse();

        const judgementRenderList = this.judgementList.filter(
            (judgement) => judgement.time - 200 < timestamp && judgement.time + 1800 + 200 > timestamp
        );

        const judgementNoRender = this.judgementList.filter(
            (judgement) => !(judgement.time - 200 < timestamp && judgement.time + 1800 + 200 > timestamp)
        );

        // console.log(judgementList);

        const noRender = this.objectsList.filter(
            (object) =>
                !(
                    object.time - currentPreempt < timestamp &&
                    (sliderAppearance.hitAnim ? object.obj.endTime : Math.max(object.time + 800, object.obj.endTime)) > timestamp
                )
        );

        const noRenderApproachCircleList = noRender.map((o) => o.obj.approachCircleObj);

        Game.addToContainer([
            ...judgementRenderList,
            ...filtered.map((o) => o.obj),
            ...approachCircleList,
            ...selected.reduce((accm, o) => {
                accm.push({ obj: o.obj.selected });
                if (o.obj instanceof Slider) accm.push({ obj: o.obj.hitCircle.selected });
                return accm;
            }, []),
        ]);

        Game.removeFromContainer([
            ...judgementNoRender,
            ...noRender.map((o) => o.obj),
            ...noRenderApproachCircleList,
            ...noSelected.reduce((accm, o) => {
                accm.push({ obj: o.obj.selected });
                if (o.obj instanceof Slider) accm.push({ obj: o.obj.hitCircle.selected });
                return accm;
            }, []),
        ]);

        // console.log(filtered);

        if (this.breakPeriods.some((period) => period[0] < timestamp && period[1] > timestamp)) {
            document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${document.querySelector("#dim").value * 0.7})`;
        } else {
            document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${document.querySelector("#dim").value})`;
        }

        judgementRenderList.forEach((object) => {
            object.draw(timestamp);
        });

        filtered.forEach((object) => {
            const objStartTime = object.time - currentPreempt;

            selected.forEach((o) => {
                o.obj.drawSelected();
                if (o.obj instanceof Slider) o.obj.hitCircle.drawSelected(o.obj.stackHeight);
            });

            if (timestamp < objStartTime) return;

            object.obj.draw(Math.max(timestamp, 0));

            if (object.obj instanceof HitCircle) {
                if (timestamp >= object.obj.hitTime && this.lastTimestamp < object.obj.hitTime && beatmapFile.audioNode.isPlaying) {
                    // console.log(object.time, timestamp, this.lastTimestamp);

                    if (!ScoreParser.REPLAY_DATA) object.hitsounds.play();
                    else {
                        const evaluation = ScoreParser.EVAL_LIST.find((evaluation) => evaluation.time === object.obj.time);
                        if (evaluation) object.hitsounds.play();
                    }
                }
            }

            if (object.obj instanceof Slider) {
                if (timestamp >= object.obj.hitTime && this.lastTimestamp < object.obj.hitTime && beatmapFile.audioNode.isPlaying) {
                    // console.log(object.time, timestamp, this.lastTimestamp);
                    if (!ScoreParser.REPLAY_DATA) object.hitsounds.sliderHead.play();
                    else {
                        const evaluation = ScoreParser.EVAL_LIST.find((evaluation) => evaluation.time === object.obj.time);
                        if (evaluation && evaluation.checkPointState.findLast((checkPoint) => checkPoint.type === "Slider Head").eval === 1)
                            object.hitsounds.sliderHead.play();
                    }
                }

                if (timestamp >= object.obj.endTime - 240 && this.lastTimestamp < object.obj.endTime - 240 && beatmapFile.audioNode.isPlaying) {
                    // console.log(object.time, timestamp, this.lastTimestamp);

                    if (!ScoreParser.REPLAY_DATA) object.hitsounds.sliderTail.play();
                    else {
                        const evaluation = ScoreParser.EVAL_LIST.find((evaluation) => evaluation.time === object.obj.time);
                        if (evaluation && evaluation.checkPointState.findLast((checkPoint) => checkPoint.type === "Slider End").eval === 1)
                            object.hitsounds.sliderTail.play();
                    }
                }

                if (object.hitsounds.sliderReverse.length > 0) {
                    const currentOffsetFromStart = timestamp - object.time;
                    const lastOffsetFromStart = this.lastTimestamp - object.time;
                    const totalLength = object.endTime - object.time;

                    const currentRepeatIdx = Math.floor((currentOffsetFromStart / totalLength) * object.obj.repeat);
                    const lastRepeatIdx = Math.floor((lastOffsetFromStart / totalLength) * object.obj.repeat);

                    if (
                        currentRepeatIdx > lastRepeatIdx &&
                        currentRepeatIdx < object.obj.repeat &&
                        currentRepeatIdx >= 1 &&
                        beatmapFile.audioNode.isPlaying
                    ) {
                        if (!ScoreParser.REPLAY_DATA) object.hitsounds.sliderReverse[currentRepeatIdx - 1].play();
                        else {
                            const evaluation = ScoreParser.EVAL_LIST.find((evaluation) => evaluation.time === object.obj.time);
                            if (
                                evaluation &&
                                evaluation.checkPointState.filter((checkPoint) => checkPoint.type === "Slider Repeat")[currentRepeatIdx - 1].eval ===
                                    1
                            )
                                object.hitsounds.sliderReverse[currentRepeatIdx - 1].play();
                        }
                    }
                }
            }

            if (object.obj instanceof Spinner) {
                if (timestamp >= object.endTime && this.lastTimestamp < object.endTime && beatmapFile.audioNode.isPlaying) {
                    // console.log(object.time, timestamp, this.lastTimestamp);
                    object.hitsounds.play();
                }
            }

            // if (selectedHitObject.includes(object.time)) object.obj.drawSelected();
        });

        if (ScoreParser.CURSOR_DATA) {
            const posInfoIndex = ScoreParser.CURSOR_DATA.slice(0, -1).findLastIndex((cursorData) => cursorData.time <= timestamp);
            const lerp_x =
                ScoreParser.CURSOR_DATA[posInfoIndex].x +
                ((timestamp - ScoreParser.CURSOR_DATA[posInfoIndex].time) /
                    (ScoreParser.CURSOR_DATA[posInfoIndex + 1].time - ScoreParser.CURSOR_DATA[posInfoIndex].time)) *
                    (ScoreParser.CURSOR_DATA[posInfoIndex + 1].x - ScoreParser.CURSOR_DATA[posInfoIndex].x);
            const lerp_y =
                ScoreParser.CURSOR_DATA[posInfoIndex].y +
                ((timestamp - ScoreParser.CURSOR_DATA[posInfoIndex].time) /
                    (ScoreParser.CURSOR_DATA[posInfoIndex + 1].time - ScoreParser.CURSOR_DATA[posInfoIndex].time)) *
                    (ScoreParser.CURSOR_DATA[posInfoIndex + 1].y - ScoreParser.CURSOR_DATA[posInfoIndex].y);

            if (posInfoIndex !== -1) {
                // Game.CURSOR.x = Game.OFFSET_X + lerp_x * (Game.WIDTH / 512);
                // Game.CURSOR.y = Game.OFFSET_Y + lerp_y * (Game.WIDTH / 512);

                Game.CURSOR.update(posInfoIndex, lerp_x, lerp_y);
            }
        }

        ObjectsController.requestID = window.requestAnimationFrame((currentTime) => {
            if (beatmapFile.audioNode !== undefined && beatmapFile !== undefined) {
                const currentAudioTime = beatmapFile.audioNode.getCurrentTime();
                const timestampNext = currentAudioTime;
                this.lastTimestamp = timestamp;

                return this.draw(timestampNext);
            }
        });
    }

    reinitializeAllSliders() {
        const start = performance.now();
        this.objectsList.forEach((o) => {
            if (o.obj instanceof Slider) o.obj.reInitialize();
        });
        console.log(`ReInitialize all sliders took: ${performance.now() - start}ms`);
    }

    render() {
        ObjectsController.requestID = window.requestAnimationFrame((currentTime) => {
            const currentAudioTime = beatmapFile.audioNode.getCurrentTime();
            const timestamp = currentAudioTime;
            return this.draw(timestamp);
        });
    }
}
