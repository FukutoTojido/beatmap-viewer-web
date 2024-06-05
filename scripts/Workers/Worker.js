function Clamp(val, from, to) {
    return Math.max(Math.min(val, to), from);
}

function difficultyRange(val, min, mid, max) {
    if (val > 5) return mid + ((max - mid) * (val - 5)) / 5;
    if (val < 5) return mid - ((mid - min) * (5 - val)) / 5;
    return mid;
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

    static approachRate = 5;
    static mods = {
        HR: false,
        EZ: false,
    };

    static getCurrentTime() {
        if (!this.isPlaying) return this.currentTime;
        return this.currentTime + (performance.now() - this.absStartTime) * Timer.playbackRate;
    }

    static getObjects() {
        const currentTime = this.getCurrentTime();
        const currentAR = Clamp(this.approachRate * (this.mods.HR ? 1.4 : 1) * (this.mods.EZ ? 0.5 : 1), 0, 10);
        const currentPreempt = difficultyRange(currentAR, 1800, 1200, 450);

        const compareFunc = (element, value) => {
            if (element.killTime + 800 < value) return -1;
            if (element.time - currentPreempt > value) return 1;
            return 0;
        };

        const drawList = [];
        const foundIndex = binarySearch(this.objects, currentTime, compareFunc);
        if (foundIndex !== -1) {
            let start = foundIndex - 1;
            let end = foundIndex + 1;

            while (start >= 0 && compareFunc(this.objects[start], currentTime) === 0) {
                drawList.push(this.objects[start]);
                start--;
            }

            drawList.reverse();
            drawList.push(this.objects[foundIndex]);

            while (end <= this.objects.length - 1 && compareFunc(this.objects[end], currentTime) === 0) {
                drawList.push(this.objects[end]);
                end++;
            }

            drawList.reverse();
        }

        const removed = [];
        this.filtered.forEach((object) => {
            if (drawList.length > 0) {
                const firstObj = drawList.at(-1);
                const lastObj = drawList.at(0);

                if (object.time <= lastObj.time && object.time >= firstObj.time) return;
            }
            removed.push(object);
        });

        const addTop = [];
        const addBack = [];

        if (this.filtered.length > 0) {
            drawList.forEach((object) => {
                if (object.time > this.filtered.at(0).time) addBack.push(object);
                if (object.time < this.filtered.at(-1).time) addTop.push(object);
            });
        } else {
            addTop.push(...drawList);
        }

        this.filtered = [...drawList];

        return {
            removed,
            addBack,
            addTop,
            filtered: this.filtered,
        };
    }

    static loop() {
        if (this.objects.length === 0) return;
        const objs = this.getObjects();
        const currentTime = this.getCurrentTime();

        postMessage({
            objects: {
                ...objs,
                // current
            },
            currentTime,
            lastTime: this.lastTime
        });

        this.lastTime = currentTime;
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
        Timer.objects = objects;
    }

    if (event.data.type === "updateStats") {
        const { mods, approachRate, playbackRate } = event.data;
        Timer.mods = mods;
        Timer.approachRate = approachRate;
        Timer.playbackRate = playbackRate;
    }

    if (event.data.type === "clear") {
        Timer.objects = [];
        Timer.filtered = [];
        
        Timer.isPlaying = false;
        Timer.currentTime = 1;
        Timer.lastTime = 0;
    }
};

setInterval(() => Timer.loop(), 0);
