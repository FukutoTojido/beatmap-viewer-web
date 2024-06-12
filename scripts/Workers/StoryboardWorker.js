function Clamp(val, from, to) {
    return Math.max(Math.min(val, to), from);
}

function binarySearch(list, value, compareFunc) {
    let start = 0;
    let end = list.length - 1;

    while (end >= start) {
        const mid = start + Math.floor((end - start) / 2);

        if (compareFunc(list[mid], value) === 0) return mid;

        if (compareFunc(list[mid], value) < 0) {
            start = mid + 1;
            continue;
        }

        if (compareFunc(list[mid], value) > 0) {
            end = mid - 1;
        }
    }

    return -1;
}

function binarySearchNearest(list, value, compareFunc) {
    let start = 0;
    let end = list.length - 1;
    let mid = start + Math.floor((end - start) / 2);

    while (end >= start) {
        mid = start + Math.floor((end - start) / 2);

        if (compareFunc(list[mid], value) === 0) return mid;

        if (compareFunc(list[mid], value) < 0) {
            start = mid + 1;
            continue;
        }

        if (compareFunc(list[mid], value) > 0) {
            end = mid - 1;
        }
    }

    return mid;
}

class Timer {
    static isPlaying = false;
    static _currentTime = 1;
    static absStartTime = 0;
    static lastTime = 0;
    static playbackRate = 1;

    static objectsByStart = [];
    static objectsByEnd = [];
    static filtered = [];

    static get currentTime() {
        return Timer._currentTime;
    }

    static set currentTime(val) {
        Timer._currentTime = val;
        // Timer.getObjects(true);
    }

    static moddedStats = {
        approachRate: 5,
        circleSize: 5,
        HPDrainRate: 5,
        overallDifficulty: 5,
        stackLeniency: 7,
        circleDiameter: (2 * (54.4 - 4.48 * 5) * 236) / 256,
        preempt: 1200,
        fadeIn: 800,
        sliderTickRate: 1,
        radius: 54.4 - 4.48 * 5,
        stackOffset: (-6.4 * (1 - (0.7 * (5 - 5)) / 5)) / 2,
    };

    static mods = {
        HR: false,
        EZ: false,
    };

    static getCurrentTime() {
        if (!this.isPlaying) return this.currentTime + (Timer.mods.DT ? -40 : 0);
        return this.currentTime + (performance.now() - this.absStartTime) * Timer.playbackRate + (Timer.mods.DT ? -40 : 0);
    }

    static getObjects(bySeek = false) {
        const currentTime = this.getCurrentTime();

        const compareFunc = (element, value) => {
            if (element.endTime + 100 < value) return -1;
            if (element.startTime - 100 > value) return 1;
            return 0;
        };

        const drawList = this.objectsByEnd.filter((object) => compareFunc(object, currentTime) === 0);
        // const drawSet = {};
        // const foundIndexByEnd = binarySearchNearest(this.objectsByEnd, currentTime, compareFunc);
        // const foundIndexByStart = binarySearchNearest(this.objectsByStart, currentTime, compareFunc);

        // if (foundIndexByEnd === -1 && foundIndexByStart === -1)
        //     return {
        //         removed: [],
        //         addBack: [],
        //         addTop: [],
        //         filtered: [],
        //     };

        // // if (
        // //     compareFunc(this.objectsByEnd[foundIndexByEnd], currentTime) !== 0 &&
        // //     compareFunc(this.objectsByStart[foundIndexByStart], currentTime) !== 0
        // // )
        // //     return {
        // //         removed: [],
        // //         addBack: [],
        // //         addTop: [],
        // //         filtered: [],
        // //     };

        // console.log(this.objectsByEnd, this.objectsByStart)
        // console.log(foundIndexByEnd, foundIndexByStart, this.objectsByEnd[foundIndexByEnd], this.objectsByStart[foundIndexByStart])

        // if (foundIndexByEnd !== -1) {
        //     let start = foundIndexByEnd - 1;
        //     let end = foundIndexByEnd + 1;

        //     while (start >= 0 && compareFunc(this.objectsByEnd[start], currentTime) === 0) {
        //         if (!drawSet[this.objectsByEnd[start].idx]) {
        //             drawSet[this.objectsByEnd[start].idx] = this.objectsByEnd[start];
        //         }
        //         start--;
        //     }

        //     while (end <= this.objectsByEnd[end] && compareFunc(this.objectsByEnd[end], currentTime) === 0) {
        //         if (!drawSet[this.objectsByEnd[end].idx]) {
        //             drawSet[this.objectsByEnd[end].idx] = this.objectsByEnd[end];
        //         }
        //         end++;
        //     }
        //     console.log(start, end);

        //     if (!drawSet[this.objectsByEnd[foundIndexByEnd].idx] && compareFunc(this.objectsByEnd[foundIndexByEnd], currentTime) === 0)
        //         drawSet[this.objectsByEnd[foundIndexByEnd].idx] = this.objectsByEnd[foundIndexByEnd];
        // }
        // console.log(drawSet);

        // if (foundIndexByStart !== -1) {
        //     let start = foundIndexByStart - 1;
        //     let end = foundIndexByStart + 1;

        //     while (start >= 0 && compareFunc(this.objectsByStart[start], currentTime) === 0) {
        //         if (!drawSet[this.objectsByStart[start].idx]) {
        //             drawSet[this.objectsByStart[start].idx] = this.objectsByStart[start];
        //         }
        //         start--;
        //     }

        //     while (end <= this.objectsByStart.length && compareFunc(this.objectsByStart[end], currentTime) === 0) {
        //         if (!drawSet[this.objectsByStart[end].idx]) {
        //             drawSet[this.objectsByStart[end].idx] = this.objectsByStart[end];
        //         }
        //         end++;
        //     }
        //     console.log(start, compareFunc(this.objectsByStart[start], currentTime), this.objectsByStart[start], end);

        //     if (!drawSet[this.objectsByStart[foundIndexByStart].idx] && compareFunc(this.objectsByStart[foundIndexByStart], currentTime) === 0)
        //         drawSet[this.objectsByStart[foundIndexByStart].idx] = this.objectsByStart[foundIndexByStart];
        // }
        // console.log(drawSet);

        // drawList.push(...Object.values(drawSet));
        drawList.sort((a, b) => a.idx - b.idx);

        const removed = [];
        this.filtered.forEach((object) => {
            if (drawList.length > 0) {
                if (compareFunc(object, currentTime) === 0) return;
            }
            removed.push(object);
        });

        // const addTop = [];
        // const addBack = [];

        // if (this.filtered.length > 0) {
        //     drawList.forEach((object) => {
        //         if (object.idx < this.filtered.at(0).idx) addBack.push(object);
        //         if (object.idx > this.filtered.at(-1).idx) addTop.push(object);
        //     });
        // } else {
        //     addTop.push(...drawList);
        // }

        const add = [];
        drawList.forEach((object) => {
            if (this.filtered.length > 0 && this.filtered.includes(object)) return;
            add.push(object);
        });

        // if (bySeek) console.log(removed, addTop, addBack, drawList, structuredClone(this.filtered));
        this.filtered = [...drawList];

        // if (removed.length > 0 || addTop.length > 0 || addBack.length > 0) {
        //     console.log(drawSet);
        //     console.log(foundIndexByEnd, foundIndexByStart);
        //     console.log(
        //         drawList
        //             .map((sprite) => `${sprite.texturepath} - ${sprite.startTime} - ${sprite.endTime} - ${compareFunc(sprite, currentTime)}`)
        //             .join("\n")
        //     );
        // }

        return {
            removed,
            // addTop,
            // addBack,
            add,
            filtered: this.filtered,
        };
    }

    static loop() {
        this._renderStart = performance.now();

        if (this.objectsByStart.length > 0 && this.objectsByEnd.length > 0) {
            const objs = this.getObjects();
            const currentTime = this.getCurrentTime();

            postMessage({
                type: "updateOrder",
                objects: {
                    ...objs,
                    // current
                },
                currentTime,
                lastTime: this.lastTime,
            });

            this.lastTime = currentTime;
        }
    }
}

onmessage = (event) => {
    if (event.data.type === "start") {
        Timer.isPlaying = true;
        Timer.absStartTime = performance.now();
    }

    if (event.data.type === "stop") {
        Timer.isPlaying = false;
        Timer.currentTime += (performance.now() - Timer.absStartTime) * Timer.playbackRate;
    }

    if (event.data.type === "seek") {
        const { time } = event.data;
        Timer.currentTime = time;
    }

    if (event.data.type === "objects") {
        const { objects } = event.data;
        Timer.objectsByStart = objects.toSorted((a, b) => {
            return a.startTime - b.startTime;
        });
        Timer.objectsByEnd = objects.toSorted((a, b) => {
            return a.endTime - b.endTime;
        });
        console.log(Timer.objectsByStart, Timer.objectsByEnd);
    }

    if (event.data.type === "updateStats") {
        const { mods, moddedStats, playbackRate } = event.data;
        Timer.mods = mods;
        Timer.moddedStats = moddedStats;
        Timer.playbackRate = playbackRate;
    }

    if (event.data.type === "clear") {
        Timer.objectsByStart = [];
        Timer.objectsByEnd = [];
        Timer.filtered = [];

        Timer.isPlaying = false;
        Timer.currentTime = 1;
        Timer.lastTime = 0;
    }
};

setInterval(() => Timer.loop(), 0);
