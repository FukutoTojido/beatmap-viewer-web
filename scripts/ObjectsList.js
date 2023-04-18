class ObjectsList {
    hitCirclesList;
    slidersList;
    objectsList;
    drawTime;
    coloursList;
    currentColor;
    coloursObject;
    lastTimestamp = 0;

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
        this.currentColor = 1 % coloursList.length;
        this.comboIdx = 1;

        if (coloursList.length !== 0) {
            hitCircleArr = [];
            coloursList.forEach((colour, idx) => {
                document.querySelector("#hitCircleColor").style.backgroundColor = colour;
                const base64_hitCircle = window.btoa(new XMLSerializer().serializeToString(sampleHitCircle));
                const hitCircleImgData = `data:image/svg+xml;base64,${base64_hitCircle}`;
                const hitCircleImg = new Image();
                hitCircleImg.src = hitCircleImgData;

                document.querySelector("#approachCircleColor").style.backgroundColor = colour;
                const base64_approachCircle = window.btoa(new XMLSerializer().serializeToString(sampleApproachCircle));
                const approachCircleImgData = `data:image/svg+xml;base64,${base64_approachCircle}`;
                const approachCircleImg = new Image();
                approachCircleImg.src = approachCircleImgData;

                hitCircleArr[idx] = hitCircleImg;
                approachCircleArr[idx] = approachCircleImg;
            });
        }

        this.objectsList = this.objectsList.map((object, idx) => {
            if (object.obj.isNewCombo && idx !== 0) {
                this.currentColor = (this.currentColor + 1) % coloursList.length;
                this.comboIdx = 1;
            }
            return {
                ...object,
                comboIdx: this.comboIdx++,
                colour: coloursList[this.currentColor],
                colourIdx: this.currentColor,
            };
        });
    }

    draw(timestamp, staticDraw) {
        // console.log(timestamp);
        if (isDragging) {
            draggingEndTime = beatmapFile.audioNode.getCurrentTime();
            handleCanvasDrag();
        }

        updateTime(timestamp);
        timestamp += HARD_OFFSET + SOFT_OFFSET;

        // if (!staticDraw) setAudioTime();
        setSliderTime();

        // if (parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) !== oldPlayerContainerWidth) {
        //     oldPlayerContainerWidth = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
        //     canvas.width =
        //         (1080 * parseInt(getComputedStyle(document.querySelector("#playerContainer")).width)) /
        //         parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
        // }

        // if (parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) !== oldPlayerContainerHeight) {
        //     oldPlayerContainerHeight = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
        //     canvas.height = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * window.devicePixelRatio;
        // }

        const currentScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);

        let currentAR = !mods.EZ ? approachRate : approachRate / 2;
        currentAR = !mods.HR ? currentAR : Math.min((currentAR * 4) / 3, 10);
        const currentPreempt = currentAR < 5 ? 1200 + (600 * (5 - currentAR)) / 5 : currentAR > 5 ? 1200 - (750 * (currentAR - 5)) / 5 : 1200;
        const currentFadeIn = currentAR < 5 ? 800 + (400 * (5 - currentAR)) / 5 : currentAR > 5 ? 800 - (500 * (currentAR - 5)) / 5 : 800;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.objectsList
            .filter(
                (object) =>
                    object.time - currentPreempt < timestamp &&
                    (sliderAppearance.hitAnim ? object.obj.endTime : Math.max(object.time + 800, object.obj.endTime)) > timestamp
            )
            .reverse()
            .forEach((object) => {
                const objStartTime = object.time - currentPreempt;
                if (timestamp >= objStartTime) {
                    const opacity =
                        timestamp < object.time
                            ? (timestamp - objStartTime) / currentFadeIn
                            : Math.min((timestamp - (object.obj.endTime - 240)) / 240 - 1, -0.0001);

                    // console.log(object.time, timestamp, timestamp < object.time);

                    object.obj.draw(
                        timestamp,
                        opacity,
                        (timestamp - object.time) / (object.obj.endTime - 240 - object.time),
                        1 - (timestamp - object.time) / 240,
                        (timestamp - objStartTime) / currentPreempt,
                        object.colour,
                        object.colourIdx,
                        object.comboIdx,
                        currentScaleFactor
                    );

                    if (timestamp - this.lastTimestamp >= 2) {
                        if (object.hitsounds.sliderHead === false || object.hitsounds.sliderTail === false) {
                            if (timestamp >= object.time && this.lastTimestamp < object.time && !staticDraw) {
                                // console.log(object.time, timestamp, this.lastTimestamp);
                                object.hitsounds.play();
                            }
                        } else {
                            if (timestamp >= object.time && this.lastTimestamp < object.time && !staticDraw) {
                                // console.log(object.time, timestamp, this.lastTimestamp);
                                object.hitsounds.sliderHead.play();
                            }

                            if (timestamp >= object.obj.endTime - 240 && this.lastTimestamp < object.obj.endTime - 240 && !staticDraw) {
                                // console.log(object.time, timestamp, this.lastTimestamp);
                                object.hitsounds.sliderTail.play();
                            }
                        }
                    }
                }
            });

        this.objectsList
            .filter((object) => selectedHitObject.includes(object.time))
            .reverse()
            .forEach((object) => {
                object.obj.drawSelected();
            });

        if (isPlaying && playingFlag && !staticDraw && beatmapFile.audioNode.isPlaying)
            window.requestAnimationFrame((currentTime) => {
                // if (!document.querySelector("audio")) return;
                // const currentAudioTime = document.querySelector("audio").currentTime * 1000;
                // const currentAudioTime = currentTime - this.drawTime;
                if (beatmapFile.audioNode !== undefined && beatmapFile !== undefined) {
                    const currentAudioTime = beatmapFile.audioNode.getCurrentTime();
                    const timestampNext = currentAudioTime;
                    this.lastTimestamp = timestamp;
                    return this.draw(timestampNext);
                }

                // console.log(timestamp);
            });
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
