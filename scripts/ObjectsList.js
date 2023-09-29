class ObjectsList {
    hitCirclesList;
    slidersList;
    objectsList;
    drawTime;
    coloursList;
    breakPeriods;
    currentColor;
    coloursObject;
    lastTimestamp = 0;
    lastTime = 0;
    fpsArr = [];
    tempW = w;
    tempH = h;

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
        // this.objectsList = this.slidersList;
        this.currentColor = 1 % (coloursList.length);
        this.comboIdx = 1;

        this.objectsList = this.objectsList.map((object, idx) => {
            if (object.obj.isNewCombo && idx !== 0) {
                this.currentColor = (this.currentColor + 1) % (coloursList.length);
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
            };
        });

        this.breakPeriods = breakPeriods;
    }

    draw(timestamp, staticDraw) {
        const DTMultiplier = !mods.DT ? 1 : 1.5;
        const HTMultiplier = !mods.HT ? 1 : 0.75;

        this.fpsArr.push(Math.max(0, timestamp - this.lastTimestamp));
        if (this.fpsArr.length > 100) {
            this.fpsArr = this.fpsArr.slice(this.fpsArr.length - 100);
        }

        fpsSprite.text = `${Math.round(
            (1000 / (this.fpsArr.reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0) / this.fpsArr.length)) * DTMultiplier * HTMultiplier
        )}fps\n${(
            this.fpsArr.reduce((prev, curr) => parseFloat(prev) + parseFloat(curr), 0) /
            this.fpsArr.length /
            (DTMultiplier * HTMultiplier)
        ).toFixed(2)}ms`;
        this.lastTime = performance.now();

        if (this.tempW !== w || this.tempH !== h) {
            this.tempW = w;
            this.tempH = h;

            generateSprites(Beatmap.stats.circleDiameter);
        }
        if (didMove && currentX !== -1 && currentY !== -1) {
            draggingEndTime = beatmapFile.audioNode.getCurrentTime();
            handleCanvasDrag(false, true);
        }

        updateTime(timestamp);
        setSliderTime();

        const currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);
        const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);

        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        const filtered = this.objectsList
            .filter(
                (object) =>
                    object.time - currentPreempt < timestamp &&
                    (sliderAppearance.hitAnim ? object.obj.endTime : Math.max(object.time + 800, object.obj.endTime)) > timestamp
            )
            .reverse();

        const selected = this.objectsList.filter((object) => selectedHitObject.includes(object.time)).reverse();
        const noSelected = this.objectsList.filter((object) => !selectedHitObject.includes(object.time)).reverse();

        const approachCircleList = filtered.map((o) => {
            if (o.obj instanceof HitCircle) return o.obj.approachCircleObj;
            if (o.obj instanceof Slider) return o.obj.hitCircle.approachCircleObj;
        });

        const noRender = this.objectsList.filter(
            (object) =>
                !(
                    object.time - currentPreempt < timestamp &&
                    (sliderAppearance.hitAnim ? object.obj.endTime : Math.max(object.time + 800, object.obj.endTime)) > timestamp
                )
        );

        const noRenderApproachCircleList = noRender.map((o) => {
            if (o.obj instanceof HitCircle) return o.obj.approachCircleObj;
            if (o.obj instanceof Slider) return o.obj.hitCircle.approachCircleObj;
        });

        addToContainer(
            filtered
                .map((o) => o.obj)
                .concat(approachCircleList)
                .concat(
                    selected.map((o) => {
                        return {
                            obj: o.obj.selected,
                        };
                    })
                )
                .concat(
                    selected
                        .filter((o) => o.obj instanceof Slider)
                        .map((o) => {
                            return {
                                obj: o.obj.hitCircle.selected,
                            };
                        })
                )
                .filter((o) => o)
        );

        removeFromContainer(
            noRender
                .map((o) => o.obj)
                .concat(noRenderApproachCircleList)
                .concat(
                    noSelected.map((o) => {
                        return {
                            obj: o.obj.selected,
                        };
                    })
                )
                .concat(
                    noSelected
                        .filter((o) => o.obj instanceof Slider)
                        .map((o) => {
                            return {
                                obj: o.obj.hitCircle.selected,
                            };
                        })
                )
                .filter((o) => o)
        );

        // console.log(filtered);

        if (this.breakPeriods.some((period) => period[0] < timestamp && period[1] > timestamp)) {
            document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${document.querySelector("#dim").value * 0.7})`;
        } else {
            document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${document.querySelector("#dim").value})`;
        }

        filtered.forEach((object) => {
            const objStartTime = object.time - currentPreempt;

            if (timestamp >= objStartTime) {
                object.obj.draw(timestamp);

                if (timestamp - this.lastTimestamp >= 2) {
                    if (object.obj instanceof HitCircle) {
                        if (timestamp >= object.obj.hitTime && this.lastTimestamp < object.obj.hitTime && !staticDraw) {
                            // console.log(object.time, timestamp, this.lastTimestamp);
                            object.hitsounds.play();
                        }
                    }

                    if (object.obj instanceof Slider) {
                        if (timestamp >= object.obj.hitTime && this.lastTimestamp < object.obj.hitTime && !staticDraw) {
                            // console.log(object.time, timestamp, this.lastTimestamp);
                            object.hitsounds.sliderHead.play();
                        }

                        if (timestamp >= object.obj.endTime - 240 && this.lastTimestamp < object.obj.endTime - 240 && !staticDraw) {
                            // console.log(object.time, timestamp, this.lastTimestamp);
                            object.hitsounds.sliderTail.play();
                        }

                        if (object.hitsounds.sliderReverse.length > 0) {
                            const currentOffsetFromStart = timestamp - object.time;
                            const lastOffsetFromStart = this.lastTimestamp - object.time;
                            const totalLength = object.endTime - object.time;

                            const currentRepeatIdx = Math.floor((currentOffsetFromStart / totalLength) * object.obj.repeat);
                            const lastRepeatIdx = Math.floor((lastOffsetFromStart / totalLength) * object.obj.repeat);

                            if (currentRepeatIdx > lastRepeatIdx && currentRepeatIdx < object.obj.repeat && currentRepeatIdx >= 1 && !staticDraw) {
                                object.hitsounds.sliderReverse[currentRepeatIdx - 1].play();
                            }
                        }
                    }

                    if (object.obj instanceof Spinner) {
                        if (timestamp >= object.endTime && this.lastTimestamp < object.endTime && !staticDraw) {
                            // console.log(object.time, timestamp, this.lastTimestamp);
                            object.hitsounds.play();
                        }
                    }
                }
            }

            selected.forEach((o) => {
                o.obj.drawSelected();
                if (o.obj instanceof Slider) o.obj.hitCircle.drawSelected(o.obj.stackHeight);
            });
            // if (selectedHitObject.includes(object.time)) object.obj.drawSelected();
        });

        if (isPlaying && playingFlag && !staticDraw && beatmapFile.audioNode.isPlaying) {
            if (beatmapFile.audioNode.getCurrentTime() > beatmapFile.audioNode.buf.duration * 1000) {
                if (playingFlag) {
                    playToggle();
                    beatmapFile.audioNode.play(beatmapFile.audioNode.getCurrentTime());
                }
            }
            window.requestAnimationFrame((currentTime) => {
                // if (!document.querySelector("audio")) return;
                // const currentAudioTime = document.querySelector("audio").currentTime * 1000;
                // const currentAudioTime = currentTime - this.drawTime;
                if (beatmapFile.audioNode !== undefined && beatmapFile !== undefined) {
                    const currentAudioTime = beatmapFile.audioNode.getCurrentTime();
                    const timestampNext = currentAudioTime;
                    this.lastTimestamp = timestamp;

                    // console.log(timestampNext - timestamp);
                    return this.draw(timestampNext);
                }

                // console.log(timestamp);
            });
        } else {
            this.fpsArr = [];
            fpsSprite.text = `0fps\nInfinite ms`;
        }
    }

    reinitializeAllSliders() {
        const start = performance.now()
        this.objectsList.forEach((o) => {
            if (o.obj instanceof Slider)
                o.obj.reInitialize()
        })
        console.log(`ReInitialize all sliders took: ${performance.now() - start}ms`)
    }

    render() {
        this.drawTime = new Date().getTime() - originalTime;
        window.requestAnimationFrame((currentTime) => {
            // const currentAudioTime = document.querySelector("audio").currentTime * 1000;
            // const currentAudioTime = currentTime - this.drawTime;
            const currentAudioTime = beatmapFile.audioNode.getCurrentTime();
            const timestamp = currentAudioTime;
            return this.draw(timestamp);
        });
    }
}
