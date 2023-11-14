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
    const HRMultiplier = !mods.HR ? 1 : 4 / 3;
    const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
    let currentHitCircleSize = 54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier;
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

Game.GRID.interactive = true;
Game.GRID.on("click", (e) => {
    if (!beatmapFile || !beatmapFile.isLoaded) return;

    const currentTime = beatmapFile.audioNode.getCurrentTime();

    // console.log(isDragging);

    let { x, y } = Game.CONTAINER.toLocal(e.global);
    x /= Game.WIDTH / 512;
    y /= Game.WIDTH / 512;

    const selectedObjList = beatmapFile.beatmapRenderData.objectsController.filtered.filter((o) => checkCollide(x, y, o));

    const selectedObj = selectedObjList.length
        ? selectedObjList.reduce((prev, curr) => {
              const prevOffset = Math.abs(prev.time - currentTime);
              const currOffset = Math.abs(curr.time - currentTime);

              return prevOffset > currOffset ? curr : prev;
          })
        : undefined;

    // console.log("x: " + x + " y: " + y, selectedObj);

    if (selectedObj) {
        if (!e.ctrlKey) selectedHitObject = [selectedObj.time];
        else {
            selectedHitObject = selectedHitObject.concat([selectedObj.time]).filter((t, idx, a) => a.indexOf(t) === idx);
        }
    } else if (!didMove) {
        selectedHitObject = [];
    }

    // console.log(selectedHitObject);
    if (!beatmapFile.audioNode.isPlaying) beatmapFile.beatmapRenderData.objectsController.draw(currentTime, true);
    didMove = false;
    // console.log("Mouse CLICK", didMove);
});

Game.GRID.on("mousedown", (e) => {
    if (!beatmapFile || !beatmapFile.isLoaded) return;

    let { x, y } = Game.CONTAINER.toLocal(e.global);
    x /= Game.WIDTH / 512;
    y /= Game.WIDTH / 512;

    isDragging = true;
    draggingStartTime = beatmapFile.audioNode.getCurrentTime();
    startX = x;
    startY = y;

    Game.DRAG_WINDOW.clear();
    Game.DRAG_WINDOW.lineStyle({
        width: 2,
        color: 0xffffff,
        alpha: 1,
        alignment: 0,
    });

    Game.DRAG_WINDOW.drawRect(x, y, 0, 0);

    Game.DRAG_WINDOW.alpha = 1;

    // console.log("Mouse DOWN");
});

Game.GRID.on("mouseup", (e) => {
    if (!beatmapFile || !beatmapFile.isLoaded) return;

    if (currentX !== -1 && currentY !== -1) {
        // console.log(selectedHitObject);
        // console.log(startX, startY, currentX, currentY);
    }
    // currentX = -1;
    // currentY = -1;
    isDragging = false;
    Game.DRAG_WINDOW.alpha = 0;
    // console.log("Mouse UP");
});

Game.GRID.on("mousemove", (e) => {
    if (!beatmapFile || !beatmapFile.isLoaded) return;

    let { x, y } = Game.CONTAINER.toLocal(e.global);
    x /= Game.WIDTH / 512;
    y /= Game.WIDTH / 512;

    if (isDragging) {
        didMove = true;
        draggingEndTime = beatmapFile.audioNode.getCurrentTime();
        currentX = x;
        currentY = y;
        // console.log("Moving");
        handleCanvasDrag(e);

        Game.DRAG_WINDOW.clear();
        Game.DRAG_WINDOW.lineStyle({
            width: 2,
            color: 0xffffff,
            alpha: 1,
            alignment: 0,
        });

        Game.DRAG_WINDOW.drawRect(
            (Math.min(startX, x) * Game.WIDTH) / 512,
            (Math.min(startY, y) * Game.WIDTH) / 512,
            (Math.abs(x - startX) * Game.WIDTH) / 512,
            (Math.abs(y - startY) * Game.WIDTH) / 512
        );
        // console.log(startX, startY, currentX, currentY);
    }

    const currentTime = beatmapFile.audioNode.getCurrentTime();
    const inRender = beatmapFile.beatmapRenderData.objectsController.filtered.filter((o) => o.obj instanceof Slider && checkCollide(x, y, o));
    const selectedSlider = inRender.reduce((selected, current) => {
        if (Math.abs(current.obj.time - currentTime) < Math.abs(selected.obj.time - currentTime)) return current;

        return selected;
    }, inRender[0] ?? null);

    beatmapFile.beatmapRenderData.objectsController.slidersList.forEach((o) => (o.obj.isHover = false));

    if (selectedSlider) selectedSlider.obj.isHover = true;

    if (!beatmapFile.audioNode.isPlaying) beatmapFile.beatmapRenderData.objectsController.draw(currentTime, true);
});
