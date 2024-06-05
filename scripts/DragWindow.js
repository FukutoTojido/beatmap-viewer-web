import { Game } from "./Game.js";
import { Beatmap } from "./Beatmap.js";
import { HitCircle } from "./HitObjects/HitCircle.js";
import { Slider } from "./HitObjects/Slider.js";
import { Clamp } from "./Utils.js";

export const handleCanvasDrag = (e, calledFromDraw) => {
    // console.log(e);

    const x = Game.CURRENT_X;
    const y = Game.CURRENT_Y;

    const currentTime = Game.BEATMAP_FILE.audioNode.getCurrentTime();

    const start_X = Game.START_X;
    const start_Y = Game.START_Y;

    let currentAR = Clamp(Beatmap.stats.approachRate * (Game.MODS.HR ? 1.4 : 1) * (Game.MODS.EZ ? 0.5 : 1), 0, 10);
    const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);

    const selectedObjList = Game.BEATMAP_FILE.beatmapRenderData.objectsController.objectsList
        .filter((o) => {
            const lowerBound = o.obj.time - currentPreempt;
            const upperBound = Game.SLIDER_APPEARANCE.hitAnim ? o.obj.killTime : Math.max(o.obj.time + 800, o.obj.killTime);

            return (
                (lowerBound <= Math.min(Game.DRAGGING_START, Game.DRAGGING_END) && upperBound >= Math.max(Game.DRAGGING_START, Game.DRAGGING_END)) ||
                (lowerBound >= Math.min(Game.DRAGGING_START, Game.DRAGGING_END) && upperBound <= Math.max(Game.DRAGGING_START, Game.DRAGGING_END)) ||
                (lowerBound >= Math.min(Game.DRAGGING_START, Game.DRAGGING_END) && lowerBound <= Math.max(Game.DRAGGING_START, Game.DRAGGING_END)) ||
                (upperBound >= Math.min(Game.DRAGGING_START, Game.DRAGGING_END) && upperBound <= Math.max(Game.DRAGGING_START, Game.DRAGGING_END))
            );
        })
        .filter((o) => {
            const coordLowerBound = {
                x: Math.min(x, start_X),
                y: Math.min(y, start_Y),
            };

            const coordUpperBound = {
                x: Math.max(x, start_X),
                y: Math.max(y, start_Y),
            };

            if (o.obj instanceof HitCircle) {
                const positionX = o.obj.originalX + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;
                const positionY = (!Game.MODS.HR ? o.obj.originalY : 384 - o.obj.originalY) + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;

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
                    const positionX = point.x + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;
                    const positionY = (!Game.MODS.HR ? point.y : 384 - point.y) + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;

                    return (
                        positionX + Beatmap.moddedStats.stackOffset * o.obj.stackHeight >= coordLowerBound.x &&
                        positionX + Beatmap.moddedStats.stackOffset * o.obj.stackHeight <= coordUpperBound.x &&
                        positionY + Beatmap.moddedStats.stackOffset * o.obj.stackHeight >= coordLowerBound.y &&
                        positionY + Beatmap.moddedStats.stackOffset * o.obj.stackHeight <= coordUpperBound.y
                    );
                });

                // console.log(o.time, res);
                return res;
            }

            return false;
        });

    if (selectedObjList.length) {
        Game.SELECTED = selectedObjList.map((o) => o.obj.time);
    } else if (e && !e.ctrlKey) {
        Game.SELECTED = [];
    }
};

export const checkCollide = (x, y, objMeta) => {
    let currentHitCircleSize = Beatmap.moddedStats.radius * (236 / 256);
    const drawOffset = currentHitCircleSize;

    const o = Game.BEATMAP_FILE.beatmapRenderData.objectsController.objectsList[objMeta.idx];

    if (o.obj instanceof HitCircle) {
        const positionX = o.obj.originalX + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;
        const positionY = (!Game.MODS.HR ? o.obj.originalY : 384 - o.obj.originalY) + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;

        return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
    }

    if (o.obj instanceof Slider) {
        const renderableAngleList = o.obj.angleList;

        const res = renderableAngleList.some((point) => {
            const positionX = point.x + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;
            const positionY = (!Game.MODS.HR ? point.y : 384 - point.y) + Beatmap.moddedStats.stackOffset * o.obj.stackHeight;

            return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
        });

        // console.log(o.time, res);
        return res;
    }

    return false;
};
