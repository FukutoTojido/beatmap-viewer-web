const handleCanvasDrag = (e, calledFromDraw) => {
    // console.log(e);

    const x = currentX;
    const y = currentY;

    const currentTime = beatmapFile.audioNode.getCurrentTime();

    const start_X = startX;
    const start_Y = startY;

    let currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);
    const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);

    const selectedObjList = beatmapFile.beatmapRenderData.objectsController.objectsList
        .filter((o) => {
            const lowerBound = o.time - currentPreempt;
            const upperBound = sliderAppearance.hitAnim ? o.endTime + 240 : Math.max(o.time + 800, o.endTime + 240);

            return (
                (lowerBound <= Math.min(draggingStartTime, draggingEndTime) && upperBound >= Math.max(draggingStartTime, draggingEndTime)) ||
                (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime)) ||
                (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && lowerBound <= Math.max(draggingStartTime, draggingEndTime)) ||
                (upperBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime))
            );
        })
        .filter((o) => {
            // console.log(Math.min(draggingStartTime, draggingEndTime), Math.max(draggingStartTime, draggingEndTime), o.time, lowerBound, upperBound);

            const coordLowerBound = {
                x: Math.min(x, start_X),
                y: Math.min(y, start_Y),
            };

            const coordUpperBound = {
                x: Math.max(x, start_X),
                y: Math.max(y, start_Y),
            };

            if (o.obj instanceof HitCircle) {
                const positionX = o.obj.originalX + stackOffset * o.obj.stackHeight;
                const positionY = (!mods.HR ? o.obj.originalY : 384 - o.obj.originalY) + stackOffset * o.obj.stackHeight;

                // console.log(
                //     o.time,
                //     lowerBound <= currentTime,
                //     upperBound >= currentTime,
                //     { x: positionX, y: positionY },
                //     coordLowerBound,
                //     coordUpperBound
                // );

                return (
                    positionX >= coordLowerBound.x &&
                    positionX <= coordUpperBound.x &&
                    positionY >= coordLowerBound.y &&
                    positionY <= coordUpperBound.y
                );
            }

            if (o.obj instanceof Slider) {
                const renderableAngleList = o.obj.angleList;

                const res = renderableAngleList.some((point) => {
                    const positionX = point.x + stackOffset * o.obj.stackHeight;
                    const positionY = (!mods.HR ? point.y : 384 - point.y) + stackOffset * o.obj.stackHeight;

                    return (
                        positionX + stackOffset * o.obj.stackHeight >= coordLowerBound.x &&
                        positionX + stackOffset * o.obj.stackHeight <= coordUpperBound.x &&
                        positionY + stackOffset * o.obj.stackHeight >= coordLowerBound.y &&
                        positionY + stackOffset * o.obj.stackHeight <= coordUpperBound.y
                    );
                });

                // console.log(o.time, res);
                return res;
            }

            return false;
        });

    // console.log("x: " + x + " y: " + y, selectedObj);

    if (selectedObjList.length) {
        selectedHitObject = selectedObjList.map((o) => o.time);
    } else if (e && !e.ctrlKey) {
        selectedHitObject = [];
    }

    if (!calledFromDraw) beatmapFile.beatmapRenderData.objectsController.draw(currentTime, true);

    // console.log(selectedHitObject);
};

const checkCollide = (x, y, o) => {
    let currentHitCircleSize = Beatmap.moddedStats.radius * (236 / 256);
    const drawOffset = currentHitCircleSize;

    if (o.obj instanceof HitCircle) {
        const positionX = o.obj.originalX + stackOffset * o.obj.stackHeight;
        const positionY = (!mods.HR ? o.obj.originalY : 384 - o.obj.originalY) + stackOffset * o.obj.stackHeight;

        return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
    }

    if (o.obj instanceof Slider) {
        const renderableAngleList = o.obj.angleList;

        const res = renderableAngleList.some((point) => {
            const positionX = point.x + stackOffset * o.obj.stackHeight;
            const positionY = (!mods.HR ? point.y : 384 - point.y) + stackOffset * o.obj.stackHeight;

            return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
        });

        // console.log(o.time, res);
        return res;
    }

    return false;
};

// beatmapFile = new BeatmapFile(mapId);
