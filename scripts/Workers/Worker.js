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

class Timer {
    static isPlaying = false;
    static currentTime = 1;
    static absStartTime = 0;
    static lastTime = 0;
    static playbackRate = 1;

    static objects = [];
    static filtered = [];
    static fpBoundary = [];
    static filteredTimeline = [];

    static range = 0;

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

    static _renderStart = 0;
    static _lastRenderTime = 0;
    static _msQueue = [];

    static getCurrentTime() {
        if (!this.isPlaying) return this.currentTime + (Timer.mods.DT ? -40 : 0);
        return this.currentTime + (performance.now() - this.absStartTime) * Timer.playbackRate + (Timer.mods.DT ? -40 : 0);
    }

    static getObjects() {
        const currentTime = this.getCurrentTime();
        const currentPreempt = this.moddedStats.preempt;

        const compareFunc = (element, value) => {
            if (element.endTime < value - Timer.range) return -1;
            if (element.time > value + Timer.range) return 1;
            return 0;
        };

        const drawList = [];
        const fpBoundary = [];

        const foundIndex = binarySearch(this.objects, currentTime, compareFunc);
        if (foundIndex !== -1) {
            let start = foundIndex - 1;
            let end = foundIndex + 1;

            while (start >= 0 && compareFunc(this.objects[start], currentTime) === 0) {
                drawList.push(this.objects[start]);
                fpBoundary.push(this.objects[start]);
                start--;
            }

            drawList.reverse();
            drawList.push(this.objects[foundIndex]);

            while (end <= this.objects.length - 1 && compareFunc(this.objects[end], currentTime) === 0) {
                drawList.push(this.objects[end]);
                fpBoundary.push(this.objects[end]);
                end++;
            }

            drawList.reverse();

            if (start >= 0) {
                fpBoundary.push(this.objects[start]);
            }

            if (end <= this.objects.length - 1) {
                fpBoundary.push(this.objects[end]);
            }
        }

        const removed = [];
        this.filteredTimeline.forEach((object) => {
            if (drawList.length > 0) {
                const firstObj = drawList.at(-1);
                const lastObj = drawList.at(0);

                if (object.time <= lastObj.time && object.time >= firstObj.time) return;
            }
            removed.push(object);
        });

        const addTop = [];
        const addBack = [];
        if (this.filteredTimeline.length > 0) {
            drawList.forEach((object) => {
                if (object.time > this.filteredTimeline.at(0).time) addBack.push(object);
                if (object.time < this.filteredTimeline.at(-1).time) addTop.push(object);
            });
        } else {
            addTop.push(...drawList);
        }

        this.filteredTimeline = [...drawList];

        const drawListPlayfield = drawList.filter((object) => object.killTime + 800 >= currentTime && object.time - currentPreempt <= currentTime);
        const removedPlayfield = [];
        this.filtered.forEach((object) => {
            if (drawListPlayfield.length > 0) {
                const firstObj = drawListPlayfield.at(-1);
                const lastObj = drawListPlayfield.at(0);

                if (object.time <= lastObj.time && object.time >= firstObj.time) return;
            }
            removedPlayfield.push(object);
        });

        const addTopPlayfield = [];
        const addBackPlayfield = [];

        if (this.filtered.length > 0) {
            drawListPlayfield.forEach((object) => {
                if (object.time > this.filtered.at(0).time) addBackPlayfield.push(object);
                if (object.time < this.filtered.at(-1).time) addTopPlayfield.push(object);
            });
        } else {
            addTopPlayfield.push(...drawListPlayfield);
        }

        this.filtered = [...drawListPlayfield];

        const removedFp = [];
        this.fpBoundary.forEach((object) => {
            if (fpBoundary.find((o) => object.idx === o.idx || drawListPlayfield.find((o) => object.idx === o.idx))) return;
            removedFp.push(object);
        });

        const addedFp = fpBoundary.filter((object) => !this.fpBoundary.some((o) => o.idx === object.idx));
        this.fpBoundary = fpBoundary;

        return {
            timeline: {
                removed,
                addBack,
                addTop,
                filtered: this.filteredTimeline,
            },
            playfield: {
                removed: removedPlayfield,
                addBack: addBackPlayfield,
                addTop: addTopPlayfield,
                fpBoundary,
                removedFp,
                addedFp,
                filtered: this.filtered,
            },
        };
    }

    static loop() {
        this._renderStart = performance.now();
        const deltaMs = this._renderStart - this._lastRenderTime;
        this._msQueue.push(deltaMs);

        if (this.objects.length > 0) {
            const { timeline, playfield } = this.getObjects();
            const currentTime = this.getCurrentTime();

            postMessage({
                type: "updateOrder",
                objects: {
                    ...playfield,
                    // current
                },
                timeline: {
                    ...timeline,
                },
                currentTime,
                lastTime: this.lastTime,
            });

            this.lastTime = currentTime;
        }

        if (this._msQueue.length > 100) this._msQueue.slice(-100);

        postMessage({
            type: "updateMs",
            deltaMs:
                this._msQueue.reduce((accm, curr, idx) => {
                    return accm + curr * ((idx + 1) / this._msQueue.length);
                }, 0) /
                ((1 / this._msQueue.length + 1) * (this._msQueue.length / 2)),
        });

        this._lastRenderTime = this._renderStart;
    }
}

class Slider {}

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
        Timer.objects = objects;
    }

    if (event.data.type === "updateStats") {
        const { mods, moddedStats, playbackRate } = event.data;
        Timer.mods = mods;
        Timer.moddedStats = moddedStats;
        Timer.playbackRate = playbackRate;
    }

    if (event.data.type === "clear") {
        Timer.objects = [];
        Timer.filtered = [];

        Timer.isPlaying = false;
        Timer.currentTime = 1;
        Timer.lastTime = 0;
    }

    if (event.data.type === "range") {
        const { range } = event.data;
        Timer.range = range;

        // console.log("GOT RANGED", range)
    }
};

setInterval(() => Timer.loop(), 0);
