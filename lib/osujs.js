var osuPerformance;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/core/audio/HitSampleInfo.ts":
/*!*****************************************!*\
  !*** ./src/core/audio/HitSampleInfo.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HitSampleInfo = void 0;
class HitSampleInfo {
    constructor(name, bank = null, suffix = null, volume = 0) {
        this.volume = 0;
        // name could be one of those HIT_WHISTLE, ...
        this.name = "";
        this.name = name;
        this.bank = bank;
        this.suffix = suffix;
        this.volume = volume;
    }
}
exports.HitSampleInfo = HitSampleInfo;
HitSampleInfo.HIT_WHISTLE = "hitwhistle";
HitSampleInfo.HIT_FINISH = "hitfinish";
HitSampleInfo.HIT_NORMAL = "hitnormal";
HitSampleInfo.HIT_CLAP = "hitclap";
HitSampleInfo.ALL_ADDITIONS = [HitSampleInfo.HIT_WHISTLE, HitSampleInfo.HIT_CLAP, HitSampleInfo.HIT_FINISH];


/***/ }),

/***/ "./src/core/audio/LegacySampleBank.ts":
/*!********************************************!*\
  !*** ./src/core/audio/LegacySampleBank.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LegacySampleBank = void 0;
var LegacySampleBank;
(function (LegacySampleBank) {
    LegacySampleBank[LegacySampleBank["None"] = 0] = "None";
    LegacySampleBank[LegacySampleBank["Normal"] = 1] = "Normal";
    LegacySampleBank[LegacySampleBank["Soft"] = 2] = "Soft";
    LegacySampleBank[LegacySampleBank["Drum"] = 3] = "Drum";
})(LegacySampleBank = exports.LegacySampleBank || (exports.LegacySampleBank = {}));


/***/ }),

/***/ "./src/core/beatmap/Beatmap.ts":
/*!*************************************!*\
  !*** ./src/core/beatmap/Beatmap.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mostCommonBeatLength = exports.Beatmap = void 0;
const BeatmapDifficulty_1 = __webpack_require__(/*! ./BeatmapDifficulty */ "./src/core/beatmap/BeatmapDifficulty.ts");
const index_1 = __webpack_require__(/*! ../utils/index */ "./src/core/utils/index.ts");
const Types_1 = __webpack_require__(/*! ../hitobjects/Types */ "./src/core/hitobjects/Types.ts");
const ControlPointInfo_1 = __webpack_require__(/*! ./ControlPoints/ControlPointInfo */ "./src/core/beatmap/ControlPoints/ControlPointInfo.ts");
/**
 * A built beatmap that is not supposed to be modified.
 */
class Beatmap {
    constructor(hitObjects, difficulty, appliedMods, controlPointInfo) {
        this.hitObjects = hitObjects;
        this.difficulty = difficulty;
        this.appliedMods = appliedMods;
        this.controlPointInfo = controlPointInfo;
        this.hitObjectDict = (0, index_1.normalizeHitObjects)(hitObjects);
        this.gameClockRate = (0, index_1.determineDefaultPlaybackSpeed)(appliedMods);
    }
    getHitObject(id) {
        return this.hitObjectDict[id];
    }
    // TODO: Perform some .type checks otherwise these don't make sense
    getSliderCheckPoint(id) {
        return this.hitObjectDict[id];
    }
    getSlider(id) {
        return this.hitObjectDict[id];
    }
    getHitCircle(id) {
        return this.hitObjectDict[id];
    }
    getSpinner(id) {
        return this.hitObjectDict[id];
    }
}
exports.Beatmap = Beatmap;
Beatmap.EMPTY_BEATMAP = new Beatmap([], BeatmapDifficulty_1.DEFAULT_BEATMAP_DIFFICULTY, [], new ControlPointInfo_1.ControlPointInfo());
// Utility?
const endTime = (o) => ((0, Types_1.isHitCircle)(o) ? o.hitTime : o.endTime);
function mostCommonBeatLength({ hitObjects, timingPoints, }) {
    // The last playable time in the beatmap - the last timing point extends to this time.
    // Note: This is more accurate and may present different results because osu-stable didn't have the ability to
    // calculate slider durations in this context.
    let lastTime = 0;
    if (hitObjects.length > 0)
        lastTime = endTime(hitObjects[hitObjects.length - 1]);
    else if (timingPoints.length > 0)
        lastTime = timingPoints[timingPoints.length - 1].time;
    // 1. Group the beat lengths and aggregate the durations
    const durations = new Map();
    function add(d, x) {
        d = Math.round(d * 1000) / 1000;
        const a = durations.get(d);
        if (a === undefined)
            durations.set(d, x);
        else
            durations.set(d, a + x);
    }
    for (let i = 0; i < timingPoints.length; i++) {
        const t = timingPoints[i];
        if (t.time > lastTime) {
            add(t.beatLength, 0);
        }
        else {
            // osu-stable forced the first control point to start at 0.
            // This is reproduced here to maintain compatibility around osu!mania scroll speed and song select display.
            const currentTime = i === 0 ? 0 : t.time;
            const nextTime = i + 1 === timingPoints.length ? lastTime : timingPoints[i + 1].time;
            add(t.beatLength, nextTime - currentTime);
        }
    }
    // 2. Sort by duration descendingly
    const list = [];
    for (const beatLength of durations.keys()) {
        list.push({ beatLength: beatLength, duration: durations.get(beatLength) });
    }
    list.sort((a, b) => b.duration - a.duration);
    if (list.length === 0) {
        return undefined;
    }
    else {
        return list[0].beatLength;
    }
}
exports.mostCommonBeatLength = mostCommonBeatLength;


/***/ }),

/***/ "./src/core/beatmap/BeatmapBuilder.ts":
/*!********************************************!*\
  !*** ./src/core/beatmap/BeatmapBuilder.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildBeatmap = void 0;
const HitCircle_1 = __webpack_require__(/*! ../hitobjects/HitCircle */ "./src/core/hitobjects/HitCircle.ts");
const Mods_1 = __webpack_require__(/*! ../mods/Mods */ "./src/core/mods/Mods.ts");
const StackingMod_1 = __webpack_require__(/*! ../mods/StackingMod */ "./src/core/mods/StackingMod.ts");
const SliderCheckPointGenerator_1 = __webpack_require__(/*! ../hitobjects/slider/SliderCheckPointGenerator */ "./src/core/hitobjects/slider/SliderCheckPointGenerator.ts");
const SliderPath_1 = __webpack_require__(/*! ../hitobjects/slider/SliderPath */ "./src/core/hitobjects/slider/SliderPath.ts");
const Slider_1 = __webpack_require__(/*! ../hitobjects/Slider */ "./src/core/hitobjects/Slider.ts");
const SliderCheckPoint_1 = __webpack_require__(/*! ../hitobjects/SliderCheckPoint */ "./src/core/hitobjects/SliderCheckPoint.ts");
const Beatmap_1 = __webpack_require__(/*! ./Beatmap */ "./src/core/beatmap/Beatmap.ts");
const Spinner_1 = __webpack_require__(/*! ../hitobjects/Spinner */ "./src/core/hitobjects/Spinner.ts");
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const HardRockMod_1 = __webpack_require__(/*! ../mods/HardRockMod */ "./src/core/mods/HardRockMod.ts");
function copyPosition({ x, y }) {
    return { x, y };
}
function createHitCircle(id, hitCircleSettings, controlPointInfo, beatmapDifficulty) {
    const hitCircle = new HitCircle_1.HitCircle();
    hitCircle.id = id;
    hitCircle.position = copyPosition(hitCircleSettings.position);
    hitCircle.unstackedPosition = copyPosition(hitCircleSettings.position);
    hitCircle.hitTime = hitCircleSettings.time;
    hitCircle.scale = (0, index_1.circleSizeToScale)(beatmapDifficulty.circleSize);
    hitCircle.approachDuration = (0, index_1.approachRateToApproachDuration)(beatmapDifficulty.approachRate);
    hitCircle.fadeInDuration = (0, index_1.getFadeInDuration)(beatmapDifficulty.approachRate);
    return hitCircle;
}
function createSliderCheckPoint(slider, id, descriptor) {
    const checkPoint = new SliderCheckPoint_1.SliderCheckPoint(slider);
    const { time, spanStartTime, spanIndex, spanProgress } = descriptor;
    checkPoint.id = id;
    checkPoint.offset = slider.path.positionAt(spanProgress);
    checkPoint.type = descriptor.type;
    checkPoint.hitTime = time;
    checkPoint.spanIndex = spanIndex;
    checkPoint.spanStartTime = spanStartTime;
    checkPoint.spanProgress = spanProgress;
    return checkPoint;
}
function createSliderCheckPoints(slider) {
    const checkPoints = [];
    let checkpointIndex = 0;
    for (const e of (0, SliderCheckPointGenerator_1.generateSliderCheckpoints)(slider.startTime, slider.spanDuration, slider.velocity, slider.tickDistance, slider.path.distance, slider.spanCount, slider.legacyLastTickOffset)) {
        const id = `${slider.id}/${checkpointIndex++}`;
        checkPoints.push(createSliderCheckPoint(slider, id, e));
    }
    return checkPoints;
}
function copyPathPoints(pathPoints) {
    return pathPoints.map(({ type, offset }) => ({
        type,
        offset: copyPosition(offset),
    }));
}
function createSlider(index, sliderSettings, controlPointInfo, difficulty) {
    const approachDuration = (0, index_1.approachRateToApproachDuration)(difficulty.approachRate);
    const fadeInDuration = (0, index_1.getFadeInDuration)(difficulty.approachRate);
    const scale = (0, index_1.circleSizeToScale)(difficulty.circleSize);
    const hitTime = sliderSettings.time;
    const timingPoint = controlPointInfo.timingPointAt(hitTime);
    const difficultyPoint = controlPointInfo.difficultyPointAt(hitTime);
    const scoringDistance = Slider_1.Slider.BASE_SCORING_DISTANCE * difficulty.sliderMultiplier * difficultyPoint.speedMultiplier;
    const sliderId = index.toString();
    const head = new HitCircle_1.HitCircle();
    head.id = `${index.toString()}/HEAD`;
    head.unstackedPosition = copyPosition(sliderSettings.position);
    head.position = copyPosition(sliderSettings.position);
    head.hitTime = sliderSettings.time;
    head.approachDuration = approachDuration;
    head.scale = scale;
    head.sliderId = sliderId;
    const slider = new Slider_1.Slider(head);
    slider.id = sliderId;
    slider.repeatCount = sliderSettings.repeatCount;
    slider.legacyLastTickOffset = sliderSettings.legacyLastTickOffset;
    slider.velocity = scoringDistance / timingPoint.beatLength;
    slider.tickDistance = (scoringDistance / difficulty.sliderTickRate) * sliderSettings.tickDistanceMultiplier;
    slider.path = new SliderPath_1.SliderPath(copyPathPoints(sliderSettings.pathPoints), sliderSettings.length);
    slider.checkPoints = createSliderCheckPoints(slider);
    return slider;
}
function createSpinner(id, settings, controlPointInfo, difficulty) {
    const spinner = new Spinner_1.Spinner();
    spinner.id = id;
    spinner.startTime = settings.time;
    spinner.duration = settings.duration;
    return spinner;
}
function createStaticHitObject(index, hitObjectSetting, controlPointInfo, beatmapDifficulty) {
    switch (hitObjectSetting.type) {
        case "HIT_CIRCLE":
            return createHitCircle(index.toString(), hitObjectSetting, controlPointInfo, beatmapDifficulty);
        case "SLIDER":
            return createSlider(index, hitObjectSetting, controlPointInfo, beatmapDifficulty);
        case "SPINNER":
            return createSpinner(index.toString(), hitObjectSetting, controlPointInfo, beatmapDifficulty);
    }
    throw new Error("Type not recognized...");
}
// Mutates the hitObject combo index values
function assignComboIndex(bluePrintSettings, hitObjects) {
    let comboSetIndex = -1, withinSetIndex = 0;
    for (let i = 0; i < hitObjects.length; i++) {
        const { newCombo, comboSkip, type } = bluePrintSettings[i];
        const hitObject = hitObjects[i]; // change 'const' -> 'let' for better readability
        if (i === 0 || newCombo || type === "SPINNER") {
            comboSetIndex += comboSkip + 1;
            withinSetIndex = 0;
        }
        // Spinners do not have comboSetIndex or withinComboSetIndex
        if (hitObject instanceof HitCircle_1.HitCircle) {
            hitObject.comboSetIndex = comboSetIndex;
            hitObject.withinComboSetIndex = withinSetIndex++;
        }
        else if (hitObject instanceof Slider_1.Slider) {
            hitObject.head.comboSetIndex = comboSetIndex;
            hitObject.head.withinComboSetIndex = withinSetIndex++;
        }
    }
}
// There should only be one, otherwise ...
function findDifficultyApplier(mods) {
    for (const m of mods) {
        const adjuster = Mods_1.ModSettings[m].difficultyAdjuster;
        if (adjuster !== undefined) {
            return adjuster;
        }
    }
    return (d) => d; // The identity function
}
const defaultBeatmapBuilderOptions = {
    addStacking: true,
    mods: [],
};
/**
 * Builds the beatmap from the given blueprint and options.
 *
 * It DOES not perform a check on the given subset of mods. So if you enter half-time and double time at the same time,
 * then this might return bad results.
 *
 * @param {Blueprint} bluePrint
 * @param {Object} options
 * @param {boolean} options.addStacking whether to apply setting or not (by default true)
 */
function buildBeatmap(bluePrint, options) {
    const { beatmapVersion, stackLeniency } = bluePrint.blueprintInfo;
    const { mods, addStacking } = Object.assign(Object.assign({}, defaultBeatmapBuilderOptions), options);
    const finalDifficulty = findDifficultyApplier(mods)(bluePrint.defaultDifficulty);
    const hitObjects = bluePrint.hitObjectSettings.map((setting, index) => createStaticHitObject(index, setting, bluePrint.controlPointInfo, finalDifficulty));
    assignComboIndex(bluePrint.hitObjectSettings, hitObjects);
    if (mods.includes("HARD_ROCK")) {
        HardRockMod_1.HardRockMod.flipVertically(hitObjects);
    }
    if (addStacking) {
        (0, StackingMod_1.modifyStackingPosition)(hitObjects, stackLeniency, beatmapVersion);
    }
    return new Beatmap_1.Beatmap(hitObjects, finalDifficulty, mods, bluePrint.controlPointInfo);
}
exports.buildBeatmap = buildBeatmap;


/***/ }),

/***/ "./src/core/beatmap/BeatmapDifficulty.ts":
/*!***********************************************!*\
  !*** ./src/core/beatmap/BeatmapDifficulty.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_BEATMAP_DIFFICULTY = void 0;
exports.DEFAULT_BEATMAP_DIFFICULTY = Object.freeze({
    drainRate: 5,
    circleSize: 5,
    overallDifficulty: 5,
    // Technically speaking default value of AR is 5 because OD is 5
    // https://github.com/ppy/osu/blob/b1fcb840a9ff4d866aac262ace7f54fa88b5e0ce/osu.Game/Beatmaps/BeatmapDifficulty.cs#L35
    approachRate: 5,
    sliderMultiplier: 1,
    sliderTickRate: 1,
});


/***/ }),

/***/ "./src/core/beatmap/ControlPoints/ControlPoint.ts":
/*!********************************************************!*\
  !*** ./src/core/beatmap/ControlPoints/ControlPoint.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ControlPoint = void 0;
class ControlPoint {
    get time() {
        var _a, _b;
        return (_b = (_a = this.controlPointGroup) === null || _a === void 0 ? void 0 : _a.time) !== null && _b !== void 0 ? _b : 0;
    }
    compareTo(other) {
        return this.time - other.time;
    }
    attachGroup(pointGroup) {
        this.controlPointGroup = pointGroup;
    }
}
exports.ControlPoint = ControlPoint;


/***/ }),

/***/ "./src/core/beatmap/ControlPoints/ControlPointGroup.ts":
/*!*************************************************************!*\
  !*** ./src/core/beatmap/ControlPoints/ControlPointGroup.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ControlPointGroup = void 0;
class ControlPointGroup {
    // itemRemoved: any;
    // itemAdded: any;
    constructor(time) {
        this.time = 0;
        this.controlPoints = [];
        this.time = time;
    }
    add(point) {
        var _a, _b;
        const i = this.controlPoints.findIndex((value) => value.type === point.type);
        if (i > -1) {
            const p = this.controlPoints[i];
            this.controlPoints.splice(i, 1);
            (_a = this.controlPointInfo) === null || _a === void 0 ? void 0 : _a.groupItemRemoved(p);
        }
        point.attachGroup(this);
        this.controlPoints.push(point);
        (_b = this.controlPointInfo) === null || _b === void 0 ? void 0 : _b.groupItemAdded(point);
    }
}
exports.ControlPointGroup = ControlPointGroup;


/***/ }),

/***/ "./src/core/beatmap/ControlPoints/ControlPointInfo.ts":
/*!************************************************************!*\
  !*** ./src/core/beatmap/ControlPoints/ControlPointInfo.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ControlPointInfo = void 0;
const DifficultyControlPoint_1 = __webpack_require__(/*! ./DifficultyControlPoint */ "./src/core/beatmap/ControlPoints/DifficultyControlPoint.ts");
const TimingControlPoint_1 = __webpack_require__(/*! ./TimingControlPoint */ "./src/core/beatmap/ControlPoints/TimingControlPoint.ts");
const EffectControlPoint_1 = __webpack_require__(/*! ./EffectControlPoint */ "./src/core/beatmap/ControlPoints/EffectControlPoint.ts");
const SampleControlPoint_1 = __webpack_require__(/*! ./SampleControlPoint */ "./src/core/beatmap/ControlPoints/SampleControlPoint.ts");
const ControlPointGroup_1 = __webpack_require__(/*! ./ControlPointGroup */ "./src/core/beatmap/ControlPoints/ControlPointGroup.ts");
const index_1 = __webpack_require__(/*! ../../../math/index */ "./src/math/index.ts");
const SortedList_1 = __webpack_require__(/*! ../../utils/SortedList */ "./src/core/utils/SortedList.ts");
class ControlPointInfo {
    constructor() {
        this.difficultyPoints = new SortedList_1.SortedList();
        this.timingPoints = new SortedList_1.SortedList();
        this.effectPoints = new SortedList_1.SortedList();
        this.samplePoints = new SortedList_1.SortedList();
        // Why not use SortedList here ?
        this.groups = [];
    }
    difficultyPointAt(time) {
        return this.binarySearchWithFallback(this.difficultyPoints.list, time, DifficultyControlPoint_1.DifficultyControlPoint.DEFAULT);
    }
    samplePointAt(time) {
        return this.binarySearchWithFallback(this.samplePoints.list, time, this.samplePoints.length > 0 ? this.samplePoints.list[0] : SampleControlPoint_1.SampleControlPoint.DEFAULT);
    }
    add(time, controlPoint) {
        if (this.checkAlreadyExisting(time, controlPoint))
            return false;
        const g = this.groupAt(time, true);
        g.add(controlPoint);
        return true;
    }
    groupAt(time, addIfNotExisting = false) {
        const newGroup = new ControlPointGroup_1.ControlPointGroup(time);
        const found = this.groups.find((o) => (0, index_1.floatEqual)(o.time, time));
        if (found)
            return found;
        if (addIfNotExisting) {
            // this is a workaround for the following two uncommented lines
            newGroup.controlPointInfo = this;
            // newGroup.itemAdded = this.groupItemAdded;
            // newGroup.itemRemoved = this.groupItemRemoved;
            this.groups.push(newGroup);
            // osu!lazer they use .insert(~i) to maintain it sorted ... -> isn't this O(n^2)?
            // we sort cause lazy rn (optimize later)
            this.groups.sort((a, b) => a.time - b.time);
            return newGroup;
        }
        return null;
    }
    groupItemAdded(controlPoint) {
        switch (controlPoint.type) {
            case TimingControlPoint_1.TimingControlPoint.TYPE:
                this.timingPoints.add(controlPoint);
                break;
            case EffectControlPoint_1.EffectControlPoint.TYPE:
                this.effectPoints.add(controlPoint);
                break;
            case SampleControlPoint_1.SampleControlPoint.TYPE:
                this.samplePoints.add(controlPoint);
                break;
            case DifficultyControlPoint_1.DifficultyControlPoint.TYPE:
                this.difficultyPoints.add(controlPoint);
                break;
        }
    }
    groupItemRemoved(controlPoint) {
        switch (controlPoint.type) {
            case TimingControlPoint_1.TimingControlPoint.TYPE:
                this.timingPoints.remove(controlPoint);
                break;
            case EffectControlPoint_1.EffectControlPoint.TYPE:
                this.effectPoints.remove(controlPoint);
                break;
            case SampleControlPoint_1.SampleControlPoint.TYPE:
                this.samplePoints.remove(controlPoint);
                break;
            case DifficultyControlPoint_1.DifficultyControlPoint.TYPE:
                this.difficultyPoints.remove(controlPoint);
                break;
        }
    }
    timingPointAt(time) {
        return this.binarySearchWithFallback(this.timingPoints.list, time, this.timingPoints.length > 0 ? this.timingPoints.get(0) : TimingControlPoint_1.TimingControlPoint.DEFAULT);
    }
    effectPointAt(time) {
        return this.binarySearchWithFallback(this.effectPoints.list, time, EffectControlPoint_1.EffectControlPoint.DEFAULT);
    }
    binarySearchWithFallback(list, time, fallback) {
        const obj = this.binarySearch(list, time);
        return obj !== null && obj !== void 0 ? obj : fallback;
    }
    // Find the first element that has a time not less than the given time.
    binarySearch(list, time) {
        if (list === null)
            throw new Error("Argument null");
        if (list.length === 0 || time < list[0].time)
            return null;
        let lo = 0;
        let hi = list.length;
        // Find the first index that has a time greater than current one.
        // The previous one will then be the answer.
        while (lo < hi) {
            const mid = lo + ((hi - lo) >> 1);
            if (list[mid].time <= time)
                lo = mid + 1;
            else
                hi = mid;
        }
        return list[lo - 1];
    }
    checkAlreadyExisting(time, newPoint) {
        let existing = null;
        switch (newPoint.type) {
            case TimingControlPoint_1.TimingControlPoint.TYPE:
                existing = this.binarySearch(this.timingPoints.list, time);
                break;
            case EffectControlPoint_1.EffectControlPoint.TYPE:
                existing = this.effectPointAt(time);
                break;
            case SampleControlPoint_1.SampleControlPoint.TYPE:
                existing = this.binarySearch(this.samplePoints.list, time);
                break;
            case DifficultyControlPoint_1.DifficultyControlPoint.TYPE:
                existing = this.difficultyPointAt(time);
                break;
        }
        // TODO: in osu!lazer it's written with newPoint?.isRedundant
        return existing ? newPoint.isRedundant(existing) : false;
    }
}
exports.ControlPointInfo = ControlPointInfo;


/***/ }),

/***/ "./src/core/beatmap/ControlPoints/DifficultyControlPoint.ts":
/*!******************************************************************!*\
  !*** ./src/core/beatmap/ControlPoints/DifficultyControlPoint.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DifficultyControlPoint = void 0;
const ControlPoint_1 = __webpack_require__(/*! ./ControlPoint */ "./src/core/beatmap/ControlPoints/ControlPoint.ts");
class DifficultyControlPoint extends ControlPoint_1.ControlPoint {
    constructor() {
        super(...arguments);
        this.speedMultiplier = 1;
    }
    get type() {
        return DifficultyControlPoint.TYPE;
    }
    isRedundant(existing) {
        return false;
    }
}
exports.DifficultyControlPoint = DifficultyControlPoint;
DifficultyControlPoint.DEFAULT = new DifficultyControlPoint();
DifficultyControlPoint.TYPE = "DifficultyControlPoint";


/***/ }),

/***/ "./src/core/beatmap/ControlPoints/EffectControlPoint.ts":
/*!**************************************************************!*\
  !*** ./src/core/beatmap/ControlPoints/EffectControlPoint.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EffectControlPoint = void 0;
const ControlPoint_1 = __webpack_require__(/*! ./ControlPoint */ "./src/core/beatmap/ControlPoints/ControlPoint.ts");
class EffectControlPoint extends ControlPoint_1.ControlPoint {
    constructor() {
        super(...arguments);
        this.kiaiMode = false;
        this.omitFirstBarLine = true;
    }
    isRedundant(existing) {
        if (this.omitFirstBarLine || existing.type !== EffectControlPoint.TYPE)
            return false;
        const e = existing;
        return this.kiaiMode === e.kiaiMode && this.omitFirstBarLine === e.omitFirstBarLine;
    }
    get type() {
        return EffectControlPoint.TYPE;
    }
}
exports.EffectControlPoint = EffectControlPoint;
EffectControlPoint.TYPE = "EffectControlPoint";
EffectControlPoint.DEFAULT = new EffectControlPoint();


/***/ }),

/***/ "./src/core/beatmap/ControlPoints/SampleControlPoint.ts":
/*!**************************************************************!*\
  !*** ./src/core/beatmap/ControlPoints/SampleControlPoint.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SampleControlPoint = void 0;
const ControlPoint_1 = __webpack_require__(/*! ./ControlPoint */ "./src/core/beatmap/ControlPoints/ControlPoint.ts");
class SampleControlPoint extends ControlPoint_1.ControlPoint {
    constructor() {
        super(...arguments);
        this.sampleBank = SampleControlPoint.DEFAULT_BANK;
        this.sampleVolume = 100;
    }
    isRedundant(existing) {
        if (existing.type !== SampleControlPoint.TYPE)
            return false;
        const e = existing;
        return this.sampleBank === e.sampleBank && this.sampleVolume === e.sampleVolume;
    }
    get type() {
        return SampleControlPoint.TYPE;
    }
}
exports.SampleControlPoint = SampleControlPoint;
SampleControlPoint.TYPE = "SampleControlPoint";
SampleControlPoint.DEFAULT_BANK = "normal";
SampleControlPoint.DEFAULT = new SampleControlPoint();


/***/ }),

/***/ "./src/core/beatmap/ControlPoints/TimingControlPoint.ts":
/*!**************************************************************!*\
  !*** ./src/core/beatmap/ControlPoints/TimingControlPoint.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TimingControlPoint = void 0;
const ControlPoint_1 = __webpack_require__(/*! ./ControlPoint */ "./src/core/beatmap/ControlPoints/ControlPoint.ts");
const TimeSignatures_1 = __webpack_require__(/*! ../TimeSignatures */ "./src/core/beatmap/TimeSignatures.ts");
class TimingControlPoint extends ControlPoint_1.ControlPoint {
    constructor() {
        super(...arguments);
        this.beatLength = 1000;
        // TODO: Is this the default value?
        this.timeSignature = TimeSignatures_1.TimeSignatures.SimpleQuadruple;
    }
    // The BPM at this control point
    get BPM() {
        return 60000 / this.beatLength;
    }
    get type() {
        return TimingControlPoint.TYPE;
    }
    isRedundant(existing) {
        return false;
    }
}
exports.TimingControlPoint = TimingControlPoint;
TimingControlPoint.TYPE = "TimingControlPoint";


/***/ }),

/***/ "./src/core/beatmap/LegacyEffectFlag.ts":
/*!**********************************************!*\
  !*** ./src/core/beatmap/LegacyEffectFlag.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LegacyEffectFlags = void 0;
var LegacyEffectFlags;
(function (LegacyEffectFlags) {
    LegacyEffectFlags[LegacyEffectFlags["None"] = 0] = "None";
    LegacyEffectFlags[LegacyEffectFlags["Kiai"] = 1] = "Kiai";
    LegacyEffectFlags[LegacyEffectFlags["OmitFirstBarLine"] = 8] = "OmitFirstBarLine";
})(LegacyEffectFlags = exports.LegacyEffectFlags || (exports.LegacyEffectFlags = {}));


/***/ }),

/***/ "./src/core/beatmap/TimeSignatures.ts":
/*!********************************************!*\
  !*** ./src/core/beatmap/TimeSignatures.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TimeSignatures = void 0;
var TimeSignatures;
(function (TimeSignatures) {
    TimeSignatures[TimeSignatures["SimpleQuadruple"] = 4] = "SimpleQuadruple";
    TimeSignatures[TimeSignatures["SimpleTriple"] = 3] = "SimpleTriple";
})(TimeSignatures = exports.TimeSignatures || (exports.TimeSignatures = {}));


/***/ }),

/***/ "./src/core/blueprint/Blueprint.ts":
/*!*****************************************!*\
  !*** ./src/core/blueprint/Blueprint.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./src/core/blueprint/BlueprintParser.ts":
/*!***********************************************!*\
  !*** ./src/core/blueprint/BlueprintParser.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseBlueprint = exports.BlueprintSections = exports.parseOsuHitObjectSetting = exports.LegacyHitSampleInfo = void 0;
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const PathType_1 = __webpack_require__(/*! ../hitobjects/slider/PathType */ "./src/core/hitobjects/slider/PathType.ts");
const TimeSignatures_1 = __webpack_require__(/*! ../beatmap/TimeSignatures */ "./src/core/beatmap/TimeSignatures.ts");
const LegacyEffectFlag_1 = __webpack_require__(/*! ../beatmap/LegacyEffectFlag */ "./src/core/beatmap/LegacyEffectFlag.ts");
const TimingControlPoint_1 = __webpack_require__(/*! ../beatmap/ControlPoints/TimingControlPoint */ "./src/core/beatmap/ControlPoints/TimingControlPoint.ts");
const DifficultyControlPoint_1 = __webpack_require__(/*! ../beatmap/ControlPoints/DifficultyControlPoint */ "./src/core/beatmap/ControlPoints/DifficultyControlPoint.ts");
const EffectControlPoint_1 = __webpack_require__(/*! ../beatmap/ControlPoints/EffectControlPoint */ "./src/core/beatmap/ControlPoints/EffectControlPoint.ts");
const SampleControlPoint_1 = __webpack_require__(/*! ../beatmap/ControlPoints/SampleControlPoint */ "./src/core/beatmap/ControlPoints/SampleControlPoint.ts");
const HitSampleInfo_1 = __webpack_require__(/*! ../audio/HitSampleInfo */ "./src/core/audio/HitSampleInfo.ts");
const LegacySampleBank_1 = __webpack_require__(/*! ../audio/LegacySampleBank */ "./src/core/audio/LegacySampleBank.ts");
const ControlPointInfo_1 = __webpack_require__(/*! ../beatmap/ControlPoints/ControlPointInfo */ "./src/core/beatmap/ControlPoints/ControlPointInfo.ts");
const SECTION_REGEX = /^\s*\[(.+?)]\s*$/;
const DEFAULT_LEGACY_TICK_OFFSET = 36;
/**
 *  Will make sure that the comment at the end of line is removed
 *  Given "0, 1, 2 // <- Test"
 *  Returns "0, 1, 2"
 */
function stripComments(line) {
    const index = line.indexOf("//");
    if (index >= 0) {
        return line.substr(0, index);
    }
    else {
        return line;
    }
}
var LegacyHitObjectType;
(function (LegacyHitObjectType) {
    LegacyHitObjectType[LegacyHitObjectType["Circle"] = 1] = "Circle";
    LegacyHitObjectType[LegacyHitObjectType["Slider"] = 2] = "Slider";
    LegacyHitObjectType[LegacyHitObjectType["NewCombo"] = 4] = "NewCombo";
    LegacyHitObjectType[LegacyHitObjectType["Spinner"] = 8] = "Spinner";
    LegacyHitObjectType[LegacyHitObjectType["ComboSkip"] = 112] = "ComboSkip";
    LegacyHitObjectType[LegacyHitObjectType["Hold"] = 128] = "Hold";
})(LegacyHitObjectType || (LegacyHitObjectType = {}));
var LegacyHitSoundType;
(function (LegacyHitSoundType) {
    LegacyHitSoundType[LegacyHitSoundType["None"] = 0] = "None";
    LegacyHitSoundType[LegacyHitSoundType["Normal"] = 1] = "Normal";
    LegacyHitSoundType[LegacyHitSoundType["Whistle"] = 2] = "Whistle";
    LegacyHitSoundType[LegacyHitSoundType["Finish"] = 4] = "Finish";
    LegacyHitSoundType[LegacyHitSoundType["Clap"] = 8] = "Clap";
})(LegacyHitSoundType || (LegacyHitSoundType = {}));
class LegacyHitSampleInfo extends HitSampleInfo_1.HitSampleInfo {
    constructor(name, bank = null, volume = 0, customSampleBank = 0, isLayered = false) {
        super(name, bank, customSampleBank >= 2 ? customSampleBank.toString() : null, volume);
        this.isLayered = isLayered;
        this.customSampleBank = customSampleBank;
    }
}
exports.LegacyHitSampleInfo = LegacyHitSampleInfo;
function hasFlag(bitmask, flag) {
    return (bitmask & flag) !== 0;
}
function splitKeyVal(line, separator = ":") {
    var _a, _b;
    const split = line.split(separator, 2);
    return [split[0].trim(), (_b = (_a = split[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ""];
}
function convertPathType(value) {
    switch (value[0]) {
        // TODO: ???
        default:
        case "C":
            return PathType_1.PathType.Catmull;
        case "B":
            return PathType_1.PathType.Bezier;
        case "L":
            return PathType_1.PathType.Linear;
        case "P":
            return PathType_1.PathType.PerfectCurve;
    }
}
// ???
class LegacyDifficultyControlPoint extends DifficultyControlPoint_1.DifficultyControlPoint {
    constructor(beatLength) {
        super();
        // Note: In stable, the division occurs on floats, but with compiler optimisations turned on actually seems to
        // occur on doubles via some .NET black magic (possibly inlining?).
        this.bpmMultiplier = beatLength < 0 ? (0, index_1.clamp)(-beatLength, 10, 10000) / 100.0 : 1;
    }
}
function convertPathString(pointString, offset) {
    const pointSplit = pointString.split("|");
    const controlPoints = [];
    let startIndex = 0;
    let endIndex = 0;
    let first = true;
    while (++endIndex < pointSplit.length) {
        // Keep incrementing endIndex while it's not the start of a new segment (indicated by having a type descriptor of
        // length 1).
        if (pointSplit[endIndex].length > 1)
            continue;
        // Multi-segmented sliders DON'T contain the end point as part of the current segment as it's assumed to be the
        // start of the next segment. The start of the next segment is the index after the type descriptor.
        const endPoint = endIndex < pointSplit.length - 1 ? pointSplit[endIndex + 1] : null;
        const points = convertPoints(pointSplit.slice(startIndex, endIndex), endPoint, first, offset);
        controlPoints.push(...points);
        startIndex = endIndex;
        first = false;
    }
    if (endIndex > startIndex) {
        controlPoints.push(...convertPoints(pointSplit.slice(startIndex, endIndex), null, first, offset));
    }
    return controlPoints;
}
// reads the relative position from the given `startPos`
function readPoint(value, startPos, points, index) {
    const [x, y] = value.split(":").map(parseFloat);
    const position = index_1.Vec2.sub({ x, y }, startPos);
    points[index] = { offset: position };
}
function isLinear(p) {
    return (0, index_1.floatEqual)(0, (p[1].y - p[0].y) * (p[2].x - p[0].x) - (p[1].x - p[0].x) * (p[2].y - p[0].y));
}
function convertPoints(points, endPoint, first, offset) {
    let type = convertPathType(points[0]);
    const readOffset = first ? 1 : 0;
    const readablePoints = points.length - 1;
    const endPointLength = endPoint !== null ? 1 : 0;
    const vertices = new Array(readOffset + readablePoints + endPointLength);
    // Fill any non-read points
    for (let i = 0; i < readOffset; i++)
        vertices[i] = { offset: index_1.Vec2.Zero };
    // Parse into control points.
    for (let i = 1; i < points.length; i++)
        readPoint(points[i], offset, vertices, readOffset + i - 1);
    if (endPoint !== null)
        readPoint(endPoint, offset, vertices, vertices.length - 1);
    if (type === PathType_1.PathType.PerfectCurve) {
        if (vertices.length !== 3)
            type = PathType_1.PathType.Bezier;
        else if (isLinear(vertices.map((v) => v.offset)))
            type = PathType_1.PathType.Linear;
    }
    vertices[0].type = type;
    let startIndex = 0;
    let endIndex = 0;
    const result = [];
    // this is just some logic to not have duplicated positions at the end
    while (++endIndex < vertices.length - endPointLength) {
        if (!index_1.Vec2.equal(vertices[endIndex].offset, vertices[endIndex - 1].offset)) {
            continue;
        }
        // The last control point of each segment is not allowed to start a new implicit segment.
        if (endIndex === vertices.length - endPointLength - 1) {
            continue;
        }
        vertices[endIndex - 1].type = type;
        result.push(...vertices.slice(startIndex, endIndex));
        startIndex = endIndex + 1;
    }
    if (endIndex > startIndex) {
        result.push(...vertices.slice(startIndex, endIndex));
    }
    return result;
}
function parseOsuHitObjectSetting(line) {
    const split = line.split(",");
    // TODO: This has MAX_COORDINATE_VALUE for sanity check
    const position = { x: parseFloat(split[0]), y: parseFloat(split[1]) };
    // TODO: This has +offset (24ms) for beatmapVersion <= 4 (include in BeatmapBuilder)
    const offset = 0; //
    const time = parseFloat(split[2]) + offset;
    const _type = parseInt(split[3]); // also has combo information
    const comboSkip = (_type & LegacyHitObjectType.ComboSkip) >> 4;
    const newCombo = hasFlag(_type, LegacyHitObjectType.NewCombo);
    const typeBitmask = _type & ~LegacyHitObjectType.ComboSkip & ~LegacyHitObjectType.NewCombo;
    // TODO: samples
    const soundType = parseInt(split[4]);
    const bankInfo = {
        add: "",
        customSampleBank: 0,
        fileName: "",
        normal: "",
        volume: 0,
    };
    if (hasFlag(typeBitmask, LegacyHitObjectType.Circle)) {
        // TODO: CustomSampleBanks not supported yet
        // if (split.length > 5) readCustomSampleBanks(split[5], bankInfo);
        return {
            type: "HIT_CIRCLE",
            time,
            position,
            newCombo,
            comboSkip,
        };
    }
    if (hasFlag(typeBitmask, LegacyHitObjectType.Slider)) {
        let length;
        const slides = parseInt(split[6]);
        if (slides > 9000)
            throw new Error("Slides count is way too high");
        const repeatCount = Math.max(0, slides - 1);
        const pathPoints = convertPathString(split[5], position);
        if (split.length > 7) {
            length = Math.max(0, parseFloat(split[7]));
            if (length === 0)
                length = undefined;
        }
        return {
            type: "SLIDER",
            time,
            position,
            repeatCount,
            comboSkip,
            newCombo,
            pathPoints,
            length,
            legacyLastTickOffset: DEFAULT_LEGACY_TICK_OFFSET,
            tickDistanceMultiplier: 1,
        };
    }
    if (hasFlag(typeBitmask, LegacyHitObjectType.Spinner)) {
        const duration = Math.max(0, parseFloat(split[5]) + offset - time);
        return {
            type: "SPINNER",
            comboSkip,
            newCombo,
            time,
            position,
            duration,
        };
    }
    throw Error("Unknown type");
}
exports.parseOsuHitObjectSetting = parseOsuHitObjectSetting;
const defaultBlueprintInfo = () => ({
    audioLeadIn: 0,
    beatmapVersion: 0,
    stackLeniency: 0.7,
    onlineBeatmapId: undefined,
    metadata: {
        artist: "",
        title: "",
        titleUnicode: "",
        audioFile: "",
        artistUnicode: "",
        source: "",
        tags: "",
        previewTime: 0,
        backgroundFile: "",
        backgroundOffset: { x: 0, y: 0 },
    },
});
const defaultBlueprintDifficulty = () => ({
    circleSize: 5,
    drainRate: 5,
    overallDifficulty: 5,
    // approachRate omitted because it depends on OD
    sliderMultiplier: 1,
    sliderTickRate: 1,
});
class BlueprintParser {
    constructor(data, options = defaultOptions) {
        // Disable for testing purposes
        this.applyOffsets = true;
        this.defaultSampleVolume = 100;
        this.hitObjectSettings = [];
        this.controlPointInfo = new ControlPointInfo_1.ControlPointInfo();
        this.defaultSampleBank = LegacySampleBank_1.LegacySampleBank.None;
        this.pendingControlPoints = [];
        this.pendingControlPointTypes = {};
        this.pendingControlPointsTime = 0;
        this.data = data;
        // this.blueprint = new Blueprint();
        this.currentSection = null;
        this.formatVersion = options.formatVersion;
        this.sectionsToRead = options.sectionsToRead;
        this.blueprintInfo = defaultBlueprintInfo();
        this.blueprintDifficulty = defaultBlueprintDifficulty();
        this.sectionsFinishedReading = [];
        // BeatmapVersion 4 and lower had an incorrect offset (stable has this set as 24ms off)
        this.offset = this.formatVersion <= 4 ? 24 : 0;
        // this.hitObjectParser = new OsuHitObjectParser(this.offset, this.formatVersion);
    }
    isFinishedReading() {
        return this.sectionsToRead <= this.sectionsFinishedReading;
    }
    parseLine(line) {
        const strippedLine = stripComments(line);
        // strippedLine can be empty
        if (!strippedLine)
            return;
        // Parse the file format
        if (!this.currentSection && strippedLine.includes("osu file format v")) {
            this.blueprintInfo.beatmapVersion = parseInt(strippedLine.split("osu file format v")[1], 10);
            return;
        }
        if (SECTION_REGEX.test(strippedLine)) {
            // We only add sections we want to read to the list
            if (this.currentSection !== null && this.sectionsToRead.includes(this.currentSection)) {
                this.sectionsFinishedReading.push(this.currentSection);
            }
            this.currentSection = SECTION_REGEX.exec(strippedLine)[1];
            // It will stop when we are done with reading all required sections
            return;
        }
        // We skip reading sections we don't want to read for optimization
        if (this.currentSection === null || this.sectionsToRead.indexOf(this.currentSection) === -1) {
            return;
        }
        switch (this.currentSection) {
            case "General":
                this.handleGeneral(strippedLine);
                break;
            case "Metadata":
                this.handleMetadata(strippedLine);
                break;
            case "Difficulty":
                this.handleDifficulty(strippedLine);
                break;
            case "HitObjects":
                this.handleHitObjects(strippedLine);
                break;
            case "TimingPoints":
                this.handleTimingPoints(strippedLine);
                break;
            // Below are low priority sections
            case "Events":
                this.handleEvents(strippedLine);
                break;
            case "Editor":
                this.handleEditor(strippedLine);
                break;
            case "Colours":
                break;
        }
    }
    handleEvents(line) {
        const [eventType, _startTime, ...eventParams] = line.split(",");
        switch (eventType) {
            case "0": {
                const [filename, xOffset, yOffset] = eventParams;
                // The quotes can optionally be given ...
                this.blueprintInfo.metadata.backgroundFile = filename.replace(/"/g, "");
                this.blueprintInfo.metadata.backgroundOffset = {
                    // In case they weren't provided: 0,0 should be used according to docs.
                    x: parseInt(xOffset !== null && xOffset !== void 0 ? xOffset : "0"),
                    y: parseInt(yOffset !== null && yOffset !== void 0 ? yOffset : "0"),
                };
            }
            // Videos and Storyboard ignored for first...
        }
    }
    handleGeneral(line) {
        const [key, value] = splitKeyVal(line);
        const blueprintInfo = this.blueprintInfo;
        const metadata = blueprintInfo.metadata;
        switch (key) {
            case "AudioFilename":
                metadata.audioFile = value; // TODO: toStandardisedPath()
                break;
            case "AudioLeadIn":
                blueprintInfo.audioLeadIn = parseInt(value);
                break;
            case "PreviewTime":
                break;
            case "Countdown":
                break;
            case "SampleSet":
                this.defaultSampleBank = parseInt(value); // hopefully it is one of those 4
                break;
            case "SampleVolume":
                break;
            case "StackLeniency":
                blueprintInfo.stackLeniency = Math.fround(parseFloat(value));
                break;
            case "Mode":
                break;
            case "LetterboxInBreaks":
                break;
            case "SpecialStyle":
                break;
            case "WidescreenStoryboard":
                break;
            case "EpilepsyWarning":
                break;
        }
    }
    handleEditor(line) {
        const [key, value] = splitKeyVal(line);
        switch (key) {
            case "Bookmarks":
                break;
            case "DistanceSpacing":
                break;
            case "BeatDivisor":
                break;
            case "GridSize":
                break;
            case "TimelineZoom":
                break;
        }
    }
    handleMetadata(line) {
        const [key, value] = splitKeyVal(line);
        const blueprintInfo = this.blueprintInfo;
        const metaData = blueprintInfo.metadata;
        switch (key) {
            case "Title":
                metaData.title = value;
                break;
            case "TitleUnicode":
                metaData.titleUnicode = value;
                break;
            case "Artist":
                metaData.artist = value;
                break;
            case "ArtistUnicode":
                metaData.artistUnicode = value;
                break;
            case "Creator":
                // metaData.authorString = value;
                break;
            case "Version":
                // beatmapInfo.beatmapVersion = value;
                break;
            case "Source":
                break;
            case "Tags":
                metaData.tags = value;
                break;
            case "BeatmapId":
                break;
            case "BeatmapSetID":
                break;
        }
    }
    handleDifficulty(line) {
        const [key, value] = splitKeyVal(line);
        const difficulty = this.blueprintDifficulty;
        switch (key) {
            case "HPDrainRate":
                difficulty.drainRate = parseFloat(value);
                break;
            case "CircleSize":
                difficulty.circleSize = parseFloat(value);
                break;
            case "OverallDifficulty":
                difficulty.overallDifficulty = parseFloat(value);
                break;
            case "ApproachRate":
                difficulty.approachRate = parseFloat(value);
                break;
            case "SliderMultiplier":
                difficulty.sliderMultiplier = parseFloat(value);
                break;
            case "SliderTickRate":
                difficulty.sliderTickRate = parseFloat(value);
                break;
        }
    }
    handleHitObjects(line) {
        const obj = parseOsuHitObjectSetting(line);
        if (obj) {
            this.hitObjectSettings.push(obj);
        }
    }
    handleTimingPoints(line) {
        const split = line.split(",");
        const time = this.getOffsetTime(parseFloat(split[0].trim()));
        const beatLength = parseFloat(split[1].trim());
        const speedMultiplier = beatLength < 0 ? 100.0 / -beatLength : 1;
        let timeSignature = TimeSignatures_1.TimeSignatures.SimpleQuadruple;
        if (split.length >= 3)
            timeSignature = split[2][0] === "0" ? TimeSignatures_1.TimeSignatures.SimpleQuadruple : parseInt(split[2]);
        // TODO: sampleSet default
        let sampleSet = this.defaultSampleBank;
        if (split.length >= 4)
            sampleSet = parseInt(split[3]);
        let customSampleBank = 0;
        if (split.length >= 5)
            customSampleBank = parseInt(split[4]);
        let sampleVolume = this.defaultSampleVolume;
        if (split.length >= 6)
            sampleVolume = parseInt(split[5]);
        let timingChange = true;
        if (split.length >= 7)
            timingChange = split[6][0] === "1";
        let kiaiMode = false;
        let omitFirstBarSignature = false;
        if (split.length >= 8) {
            const effectFlags = parseInt(split[7]);
            kiaiMode = hasFlag(effectFlags, LegacyEffectFlag_1.LegacyEffectFlags.Kiai);
            omitFirstBarSignature = hasFlag(effectFlags, LegacyEffectFlag_1.LegacyEffectFlags.OmitFirstBarLine);
        }
        // This will receive the string value from the enum
        let stringSampleSet = LegacySampleBank_1.LegacySampleBank[sampleSet].toLowerCase();
        if (stringSampleSet === "none")
            stringSampleSet = "normal";
        if (timingChange) {
            const controlPoint = this.createTimingControlPoint();
            if (Number.isNaN(beatLength))
                throw Error("NaN");
            else
                controlPoint.beatLength = (0, index_1.clamp)(beatLength, MIN_BEAT_LENGTH, MAX_BEAT_LENGTH);
            controlPoint.timeSignature = timeSignature;
            this.addControlPoint(time, controlPoint, true);
        }
        {
            const p = new LegacyDifficultyControlPoint(beatLength);
            p.speedMultiplier = bindableNumberNew(speedMultiplier, { min: 0.1, max: 10, precision: 0.01 });
            this.addControlPoint(time, p, timingChange);
        }
        {
            const p = new EffectControlPoint_1.EffectControlPoint();
            p.kiaiMode = kiaiMode;
            p.omitFirstBarLine = omitFirstBarSignature;
            this.addControlPoint(time, p, timingChange);
        }
        {
            const p = new SampleControlPoint_1.SampleControlPoint();
            p.sampleBank = stringSampleSet;
            p.sampleVolume = sampleVolume;
            // TODO:  Need LegacySampleControlPoint, but this is something we support later on
            // p.customSampleBank = customSampleBank;
            this.addControlPoint(time, p, timingChange);
        }
    }
    createTimingControlPoint() {
        return new TimingControlPoint_1.TimingControlPoint();
    }
    addControlPoint(time, point, timingChange) {
        if (!(0, index_1.floatEqual)(time, this.pendingControlPointsTime)) {
            this.flushPendingPoints();
        }
        if (timingChange) {
            this.pendingControlPoints.splice(0, 0, point);
        }
        else {
            this.pendingControlPoints.push(point);
        }
        this.pendingControlPointsTime = time;
    }
    flushPendingPoints() {
        // Changes from non-timing-points are added to the end of the list (see addControlPoint()) and should override any
        // changes from timing-points (added to the start of the list).
        for (let i = this.pendingControlPoints.length - 1; i >= 0; i--) {
            const type = this.pendingControlPoints[i].type;
            if (this.pendingControlPointTypes[type])
                continue;
            this.pendingControlPointTypes[type] = true;
            this.controlPointInfo.add(this.pendingControlPointsTime, this.pendingControlPoints[i]);
        }
        this.pendingControlPoints = [];
        this.pendingControlPointTypes = {};
    }
    getOffsetTime(time) {
        return time + (this.applyOffsets ? this.offset : 0);
    }
    parse() {
        var _a;
        if (!this.data)
            throw new Error("No data given");
        const lines = this.data.split("\n").map((v) => v.trim());
        for (const line of lines) {
            try {
                this.parseLine(line);
            }
            catch (err) {
                console.error(`Failed to parse line ${line} due to: `, err);
            }
            if (this.isFinishedReading()) {
                break;
            }
        }
        this.flushPendingPoints();
        return {
            blueprintInfo: this.blueprintInfo,
            defaultDifficulty: Object.assign(Object.assign({}, this.blueprintDifficulty), { 
                // Reasoning:
                // https://github.com/ppy/osu/blob/b1fcb840a9ff4d866aac262ace7f54fa88b5e0ce/osu.Game/Beatmaps/BeatmapDifficulty.cs#L35
                approachRate: (_a = this.blueprintDifficulty.approachRate) !== null && _a !== void 0 ? _a : this.blueprintDifficulty.overallDifficulty }),
            hitObjectSettings: this.hitObjectSettings,
            controlPointInfo: this.controlPointInfo,
        };
    }
}
BlueprintParser.LATEST_VERSION = 14;
const MIN_BEAT_LENGTH = 6;
const MAX_BEAT_LENGTH = 60000;
const DEFAULT_BEAT_LENGTH = 1000;
// So precision is only used when not initializing?
// The BindableNumber has a precision value but is not used when initialized
function bindableNumberNew(val, { min, max, precision }) {
    return (0, index_1.clamp)(val, min, max);
    // return Math.round(val / precision) * precision;
}
exports.BlueprintSections = [
    "General",
    "Metadata",
    "Difficulty",
    "HitObjects",
    "TimingPoints",
    "Events",
    "Editor",
    "Colours",
];
const defaultOptions = {
    // TODO: Format version should actually be parsed
    formatVersion: BlueprintParser.LATEST_VERSION,
    sectionsToRead: exports.BlueprintSections,
};
/**
 * Parses the blueprint that is given in the legacy `.osu` format.
 * @param data the .osu file string
 * @param {BlueprintParseOptions} options config options
 * @param {BlueprintParseOptions} options.sectionsToRead list of sections that should be read
 */
function parseBlueprint(data, options) {
    const allOptions = Object.assign(Object.assign({}, defaultOptions), options);
    const parser = new BlueprintParser(data, allOptions);
    return parser.parse();
}
exports.parseBlueprint = parseBlueprint;


/***/ }),

/***/ "./src/core/blueprint/HitObjectSettings.ts":
/*!*************************************************!*\
  !*** ./src/core/blueprint/HitObjectSettings.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./src/core/gameplay/GameState.ts":
/*!****************************************!*\
  !*** ./src/core/gameplay/GameState.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cloneGameState = exports.defaultGameState = exports.NOT_PRESSING = void 0;
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
exports.NOT_PRESSING = +727727727;
const HitCircleMissReasons = [
    // When the time has expired and the circle got force killed.
    "TIME_EXPIRED",
    // There is no HIT_TOO_LATE because TIME_EXPIRED would occur earlier.
    "HIT_TOO_EARLY",
    // This is only possible in osu!lazer where clicking a later circle can cause this circle to be force missed.
    "FORCE_MISS_NOTELOCK",
    // If the user had time to press the hitCircle until time 300, but the slider is so short that it ends at 200,
    // then the user actually has a reduced hit window for hitting it.
    "SLIDER_FINISHED_FASTER",
];
const defaultGameState = () => ({
    eventIndex: 0,
    currentTime: 0,
    cursorPosition: index_1.Vec2.Zero,
    hitCircleVerdict: {},
    sliderBodyState: new Map(),
    checkPointVerdict: {},
    spinnerState: new Map(),
    sliderVerdict: {},
    clickWasUseful: false,
    // Rest are used for optimizations
    latestHitObjectIndex: 0,
    aliveHitCircleIds: new Set(),
    aliveSliderIds: new Set(),
    aliveSpinnerIds: new Set(),
    // Also used as an optimization
    judgedObjects: [],
    pressingSince: [exports.NOT_PRESSING, exports.NOT_PRESSING],
});
exports.defaultGameState = defaultGameState;
function cloneGameState(replayState) {
    const { aliveHitCircleIds, aliveSliderIds, aliveSpinnerIds, spinnerState, sliderBodyState, checkPointVerdict, hitCircleVerdict, sliderVerdict, eventIndex, clickWasUseful, currentTime, cursorPosition, latestHitObjectIndex, pressingSince, judgedObjects, } = replayState;
    return {
        eventIndex: eventIndex,
        aliveHitCircleIds: new Set(aliveHitCircleIds),
        aliveSliderIds: new Set(aliveSliderIds),
        aliveSpinnerIds: new Set(aliveSpinnerIds),
        hitCircleVerdict: Object.assign({}, hitCircleVerdict),
        sliderVerdict: Object.assign({}, sliderVerdict),
        checkPointVerdict: Object.assign({}, checkPointVerdict),
        currentTime: currentTime,
        cursorPosition: cursorPosition,
        latestHitObjectIndex: latestHitObjectIndex,
        judgedObjects: [...judgedObjects],
        clickWasUseful: clickWasUseful,
        sliderBodyState: new Map(sliderBodyState),
        spinnerState: new Map(spinnerState),
        pressingSince: pressingSince.slice(),
    };
}
exports.cloneGameState = cloneGameState;


/***/ }),

/***/ "./src/core/gameplay/GameStateEvaluator.ts":
/*!*************************************************!*\
  !*** ./src/core/gameplay/GameStateEvaluator.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.newPressingSince = exports.GameStateEvaluator = void 0;
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const GameState_1 = __webpack_require__(/*! ./GameState */ "./src/core/gameplay/GameState.ts");
const Types_1 = __webpack_require__(/*! ../hitobjects/Types */ "./src/core/hitobjects/Types.ts");
const Replay_1 = __webpack_require__(/*! ../replays/Replay */ "./src/core/replays/Replay.ts");
const Mods_1 = __webpack_require__(/*! ../mods/Mods */ "./src/core/mods/Mods.ts");
function generateEvents(beatmap, hitWindows) {
    const events = [];
    const mehHitWindow = hitWindows[2];
    const pushHitCircleEvents = (h) => {
        events.push({ time: h.hitTime - h.approachDuration, hitObjectId: h.id, type: "HIT_CIRCLE_SPAWN" });
        // TODO: In case you are allowed to press late -> +1 additional
        events.push({ time: h.hitTime + mehHitWindow + 1, hitObjectId: h.id, type: "HIT_CIRCLE_FORCE_KILL" });
    };
    for (const h of beatmap.hitObjects) {
        if ((0, Types_1.isHitCircle)(h)) {
            pushHitCircleEvents(h);
        }
        else if ((0, Types_1.isSlider)(h)) {
            pushHitCircleEvents(h.head);
            events.push({ time: h.startTime, hitObjectId: h.id, type: "SLIDER_START" });
            events.push({ time: h.endTime, hitObjectId: h.id, type: "SLIDER_END" });
            h.checkPoints.forEach((c) => {
                events.push({ time: c.hitTime, hitObjectId: c.id, type: "SLIDER_CHECK_POINT" });
            });
        }
        else if ((0, Types_1.isSpinner)(h)) {
            events.push({ time: h.startTime, hitObjectId: h.id, type: "SPINNER_START" });
            events.push({ time: h.endTime, hitObjectId: h.id, type: "SPINNER_END" });
        }
    }
    // TODO: What if 2B maps?
    events.sort((a, b) => a.time - b.time);
    return events;
}
const defaultOptions = {
    noteLockStyle: "STABLE",
    hitWindowStyle: "OSU_STABLE",
};
const HitObjectVerdicts = {
    GREAT: 0,
    OK: 1,
    MEH: 2,
    MISS: 3,
};
function isWithinHitWindow(hitWindow, delta, verdict) {
    return Math.abs(delta) <= hitWindow[HitObjectVerdicts[verdict]];
}
class GameStateEvaluator {
    constructor(beatmap, options) {
        this.beatmap = beatmap;
        this.gameState = (0, GameState_1.defaultGameState)();
        this.frame = { time: 0, position: { x: 0, y: 0 }, actions: [] };
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
        this.hitWindows = (0, index_1.hitWindowsForOD)(beatmap.difficulty.overallDifficulty, this.options.hitWindowStyle === "OSU_LAZER");
        this.events = generateEvents(beatmap, this.hitWindows);
    }
    judgeHitCircle(id, verdict) {
        this.gameState.hitCircleVerdict[id] = verdict;
        this.gameState.aliveHitCircleIds.delete(id);
        this.gameState.judgedObjects.push(id);
    }
    handleHitCircleSpawn(time, hitCircleId) {
        this.gameState.aliveHitCircleIds.add(hitCircleId);
    }
    handleHitCircleForceKill(time, hitCircleId) {
        // Already dead? The shinigami will just leave...
        if (!this.gameState.aliveHitCircleIds.has(hitCircleId)) {
            return;
        }
        // Otherwise we force kill for not being hit by the player ...
        const verdict = { judgementTime: time, type: "MISS", missReason: "TIME_EXPIRED" };
        this.judgeHitCircle(hitCircleId, verdict);
    }
    handleSliderStart(time, sliderId) {
        this.gameState.aliveSliderIds.add(sliderId);
    }
    handleSliderEnding(time, sliderId) {
        var _a;
        const slider = this.beatmap.getSlider(sliderId);
        const headVerdict = this.gameState.hitCircleVerdict[slider.head.id];
        // Clean up the head if it hasn't been interacted with the player in any way.
        if (headVerdict === undefined) {
            this.judgeHitCircle(slider.head.id, {
                judgementTime: slider.endTime,
                type: "MISS",
                missReason: "SLIDER_FINISHED_FASTER",
            });
        }
        // Now count the hit checkpoints and get the verdict
        const totalCheckpoints = slider.checkPoints.length + 1;
        let hitCheckpoints = 0;
        if (!(headVerdict === undefined || headVerdict.type === "MISS"))
            hitCheckpoints++;
        for (const c of slider.checkPoints) {
            hitCheckpoints += ((_a = this.gameState.checkPointVerdict[c.id]) === null || _a === void 0 ? void 0 : _a.hit) ? 1 : 0;
        }
        this.gameState.sliderVerdict[slider.id] = sliderVerdictBasedOnCheckpoints(totalCheckpoints, hitCheckpoints);
        this.gameState.judgedObjects.push(slider.id);
        // The head should not be alive
        this.gameState.aliveSliderIds.delete(sliderId);
        this.gameState.sliderBodyState.delete(sliderId);
    }
    predictedCursorPositionAt(time) {
        const previousTime = this.gameState.currentTime;
        const nextTime = this.frame.time;
        const previousPosition = this.gameState.cursorPosition;
        const nextPosition = this.frame.position;
        if (previousTime === nextTime)
            return previousPosition;
        const f = (time - previousTime) / (nextTime - previousTime);
        return index_1.Vec2.interpolate(previousPosition, nextPosition, f);
    }
    handleSliderCheckPoint(time, id) {
        const cursorPosition = this.predictedCursorPositionAt(time);
        const checkPoint = this.beatmap.getSliderCheckPoint(id);
        this.updateSliderBodyTracking(time, cursorPosition, this.gameState.pressingSince);
        const sliderId = checkPoint.slider.id;
        const state = this.gameState.sliderBodyState.get(sliderId);
        if (state === undefined) {
            throw Error("Somehow the slider body has no state while there is a checkpoint alive.");
        }
        this.gameState.checkPointVerdict[id] = { hit: state.isTracking };
        this.gameState.judgedObjects.push(id);
    }
    handleSpinnerStart(id) {
        this.gameState.aliveSpinnerIds.add(id);
    }
    handleSpinnerEnd(id) {
        this.gameState.aliveSpinnerIds.delete(id);
        this.gameState.judgedObjects.push(id);
    }
    handleEvent(event) {
        const { hitObjectId, time, type } = event;
        switch (type) {
            case "HIT_CIRCLE_SPAWN":
                this.handleHitCircleSpawn(time, hitObjectId);
                break;
            case "HIT_CIRCLE_FORCE_KILL":
                this.handleHitCircleForceKill(time, hitObjectId);
                break;
            case "SLIDER_START":
                this.handleSliderStart(time, hitObjectId);
                break;
            case "SLIDER_END":
                this.handleSliderEnding(time, hitObjectId);
                break;
            case "SLIDER_CHECK_POINT":
                this.handleSliderCheckPoint(time, hitObjectId);
                break;
            case "SPINNER_START":
                this.handleSpinnerStart(hitObjectId);
                break;
            case "SPINNER_END":
                this.handleSpinnerEnd(hitObjectId);
                break;
        }
    }
    handleAliveHitCircles() {
        // There is only action if there is also a click in this frame ...
        const hasRelax = this.beatmap.appliedMods.includes("RELAX");
        if (!this.hasFreshClickThisFrame && !hasRelax) {
            return;
        }
        const { noteLockStyle } = this.options;
        const currentTime = this.gameState.currentTime;
        let noteLocked = false;
        // JavaScript `Set` maintains its elements in insertion order so the early ones
        // we iterate on are also the ones that are supposed to be hit first ...
        // We copy because the values into an array because we might delete them ...
        const hitCircleIds = Array.from(this.gameState.aliveHitCircleIds.values());
        for (let i = 0; i < hitCircleIds.length; i++) {
            const id = hitCircleIds[i];
            const hitCircle = this.beatmap.getHitCircle(id);
            const cursorInside = index_1.Vec2.withinDistance(hitCircle.position, this.gameState.cursorPosition, Math.fround(hitCircle.radius));
            if (!cursorInside) {
                // We put a lock on the other circles because the first alive HitCircle is the only circle we can interact with.
                if (noteLockStyle === "STABLE") {
                    noteLocked = true;
                }
                // It's a bit fairer because this allows us to force miss notes that are in the past.
                if (noteLockStyle === "LAZER" && currentTime <= hitCircle.hitTime) {
                    noteLocked = true;
                }
                continue;
            }
            // If we got note locked, we want to set an animation then ignore the other hit circles
            if (noteLocked) {
                // TODO: Set state of `id` to be noteLocked at the current time (this allows us to show an "shaking" animation)
                break;
            }
            // If this hitobject is too early for relax, then the other ones will be as well, so break.
            const delta = currentTime - hitCircle.hitTime;
            if (hasRelax && delta < -Mods_1.RELAX_LENIENCY)
                break;
            let judged = false;
            for (const verdict of ["GREAT", "OK", "MEH"]) {
                if (isWithinHitWindow(this.hitWindows, delta, verdict)) {
                    this.judgeHitCircle(hitCircle.id, { judgementTime: currentTime, type: verdict });
                    judged = true;
                    break;
                }
            }
            // TODO: Force miss other notes less than i for lazer style
            if (judged)
                break;
            if (isWithinHitWindow(this.hitWindows, delta, "MISS")) {
                // TODO: Add a "HIT_TOO_LATE" (even though it's kinda unfair, but this is osu!stable behavior)
                // For some reason in osu!stable the HitCircle that has a MEH time of let's say +-109.5ms is still alive at
                // t+110ms and can be "clicked" by the user at time t+110ms, but it will just result in a miss. The problem is
                // that the underlying note will then be ignored because the click is "wasted" for the already expired hit
                // circle. => This might be a stable bug or feature?
                this.judgeHitCircle(hitCircle.id, { judgementTime: currentTime, type: "MISS", missReason: "HIT_TOO_EARLY" });
                judged = true;
            }
            // TODO: Do we force miss other notes as well? for lazer style
            if (judged)
                break;
        }
    }
    get hasFreshClickThisFrame() {
        return this.gameState.pressingSince.includes(this.gameState.currentTime);
    }
    headHitTime(headId) {
        const verdict = this.gameState.hitCircleVerdict[headId];
        if (!verdict || verdict.type === "MISS")
            return undefined;
        return verdict.judgementTime;
    }
    updateSliderBodyTracking(time, cursorPosition, pressingSince) {
        var _a, _b;
        for (const id of this.gameState.aliveSliderIds) {
            const slider = this.beatmap.getSlider(id);
            const headHitTime = this.headHitTime(slider.head.id);
            const wasTracking = (_b = (_a = this.gameState.sliderBodyState.get(id)) === null || _a === void 0 ? void 0 : _a.isTracking) !== null && _b !== void 0 ? _b : false;
            const hasRelax = this.beatmap.appliedMods.includes("RELAX");
            const isTracking = determineTracking(wasTracking, slider, cursorPosition, time, pressingSince, headHitTime, hasRelax);
            this.gameState.sliderBodyState.set(id, { isTracking });
        }
    }
    // Process the events until event[i].time <= maxTimeInclusive is no longer valid.
    handleEventsUntilTime(maxTimeInclusive) {
        const { gameState, events } = this;
        while (gameState.eventIndex < events.length) {
            const event = events[gameState.eventIndex];
            if (event.time > maxTimeInclusive) {
                break;
            }
            gameState.eventIndex += 1;
            this.handleEvent(event);
        }
    }
    evaluate(gameState, frame) {
        this.gameState = gameState;
        this.frame = frame;
        // 1. Deal with hit objects that are only affected with movement (sliders, spinners)
        // Tbh in my first version I have this.handleEventsUntilTime(frame.time) right now, which makes more sense.
        this.handleEventsUntilTime(frame.time - 1);
        // 2. Now consider things that get affected by releasing / clicking at this particular time.
        this.gameState.cursorPosition = frame.position;
        this.gameState.currentTime = frame.time;
        this.gameState.pressingSince = (0, exports.newPressingSince)(this.gameState.pressingSince, frame.actions, frame.time);
        this.gameState.clickWasUseful = false;
        this.handleAliveHitCircles();
        this.updateSliderBodyTracking(frame.time, frame.position, this.gameState.pressingSince);
        // 3. Deal with events after the click such as force killing a HitCircle
        this.handleEventsUntilTime(frame.time);
    }
}
exports.GameStateEvaluator = GameStateEvaluator;
const sliderProgress = (slider, time) => (time - slider.startTime) / slider.duration;
/**
 * SliderTracking is described in a complicated way in osu!lazer, but it can be boiled down to:
 *
 * * A key must be pressed (?)
 * * Slider tracking is only done between slider.startTime (inclusively) and slider.endTime
 * (exclusively).
 * * The follow circle is scaled up to 2.4 if tracking, and down to 1.0 if not tracking, the cursor should be
 * in the follow circle.
 * * Additionally there are two states of a slider:
 *  - Either the header was not hit, then we can accept any key for slider tracking.
 *
 *  - If the head was hit at `t`, then we can only restrict the keys to "fresh" clicks, which means clicks not
 * before t.
 *
 * Note that the state can be 1. at first and then transition to 2.
 *
 * In osu!lazer the tracking follows the visual tracking:
 * https://discord.com/channels/188630481301012481/188630652340404224/865648740810883112
 * https://github.com/ppy/osu/blob/6cec1145e3510eb27c6fbeb0f93967d2d872e600/osu.Game.Rulesets.Osu/Mods/OsuModClassic.cs#L61
 * The slider ball actually gradually scales to 2.4 (duration: 300ms, method: Easing.OutQuint) which means that at the
 * beginning the cursor has less leeway than after 300ms, while in osu!stable you instantly have the maximum leeway. In
 * osu!lazer it's actually a little bit harder than osu!stable.
 */
function determineTracking(previouslyTracking, slider, cursorPosition, time, pressingSince, headHitTime, hasRelax) {
    const keyIsBeingPressed = pressingSince.findIndex((x) => x !== GameState_1.NOT_PRESSING) >= 0;
    // Zeroth condition
    if (!keyIsBeingPressed && !hasRelax)
        return false;
    // First condition
    if (time < slider.startTime || slider.endTime <= time)
        return false;
    // Second condition
    const progress = sliderProgress(slider, time);
    const followCircleRadius = (previouslyTracking ? 2.4 : 1.0) * slider.radius;
    const distanceCursorToBall = index_1.Vec2.distance(slider.ballPositionAt(progress), cursorPosition);
    if (distanceCursorToBall > followCircleRadius)
        return false;
    // Now last condition
    // State 1
    if (headHitTime === undefined)
        return true; // Since any key is ok
    // For the click that was done at t=headHitTime: t >= headHitTime is true.
    // In the other case, we require a fresh click
    // State 2 (requiring a fresh click)
    return pressingSince.findIndex((x) => x >= headHitTime) >= 0;
}
function sliderVerdictBasedOnCheckpoints(totalCheckpoints, hitCheckpoints) {
    if (hitCheckpoints === totalCheckpoints)
        return "GREAT";
    if (hitCheckpoints === 0)
        return "MISS";
    if (hitCheckpoints * 2 >= totalCheckpoints)
        return "OK";
    return "MEH";
}
// Maybe hitObjects should be flattened out (nested pulled out)
// The mods should be applied to those them ...
const actionsToBooleans = (osuActions) => [
    osuActions.includes(Replay_1.OsuAction.leftButton),
    osuActions.includes(Replay_1.OsuAction.rightButton),
];
const newPressingSince = (pressingSince, osuActions, time) => {
    const pressed = actionsToBooleans(osuActions);
    const newPressingSince = [...pressingSince];
    for (let i = 0; i < newPressingSince.length; i++) {
        if (pressed[i]) {
            newPressingSince[i] = Math.min(newPressingSince[i], time);
        }
        else {
            newPressingSince[i] = GameState_1.NOT_PRESSING;
        }
    }
    return newPressingSince;
};
exports.newPressingSince = newPressingSince;


/***/ }),

/***/ "./src/core/gameplay/GameStateTimeMachine.ts":
/*!***************************************************!*\
  !*** ./src/core/gameplay/GameStateTimeMachine.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BucketedGameStateTimeMachine = void 0;
const GameState_1 = __webpack_require__(/*! ./GameState */ "./src/core/gameplay/GameState.ts");
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const GameStateEvaluator_1 = __webpack_require__(/*! ./GameStateEvaluator */ "./src/core/gameplay/GameStateEvaluator.ts");
/**
 * By default O(R sqrt n) memory and O(sqrt n) time, where R is the size of a replay state.
 * Stores replays at the indices [0, sqrt n, 2 *sqrt n, ..., sqrt n * sqrt n] and the others are inferred.
 *
 * TODO: We could do caching like described in method 4 of
 * https://gamedev.stackexchange.com/questions/6080/how-to-design-a-replay-system/8372#8372 TODO: Should we
 * Object.freeze(...) the cached ones in order to prevent accidental mutations?
 */
class BucketedGameStateTimeMachine {
    constructor(initialKnownFrames, beatmap, 
    // private readonly hitObjects: OsuHitObject[],
    settings, bucketSize) {
        this.beatmap = beatmap;
        this.settings = settings;
        // 0 stands for initial state
        // and i means that i frames have been processed
        this.currentIndex = 0;
        this.storedGameState = [];
        // Add a dummy replay frame at the beginning.
        this.frames = [{ time: -727727, position: new index_1.Vec2(0, 0), actions: [] }, ...initialKnownFrames];
        this.bucketSize = bucketSize !== null && bucketSize !== void 0 ? bucketSize : Math.ceil(Math.sqrt(this.frames.length));
        this.storedGameState[0] = (0, GameState_1.defaultGameState)();
        this.currentGameState = (0, GameState_1.cloneGameState)(this.storedGameState[0]);
        this.evaluator = new GameStateEvaluator_1.GameStateEvaluator(beatmap, settings);
    }
    getHighestCachedIndex(time) {
        for (let i = 0; i < this.frames.length; i += this.bucketSize) {
            // The second condition should not happen in our version of implementation where we travel forward.
            if (time < this.frames[i].time || !this.storedGameState[i]) {
                return i - this.bucketSize;
            }
        }
        return 0;
    }
    gameStateAt(time) {
        const highestCachedIndex = this.getHighestCachedIndex(time);
        // TODO: Just check if we had normal forward behavior or not, this can drastically improve performance
        // If not, we need to reset something such as the derived data.
        // Either we have to travel back anyways or there is a future index available for that time.
        if (this.currentIndex < highestCachedIndex || time < this.frames[this.currentIndex].time) {
            this.currentIndex = highestCachedIndex;
            this.currentGameState = (0, GameState_1.cloneGameState)(this.storedGameState[this.currentIndex]);
        }
        // Check if we need to move forward in time
        while (this.currentIndex + 1 < this.frames.length) {
            const nextFrame = this.frames[this.currentIndex + 1];
            if (time < nextFrame.time) {
                break;
            }
            this.evaluator.evaluate(this.currentGameState, nextFrame);
            this.currentIndex += 1;
            // Caching the state at a multiple of bucketSize
            if (this.currentIndex % this.bucketSize === 0) {
                this.storedGameState[this.currentIndex] = (0, GameState_1.cloneGameState)(this.currentGameState);
            }
        }
        return this.currentGameState;
    }
}
exports.BucketedGameStateTimeMachine = BucketedGameStateTimeMachine;


/***/ }),

/***/ "./src/core/gameplay/GameplayAnalysisEvent.ts":
/*!****************************************************!*\
  !*** ./src/core/gameplay/GameplayAnalysisEvent.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.retrieveEvents = exports.isHitObjectJudgement = void 0;
const index_1 = __webpack_require__(/*! ../utils/index */ "./src/core/utils/index.ts");
// Type predicates
const isHitObjectJudgement = (h) => h.type === "HitObjectJudgement";
exports.isHitObjectJudgement = isHitObjectJudgement;
// This is osu!stable style and is also only recommended for offline processing.
// In the future, where something like online replay streaming is implemented, this implementation will ofc be too slow.
function retrieveEvents(gameState, hitObjects) {
    var _a;
    const events = [];
    const dict = (0, index_1.normalizeHitObjects)(hitObjects);
    // HitCircle judgements (SliderHeads included and indicated)
    for (const id in gameState.hitCircleVerdict) {
        const state = gameState.hitCircleVerdict[id];
        const hitCircle = dict[id];
        const isSliderHead = hitCircle.sliderId !== undefined;
        const verdict = state.type;
        events.push({
            type: "HitObjectJudgement",
            time: state.judgementTime,
            hitObjectId: id,
            position: hitCircle.position,
            verdict,
            isSliderHead,
        });
    }
    for (const id in gameState.sliderVerdict) {
        const verdict = gameState.sliderVerdict[id];
        // Slider judgement events
        const slider = dict[id];
        const position = slider.endPosition;
        events.push({ time: slider.endTime, hitObjectId: id, position, verdict, type: "HitObjectJudgement" });
        // CheckpointEvents
        for (const point of slider.checkPoints) {
            const checkPointState = gameState.checkPointVerdict[point.id];
            const hit = (_a = checkPointState === null || checkPointState === void 0 ? void 0 : checkPointState.hit) !== null && _a !== void 0 ? _a : false;
            const isLastTick = point.type === "LAST_LEGACY_TICK";
            events.push({ time: slider.endTime, position: point.position, type: "CheckpointJudgement", hit, isLastTick });
        }
    }
    // TODO: Spinner nested ticks events
    return events;
}
exports.retrieveEvents = retrieveEvents;


/***/ }),

/***/ "./src/core/gameplay/GameplayInfo.ts":
/*!*******************************************!*\
  !*** ./src/core/gameplay/GameplayInfo.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Shows the statistics
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameplayInfoEvaluator = exports.defaultGameplayInfo = exports.osuStableAccuracy = void 0;
const HitCircle_1 = __webpack_require__(/*! ../hitobjects/HitCircle */ "./src/core/hitobjects/HitCircle.ts");
const Slider_1 = __webpack_require__(/*! ../hitobjects/Slider */ "./src/core/hitobjects/Slider.ts");
const SliderCheckPoint_1 = __webpack_require__(/*! ../hitobjects/SliderCheckPoint */ "./src/core/hitobjects/SliderCheckPoint.ts");
function updateComboInfo(combo, type, hit) {
    let currentCombo = combo.currentCombo;
    switch (type) {
        case "HIT_CIRCLE":
        case "TICK":
        case "REPEAT":
        case "SPINNER":
            currentCombo = hit ? currentCombo + 1 : 0;
            break;
        case "LAST_LEGACY_TICK":
            // Slider ends do not break the combo, but they can increase them
            currentCombo += hit ? 1 : 0;
            break;
        case "SLIDER":
            // For sliders there is no combo update
            break;
    }
    return { currentCombo, maxComboSoFar: Math.max(combo.maxComboSoFar, currentCombo) };
}
/** ACC **/
/**
 * Returns a number between 0 and 1 using osu!stable accuracy logic.
 * Also returns undefined if there is no count
 *
 * @param count counts of 300, 100, 50, 0 (in this order)
 */
function osuStableAccuracy(count) {
    if (count.length !== 4) {
        return undefined;
    }
    const JudgementScores = [300, 100, 50, 0];
    let perfect = 0, actual = 0;
    for (let i = 0; i < count.length; i++) {
        actual += JudgementScores[i] * count[i];
        perfect += JudgementScores[0] * count[i];
    }
    if (perfect === 0) {
        return undefined;
    }
    return actual / perfect;
}
exports.osuStableAccuracy = osuStableAccuracy;
//https://osu.ppy.sh/wiki/en/Score/ScoreV1
const defaultEvaluationOptions = {
    scoringSystem: "ScoreV1",
};
exports.defaultGameplayInfo = Object.freeze({
    currentCombo: 0,
    maxComboSoFar: 0,
    verdictCounts: [0, 0, 0, 0],
    accuracy: 0,
    score: 0,
});
/**
 * Calculating: Count, Accuracy, Combo, MaxCombo
 * The one who is calling this has to make sure that slider heads are not considered in case they are using osu!stable
 * calculation.
 */
class GameplayInfoEvaluator {
    constructor(beatmap, options) {
        this.beatmap = beatmap;
        this.options = Object.assign(Object.assign({}, defaultEvaluationOptions), options);
        this.comboInfo = { maxComboSoFar: 0, currentCombo: 0 };
        this.verdictCount = { MISS: 0, MEH: 0, GREAT: 0, OK: 0 };
        this.judgedObjectsIndex = 0;
        // TODO: Do some initialization for calculating ScoreV2 (like max score)
    }
    evaluateHitObject(hitObjectType, verdict, isSliderHead) {
        this.comboInfo = updateComboInfo(this.comboInfo, hitObjectType, verdict !== "MISS");
        if (!isSliderHead) {
            this.verdictCount[verdict] += 1;
        }
    }
    evaluateSliderCheckpoint(hitObjectType, hit) {
        this.comboInfo = updateComboInfo(this.comboInfo, hitObjectType, hit);
    }
    countAsArray() {
        return ["GREAT", "OK", "MEH", "MISS"].map((v) => this.verdictCount[v]);
    }
    evaluateReplayState(replayState) {
        var _a;
        // Assume something like seeking backwards happened at reevaluate
        if (this.judgedObjectsIndex >= replayState.judgedObjects.length + 1) {
            this.comboInfo = { maxComboSoFar: 0, currentCombo: 0 };
            this.verdictCount = { MISS: 0, MEH: 0, GREAT: 0, OK: 0 };
            this.judgedObjectsIndex = 0;
        }
        while (this.judgedObjectsIndex < replayState.judgedObjects.length) {
            const id = replayState.judgedObjects[this.judgedObjectsIndex++];
            const hitObject = this.beatmap.getHitObject(id);
            if (hitObject instanceof SliderCheckPoint_1.SliderCheckPoint) {
                const hit = replayState.checkPointVerdict[hitObject.id].hit;
                this.evaluateSliderCheckpoint(hitObject.type, hit);
            }
            else if (hitObject instanceof HitCircle_1.HitCircle) {
                const verdict = replayState.hitCircleVerdict[id].type;
                const isSliderHead = hitObject.sliderId !== undefined;
                this.evaluateHitObject(hitObject.type, verdict, isSliderHead);
            }
            else if (hitObject instanceof Slider_1.Slider) {
                const verdict = replayState.sliderVerdict[hitObject.id];
                this.evaluateHitObject(hitObject.type, verdict);
            }
            else {
                // Spinner
                // TODO: We just going to assume that they hit it
                this.evaluateHitObject("SPINNER", "GREAT");
            }
        }
        const counts = this.countAsArray();
        return {
            score: 0,
            verdictCounts: counts,
            accuracy: (_a = osuStableAccuracy(counts)) !== null && _a !== void 0 ? _a : 1.0,
            currentCombo: this.comboInfo.currentCombo,
            maxComboSoFar: this.comboInfo.maxComboSoFar,
        };
    }
}
exports.GameplayInfoEvaluator = GameplayInfoEvaluator;


/***/ }),

/***/ "./src/core/gameplay/Verdicts.ts":
/*!***************************************!*\
  !*** ./src/core/gameplay/Verdicts.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./src/core/hitobjects/HitCircle.ts":
/*!******************************************!*\
  !*** ./src/core/hitobjects/HitCircle.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HitCircle = void 0;
class HitCircle {
    constructor() {
        this.id = "";
        this.hitTime = 0;
        this.approachDuration = 0;
        this.fadeInDuration = 0;
        this.comboSetIndex = 0;
        this.withinComboSetIndex = 0;
        this.scale = 1;
        this.position = { x: 0, y: 0 };
        // Only used because there's a bug in the Flashlight difficulty processing
        this.unstackedPosition = { x: 0, y: 0 };
    }
    get type() {
        return "HIT_CIRCLE";
    }
    get radius() {
        return HitCircle.OBJECT_RADIUS * this.scale;
    }
    get spawnTime() {
        return this.hitTime - this.approachDuration;
    }
    get timeFadeIn() {
        return this.fadeInDuration;
    }
    opacityAt(time, hidden) {
        if (time > this.hitTime) {
            return 0.0;
        }
        let fadeInStartTime = this.spawnTime;
        let fadeInDuration = this.timeFadeIn;
        if (hidden) {
            let fadeOutStartTime = fadeInStartTime + fadeInDuration;
            let fadeOutDuration = this.approachDuration * 0.3;
            return Math.min(Math.min(Math.max((time - fadeInStartTime) / fadeInDuration, 0), 1), 1.0 - Math.min(Math.max((time - fadeOutStartTime) / fadeOutDuration, 0), 1));
        }
        return Math.min(Math.max((time - fadeInStartTime) / fadeInDuration, 0), 1);
    }
}
exports.HitCircle = HitCircle;
HitCircle.OBJECT_RADIUS = 64;


/***/ }),

/***/ "./src/core/hitobjects/Slider.ts":
/*!***************************************!*\
  !*** ./src/core/hitobjects/Slider.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Slider = void 0;
const SliderPath_1 = __webpack_require__(/*! ./slider/SliderPath */ "./src/core/hitobjects/slider/SliderPath.ts");
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
class Slider {
    constructor(hitCircle) {
        this.id = "";
        this.path = new SliderPath_1.SliderPath([]);
        this.checkPoints = [];
        this.velocity = 1;
        this.tickDistance = 0;
        this.tickDistanceMultiplier = 1;
        this.repeatCount = 0;
        this.head = hitCircle;
    }
    get type() {
        return "SLIDER";
    }
    get spawnTime() {
        return this.head.spawnTime;
    }
    // Number of times the slider spans over the screen.
    get spanCount() {
        return this.repeatCount + 1;
    }
    get scale() {
        return this.head.scale;
    }
    get radius() {
        return this.head.radius;
    }
    get spanDuration() {
        return this.duration / this.spanCount;
    }
    get duration() {
        return this.endTime - this.startTime;
    }
    get startTime() {
        return this.head.hitTime;
    }
    get endTime() {
        return this.startTime + (this.spanCount * this.path.distance) / this.velocity;
    }
    get startPosition() {
        return this.head.position;
    }
    get endPosition() {
        // TODO: Caching like in osu!lazer since this takes a lot of time
        return index_1.Vec2.add(this.head.position, this.ballOffsetAt(1.0));
    }
    get unstackedEndPosition() {
        return index_1.Vec2.add(this.head.unstackedPosition, this.ballOffsetAt(1.0));
    }
    /**
     * Returns the absolute position of the ball given the progress p, where p is the percentage of time passed
     * between startTime and endTime.
     * @param progress
     */
    ballPositionAt(progress) {
        return index_1.Vec2.add(this.head.position, this.ballOffsetAt(progress));
    }
    /**
     * Returns the position given the (time) progress. Basically it just tells you where the slider ball should be after
     * p% of time has passed.
     *
     * @param progress number between 0 and 1 determining the time progress
     */
    ballOffsetAt(progress) {
        const spanProgress = progress * this.spanCount;
        let progressInSpan = spanProgress % 1.0;
        // When it's "returning" we should consider the progress in an inverted way.
        if (Math.floor(spanProgress) % 2 === 1) {
            progressInSpan = 1.0 - progressInSpan;
        }
        return this.path.positionAt(progressInSpan);
    }
}
exports.Slider = Slider;
// scoring distance with a speed-adjusted beat length of 1 second (i.e. the speed slider balls
// move through their track).
Slider.BASE_SCORING_DISTANCE = 100;


/***/ }),

/***/ "./src/core/hitobjects/SliderCheckPoint.ts":
/*!*************************************************!*\
  !*** ./src/core/hitobjects/SliderCheckPoint.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SliderCheckPoint = void 0;
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
// Important points on the slider. Depending on if they were "hit" or not, we will have a different judgement on the
// slider.
class SliderCheckPoint {
    constructor(slider) {
        this.slider = slider;
        this.id = "";
        this.type = "TICK";
        this.spanIndex = 0;
        // The `spanProgress` is a number between 0 and 1 that determines the position on the slider path.
        this.spanProgress = 0;
        this.spanStartTime = 0;
        this.offset = { x: 0, y: 0 };
        this.hitTime = 0;
    }
    get position() {
        return index_1.Vec2.add(this.slider.startPosition, this.offset);
    }
    get scale() {
        return this.slider.scale;
    }
}
exports.SliderCheckPoint = SliderCheckPoint;


/***/ }),

/***/ "./src/core/hitobjects/Spinner.ts":
/*!****************************************!*\
  !*** ./src/core/hitobjects/Spinner.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spinner = void 0;
/**
 * Logic:
 *
 * * Assumption is that the user can't spin more than 8 times per second `max_rotations_per_second=8`.
 * * "MaxSpinsPossible" "MinSpinsNeeded"
 *
 *
 * Then there are like "MaxSpinsPossible" spinner ticks generated (???) which have a start time of [0, d, 2d, ...,
 * maxSpinsPossible * d] where d is the duration of one spin.
 *
 * 100% min spinned -> GREAT
 * > 90%-> OK
 * > 75% -> MEH
 * otherwise miss
 * requires gameClock playRate
 *
 *
 *                 if (HitObject.SpinsRequired == 0)
 // some spinners are so short they can't require an integer spin count.
 // these become implicitly hit.
 return 1;
 * SPM count is calculated as follows:
 *
 * First define a time window spm_count_duration = 595ms for example then find out how much you have spinned at t
 * compared to t - spm_count_duration.
 *
 * This is done by keeping track with a queue of (t, total_rotation) by most people
 *
 */
// Sources: https://github.com/itdelatrisu/opsu/blob/master/src/itdelatrisu/opsu/objects/Spinner.java
// https://github.com/McKay42/McOsu/blob/master/src/App/Osu/OsuSpinner.cpp
// https://github.com/ppy/osu/blob/master/osu.Game.Rulesets.Osu/Objects/Drawables/DrawableSpinner.cs
function diffRange(difficulty, min, mid, max) {
    if (difficulty > 5)
        return mid + ((max - mid) * (difficulty - 5)) / 5;
    if (difficulty < 5)
        return mid - ((mid - min) * (5 - difficulty)) / 5;
    return mid;
}
class Spinner {
    constructor() {
        this.id = "";
        this.startTime = 0;
        this.duration = 0;
        this.spinsRequired = 1;
        this.maximumBonusSpins = 1;
    }
    // The spinner is visible way earlier, but can only be interacted with at [startTime, endTime]
    get spawnTime() {
        return this.startTime;
    }
    get endTime() {
        return this.startTime + this.duration;
    }
    get type() {
        return "SPINNER";
    }
}
exports.Spinner = Spinner;


/***/ }),

/***/ "./src/core/hitobjects/Types.ts":
/*!**************************************!*\
  !*** ./src/core/hitobjects/Types.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isSpinner = exports.isSlider = exports.isHitCircle = void 0;
const isHitCircle = (o) => o.type === "HIT_CIRCLE";
exports.isHitCircle = isHitCircle;
const isSlider = (o) => o.type === "SLIDER";
exports.isSlider = isSlider;
const isSpinner = (o) => o.type === "SPINNER";
exports.isSpinner = isSpinner;


/***/ }),

/***/ "./src/core/hitobjects/slider/PathApproximator.ts":
/*!********************************************************!*\
  !*** ./src/core/hitobjects/slider/PathApproximator.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PathApproximator = void 0;
const index_1 = __webpack_require__(/*! ../../../math/index */ "./src/math/index.ts");
// TODO: Move to osu-math
// https://github.com/ppy/osu-framework/blob/f9d44b1414e30ad507894ef7eaaf5d1b0118be82/osu.Framework/Utils/PathApproximator.cs
const bezierTolerance = Math.fround(0.25);
const circularArcTolerance = Math.fround(0.1);
// The amount of pieces to calculate for each control point quadruplet.
const catmullDetail = 50;
const toFloat = (x) => Math.fround(x);
/**
 * Helper methods to approximate a path by interpolating a sequence of control points.
 */
class PathApproximator {
    /**
     * Creates a piecewise-linear approximation of a bezier curve, by adaptively repeatedly subdividing
     * the control points until their approximation error vanishes below a given threshold.
     * @returns A list of vectors representing the piecewise-linear approximation.
     */
    static approximateBezier(controlPoints, p = 0) {
        var _a;
        const output = [];
        const n = controlPoints.length - 1;
        if (n < 0) {
            return output;
        }
        // Both Stacks<>
        const toFlatten = [];
        const freeBuffers = [];
        // Creates a copy of controlPoints
        const points = [...controlPoints];
        if (p > 0 && p < n) {
            for (let i = 0; i < n - p; i++) {
                const subBezier = new Array(p + 1);
                subBezier[0] = points[i];
                for (let j = 0; j < p - 1; j++) {
                    subBezier[j + 1] = points[i + 1];
                    for (let k = 1; k < p - j; k++) {
                        const l = Math.min(k, n - p - i);
                        points[i + k] = points[i + k]
                            .scale(l)
                            .add(points[i + k + 1])
                            .scale(1 / (l + 1));
                    }
                }
                subBezier[p] = points[i + 1];
                toFlatten.push(subBezier);
            }
            // TODO: Is this same as  points[(n-p)..]) as in C# ?
            toFlatten.push(points.slice(n - p, points.length));
            // TODO: Is this as in the osu!lazer code?
            // Reverse the stack so elements can be accessed in order
            toFlatten.reverse();
        }
        else {
            // B-spline subdivisions unnecessary, degenerate to single bezier
            p = n;
            toFlatten.push(points);
        }
        const subdivisionBuffer1 = new Array(p + 1);
        const subdivisionBuffer2 = new Array(p * 2 + 1);
        const leftChild = subdivisionBuffer2;
        // let leftChild = subdivisionBuffer2;
        while (toFlatten.length > 0) {
            // Can't be undefined dude
            const parent = toFlatten.pop();
            if (PathApproximator._bezierIsFlatEnough(parent)) {
                // If the control points we currently operate on are sufficiently "flat", we use
                // an extension to De Casteljau's algorithm to obtain a piecewise-linear approximation
                // of the bezier curve represented by our control points, consisting of the same amount
                // of points as there are control points.
                PathApproximator._bezierApproximate(parent, output, subdivisionBuffer1, subdivisionBuffer2, p + 1);
                freeBuffers.push(parent);
                continue;
            }
            // If we do not yet have a sufficiently "flat" (in other words, detailed) approximation we keep
            // subdividing the curve we are currently operating on.
            const rightChild = (_a = freeBuffers.pop()) !== null && _a !== void 0 ? _a : new Array(p + 1);
            PathApproximator._bezierSubdivide(parent, leftChild, rightChild, subdivisionBuffer1, p + 1);
            // We re-use the buffer of the parent for one of the children, so that we save one allocation per iteration.
            for (let i = 0; i < p + 1; ++i) {
                parent[i] = leftChild[i];
            }
            toFlatten.push(rightChild);
            toFlatten.push(parent);
        }
        output.push(controlPoints[n]);
        return output;
    }
    /**
     * Creates a piecewise-linear approximation of a Catmull-Rom spline.
     * @returns A list of vectors representing the piecewise-linear approximation.
     */
    static approximateCatmull(controlPoints) {
        const result = [];
        const controlPointsLength = controlPoints.length;
        for (let i = 0; i < controlPointsLength - 1; i++) {
            const v1 = i > 0 ? controlPoints[i - 1] : controlPoints[i];
            const v2 = controlPoints[i];
            const v3 = i < controlPointsLength - 1 ? controlPoints[i + 1] : v2.add(v2).sub(v1);
            const v4 = i < controlPointsLength - 2 ? controlPoints[i + 2] : v3.add(v3).sub(v2);
            for (let c = 0; c < catmullDetail; c++) {
                result.push(PathApproximator._catmullFindPoint(v1, v2, v3, v4, Math.fround(c / catmullDetail)));
                result.push(PathApproximator._catmullFindPoint(v1, v2, v3, v4, Math.fround((c + 1) / catmullDetail)));
            }
        }
        return result;
    }
    // TODO: Use Math.fround maybe
    static circularArcProperties(controlPoints) {
        const a = controlPoints[0];
        const b = controlPoints[1];
        const c = controlPoints[2];
        if ((0, index_1.floatEqual)(0, (0, index_1.float32)((0, index_1.float32_mul)(b.y - a.y, c.x - a.x) - (0, index_1.float32_mul)(b.x - a.x, c.y - a.y))))
            return undefined; // = invalid
        const d = (0, index_1.float32_mul)(2, (0, index_1.float32_add)((0, index_1.float32_add)((0, index_1.float32_mul)(a.x, b.sub(c).y), (0, index_1.float32_mul)(b.x, c.sub(a).y)), (0, index_1.float32_mul)(c.x, a.sub(b).y)));
        const aSq = toFloat(a.lengthSquared());
        const bSq = toFloat(b.lengthSquared());
        const cSq = toFloat(c.lengthSquared());
        // Not really exact
        const centerX = toFloat((0, index_1.float32_add)((0, index_1.float32_add)((0, index_1.float32_mul)(aSq, b.sub(c).y), (0, index_1.float32_mul)(bSq, c.sub(a).y)), (0, index_1.float32_mul)(cSq, a.sub(b).y)));
        const centerY = toFloat((0, index_1.float32_add)((0, index_1.float32_add)((0, index_1.float32_mul)(aSq, c.sub(b).x), (0, index_1.float32_mul)(bSq, a.sub(c).x)), (0, index_1.float32_mul)(cSq, b.sub(a).x)));
        const center = new index_1.Vec2(centerX, centerY).divide(d);
        const dA = a.sub(center);
        const dC = c.sub(center);
        // Also not exact
        const r = toFloat(dA.length());
        const thetaStart = Math.atan2(dA.y, dA.x);
        let thetaEnd = Math.atan2(dC.y, dC.x);
        while (thetaEnd < thetaStart)
            thetaEnd += 2 * Math.PI;
        let dir = 1;
        let thetaRange = thetaEnd - thetaStart;
        let orthoAtoC = c.sub(a);
        orthoAtoC = new index_1.Vec2(orthoAtoC.y, -orthoAtoC.x);
        if (index_1.Vec2.dot(orthoAtoC, b.sub(a)) < 0) {
            dir = -dir;
            thetaRange = 2 * Math.PI - thetaRange;
        }
        return { thetaStart, thetaRange, direction: dir, radius: r, center };
    }
    /**
     * Creates a piecewise-linear approximation of a circular arc curve.
     * @returns A list of vectors representing the piecewise-linear approximation.
     */
    static approximateCircularArc(controlPoints) {
        const properties = PathApproximator.circularArcProperties(controlPoints);
        if (!properties) {
            return PathApproximator.approximateBezier(controlPoints);
        }
        const { radius, center, thetaRange, thetaStart, direction } = properties;
        const amountPoints = 2 * radius <= circularArcTolerance
            ? 2
            : Math.max(2, Math.ceil(thetaRange / (2 * Math.acos(1 - (0, index_1.float32_div)(circularArcTolerance, radius)))));
        // We select the amount of points for the approximation by requiring the discrete curvature
        // to be smaller than the provided tolerance. The exact angle required to meet the tolerance
        // is: 2 * Math.Acos(1 - TOLERANCE / r)
        // The special case is required for extremely short sliders where the radius is smaller than
        // the tolerance. This is a pathological rather than a realistic case.
        const output = [];
        for (let i = 0; i < amountPoints; ++i) {
            const fract = i / (amountPoints - 1);
            const theta = thetaStart + direction * fract * thetaRange;
            const o = new index_1.Vec2(toFloat(Math.cos(theta)), toFloat(Math.sin(theta))).scale(radius);
            output.push(center.add(o));
        }
        return output;
    }
    /**
     * Creates a piecewise-linear approximation of a linear curve.
     * Basically, returns the input.
     * @returns A list of vectors representing the piecewise-linear approximation.
     */
    static approximateLinear(controlPoints) {
        return [...controlPoints];
    }
    /**
     * Creates a piecewise-linear approximation of a lagrange polynomial.
     * @returns A list of vectors representing the piecewise-linear approximation.
     */
    static approximateLagrangePolynomial(controlPoints) {
        // TODO: add some smarter logic here, chebyshev nodes?
        const numSteps = 51;
        const result = [];
        const weights = PathApproximator._barycentricWeights(controlPoints);
        let minX = controlPoints[0].x;
        let maxX = controlPoints[0].x;
        for (let i = 1; i < controlPoints.length; i++) {
            minX = Math.min(minX, controlPoints[i].x);
            maxX = Math.max(maxX, controlPoints[i].x);
        }
        const dx = maxX - minX;
        for (let i = 0; i < numSteps; i++) {
            const x = minX + (dx / (numSteps - 1)) * i;
            const y = Math.fround(PathApproximator._barycentricLagrange(controlPoints, weights, x));
            result.push(new index_1.Vec2(x, y));
        }
        return result;
    }
    /**
     * Calculates the Barycentric weights for a Lagrange polynomial for a given set of coordinates.
     * Can be used as a helper function to compute a Lagrange polynomial repeatedly.
     * @param points An array of coordinates. No two x should be the same.
     */
    static _barycentricWeights(points) {
        const n = points.length;
        const w = [];
        for (let i = 0; i < n; i++) {
            // TODO: w[i].push() -> unholey
            w[i] = 1;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    w[i] *= points[i].x - points[j].x;
                }
            }
            w[i] = 1.0 / w[i];
        }
        return w;
    }
    /**
     * Calculates the Lagrange basis polynomial for a given set of x coordinates based on previously computed barycentric
     * weights.
     * @param points An array of coordinates. No two x should be the same.
     * @param weights An array of precomputed barycentric weights.
     * @param time The x coordinate to calculate the basis polynomial for.
     */
    static _barycentricLagrange(points, weights, time) {
        if (points === null || points.length === 0) {
            throw new Error("points must contain at least one point");
        }
        if (points.length !== weights.length) {
            throw new Error("points must contain exactly as many items as {nameof(weights)}");
        }
        let numerator = 0;
        let denominator = 0;
        for (let i = 0, len = points.length; i < len; i++) {
            // while this is not great with branch prediction, it prevents NaN at control point X coordinates
            if (time === points[i].x) {
                return points[i].y;
            }
            const li = weights[i] / (time - points[i].x);
            numerator += li * points[i].y;
            denominator += li;
        }
        return numerator / denominator;
    }
    /**
     * Make sure the 2nd order derivative (approximated using finite elements) is within tolerable bounds.
     * NOTE: The 2nd order derivative of a 2d curve represents its curvature, so intuitively this function
     *       checks (as the name suggests) whether our approximation is _locally_ "flat". More curvy parts
     *       need to have a denser approximation to be more "flat".
     * @param controlPoints The control points to check for flatness.
     * @returns Whether the control points are flat enough.
     */
    static _bezierIsFlatEnough(controlPoints) {
        for (let i = 1; i < controlPoints.length - 1; i++) {
            const tmp = controlPoints[i - 1].sub(controlPoints[i].scale(2)).add(controlPoints[i + 1]);
            if (tmp.lengthSquared() > bezierTolerance ** 2 * 4) {
                return false;
            }
        }
        return true;
    }
    /**
     * Subdivides n control points representing a bezier curve into 2 sets of n control points, each
     * describing a bezier curve equivalent to a half of the original curve. Effectively this splits
     * the original curve into 2 curves which result in the original curve when pieced back together.
     * @param controlPoints The control points to split.
     * @param l Output: The control points corresponding to the left half of the curve.
     * @param r Output: The control points corresponding to the right half of the curve.
     * @param subdivisionBuffer The first buffer containing the current subdivision state.
     * @param count The number of control points in the original list.
     */
    static _bezierSubdivide(controlPoints, l, r, subdivisionBuffer, count) {
        const midpoints = subdivisionBuffer;
        for (let i = 0; i < count; ++i) {
            midpoints[i] = controlPoints[i];
        }
        for (let i = 0; i < count; ++i) {
            l[i] = midpoints[0];
            r[count - i - 1] = midpoints[count - i - 1];
            for (let j = 0; j < count - i - 1; j++) {
                midpoints[j] = midpoints[j].add(midpoints[j + 1]);
                midpoints[j] = midpoints[j].divide(2);
            }
        }
    }
    /**
     * This uses <a href="https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm De Casteljau's algorithm</a> to obtain
     * an optimal piecewise-linear approximation of the bezier curve with the same amount of points as there are control
     * points.
     * @param controlPoints The control points describing the bezier curve to be approximated.
     * @param output The points representing the resulting piecewise-linear approximation.
     * @param count The number of control points in the original list.
     * @param subdivisionBuffer1 The first buffer containing the current subdivision state.
     * @param subdivisionBuffer2 The second buffer containing the current subdivision state.
     */
    static _bezierApproximate(controlPoints, output, subdivisionBuffer1, subdivisionBuffer2, count) {
        const l = subdivisionBuffer2;
        const r = subdivisionBuffer1;
        PathApproximator._bezierSubdivide(controlPoints, l, r, subdivisionBuffer1, count);
        for (let i = 0; i < count - 1; ++i) {
            l[count + i] = r[i + 1];
        }
        output.push(controlPoints[0]);
        for (let i = 1; i < count - 1; ++i) {
            const index = 2 * i;
            let p = l[index - 1].add(l[index].scale(2)).add(l[index + 1]);
            p = p.scale(Math.fround(0.25));
            output.push(p);
        }
    }
    /**
     * Finds a point on the spline at the position of a parameter.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @param vec3 The third vector.
     * @param vec4 The fourth vector.
     * @param t The parameter at which to find the point on the spline, in the range [0, 1].
     * @returns The point on the spline at t.
     */
    static _catmullFindPoint(vec1, vec2, vec3, vec4, t) {
        const t2 = Math.fround(t * t);
        const t3 = Math.fround(t * t2);
        return new index_1.Vec2(Math.fround(0.5 *
            (2 * vec2.x +
                (-vec1.x + vec3.x) * t +
                (2 * vec1.x - 5 * vec2.x + 4 * vec3.x - vec4.x) * t2 +
                (-vec1.x + 3 * vec2.x - 3 * vec3.x + vec4.x) * t3)), Math.fround(0.5 *
            (2 * vec2.y +
                (-vec1.y + vec3.y) * t +
                (2 * vec1.y - 5 * vec2.y + 4 * vec3.y - vec4.y) * t2 +
                (-vec1.y + 3 * vec2.y - 3 * vec3.y + vec4.y) * t3)));
    }
}
exports.PathApproximator = PathApproximator;


/***/ }),

/***/ "./src/core/hitobjects/slider/PathControlPoint.ts":
/*!********************************************************!*\
  !*** ./src/core/hitobjects/slider/PathControlPoint.ts ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./src/core/hitobjects/slider/PathType.ts":
/*!************************************************!*\
  !*** ./src/core/hitobjects/slider/PathType.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PathType = void 0;
var PathType;
(function (PathType) {
    PathType[PathType["Catmull"] = 0] = "Catmull";
    PathType[PathType["Bezier"] = 1] = "Bezier";
    PathType[PathType["Linear"] = 2] = "Linear";
    PathType[PathType["PerfectCurve"] = 3] = "PerfectCurve";
})(PathType = exports.PathType || (exports.PathType = {}));


/***/ }),

/***/ "./src/core/hitobjects/slider/SliderCheckPointGenerator.ts":
/*!*****************************************************************!*\
  !*** ./src/core/hitobjects/slider/SliderCheckPointGenerator.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateSliderCheckpoints = void 0;
const index_1 = __webpack_require__(/*! ../../../math/index */ "./src/math/index.ts");
function* generateTicks(spanIndex, spanStartTime, spanDuration, reversed, length, tickDistance, minDistanceFromEnd) {
    for (let d = tickDistance; d <= length; d += tickDistance) {
        if (d >= length - minDistanceFromEnd) {
            break;
        }
        const spanProgress = d / length;
        const timeProgress = reversed ? 1.0 - spanProgress : spanProgress;
        yield {
            type: "TICK",
            spanIndex,
            spanStartTime,
            time: spanStartTime + timeProgress * spanDuration,
            spanProgress,
        };
    }
}
function* generateSliderCheckpoints(startTime, spanDuration, velocity, tickDistance, totalDistance, spanCount, legacyLastTickOffset) {
    const length = Math.min(100000.0, totalDistance);
    tickDistance = (0, index_1.clamp)(tickDistance, 0.0, length);
    const minDistanceFromEnd = velocity * 10;
    // Generating ticks, repeats
    // Using `floatEqual` was my suggestion, but osu!lazer uses tickDistance != 0
    if (tickDistance !== 0) {
        for (let span = 0; span < spanCount; span++) {
            const spanStartTime = startTime + span * spanDuration;
            const reversed = span % 2 === 1;
            const it = generateTicks(span, spanStartTime, spanDuration, reversed, length, tickDistance, minDistanceFromEnd);
            // Don't flame me for this
            const ticks = [];
            for (const t of it)
                ticks.push(t);
            if (reversed)
                ticks.reverse();
            for (const t of ticks)
                yield t;
            if (span < spanCount - 1) {
                yield {
                    type: "REPEAT",
                    spanIndex: span,
                    spanStartTime,
                    time: spanStartTime + spanDuration,
                    spanProgress: (span + 1) % 2,
                };
            }
        }
    }
    const totalDuration = spanCount * spanDuration;
    const finalSpanIndex = spanCount - 1;
    const finalSpanStartTime = startTime + finalSpanIndex * spanDuration;
    const finalSpanEndTime = Math.max(startTime + totalDuration / 2.0, finalSpanStartTime + spanDuration - (legacyLastTickOffset !== null && legacyLastTickOffset !== void 0 ? legacyLastTickOffset : 0));
    let finalProgress = (finalSpanEndTime - finalSpanStartTime) / spanDuration;
    if (spanCount % 2 === 0)
        finalProgress = 1.0 - finalProgress;
    yield {
        type: "LAST_LEGACY_TICK",
        spanIndex: finalSpanIndex,
        spanStartTime: finalSpanStartTime,
        time: finalSpanEndTime,
        spanProgress: finalProgress,
    };
    // Technically speaking the tail has no real relevancy for gameplay, it is just a visual element.
    // In Slider.cs it is even ignored...
    // yield {
    //   type: SliderCheckPointType.TAIL,
    //   spanIndex: finalSpanIndex,
    //   spanStartTime: startTime + (spanCount - 1) * spanDuration,
    //   time: startTime + totalDuration,
    //   pathProgress: spanCount % 2
    // };
}
exports.generateSliderCheckpoints = generateSliderCheckpoints;


/***/ }),

/***/ "./src/core/hitobjects/slider/SliderPath.ts":
/*!**************************************************!*\
  !*** ./src/core/hitobjects/slider/SliderPath.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SliderPath = void 0;
const PathType_1 = __webpack_require__(/*! ./PathType */ "./src/core/hitobjects/slider/PathType.ts");
const index_1 = __webpack_require__(/*! ../../../math/index */ "./src/math/index.ts");
const PathApproximator_1 = __webpack_require__(/*! ./PathApproximator */ "./src/core/hitobjects/slider/PathApproximator.ts");
function mapToVector2(p) {
    return p.map((p) => new index_1.Vec2(p.x, p.y));
}
class SliderPath {
    constructor(controlPoints, length) {
        this._min = { x: 0, y: 0 };
        this._max = { x: 0, y: 0 };
        this.controlPoints = controlPoints;
        this._invalid = true;
        this._cumulativeLength = [];
        this._calculatedPath = [];
        this._expectedDistance = length;
    }
    get cumulativeLengths() {
        this.ensureValid();
        return this._cumulativeLength;
    }
    get calculatedPath() {
        this.ensureValid();
        return this._calculatedPath;
    }
    makeInvalid() {
        this._invalid = true;
    }
    // Recalculates the helper data if needed
    ensureValid() {
        if (this._invalid) {
            this.calculatePath();
            this.calculateLength();
            this.calculateBoundaryBox();
            this._invalid = false;
        }
    }
    calculateSubPath(subControlPoints, type) {
        switch (type) {
            case PathType_1.PathType.Catmull:
                return PathApproximator_1.PathApproximator.approximateCatmull(mapToVector2(subControlPoints));
            case PathType_1.PathType.Linear:
                return PathApproximator_1.PathApproximator.approximateLinear(mapToVector2(subControlPoints));
            case PathType_1.PathType.PerfectCurve:
                if (subControlPoints.length !== 3)
                    break;
                // eslint-disable-next-line no-case-declarations
                const subpath = PathApproximator_1.PathApproximator.approximateCircularArc(mapToVector2(subControlPoints));
                // If for some reason a circular arc could not be fit to the 3 given points, fall back to a numerically stable
                // bezier approximation.
                if (subpath.length === 0)
                    break;
                return subpath;
        }
        return PathApproximator_1.PathApproximator.approximateBezier(mapToVector2(subControlPoints));
    }
    get boundaryBox() {
        this.ensureValid();
        return [this._min, this._max];
    }
    calculateBoundaryBox() {
        // Since it is osu!px , it should be no problem
        let minX = 3000, maxX = -3000, minY = 3000, maxY = -3000;
        this._calculatedPath.forEach((p) => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        this._min = new index_1.Vec2(minX, minY);
        this._max = new index_1.Vec2(maxX, maxY);
        return [this._min, this._max];
    }
    calculatePath() {
        var _a;
        this._calculatedPath = [];
        const numberOfPoints = this.controlPoints.length;
        if (numberOfPoints === 0)
            return;
        const vertices = this.controlPoints.map((p) => p.offset);
        let start = 0;
        for (let i = 0; i < numberOfPoints; i++) {
            // Need to calculate previous segment
            if (this.controlPoints[i].type === undefined && i < numberOfPoints - 1) {
                continue;
            }
            // Current vertex ends the segment
            const segmentVertices = vertices.slice(start, i + 1);
            const segmentType = (_a = this.controlPoints[start].type) !== null && _a !== void 0 ? _a : PathType_1.PathType.Linear;
            for (const t of this.calculateSubPath(segmentVertices, segmentType)) {
                const n = this._calculatedPath.length;
                if (n === 0 || !index_1.Vec2.equal(this._calculatedPath[n - 1], t)) {
                    this._calculatedPath.push(t);
                }
            }
            start = i;
        }
    }
    calculateLength() {
        this._cumulativeLength = new Array(this._calculatedPath.length);
        this._cumulativeLength[0] = 0.0;
        for (let i = 1; i < this._calculatedPath.length; i++) {
            this._cumulativeLength[i] =
                this._cumulativeLength[i - 1] + Math.fround(index_1.Vec2.distance(this._calculatedPath[i - 1], this._calculatedPath[i]));
        }
        const calculatedLength = this._cumulativeLength[this._cumulativeLength.length - 1];
        // TODO: In lazer the != operator is used, but shouldn't the approximate equal be used?
        if (this._expectedDistance !== undefined && calculatedLength !== this._expectedDistance) {
            // In osu-stable, if the last two control points of a slider are equal, extension is not performed.
            if (this.controlPoints.length >= 2 && index_1.Vec2.equal(this.controlPoints[this.controlPoints.length - 1].offset, this.controlPoints[this.controlPoints.length - 2].offset)
                && this._expectedDistance > calculatedLength) {
                this._cumulativeLength.push(calculatedLength);
                return;
            }
            // The last length is always incorrect
            this._cumulativeLength.splice(this._cumulativeLength.length - 1);
            let pathEndIndex = this._calculatedPath.length - 1;
            if (calculatedLength > this._expectedDistance) {
                while (this._cumulativeLength.length > 0 &&
                    this._cumulativeLength[this._cumulativeLength.length - 1] >= this._expectedDistance) {
                    this._cumulativeLength.splice(this._cumulativeLength.length - 1);
                    this._calculatedPath.splice(pathEndIndex--, 1);
                }
            }
            if (pathEndIndex <= 0) {
                // TODO: Perhaps negative path lengths should be disallowed together
                this._cumulativeLength.push(0);
                return;
            }
            // the direction of the segment to shorten or lengthen
            const dir = index_1.Vec2.sub(this._calculatedPath[pathEndIndex], this._calculatedPath[pathEndIndex - 1]).normalized();
            const f = this._expectedDistance - this._cumulativeLength[this._cumulativeLength.length - 1];
            this._calculatedPath[pathEndIndex] = index_1.Vec2.add(this._calculatedPath[pathEndIndex - 1], dir.scale(Math.fround(f)));
            this._cumulativeLength.push(this._expectedDistance);
        }
    }
    get distance() {
        const cumulativeLengths = this.cumulativeLengths;
        const count = cumulativeLengths.length;
        return count > 0 ? cumulativeLengths[count - 1] : 0.0;
    }
    indexOfDistance(distance) {
        // TODO: Binary search the first value that is not less than partialDistance
        const idx = this.cumulativeLengths.findIndex((value) => value >= distance);
        if (idx === undefined) {
            // Should not be possible
            throw new Error("Cumulative lengths or distance wrongly programmed");
        }
        else {
            return idx;
        }
    }
    /**
     * Calculates the position of the slider at the given progress.
     * @param progress a number between 0 (head) and 1 (tail/repeat)
     */
    positionAt(progress) {
        const partialDistance = this.distance * (0, index_1.clamp)(progress, 0, 1);
        return this.interpolateVertices(this.indexOfDistance(partialDistance), partialDistance);
    }
    // d: double
    interpolateVertices(i, d) {
        const calculatedPath = this.calculatedPath;
        if (calculatedPath.length === 0)
            return index_1.Vec2.Zero;
        if (i <= 0)
            return calculatedPath[0];
        if (i >= calculatedPath.length)
            return calculatedPath[calculatedPath.length - 1];
        const p1 = calculatedPath[i - 1];
        const p2 = calculatedPath[i];
        const d1 = this.cumulativeLengths[i - 1];
        const d2 = this.cumulativeLengths[i];
        if ((0, index_1.doubleEqual)(d1, d2)) {
            return p1;
        }
        // Number between 0 and 1
        const z = (d - d1) / (d2 - d1);
        return index_1.Vec2.interpolate(p1, p2, z);
    }
}
exports.SliderPath = SliderPath;


/***/ }),

/***/ "./src/core/index.ts":
/*!***************************!*\
  !*** ./src/core/index.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseReplayFramesFromRaw = exports.parseBlueprint = void 0;
// audio
__exportStar(__webpack_require__(/*! ./audio/HitSampleInfo */ "./src/core/audio/HitSampleInfo.ts"), exports);
// beatmap
__exportStar(__webpack_require__(/*! ./beatmap/ControlPoints/ControlPoint */ "./src/core/beatmap/ControlPoints/ControlPoint.ts"), exports);
__exportStar(__webpack_require__(/*! ./beatmap/ControlPoints/ControlPointGroup */ "./src/core/beatmap/ControlPoints/ControlPointGroup.ts"), exports);
__exportStar(__webpack_require__(/*! ./beatmap/ControlPoints/DifficultyControlPoint */ "./src/core/beatmap/ControlPoints/DifficultyControlPoint.ts"), exports);
__exportStar(__webpack_require__(/*! ./beatmap/ControlPoints/TimingControlPoint */ "./src/core/beatmap/ControlPoints/TimingControlPoint.ts"), exports);
__exportStar(__webpack_require__(/*! ./mods/HardRockMod */ "./src/core/mods/HardRockMod.ts"), exports);
__exportStar(__webpack_require__(/*! ./mods/Mods */ "./src/core/mods/Mods.ts"), exports);
__exportStar(__webpack_require__(/*! ./mods/StackingMod */ "./src/core/mods/StackingMod.ts"), exports);
__exportStar(__webpack_require__(/*! ./beatmap/BeatmapBuilder */ "./src/core/beatmap/BeatmapBuilder.ts"), exports);
__exportStar(__webpack_require__(/*! ./beatmap/BeatmapDifficulty */ "./src/core/beatmap/BeatmapDifficulty.ts"), exports);
__exportStar(__webpack_require__(/*! ./beatmap/Beatmap */ "./src/core/beatmap/Beatmap.ts"), exports);
// blueprints
__exportStar(__webpack_require__(/*! ./blueprint/Blueprint */ "./src/core/blueprint/Blueprint.ts"), exports);
__exportStar(__webpack_require__(/*! ./blueprint/HitObjectSettings */ "./src/core/blueprint/HitObjectSettings.ts"), exports);
var BlueprintParser_1 = __webpack_require__(/*! ./blueprint/BlueprintParser */ "./src/core/blueprint/BlueprintParser.ts");
Object.defineProperty(exports, "parseBlueprint", ({ enumerable: true, get: function () { return BlueprintParser_1.parseBlueprint; } }));
// hitobjects
__exportStar(__webpack_require__(/*! ./hitobjects/slider/PathApproximator */ "./src/core/hitobjects/slider/PathApproximator.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/slider/PathControlPoint */ "./src/core/hitobjects/slider/PathControlPoint.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/slider/PathType */ "./src/core/hitobjects/slider/PathType.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/slider/SliderPath */ "./src/core/hitobjects/slider/SliderPath.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/HitCircle */ "./src/core/hitobjects/HitCircle.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/Types */ "./src/core/hitobjects/Types.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/Slider */ "./src/core/hitobjects/Slider.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/SliderCheckPoint */ "./src/core/hitobjects/SliderCheckPoint.ts"), exports);
__exportStar(__webpack_require__(/*! ./hitobjects/Spinner */ "./src/core/hitobjects/Spinner.ts"), exports);
// gameplay
__exportStar(__webpack_require__(/*! ./gameplay/GameplayAnalysisEvent */ "./src/core/gameplay/GameplayAnalysisEvent.ts"), exports);
__exportStar(__webpack_require__(/*! ./gameplay/GameplayInfo */ "./src/core/gameplay/GameplayInfo.ts"), exports);
__exportStar(__webpack_require__(/*! ./gameplay/GameState */ "./src/core/gameplay/GameState.ts"), exports);
__exportStar(__webpack_require__(/*! ./gameplay/GameStateEvaluator */ "./src/core/gameplay/GameStateEvaluator.ts"), exports);
__exportStar(__webpack_require__(/*! ./gameplay/GameStateTimeMachine */ "./src/core/gameplay/GameStateTimeMachine.ts"), exports);
__exportStar(__webpack_require__(/*! ./gameplay/Verdicts */ "./src/core/gameplay/Verdicts.ts"), exports);
// replays
__exportStar(__webpack_require__(/*! ./replays/RawReplayData */ "./src/core/replays/RawReplayData.ts"), exports);
__exportStar(__webpack_require__(/*! ./replays/Replay */ "./src/core/replays/Replay.ts"), exports);
__exportStar(__webpack_require__(/*! ./replays/ReplayClicks */ "./src/core/replays/ReplayClicks.ts"), exports);
var ReplayParser_1 = __webpack_require__(/*! ./replays/ReplayParser */ "./src/core/replays/ReplayParser.ts");
Object.defineProperty(exports, "parseReplayFramesFromRaw", ({ enumerable: true, get: function () { return ReplayParser_1.parseReplayFramesFromRaw; } }));
__exportStar(__webpack_require__(/*! ./playfield */ "./src/core/playfield.ts"), exports);
__exportStar(__webpack_require__(/*! ./utils/index */ "./src/core/utils/index.ts"), exports);


/***/ }),

/***/ "./src/core/mods/EasyMod.ts":
/*!**********************************!*\
  !*** ./src/core/mods/EasyMod.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EasyMod = void 0;
const ratio = 0.5;
class EasyMod {
}
exports.EasyMod = EasyMod;
EasyMod.difficultyAdjuster = (base) => (Object.assign(Object.assign({}, base), { overallDifficulty: base.overallDifficulty * ratio, approachRate: base.approachRate * ratio, drainRate: base.drainRate * ratio, circleSize: base.circleSize * ratio }));


/***/ }),

/***/ "./src/core/mods/HardRockMod.ts":
/*!**************************************!*\
  !*** ./src/core/mods/HardRockMod.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HardRockMod = void 0;
const Types_1 = __webpack_require__(/*! ../hitobjects/Types */ "./src/core/hitobjects/Types.ts");
const playfield_1 = __webpack_require__(/*! ../playfield */ "./src/core/playfield.ts");
function flipY(position) {
    const { x, y } = position;
    return { x, y: playfield_1.OSU_PLAYFIELD_HEIGHT - y };
}
class HardRockMod {
}
exports.HardRockMod = HardRockMod;
HardRockMod.difficultyAdjuster = (base) => (Object.assign(Object.assign({}, base), { overallDifficulty: Math.min(10, base.overallDifficulty * 1.4), approachRate: Math.min(10, base.approachRate * 1.4), drainRate: Math.min(10, base.drainRate * 1.4), circleSize: Math.min(10, base.circleSize * 1.3) }));
HardRockMod.flipVertically = (hitObjects) => {
    hitObjects.forEach((h) => {
        if ((0, Types_1.isHitCircle)(h)) {
            h.position = flipY(h.position);
            h.unstackedPosition = flipY(h.unstackedPosition);
        }
        else if ((0, Types_1.isSlider)(h)) {
            // TODO: Need to set invalid as well or just recreate the checkpoints from control points
            h.head.position = flipY(h.head.position);
            h.head.unstackedPosition = flipY(h.head.unstackedPosition);
            h.path.controlPoints.forEach((p) => {
                p.offset.y *= -1;
            });
            h.path.makeInvalid();
            h.checkPoints.forEach((p) => {
                p.offset.y *= -1;
            });
        }
    });
};


/***/ }),

/***/ "./src/core/mods/Mods.ts":
/*!*******************************!*\
  !*** ./src/core/mods/Mods.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RELAX_LENIENCY = exports.ModSettings = exports.OsuClassicMods = void 0;
const HardRockMod_1 = __webpack_require__(/*! ./HardRockMod */ "./src/core/mods/HardRockMod.ts");
const EasyMod_1 = __webpack_require__(/*! ./EasyMod */ "./src/core/mods/EasyMod.ts");
// https://osu.ppy.sh/wiki/en/Game_modifier
exports.OsuClassicMods = [
    "EASY",
    "HALF_TIME",
    "NO_FAIL",
    "HARD_ROCK",
    "SUDDEN_DEATH",
    "PERFECT",
    "DOUBLE_TIME",
    "NIGHT_CORE",
    "HIDDEN",
    "FLASH_LIGHT",
    "AUTO_PLAY",
    "AUTO_PILOT",
    "RELAX",
    "SPUN_OUT",
    "SCORE_V2",
];
exports.ModSettings = {
    EASY: {
        name: "Easy",
        difficultyAdjuster: EasyMod_1.EasyMod.difficultyAdjuster,
        scoreMultiplier: 0.5,
    },
    HARD_ROCK: {
        name: "Hard Rock",
        scoreMultiplier: 1.06,
        difficultyAdjuster: HardRockMod_1.HardRockMod.difficultyAdjuster,
    },
    DOUBLE_TIME: { name: "Double Time", scoreMultiplier: 1.12 },
    FLASH_LIGHT: { name: "Flash Light", scoreMultiplier: 1.12 },
    HALF_TIME: { name: "Half Time", scoreMultiplier: 0.3 },
    HIDDEN: { name: "Hidden", scoreMultiplier: 1.06 },
    NIGHT_CORE: { name: "Night Core", scoreMultiplier: 1.12 },
    NO_FAIL: { name: "No Fail", scoreMultiplier: 0.5 },
    AUTO_PLAY: { name: "Auto Play" },
    AUTO_PILOT: { name: "Auto Pilot" },
    PERFECT: { name: "Perfect" },
    RELAX: { name: "Relax" },
    SCORE_V2: { name: "Score V2" },
    SPUN_OUT: { name: "Spun Out" },
    SUDDEN_DEATH: { name: "Sudden Death" },
};
// How early before a hitobject's time Relax can hit. (in ms)
exports.RELAX_LENIENCY = 12;


/***/ }),

/***/ "./src/core/mods/StackingMod.ts":
/*!**************************************!*\
  !*** ./src/core/mods/StackingMod.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.modifyStackingPosition = void 0;
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const Types_1 = __webpack_require__(/*! ../hitobjects/Types */ "./src/core/hitobjects/Types.ts");
function stackOffset(stackHeight, scale) {
    const value = (0, index_1.float32_mul)(stackHeight, (0, index_1.float32_mul)(scale, -6.4));
    return { x: value, y: value };
}
function stackedPosition(initialPosition, stackHeight, scale) {
    const offset = stackOffset(stackHeight, scale);
    return index_1.Vec2.add(initialPosition, offset);
}
const STACK_DISTANCE = 3;
// I refuse to put an endPosition and endTime into HitCircle just because it's then easier to code it here
// How does it even make sense that an HitCircle has an "endPosition" or "endTime".
// Or how does it make sense that a Spinner has a stacking position, when it even doesn't have a position?
const hitCircle = (o) => ((0, Types_1.isSlider)(o) ? o.head : o);
const approachDuration = (o) => hitCircle(o).approachDuration;
const hitTime = (o) => hitCircle(o).hitTime;
const position = (o) => hitCircle(o).position;
const endPosition = (o) => ((0, Types_1.isSlider)(o) ? o.endPosition : o.position);
const endTime = (o) => ((0, Types_1.isSlider)(o) ? o.endTime : o.hitTime);
function createStackingHeights(hitObjects) {
    const stackingHeights = new Map();
    function setH(o, val) {
        stackingHeights.set(hitCircle(o).id, val);
    }
    function H(o) {
        var _a;
        return (_a = stackingHeights.get(hitCircle(o).id)) !== null && _a !== void 0 ? _a : 0;
    }
    // They all have 0 as stack heights
    for (const ho of hitObjects) {
        if (!(0, Types_1.isSpinner)(ho)) {
            setH(ho, 0);
        }
    }
    return { stackingHeights, setH, H };
}
function newStackingHeights(hitObjects, stackLeniency) {
    const startIndex = 0;
    const endIndex = hitObjects.length - 1;
    const extendedEndIndex = endIndex;
    const { stackingHeights, setH, H } = createStackingHeights(hitObjects);
    // Reverse pass for stack calculation
    let extendedStartIndex = startIndex;
    for (let i = extendedEndIndex; i > startIndex; i--) {
        let n = i;
        let objectI = hitObjects[i];
        if ((0, Types_1.isSpinner)(objectI) || H(objectI) !== 0)
            continue;
        const stackThreshold = approachDuration(objectI) * stackLeniency;
        if ((0, Types_1.isHitCircle)(objectI)) {
            while (--n >= 0) {
                const objectN = hitObjects[n];
                if ((0, Types_1.isSpinner)(objectN))
                    break;
                if (hitTime(objectI) - endTime(objectN) > stackThreshold)
                    break;
                if (n < extendedStartIndex) {
                    setH(objectN, 0);
                    extendedStartIndex = n;
                }
                if ((0, Types_1.isSlider)(objectN) && index_1.Vec2.distance(endPosition(objectN), position(objectI)) < STACK_DISTANCE) {
                    const offset = H(objectI) - H(objectN) + 1;
                    for (let j = n + 1; j <= i; j++) {
                        const objectJ = hitObjects[j];
                        if ((0, Types_1.isSpinner)(objectJ))
                            continue; // TODO: Inserted, but not sure
                        if (index_1.Vec2.distance(endPosition(objectN), position(objectJ)) < STACK_DISTANCE) {
                            setH(objectJ, H(objectJ) - offset);
                        }
                    }
                    break;
                }
                if (index_1.Vec2.distance(position(objectN), position(objectI)) < STACK_DISTANCE) {
                    setH(objectN, H(objectI) + 1);
                    objectI = objectN;
                }
            }
        }
        else {
            while (--n >= startIndex) {
                const objectN = hitObjects[n];
                if ((0, Types_1.isSpinner)(objectN))
                    continue;
                if (hitTime(objectI) - hitTime(objectN) > stackThreshold)
                    break;
                if (index_1.Vec2.distance(endPosition(objectN), position(objectI)) < STACK_DISTANCE) {
                    setH(objectN, H(objectI) + 1);
                    objectI = objectN;
                }
            }
        }
    }
    return stackingHeights;
}
function oldStackingHeights(hitObjects, stackLeniency) {
    const { stackingHeights, H, setH } = createStackingHeights(hitObjects);
    for (let i = 0; i < hitObjects.length; i++) {
        const currHitObject = hitObjects[i];
        if ((0, Types_1.isSpinner)(currHitObject))
            continue;
        if (H(currHitObject) !== 0 && !(0, Types_1.isSlider)(currHitObject)) {
            continue;
        }
        let startTime = endTime(currHitObject);
        let sliderStack = 0;
        for (let j = i + 1; j < hitObjects.length; j++) {
            const stackThreshold = approachDuration(currHitObject) * stackLeniency;
            const nextHitObject = hitObjects[j];
            if ((0, Types_1.isSpinner)(nextHitObject))
                continue;
            if (hitTime(nextHitObject) - stackThreshold > startTime) {
                break;
            }
            const position2 = (0, Types_1.isSlider)(currHitObject) ? currHitObject.endPosition : currHitObject.position;
            if (index_1.Vec2.withinDistance(position(nextHitObject), position(currHitObject), STACK_DISTANCE)) {
                setH(currHitObject, H(currHitObject) + 1);
                startTime = endTime(nextHitObject);
            }
            else if (index_1.Vec2.withinDistance(position(nextHitObject), position2, STACK_DISTANCE)) {
                sliderStack++;
                setH(nextHitObject, H(nextHitObject) - sliderStack);
                startTime = endTime(nextHitObject);
            }
        }
    }
    return stackingHeights;
}
// Modifies the hitObjects according to the stacking algorithm.
function modifyStackingPosition(hitObjects, stackLeniency, beatmapVersion) {
    const heights = (() => {
        if (beatmapVersion >= 6) {
            return newStackingHeights(hitObjects, stackLeniency);
        }
        else {
            return oldStackingHeights(hitObjects, stackLeniency);
        }
    })();
    hitObjects.forEach((hitObject) => {
        if ((0, Types_1.isSpinner)(hitObject))
            return;
        const h = hitCircle(hitObject);
        const height = heights.get(h.id);
        if (height === undefined) {
            throw Error("Stack height can't be undefined");
        }
        h.position = stackedPosition(h.position, height, h.scale);
    });
}
exports.modifyStackingPosition = modifyStackingPosition;


/***/ }),

/***/ "./src/core/playfield.ts":
/*!*******************************!*\
  !*** ./src/core/playfield.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OSU_PLAYFIELD_WIDTH = exports.OSU_PLAYFIELD_HEIGHT = void 0;
exports.OSU_PLAYFIELD_HEIGHT = 384;
exports.OSU_PLAYFIELD_WIDTH = 512;


/***/ }),

/***/ "./src/core/replays/RawReplayData.ts":
/*!*******************************************!*\
  !*** ./src/core/replays/RawReplayData.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.modsToBitmask = exports.modsFromBitmask = exports.ReplayModBit = exports.RawReplayData = void 0;
/**
 * The one that gets parsed from an .osr file
 * This is exactly like the one you would get from osr-node
 */
const Mods_1 = __webpack_require__(/*! ../mods/Mods */ "./src/core/mods/Mods.ts");
class RawReplayData {
    constructor() {
        this.gameMode = 0;
        this.gameVersion = 0;
        this.beatmapMD5 = "";
        this.playerName = "";
        this.replayMD5 = "";
        this.number_300s = 0;
        this.number_100s = 0;
        this.number_50s = 0;
        this.gekis = 0;
        this.katus = 0;
        this.misses = 0;
        this.score = 0;
        this.max_combo = 0;
        this.perfect_combo = 0;
        this.mods = 0;
        this.life_bar = "";
        this.timestamp = 0;
        this.replay_length = 0;
        this.replay_data = "";
        this.unknown = 0;
    }
}
exports.RawReplayData = RawReplayData;
// https://github.com/ppy/osu/blob/7654df94f6f37b8382be7dfcb4f674e03bd35427/osu.Game/Beatmaps/Legacy/LegacyMods.cs
exports.ReplayModBit = {
    NO_FAIL: 1 << 0,
    EASY: 1 << 1,
    // "TOUCH_DEVICE": 1 << 2,
    HIDDEN: 1 << 3,
    HARD_ROCK: 1 << 4,
    SUDDEN_DEATH: 1 << 5,
    DOUBLE_TIME: 1 << 6,
    RELAX: 1 << 7,
    HALF_TIME: 1 << 8,
    NIGHT_CORE: 1 << 9,
    FLASH_LIGHT: 1 << 10,
    AUTO_PLAY: 1 << 11,
    SPUN_OUT: 1 << 12,
    AUTO_PILOT: 1 << 13,
    PERFECT: 1 << 14,
    SCORE_V2: 1 << 29,
};
function modsFromBitmask(modMask) {
    const list = [];
    for (const mod of Mods_1.OsuClassicMods) {
        const bit = exports.ReplayModBit[mod];
        if ((modMask & bit) > 0) {
            list.push(mod);
        }
    }
    return list;
}
exports.modsFromBitmask = modsFromBitmask;
function modsToBitmask(mods) {
    let mask = 0;
    for (const mod of mods) {
        mask |= 1 << exports.ReplayModBit[mod];
    }
    return mask;
}
exports.modsToBitmask = modsToBitmask;


/***/ }),

/***/ "./src/core/replays/Replay.ts":
/*!************************************!*\
  !*** ./src/core/replays/Replay.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReplayButtonState = exports.OsuAction = void 0;
var OsuAction;
(function (OsuAction) {
    OsuAction[OsuAction["leftButton"] = 0] = "leftButton";
    OsuAction[OsuAction["rightButton"] = 1] = "rightButton";
})(OsuAction = exports.OsuAction || (exports.OsuAction = {}));
var ReplayButtonState;
(function (ReplayButtonState) {
    ReplayButtonState[ReplayButtonState["None"] = 0] = "None";
    ReplayButtonState[ReplayButtonState["Left1"] = 1] = "Left1";
    ReplayButtonState[ReplayButtonState["Right1"] = 2] = "Right1";
    ReplayButtonState[ReplayButtonState["Left2"] = 4] = "Left2";
    ReplayButtonState[ReplayButtonState["Right2"] = 8] = "Right2";
    ReplayButtonState[ReplayButtonState["Smoke"] = 16] = "Smoke";
})(ReplayButtonState = exports.ReplayButtonState || (exports.ReplayButtonState = {}));


/***/ }),

/***/ "./src/core/replays/ReplayClicks.ts":
/*!******************************************!*\
  !*** ./src/core/replays/ReplayClicks.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateReplayClicks = void 0;
function calculateReplayClicks(frames) {
    const clicks = [[], []];
    const startTime = [null, null];
    for (const frame of frames) {
        for (let i = 0; i < 2; i++) {
            // Enums are so bad in terms of type safety
            const isPressing = frame.actions.includes(i);
            if (!isPressing && startTime[i]) {
                clicks[i].push([startTime[i], frame.time]);
                startTime[i] = null;
            }
            else if (isPressing && startTime[i] === null) {
                startTime[i] = frame.time;
            }
        }
    }
    for (let i = 0; i < 2; i++) {
        if (startTime[i] !== null) {
            clicks[i].push([startTime[i], 1e9]);
        }
    }
    return clicks;
}
exports.calculateReplayClicks = calculateReplayClicks;


/***/ }),

/***/ "./src/core/replays/ReplayParser.ts":
/*!******************************************!*\
  !*** ./src/core/replays/ReplayParser.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseReplayFramesFromRaw = void 0;
const Replay_1 = __webpack_require__(/*! ./Replay */ "./src/core/replays/Replay.ts");
const MAX_COORDINATE_VALUE = 131072;
// LegacyScoreDecoder.cs
// PowerOfTwo bit
const bitmaskCheck = (mask, bit) => (mask & bit) !== 0;
const parseReplayFramesFromRaw = (rawString) => {
    const frameStrings = rawString.split(",");
    let lastTime = 0;
    const frames = [];
    for (let i = 0; i < frameStrings.length; i++) {
        const split = frameStrings[i].split("|");
        if (split.length < 4)
            continue;
        if (split[0] === "-12345") {
            // osu-lazer-comment: The seed is provided in split[3], which we'll need to use at some point
            continue;
        }
        const diff = parseFloat(split[0]);
        const mouseX = parseFloat(split[1]);
        const mouseY = parseFloat(split[2]);
        if (Math.abs(mouseX) > MAX_COORDINATE_VALUE || Math.abs(mouseY) > MAX_COORDINATE_VALUE) {
            throw Error("Value overflow while parsing mouse coordinates");
        }
        lastTime += diff;
        if (i < 2 && mouseX === 256 && mouseY === -500)
            // at the start of the replay, stable places two replay frames, at time 0 and SkipBoundary - 1, respectively.
            // both frames use a position of (256, -500).
            // ignore these frames as they serve no real purpose (and can even mislead ruleset-specific handlers - see mania)
            continue;
        // osu-lazer-comment: At some point we probably want to rewind and play back the negative-time frames
        // but for now we'll achieve equal playback to stable by skipping negative frames
        if (diff < 0)
            continue;
        const actions = [];
        const b = parseInt(split[3]);
        if (bitmaskCheck(b, Replay_1.ReplayButtonState.Left1) || bitmaskCheck(b, Replay_1.ReplayButtonState.Left2))
            actions.push(Replay_1.OsuAction.leftButton);
        if (bitmaskCheck(b, Replay_1.ReplayButtonState.Right1) || bitmaskCheck(b, Replay_1.ReplayButtonState.Right2))
            actions.push(Replay_1.OsuAction.rightButton);
        frames.push({ actions, position: { x: mouseX, y: mouseY }, time: lastTime });
    }
    // We do the following merging because some frames have the same time, but the actions have to be merged together.
    const mergedFrames = [];
    let last;
    for (let i = 0; i < frames.length; i++) {
        if (last === undefined || frames[i].time !== last.time) {
            mergedFrames.push(frames[i]);
            last = frames[i];
        }
        else {
            for (let j = 0; j < frames[i].actions.length; j++) {
                const a = frames[i].actions[j];
                if (!last.actions.includes(a)) {
                    last.actions.push(a);
                }
            }
            last.actions.sort();
        }
    }
    return mergedFrames;
};
exports.parseReplayFramesFromRaw = parseReplayFramesFromRaw;


/***/ }),

/***/ "./src/core/utils/SortedList.ts":
/*!**************************************!*\
  !*** ./src/core/utils/SortedList.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SortedList = void 0;
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
class SortedList {
    constructor() {
        this.list = [];
    }
    // binary search or not -> the insert/remove is also O(n) ....
    indexOf(t) {
        return this.list.findIndex((value) => (0, index_1.floatEqual)(t.compareTo(value), 0));
    }
    // This will also maintain insertion order, which means that adding a 2' to [1, 2, 3] will result to [1, 2, 2', 3].
    add(t) {
        const i = this.list.findIndex((value) => t.compareTo(value) < 0);
        if (i === -1) {
            // This means that there is no element that is larger than the given value
            this.list.splice(this.list.length, 0, t);
        }
        else {
            this.list.splice(i, 0, t);
        }
    }
    remove(t) {
        const i = this.indexOf(t);
        if (i > -1) {
            this.list.splice(i, 1);
        }
    }
    get(i) {
        return this.list[i];
    }
    get length() {
        return this.list.length;
    }
}
exports.SortedList = SortedList;


/***/ }),

/***/ "./src/core/utils/index.ts":
/*!*********************************!*\
  !*** ./src/core/utils/index.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.determineDefaultPlaybackSpeed = exports.normalizeHitObjects = void 0;
const Slider_1 = __webpack_require__(/*! ../hitobjects/Slider */ "./src/core/hitobjects/Slider.ts");
function normalizeHitObjects(hitObjects) {
    const hitObjectById = {};
    hitObjects.forEach((h) => {
        hitObjectById[h.id] = h;
        if (h instanceof Slider_1.Slider) {
            hitObjectById[h.head.id] = h.head;
            for (const c of h.checkPoints) {
                hitObjectById[c.id] = c;
            }
        }
    });
    return hitObjectById;
}
exports.normalizeHitObjects = normalizeHitObjects;
function determineDefaultPlaybackSpeed(mods) {
    for (let i = 0; i < mods.length; i++) {
        if (mods[i] === "DOUBLE_TIME" || mods[i] === "NIGHT_CORE")
            return 1.5;
        if (mods[i] === "HALF_TIME")
            return 0.75;
    }
    return 1.0;
}
exports.determineDefaultPlaybackSpeed = determineDefaultPlaybackSpeed;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildBeatmap = exports.parseBlueprint = void 0;
var index_1 = __webpack_require__(/*! ./core/index */ "./src/core/index.ts");
Object.defineProperty(exports, "parseBlueprint", ({ enumerable: true, get: function () { return index_1.parseBlueprint; } }));
Object.defineProperty(exports, "buildBeatmap", ({ enumerable: true, get: function () { return index_1.buildBeatmap; } }));
__exportStar(__webpack_require__(/*! ./lib/pp */ "./src/lib/pp.ts"), exports);
__exportStar(__webpack_require__(/*! ./lib/diff */ "./src/lib/diff.ts"), exports);


/***/ }),

/***/ "./src/lib/diff.ts":
/*!*************************!*\
  !*** ./src/lib/diff.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateDifficultyAttributes = void 0;
// Strain
const index_1 = __webpack_require__(/*! ../core/index */ "./src/core/index.ts");
const index_2 = __webpack_require__(/*! ../math/index */ "./src/math/index.ts");
const aim_1 = __webpack_require__(/*! ./skills/aim */ "./src/lib/skills/aim.ts");
const speed_1 = __webpack_require__(/*! ./skills/speed */ "./src/lib/skills/speed.ts");
const flashlight_1 = __webpack_require__(/*! ./skills/flashlight */ "./src/lib/skills/flashlight.ts");
// TODO: Utilitiy functions?
const startTime = (o) => ((0, index_1.isHitCircle)(o) ? o.hitTime : o.startTime);
const endTime = (o) => ((0, index_1.isHitCircle)(o) ? o.hitTime : o.endTime);
const position = (o) => ((0, index_1.isHitCircle)(o) ? o.position : o.head.position);
const normalised_radius = 50.0;
const maximum_slider_radius = normalised_radius * 2.4;
const assumed_slider_radius = normalised_radius * 1.8;
function computeSliderCursorPosition(slider) {
    const lazyTravelTime = slider.checkPoints[slider.checkPoints.length - 1].hitTime - slider.startTime;
    // float
    let lazyTravelDistance = 0;
    let endTimeMin = lazyTravelTime / slider.spanDuration;
    // TODO: Control this code again
    if (endTimeMin % 2 >= 1)
        endTimeMin = 1 - (endTimeMin % 1);
    else
        endTimeMin %= 1;
    // temporary lazy end position until a real result can be derived.
    let lazyEndPosition = index_2.Vec2.add(slider.startPosition, slider.path.positionAt(endTimeMin));
    let currCursorPosition = slider.startPosition;
    const scalingFactor = normalised_radius / slider.radius; // lazySliderDistance is coded to be sensitive to scaling,
    // this makes the maths easier with the thresholds being
    // used.
    const numCheckPoints = slider.checkPoints.length;
    // We start from 0 because the head is NOT a slider checkpoint here
    for (let i = 0; i < numCheckPoints; i++) {
        const currMovementObj = slider.checkPoints[i];
        // This is where we have to be very careful due to osu!lazer using their VISUAL RENDERING POSITION instead of
        // JUDGEMENT POSITION for their last tick. bruh
        const currMovementObjPosition = currMovementObj.type === "LAST_LEGACY_TICK" ? slider.endPosition : currMovementObj.position;
        let currMovement = index_2.Vec2.sub(currMovementObjPosition, currCursorPosition);
        let currMovementLength = scalingFactor * currMovement.length();
        // Amount of movement required so that the cursor position needs to be updated.
        let requiredMovement = assumed_slider_radius;
        if (i === numCheckPoints - 1) {
            // The end of a slider has special aim rules due to the relaxed time constraint on position.
            // There is both a lazy end position as well as the actual end slider position. We assume the player takes the
            // simpler movement. For sliders that are circular, the lazy end position may actually be farther away than the
            // sliders true end. This code is designed to prevent buffing situations where lazy end is actually a less
            // efficient movement.
            const lazyMovement = index_2.Vec2.sub(lazyEndPosition, currCursorPosition);
            if (lazyMovement.length() < currMovement.length())
                currMovement = lazyMovement;
            currMovementLength = scalingFactor * currMovement.length();
        }
        else if (currMovementObj.type === "REPEAT") {
            // For a slider repeat, assume a tighter movement threshold to better assess repeat sliders.
            requiredMovement = normalised_radius;
        }
        if (currMovementLength > requiredMovement) {
            // this finds the positional delta from the required radius and the current position, and updates the
            // currCursorPosition accordingly, as well as rewarding distance.
            currCursorPosition = index_2.Vec2.add(currCursorPosition, index_2.Vec2.scale(currMovement, (0, index_2.float32_div)(currMovementLength - requiredMovement, currMovementLength)));
            currMovementLength *= (currMovementLength - requiredMovement) / currMovementLength;
            lazyTravelDistance = (0, index_2.float32_add)(lazyTravelDistance, currMovementLength);
        }
        if (i === numCheckPoints - 1)
            lazyEndPosition = currCursorPosition;
    }
    lazyTravelDistance = (0, index_2.float32_mul)(lazyTravelDistance, Math.pow(1 + slider.repeatCount / 2.5, 1.0 / 2.5)); // Bonus for
    // repeat
    // sliders
    // until a
    // better
    // per nested object strain system can be
    // achieved.
    return { lazyTravelTime, lazyTravelDistance, lazyEndPosition };
}
const defaultOsuDifficultyHitObject = () => ({
    deltaTime: 0,
    travelTime: 0,
    travelDistance: 0,
    jumpDistance: 0,
    movementDistance: 0,
    movementTime: 0,
    strainTime: 0,
    endTime: 0,
    startTime: 0,
    angle: null,
});
/**
 * Returns n OsuDifficultyHitObjects where the first one is a dummy value
 */
function preprocessDifficultyHitObject(hitObjects, clockRate) {
    const difficultyHitObjects = [defaultOsuDifficultyHitObject()];
    const min_delta_time = 25;
    const clockAdjusted = (x) => x / clockRate;
    // Caching for the sliders
    const sliderCursorPosition = {};
    function computeSliderCursorPositionIfNeeded(s) {
        if (sliderCursorPosition[s.id] === undefined) {
            sliderCursorPosition[s.id] = computeSliderCursorPosition(s);
        }
        return sliderCursorPosition[s.id];
    }
    for (let i = 1; i < hitObjects.length; i++) {
        const lastLast = hitObjects[i - 2];
        const last = hitObjects[i - 1];
        const current = hitObjects[i];
        const difficultyHitObject = (function calculateDifficultyHitObject() {
            const result = defaultOsuDifficultyHitObject();
            result.startTime = clockAdjusted(startTime(current));
            result.endTime = clockAdjusted(endTime(current));
            result.deltaTime = clockAdjusted(startTime(current) - startTime(last));
            const strainTime = Math.max(result.deltaTime, min_delta_time);
            result.strainTime = strainTime;
            if ((0, index_1.isSpinner)(current) || (0, index_1.isSpinner)(last))
                return result;
            // float
            let scalingFactor = (0, index_2.float32_div)(normalised_radius, current.radius);
            // Now current is either HitCircle or Slider
            if (current.radius < 30) {
                const smallCircleBonus = (0, index_2.float32_div)(Math.min(30 - current.radius, 5), 50);
                scalingFactor *= 1 + smallCircleBonus;
            }
            function getEndCursorPosition(o) {
                if ((0, index_1.isHitCircle)(o))
                    return o.position;
                const { lazyEndPosition } = computeSliderCursorPositionIfNeeded(o);
                return lazyEndPosition !== null && lazyEndPosition !== void 0 ? lazyEndPosition : o.startPosition; // TODO: How can it be nullable?
            }
            const lastCursorPosition = getEndCursorPosition(last);
            // sqrt((x1*c-x2*c)^2+(y1*c-y2*c)^2) = sqrt(c^2 (x1-x2)^2 + c^2 (y1-y2)^2) = c * dist((x1,y1),(x2,y2))
            result.jumpDistance = index_2.Vec2.distance(index_2.Vec2.scale(position(current), scalingFactor), index_2.Vec2.scale(lastCursorPosition, scalingFactor));
            if ((0, index_1.isSlider)(last)) {
                // No need to store into the Slider object!
                const { lazyTravelTime: lastSliderLazyTravelTime, lazyTravelDistance: lastSliderLazyTravelDistance } = computeSliderCursorPositionIfNeeded(last);
                result.travelDistance = lastSliderLazyTravelDistance;
                result.travelTime = Math.max(lastSliderLazyTravelTime / clockRate, min_delta_time);
                result.movementTime = Math.max(strainTime - result.travelTime, min_delta_time);
                // tailCircle.StackedPosition
                const tailJumpDistance = (0, index_2.float32)(index_2.Vec2.distance(last.endPosition, position(current)) * scalingFactor);
                result.movementDistance = Math.max(0, Math.min(result.jumpDistance - (maximum_slider_radius - assumed_slider_radius), tailJumpDistance - maximum_slider_radius));
            }
            else {
                result.movementTime = strainTime;
                result.movementDistance = result.jumpDistance;
            }
            if (lastLast !== undefined && !(0, index_1.isSpinner)(lastLast)) {
                const lastLastCursorPosition = getEndCursorPosition(lastLast);
                const v1 = index_2.Vec2.sub(lastLastCursorPosition, position(last));
                const v2 = index_2.Vec2.sub(position(current), lastCursorPosition);
                const dot = (0, index_2.float32)(index_2.Vec2.dot(v1, v2));
                const det = (0, index_2.float32_add)((0, index_2.float32_mul)(v1.x, v2.y), -(0, index_2.float32_mul)(v1.y, v2.x));
                result.angle = Math.abs(Math.atan2(det, dot));
            }
            return result;
        })();
        difficultyHitObjects.push(difficultyHitObject);
    }
    return difficultyHitObjects;
}
function determineMaxCombo(hitObjects) {
    let maxCombo = 0;
    let hitCircleCount = 0, sliderCount = 0, spinnerCount = 0;
    for (const o of hitObjects) {
        maxCombo++;
        if ((0, index_1.isHitCircle)(o))
            hitCircleCount++;
        if ((0, index_1.isSpinner)(o))
            spinnerCount++;
        if ((0, index_1.isSlider)(o)) {
            sliderCount++;
            maxCombo += o.checkPoints.length;
        }
    }
    return { maxCombo, hitCircleCount, sliderCount, spinnerCount };
}
const DIFFICULTY_MULTIPLIER = 0.0675;
const speedAdjustedAR = (AR, clockRate) => (0, index_2.approachDurationToApproachRate)((0, index_2.approachRateToApproachDuration)(AR) / clockRate);
const speedAdjustedOD = (OD, clockRate) => (0, index_2.hitWindowGreatToOD)((0, index_2.overallDifficultyToHitWindowGreat)(OD) / clockRate);
// Calculates the different star ratings after every hit object i
function calculateDifficultyAttributes({ appliedMods: mods, difficulty, hitObjects, controlPointInfo }, onlyFinalValue) {
    const clockRate = (0, index_1.determineDefaultPlaybackSpeed)(mods);
    const diffs = preprocessDifficultyHitObject(hitObjects, clockRate);
    const hitWindowGreat = (0, index_2.hitWindowsForOD)(difficulty.overallDifficulty, true)[0] / clockRate;
    const aimValues = (0, aim_1.calculateAim)(hitObjects, diffs, true, onlyFinalValue);
    const aimValuesNoSliders = (0, aim_1.calculateAim)(hitObjects, diffs, false, onlyFinalValue);
    const speedValues = (0, speed_1.calculateSpeed)(hitObjects, diffs, hitWindowGreat, onlyFinalValue);
    const flashlightValues = (0, flashlight_1.calculateFlashlight)(hitObjects, diffs, onlyFinalValue, mods.includes("HIDDEN"));
    const speedNotes = (0, speed_1.calculateRelevantNotes)(hitObjects, diffs, hitWindowGreat, onlyFinalValue);
    // Static values
    const { hitCircleCount, sliderCount, spinnerCount, maxCombo } = determineMaxCombo(hitObjects);
    const overallDifficulty = speedAdjustedOD(difficulty.overallDifficulty, clockRate);
    const approachRate = speedAdjustedAR(difficulty.approachRate, clockRate);
    const beatLength = (0, index_1.mostCommonBeatLength)({
        hitObjects,
        timingPoints: controlPointInfo.timingPoints.list,
    });
    const mostCommonBPM = (beatLength === undefined ? 0 : (0, index_2.beatLengthToBPM)(beatLength)) * clockRate;
    const attributes = [];
    for (let i = 0; i < aimValues.length; i++) {
        let aimRating = Math.sqrt(aimValues[i]) * DIFFICULTY_MULTIPLIER;
        const aimRatingNoSliders = Math.sqrt(aimValuesNoSliders[i]) * DIFFICULTY_MULTIPLIER;
        let speedRating = Math.sqrt(speedValues[i]) * DIFFICULTY_MULTIPLIER;
        let flashlightRating = Math.sqrt(flashlightValues[i]) * DIFFICULTY_MULTIPLIER;
        const sliderFactor = aimRating > 0 ? aimRatingNoSliders / aimRating : 1;
        if (mods.includes("RELAX")) {
            aimRating *= 0.9;
            speedRating = 0;
            flashlightRating *= 0.7;
        }
        const baseAimPerformance = Math.pow(5 * Math.max(1, aimRating / 0.0675) - 4, 3) / 100000;
        const baseSpeedPerformance = Math.pow(5 * Math.max(1, speedRating / 0.0675) - 4, 3) / 100000;
        let baseFlashlightPerformance = 0.0;
        if (mods.includes("FLASH_LIGHT"))
            baseFlashlightPerformance = Math.pow(flashlightRating, 2.0) * 25.0;
        const basePerformance = Math.pow(Math.pow(baseAimPerformance, 1.1) +
            Math.pow(baseSpeedPerformance, 1.1) +
            Math.pow(baseFlashlightPerformance, 1.1), 1.0 / 1.1);
        const starRating = basePerformance > 0.00001
            ? Math.cbrt(1.14) * 0.027 * (Math.cbrt((100000 / Math.pow(2, 1 / 1.1)) * basePerformance) + 4)
            : 0;
        attributes.push({
            aimDifficulty: aimRating,
            speedDifficulty: speedRating,
            flashlightDifficulty: flashlightRating,
            sliderFactor,
            speedNotes,
            starRating,
            // These are actually redundant but idc
            hitCircleCount,
            sliderCount,
            spinnerCount,
            maxCombo,
            overallDifficulty,
            approachRate,
            mostCommonBPM,
            drainRate: difficulty.drainRate,
        });
    }
    return attributes;
}
exports.calculateDifficultyAttributes = calculateDifficultyAttributes;


/***/ }),

/***/ "./src/lib/pp.ts":
/*!***********************!*\
  !*** ./src/lib/pp.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculatePerformanceAttributes = void 0;
const index_1 = __webpack_require__(/*! ../core/index */ "./src/core/index.ts");
const index_2 = __webpack_require__(/*! ../math/index */ "./src/math/index.ts");
function calculatePerformanceAttributes(beatmapParams, scoreParams) {
    var _a;
    const { hitCircleCount, sliderCount, spinnerCount, aimDifficulty, speedDifficulty, flashlightDifficulty, approachRate, drainRate, overallDifficulty, sliderFactor, maxCombo: beatmapMaxCombo, speedNotes } = beatmapParams;
    const { mods, countMeh, countGreat, countMiss, countOk, maxCombo: scoreMaxCombo } = scoreParams;
    const accuracy = (_a = (0, index_1.osuStableAccuracy)([countGreat, countOk, countMeh, countMiss])) !== null && _a !== void 0 ? _a : 0;
    const totalHits = countGreat + countOk + countMeh + countMiss;
    let effectiveMissCount = (function calculateEffectiveMissCount() {
        // Guess the number of misses + slider breaks from combo
        let comboBasedMissCount = 0.0;
        if (sliderCount > 0) {
            const fullComboThreshold = beatmapMaxCombo - 0.1 * sliderCount;
            if (scoreMaxCombo < fullComboThreshold)
                comboBasedMissCount = fullComboThreshold / Math.max(1.0, scoreMaxCombo);
        }
        // Clamp misscount since it's derived from combo and can be higher than total hits and that breaks some calculations
        comboBasedMissCount = Math.min(comboBasedMissCount, totalHits);
        return Math.max(countMiss, comboBasedMissCount);
    })();
    let multiplier = 1.14;
    if (mods.includes("NO_FAIL"))
        multiplier *= Math.max(0.9, 1 - 0.02 * effectiveMissCount);
    if (mods.includes("SPUN_OUT"))
        multiplier *= 1.0 - Math.pow(spinnerCount / totalHits, 0.85);
    if (mods.includes("RELAX")) {
        const okMultiplier = Math.max(0.0, overallDifficulty > 0.0 ? 1 - Math.pow(overallDifficulty / 13.33, 1.8) : 1.0);
        const mehMultiplier = Math.max(0.0, overallDifficulty > 0.0 ? 1 - Math.pow(overallDifficulty / 13.33, 5) : 1.0);
        effectiveMissCount = Math.min(effectiveMissCount + countOk * okMultiplier + countMeh * mehMultiplier, totalHits);
        multiplier *= 0.6;
    }
    const comboScalingFactor = beatmapMaxCombo <= 0 ? 1.0 : Math.min(Math.pow(scoreMaxCombo, 0.8) / Math.pow(beatmapMaxCombo, 0.8), 1.0);
    const aimValue = (function computeAimValue() {
        let rawAim = aimDifficulty;
        if (mods.includes("TOUCH_DEVICE"))
            rawAim = Math.pow(rawAim, 0.8);
        let aimValue = Math.pow(5.0 * Math.max(1.0, rawAim / 0.0675) - 4.0, 3.0) / 100000.0;
        const lengthBonus = 0.95 + 0.4 * Math.min(1.0, totalHits / 2000.0) + (totalHits > 2000 ? Math.log10(totalHits / 2000.0) * 0.5 : 0.0);
        aimValue *= lengthBonus;
        if (effectiveMissCount > 0)
            aimValue *= 0.97 * Math.pow(1 - Math.pow(effectiveMissCount / totalHits, 0.775), effectiveMissCount);
        aimValue *= comboScalingFactor;
        let approachRateFactor = 0.0;
        if (approachRate > 10.33)
            approachRateFactor = 0.3 * (approachRate - 10.33);
        else if (approachRate < 8)
            approachRateFactor = 0.05 * (8.0 - approachRate);
        if (mods.includes("RELAX"))
            approachRateFactor = 0.0;
        aimValue *= 1.0 + approachRateFactor * lengthBonus; // Buff for long maps with high AR
        if (mods.includes("BLINDS")) {
            aimValue *=
                1.3 +
                    totalHits *
                        (0.0016 / (1 + 2 * effectiveMissCount)) *
                        Math.pow(accuracy, 16) *
                        (1 - 0.003 * drainRate * drainRate);
        }
        else if (mods.includes("HIDDEN")) {
            // Rewarding low AR when there is HD -> this nerfs high AR and buffs low AR
            aimValue *= 1.0 + 0.04 * (12.0 - approachRate);
        }
        // We assume 15% of sliders in a map are difficult since there's no way to tell from the performance calculator.
        const estimateDifficultSliders = sliderCount * 0.15;
        if (sliderCount > 0) {
            const estimateSliderEndsDropped = (0, index_2.clamp)(Math.min(countOk + countMeh + countMiss, beatmapMaxCombo - scoreMaxCombo), 0, estimateDifficultSliders);
            const sliderNerfFactor = (1 - sliderFactor) * Math.pow(1 - estimateSliderEndsDropped / estimateDifficultSliders, 3) + sliderFactor;
            aimValue *= sliderNerfFactor;
        }
        aimValue *= accuracy;
        aimValue *= 0.98 + Math.pow(overallDifficulty, 2) / 2500;
        return aimValue;
    })();
    const speedValue = (function computeSpeedValue() {
        const relevantTotalDiff = totalHits - speedNotes;
        const relevantCountGreat = Math.max(0, countGreat - relevantTotalDiff);
        const relevantCountOk = Math.max(0, countOk - Math.max(0, relevantTotalDiff - countGreat));
        const relevantCountMeh = Math.max(0, countMeh - Math.max(0, relevantTotalDiff - countGreat - countOk));
        const relevantAccuracy = speedNotes == 0 ? 0 : (relevantCountGreat * 6.0 + relevantCountOk * 2.0 + relevantCountMeh) / (speedNotes * 6.0);
        let speedValue = Math.pow(5.0 * Math.max(1.0, speedDifficulty / 0.0675) - 4.0, 3.0) / 100000.0;
        const lengthBonus = 0.95 + 0.4 * Math.min(1.0, totalHits / 2000.0) + (totalHits > 2000 ? Math.log10(totalHits / 2000.0) * 0.5 : 0.0);
        speedValue *= lengthBonus;
        // Penalize misses by assessing # of misses relative to the total # of objects. Default a 3% reduction for any # of
        // misses.
        if (effectiveMissCount > 0)
            speedValue *=
                0.97 * Math.pow(1 - Math.pow(effectiveMissCount / totalHits, 0.775), Math.pow(effectiveMissCount, 0.875));
        speedValue *= comboScalingFactor;
        let approachRateFactor = 0.0;
        if (approachRate > 10.33)
            approachRateFactor = 0.3 * (approachRate - 10.33);
        speedValue *= 1.0 + approachRateFactor * lengthBonus; // Buff for longer maps with high AR.
        if (mods.includes("BLINDS")) {
            // Increasing the speed value by object count for Blinds isn't ideal, so the minimum buff is given.
            speedValue *= 1.12;
        }
        else if (mods.includes("HIDDEN")) {
            // We want to give more reward for lower AR when it comes to aim and HD. This nerfs high AR and buffs lower AR.
            speedValue *= 1.0 + 0.04 * (12.0 - approachRate);
        }
        // Scale the speed value with accuracy and OD.
        speedValue *=
            (0.95 + Math.pow(overallDifficulty, 2) / 750) * Math.pow((accuracy + relevantAccuracy) / 2.0, (14.5 - Math.max(overallDifficulty, 8)) / 2);
        // Scale the speed value with # of 50s to punish double-tapping.
        speedValue *= Math.pow(0.99, countMeh < totalHits / 500.0 ? 0 : countMeh - totalHits / 500.0);
        return speedValue;
    })();
    const accuracyValue = (function computeAccuracyValue() {
        if (mods.includes("RELAX"))
            return 0.0;
        // This percentage only considers HitCircles of any value - in this part of the calculation we focus on hitting the
        // timing hit window.
        let betterAccuracyPercentage;
        const amountHitObjectsWithAccuracy = hitCircleCount;
        if (amountHitObjectsWithAccuracy > 0)
            betterAccuracyPercentage =
                ((countGreat - (totalHits - amountHitObjectsWithAccuracy)) * 6 + countOk * 2 + countMeh) /
                    (amountHitObjectsWithAccuracy * 6.0);
        else
            betterAccuracyPercentage = 0;
        // It is possible to reach a negative accuracy with this formula. Cap it at zero - zero points.
        if (betterAccuracyPercentage < 0)
            betterAccuracyPercentage = 0;
        // Lots of arbitrary values from testing.
        // Considering to use derivation from perfect accuracy in a probabilistic manner - assume normal distribution.
        let accuracyValue = Math.pow(1.52163, overallDifficulty) * Math.pow(betterAccuracyPercentage, 24) * 2.83;
        // Bonus for many hitcircles - it's harder to keep good accuracy up for longer.
        accuracyValue *= Math.min(1.15, Math.pow(amountHitObjectsWithAccuracy / 1000.0, 0.3));
        // Increasing the accuracy value by object count for Blinds isn't ideal, so the minimum buff is given.
        if (mods.includes("BLINDS"))
            accuracyValue *= 1.14;
        else if (mods.includes("HIDDEN"))
            accuracyValue *= 1.08;
        if (mods.includes("FLASH_LIGHT"))
            accuracyValue *= 1.02;
        return accuracyValue;
    })();
    const flashlightValue = (function computeFlashLightValue() {
        if (!mods.includes("FLASH_LIGHT"))
            return 0.0;
        let rawFlashlight = flashlightDifficulty;
        if (mods.includes("TOUCH_DEVICE"))
            rawFlashlight = Math.pow(rawFlashlight, 0.8);
        let flashlightValue = Math.pow(rawFlashlight, 2.0) * 25.0;
        // if (mods.includes("HIDDEN")) flashlightValue *= 1.3;
        // Penalize misses by assessing # of misses relative to the total # of objects. Default a 3% reduction for any # of
        // misses.
        if (effectiveMissCount > 0)
            flashlightValue *=
                0.97 * Math.pow(1 - Math.pow(effectiveMissCount / totalHits, 0.775), Math.pow(effectiveMissCount, 0.875));
        flashlightValue *= comboScalingFactor;
        // Account for shorter maps having a higher ratio of 0 combo/100 combo flashlight radius.
        flashlightValue *=
            0.7 +
                0.1 * Math.min(1.0, totalHits / 200.0) +
                (totalHits > 200 ? 0.2 * Math.min(1.0, (totalHits - 200) / 200.0) : 0.0);
        // Scale the flashlight value with accuracy _slightly_.
        flashlightValue *= 0.5 + accuracy / 2.0;
        // It is important to also consider accuracy difficulty when doing that.
        flashlightValue *= 0.98 + Math.pow(overallDifficulty, 2) / 2500;
        return flashlightValue;
    })();
    const totalValue = Math.pow(Math.pow(aimValue, 1.1) +
        Math.pow(speedValue, 1.1) +
        Math.pow(accuracyValue, 1.1) +
        Math.pow(flashlightValue, 1.1), 1.0 / 1.1) * multiplier;
    return {
        aim: aimValue,
        speed: speedValue,
        accuracy: accuracyValue,
        flashlight: flashlightValue,
        effectiveMissCount,
        total: totalValue,
    };
}
exports.calculatePerformanceAttributes = calculatePerformanceAttributes;


/***/ }),

/***/ "./src/lib/skills/aim.ts":
/*!*******************************!*\
  !*** ./src/lib/skills/aim.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateAim = void 0;
const index_1 = __webpack_require__(/*! ../../core/index */ "./src/core/index.ts");
const index_2 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const strain_1 = __webpack_require__(/*! ./strain */ "./src/lib/skills/strain.ts");
const wide_angle_multiplier = 1.5;
const acute_angle_multiplier = 1.95;
const slider_multiplier = 1.35;
const velocity_change_multiplier = 0.75;
const skillMultiplier = 23.55;
const strainDecayBase = 0.15;
const strainDecay = (ms) => Math.pow(strainDecayBase, ms / 1000);
const calcWideAngleBonus = (angle) => Math.pow(Math.sin((3.0 / 4) * (Math.min((5.0 / 6) * Math.PI, Math.max(Math.PI / 6, angle)) - Math.PI / 6)), 2);
const calcAcuteAngleBonus = (angle) => 1 - calcWideAngleBonus(angle);
/**
 * @returns `strains[i]` = strain value after the `i`th hitObject
 */
function calculateAimStrains(hitObjects, diffs, withSliders) {
    if (hitObjects.length === 0)
        return [];
    const strains = [0];
    let currentStrain = 0;
    // Index 0 is a dummy difficultyHitObject
    for (let i = 1; i < diffs.length; i++) {
        const lastLast = hitObjects[i - 2];
        const last = hitObjects[i - 1];
        const current = hitObjects[i];
        const diffLastLast = diffs[i - 2];
        const diffLast = diffs[i - 1];
        const diffCurrent = diffs[i];
        const strainValueOf = (function () {
            // We need at least three non-dummy elements for this calculation
            if (i <= 2 || (0, index_1.isSpinner)(current) || (0, index_1.isSpinner)(last))
                return 0;
            let currVelocity = diffCurrent.jumpDistance / diffCurrent.strainTime;
            if ((0, index_1.isSlider)(last) && withSliders) {
                const movementVelocity = diffCurrent.movementDistance / diffCurrent.movementTime;
                const travelVelocity = diffCurrent.travelDistance / diffCurrent.travelTime;
                currVelocity = Math.max(currVelocity, movementVelocity + travelVelocity);
            }
            let prevVelocity = diffLast.jumpDistance / diffLast.strainTime;
            if ((0, index_1.isSlider)(lastLast) && withSliders) {
                const movementVelocity = diffLast.movementDistance / diffLast.movementTime;
                const travelVelocity = diffLast.travelDistance / diffLast.travelTime;
                prevVelocity = Math.max(prevVelocity, movementVelocity + travelVelocity);
            }
            let wideAngleBonus = 0;
            let acuteAngleBonus = 0;
            let sliderBonus = 0;
            let velocityChangeBonus = 0;
            let aimStrain = currVelocity; // Start strain with regular velocity.
            if (
            // If rhythms are the same.
            Math.max(diffCurrent.strainTime, diffLast.strainTime) <
                1.25 * Math.min(diffCurrent.strainTime, diffLast.strainTime)) {
                if (diffCurrent.angle !== null && diffLast.angle !== null && diffLastLast.angle !== null) {
                    const currAngle = diffCurrent.angle;
                    const lastAngle = diffLast.angle;
                    const lastLastAngle = diffLastLast.angle;
                    // Rewarding angles, take the smaller velocity as base.
                    const angleBonus = Math.min(currVelocity, prevVelocity);
                    wideAngleBonus = calcWideAngleBonus(currAngle);
                    acuteAngleBonus = calcAcuteAngleBonus(currAngle);
                    if (diffCurrent.strainTime > 100)
                        // Only buff deltaTime exceeding 300 bpm 1/2.
                        acuteAngleBonus = 0;
                    else {
                        acuteAngleBonus *=
                            calcAcuteAngleBonus(lastAngle) *
                                Math.min(angleBonus, 125 / diffCurrent.strainTime) *
                                Math.pow(Math.sin((Math.PI / 2) * Math.min(1, (100 - diffCurrent.strainTime) / 25)), 2) *
                                Math.pow(Math.sin(((Math.PI / 2) * ((0, index_2.clamp)(diffCurrent.jumpDistance, 50, 100) - 50)) / 50), 2);
                    }
                    // Penalize wide angles if they're repeated, reducing the penalty as the lastAngle gets more acute.
                    wideAngleBonus *= angleBonus * (1 - Math.min(wideAngleBonus, Math.pow(calcWideAngleBonus(lastAngle), 3)));
                    // Penalize acute angles if they're repeated, reducing the penalty as the lastLastAngle gets more obtuse.
                    acuteAngleBonus *=
                        0.5 + 0.5 * (1 - Math.min(acuteAngleBonus, Math.pow(calcAcuteAngleBonus(lastLastAngle), 3)));
                }
            }
            // TODO: floatEqual?
            if (Math.max(prevVelocity, currVelocity) !== 0) {
                // We want to use the average velocity over the whole object when awarding differences, not the individual jump
                // and slider path velocities.
                prevVelocity = (diffLast.jumpDistance + diffLast.travelDistance) / diffLast.strainTime;
                currVelocity = (diffCurrent.jumpDistance + diffCurrent.travelDistance) / diffCurrent.strainTime;
                // Scale with ratio of difference compared to 0.5 * max dist.
                const distRatio = Math.pow(Math.sin(((Math.PI / 2) * Math.abs(prevVelocity - currVelocity)) / Math.max(prevVelocity, currVelocity)), 2);
                // Reward for % distance up to 125 / strainTime for overlaps where velocity is still changing.
                const overlapVelocityBuff = Math.min(125 / Math.min(diffCurrent.strainTime, diffLast.strainTime), Math.abs(prevVelocity - currVelocity));
                // Reward for % distance slowed down compared to previous, paying attention to not award overlap
                const nonOverlapVelocityBuff = Math.abs(prevVelocity - currVelocity) *
                    // do not award overlap
                    Math.pow(Math.sin((Math.PI / 2) * Math.min(1, Math.min(diffCurrent.jumpDistance, diffLast.jumpDistance) / 100)), 2);
                // Choose the largest bonus, multiplied by ratio.
                // velocityChangeBonus = Math.max(overlapVelocityBuff, nonOverlapVelocityBuff) * distRatio;
                velocityChangeBonus = overlapVelocityBuff * distRatio;
                // Penalize for rhythm changes.
                velocityChangeBonus *= Math.pow(Math.min(diffCurrent.strainTime, diffLast.strainTime) / Math.max(diffCurrent.strainTime, diffLast.strainTime), 2);
            }
            if (diffCurrent.travelTime !== 0) {
                // Reward sliders based on velocity.
                sliderBonus = diffCurrent.travelDistance / diffCurrent.travelTime;
            }
            // Add in acute angle bonus or wide angle bonus + velocity change bonus, whichever is larger.
            aimStrain += Math.max(acuteAngleBonus * acute_angle_multiplier, wideAngleBonus * wide_angle_multiplier + velocityChangeBonus * velocity_change_multiplier);
            // Add in additional slider velocity bonus.
            if (withSliders)
                aimStrain += sliderBonus * slider_multiplier;
            return aimStrain;
        })();
        currentStrain *= strainDecay(diffCurrent.deltaTime);
        currentStrain += strainValueOf * skillMultiplier;
        strains.push(currentStrain);
    }
    return strains;
}
function calculateAim(hitObjects, diffs, withSliders, onlyFinalValue) {
    const strains = calculateAimStrains(hitObjects, diffs, withSliders);
    return (0, strain_1.calculateDifficultyValues)(diffs, strains, {
        decayWeight: 0.9,
        difficultyMultiplier: 1.06,
        sectionDuration: 400,
        reducedSectionCount: 10,
        strainDecay,
    }, onlyFinalValue);
}
exports.calculateAim = calculateAim;


/***/ }),

/***/ "./src/lib/skills/flashlight.ts":
/*!**************************************!*\
  !*** ./src/lib/skills/flashlight.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateFlashlight = void 0;
const index_1 = __webpack_require__(/*! ../../core/index */ "./src/core/index.ts");
const index_2 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const strain_1 = __webpack_require__(/*! ./strain */ "./src/lib/skills/strain.ts");
const skillMultiplier = 0.05;
const strainDecayBase = 0.15;
const historyLength = 10; // Look back for 10 notes is added for the sake of flashlight calculations.
const strainDecay = (ms) => Math.pow(strainDecayBase, ms / 1000);
const position = (o) => ((0, index_1.isHitCircle)(o) ? o.position : o.head.position);
// In Flashlight it's not using StackedEndPosition so we have to adjust
const unstackedEndPosition = (o) => ((0, index_1.isHitCircle)(o) ? o.unstackedPosition : o.unstackedEndPosition);
// const blueprintEndPosition = (o: HitCircle | Slider) => (isHitCircle(o) ? o.position : o.endPosition);
function calculateFlashlightStrains(hitObjects, diffs, hidden) {
    if (hitObjects.length === 0)
        return [];
    let currentStrain = 0;
    const strains = [currentStrain];
    const max_opacity_bonus = 0.4;
    const hidden_bonus = 0.2;
    for (let i = 1; i < diffs.length; i++) {
        const current = hitObjects[i];
        const diffCurrent = diffs[i];
        const strainValueOf = (function () {
            if ((0, index_1.isSpinner)(current))
                return 0;
            const scalingFactor = 52.0 / current.radius;
            let smallDistNerf = 1.0;
            let cumulativeStrainTime = 0.0;
            let result = 0.0;
            const previousCount = Math.min(i - 1, historyLength);
            for (let j = 0; j < previousCount; j++) {
                const previous = hitObjects[i - j - 1];
                const diffPrevious = diffs[i - j - 1];
                if ((0, index_1.isSpinner)(previous))
                    continue;
                // #LAZERBUG: Lazer doesn't use StackedEndPosition
                const jumpDistance = index_2.Vec2.distance(position(current), unstackedEndPosition(previous));
                // cumulativeStrainTime += diffPrevious.strainTime;
                cumulativeStrainTime += diffs[i].strainTime;
                if (j === 0)
                    smallDistNerf = Math.min(1.0, jumpDistance / 75.0);
                const stackNerf = Math.min(1.0, (diffPrevious.jumpDistance / scalingFactor) / 25.0);
                const opacityBonus = 1.0 + max_opacity_bonus * (1.0 - (!(0, index_1.isSpinner)(current) ? ((0, index_1.isHitCircle)(current) ? current.opacityAt(current.hitTime, hidden) : current.head.opacityAt(current.head.hitTime, hidden)) : 1));
                result += stackNerf * opacityBonus * scalingFactor * jumpDistance / cumulativeStrainTime;
            }
            result = Math.pow(smallDistNerf * result, 2.0);
            if (hidden)
                result *= 1.0 + hidden_bonus;
            return result;
        })();
        currentStrain *= strainDecay(diffCurrent.deltaTime);
        currentStrain += strainValueOf * skillMultiplier;
        strains.push(currentStrain);
    }
    return strains;
}
function calculateFlashlight(hitObjects, diffs, onlyFinalValue, hidden) {
    const strains = calculateFlashlightStrains(hitObjects, diffs, hidden);
    return (0, strain_1.calculateDifficultyValues)(diffs, strains, {
        decayWeight: 0.9,
        difficultyMultiplier: 1.06,
        sectionDuration: 400,
        reducedSectionCount: 10,
        strainDecay,
    }, onlyFinalValue);
}
exports.calculateFlashlight = calculateFlashlight;


/***/ }),

/***/ "./src/lib/skills/speed.ts":
/*!*********************************!*\
  !*** ./src/lib/skills/speed.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateRelevantNotes = exports.calculateSpeed = exports.calculateSpeedStrains = void 0;
const index_1 = __webpack_require__(/*! ../../core/index */ "./src/core/index.ts");
const index_2 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const strain_1 = __webpack_require__(/*! ./strain */ "./src/lib/skills/strain.ts");
const single_spacing_threshold = 125;
const rhythm_multiplier = 0.75;
const history_time_max = 5000; // 5 seconds of calculatingRhythmBonus max.
const min_speed_bonus = 75; // ~200BPM
const speed_balancing_factor = 40;
const skillMultiplier = 1375;
const strainDecayBase = 0.3;
const history_length = 32;
const strainDecay = (ms) => Math.pow(strainDecayBase, ms / 1000);
/**
 * @param hitObjects
 * @param diffs
 * @param greatWindow the clock rate adjusted hit window
 * @returns `strains[i]` = speed strain value after the `i`th hitObject
 */
function calculateSpeedStrains(hitObjects, diffs, greatWindow) {
    let currentStrain = 0;
    const strains = [0];
    for (let i = 1; i < hitObjects.length; i++) {
        const current = hitObjects[i];
        const diffCurrent = diffs[i];
        const diffPrev = diffs[i - 1];
        const diffNext = diffs[i + 1];
        // console.log(diffCurrent, diffNext)
        // Helper function so that we don't have to use the ReversedQueue `Previous`
        const previousCount = Math.min(history_length, i - 1);
        const previous = (j) => diffs[i - 1 - j];
        const previousHitObject = (j) => hitObjects[i - 1 - j];
        const strainValueOf = (function () {
            if ((0, index_1.isSpinner)(current))
                return 0;
            // Note: osuPrevObj != null is equivalent to i > 1 since it wants to look at one non-dummy diff object
            const prevIsNonDummy = previousCount > 0;
            // derive strainTime for calculation
            let strainTime = diffCurrent.strainTime;
            const greatWindowFull = greatWindow * 2;
            // const speedWindowRatio = strainTime / greatWindowFull;
            let tryz_vn = 1;
            if (diffNext !== undefined) {
                const currDeltaTime = Math.max(1, diffCurrent.deltaTime);
                const nextDeltaTime = Math.max(1, diffNext.deltaTime);
                const deltaDifference = Math.abs(nextDeltaTime - currDeltaTime);
                const speedRatio = currDeltaTime / Math.max(currDeltaTime, deltaDifference);
                const windowRatio = Math.pow(Math.min(1, currDeltaTime / greatWindowFull), 2);
                tryz_vn = Math.pow(speedRatio, 1 - windowRatio);
            }
            // Aim to nerf cheesy rhythms (Very fast consecutive doubles with large delta-times between)
            // if (prevIsNonDummy && strainTime < greatWindowFull && diffPrev.strainTime > strainTime)
            //   strainTime = lerp(diffPrev.strainTime, strainTime, speedWindowRatio);
            // Cap deltatime to the OD 300 hitwindow.
            // 0.93 is derived from making sure 260bpm OD8 streams aren't nerfed harshly, whilst 0.92 limits the effect of
            // the cap.
            strainTime /= (0, index_2.clamp)(strainTime / greatWindowFull / 0.93, 0.92, 1);
            // derive speedBonus for calculation
            let speedBonus = 1.0;
            if (strainTime < min_speed_bonus)
                speedBonus = 1 + 0.75 * Math.pow((min_speed_bonus - strainTime) / speed_balancing_factor, 2);
            const distance = Math.min(single_spacing_threshold, diffCurrent.travelDistance + diffCurrent.movementDistance);
            return (speedBonus + speedBonus * Math.pow(distance / single_spacing_threshold, 3.5)) * tryz_vn / strainTime;
        })();
        const currentRhythm = (function () {
            if ((0, index_1.isSpinner)(current))
                return 0;
            let previousIslandSize = 0;
            let rhythmComplexitySum = 0;
            let islandSize = 1;
            let startRatio = 0; // store the ratio of the current start of an island to buff for tighter rhythms
            let firstDeltaSwitch = false;
            let rhythmStart = 0;
            // Optimization from a "future" commit
            // https://github.com/ppy/osu/commit/c87ff82c1cde3af45c173fcb264de999340b743c#diff-4ed7064eeb60b6f0a19dc16729cd6fc3c3ba9794962a7bcfc830bddbea781000
            while (rhythmStart < previousCount - 2 &&
                diffCurrent.startTime - previous(rhythmStart).startTime < history_time_max)
                rhythmStart++;
            for (let j = rhythmStart; j > 0; j--) {
                const currObj = previous(j - 1);
                const prevObj = previous(j);
                const lastObj = previous(j + 1);
                let currHistoricalDecay = (history_time_max - (diffCurrent.startTime - currObj.startTime)) / history_time_max;
                currHistoricalDecay = Math.min((previousCount - j) / previousCount, currHistoricalDecay);
                const currDelta = currObj.strainTime;
                const prevDelta = prevObj.strainTime;
                const lastDelta = lastObj.strainTime;
                const currRatio = 1.0 +
                    6.0 *
                        Math.min(0.5, Math.pow(Math.sin(Math.PI / (Math.min(prevDelta, currDelta) / Math.max(prevDelta, currDelta))), 2)); // fancy function to calculate rhythmbonuses.
                let windowPenalty = Math.min(1, Math.max(0, Math.abs(prevDelta - currDelta) - greatWindow * 0.6) / (greatWindow * 0.6));
                windowPenalty = Math.min(1, windowPenalty);
                let effectiveRatio = windowPenalty * currRatio;
                if (firstDeltaSwitch) {
                    if (!(prevDelta > 1.25 * currDelta || prevDelta * 1.25 < currDelta)) {
                        if (islandSize < 7)
                            islandSize++; // island is still progressing, count size.
                    }
                    else {
                        if ((0, index_1.isSlider)(previousHitObject(j - 1)))
                            // bpm change is into slider, this is easy acc window
                            effectiveRatio *= 0.125;
                        if ((0, index_1.isSlider)(previousHitObject(j)))
                            // bpm change was from a slider, this is easier typically than circle -> circle
                            effectiveRatio *= 0.25;
                        if (previousIslandSize == islandSize)
                            // repeated island size (ex: triplet -> triplet)
                            effectiveRatio *= 0.25;
                        if (previousIslandSize % 2 == islandSize % 2)
                            // repeated island polartiy (2 -> 4, 3 -> 5)
                            effectiveRatio *= 0.5;
                        if (lastDelta > prevDelta + 10 && prevDelta > currDelta + 10)
                            // previous increase happened a note ago, 1/1->1/2-1/4, dont want to buff this.
                            effectiveRatio *= 0.125;
                        rhythmComplexitySum +=
                            (((Math.sqrt(effectiveRatio * startRatio) * currHistoricalDecay * Math.sqrt(4 + islandSize)) / 2) *
                                Math.sqrt(4 + previousIslandSize)) /
                                2;
                        startRatio = effectiveRatio;
                        previousIslandSize = islandSize; // log the last island size.
                        if (prevDelta * 1.25 < currDelta)
                            // we're slowing down, stop counting
                            firstDeltaSwitch = false; // if we're speeding up, this stays true and  we keep counting island size.
                        islandSize = 1;
                    }
                }
                else if (prevDelta > 1.25 * currDelta) {
                    // we want to be speeding up.
                    // Begin counting island until we change speed again.
                    firstDeltaSwitch = true;
                    startRatio = effectiveRatio;
                    islandSize = 1;
                }
            }
            return Math.sqrt(4 + rhythmComplexitySum * rhythm_multiplier) / 2; //produces multiplier that can be applied to
            // strain. range [1, infinity) (not really
            // though)
        })();
        currentStrain *= strainDecay(diffCurrent.strainTime);
        currentStrain += strainValueOf * skillMultiplier;
        strains.push(currentStrain * currentRhythm);
    }
    return strains;
}
exports.calculateSpeedStrains = calculateSpeedStrains;
function calculateSpeed(hitObjects, diffs, hitWindowGreat, onlyFinalValue) {
    const strains = calculateSpeedStrains(hitObjects, diffs, hitWindowGreat);
    return (0, strain_1.calculateDifficultyValues)(diffs, strains, {
        decayWeight: 0.9,
        difficultyMultiplier: 1.04,
        sectionDuration: 400,
        reducedSectionCount: 5,
        strainDecay,
    }, onlyFinalValue);
}
exports.calculateSpeed = calculateSpeed;
function calculateRelevantNotes(hitObjects, diffs, hitWindowGreat, onlyFinalValue) {
    const strains = calculateSpeedStrains(hitObjects, diffs, hitWindowGreat);
    if (strains.length === 0)
        return 0;
    const maxStrain = Math.max(...strains);
    if (maxStrain === 0)
        return 0;
    let total = 0;
    strains.forEach(next => {
        total += 1.0 / (1.0 + Math.exp(-(next / maxStrain * 12 - 6)));
    });
    return total;
}
exports.calculateRelevantNotes = calculateRelevantNotes;


/***/ }),

/***/ "./src/lib/skills/strain.ts":
/*!**********************************!*\
  !*** ./src/lib/skills/strain.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateDifficultyValues = void 0;
const index_1 = __webpack_require__(/*! ../../math/index */ "./src/math/index.ts");
const index_2 = __webpack_require__(/*! ../../core/index */ "./src/core/index.ts");
const startTime = (o) => ((0, index_2.isHitCircle)(o) ? o.hitTime : o.startTime);
// Not overridden ... yet?
const REDUCED_STRAIN_BASELINE = 0.75;
/**
 * Summary of how the strain skill works:
 * - Strain is a value that decays exponentially over time if there is no hit object present
 * - Let strain at time t be S(t)
 *
 * - First the whole beatmap is partitioned into multiple sections each of duration D (D=400ms in osu!std) e.g. [0,
 * 400], [400, 800], ...
 * - Now we only consider the highest strain of each section aka "section peak" i.e. P(i) = max(S(t)) where i*D <= t <=
 * i*(D+1)
 * Note: This can be easily calculated since we know that the peak can only happen after each hit object or at the
 * beginning of a section
 *
 * - Finally the difficulty value of a strain skill considers the largest K strain peaks (K=10 in osu!std) and
 * nerfs them so that the extremly unique difficulty spikes get nerfed.
 *
 * - Then it uses the weighted sum to calculate the difficultyValue.
 *
 * Performance notes:
 * 1. O(n + D + D * log D) if only calculating the last value
 * 2. If we want to calculate for every value:
 *   This is O(n * D * log D) but can be optimized to O(n) by having a precision breakpoint
 *   -> For example, if we now want to push a peak that'd be the 150th highest value, then best it could get in
 *    is to become the 140th highest value -> its value multiplied with the weight 0.9^140 should be
 *    greater than some precision (let's say 10^-6), otherwise we just don't push it to the peaks. In theory, we should
 *    just be maintaining about ~100-150 peak values depending on the required precision which is O(1) compared to O(D).
 */
function calculateDifficultyValues(diffs, // -> only startTime is used here
strains, { sectionDuration, reducedSectionCount, difficultyMultiplier, strainDecay, decayWeight }, onlyFinalValue) {
    if (diffs.length === 0)
        return [];
    // osu!lazer note: sectionBegin = sectionDuration if t is dividable by sectionDuration (bug?)
    const calcSectionBegin = (sectionDuration, t) => Math.floor(t / sectionDuration) * sectionDuration;
    const peaks = [];
    const difficultyValues = [];
    let currentSectionBegin = calcSectionBegin(sectionDuration, diffs[0].startTime);
    let currentSectionPeak = 0;
    if (!onlyFinalValue) {
        // For the first hitobject it is always 0
        difficultyValues.push(0);
    }
    for (let i = 1; i < diffs.length; i++) {
        const prevStartTime = diffs[i - 1].startTime;
        const currStartTime = diffs[i].startTime;
        // Let's see if we can close off the other sections
        while (currentSectionBegin + sectionDuration < currStartTime) {
            peaks.push(currentSectionPeak);
            currentSectionBegin += sectionDuration;
            currentSectionPeak = strains[i - 1] * strainDecay(currentSectionBegin - prevStartTime);
        }
        // Now check if the currentSectionPeak can be improved with the current hit object i
        currentSectionPeak = Math.max(currentSectionPeak, strains[i]);
        if (onlyFinalValue && i + 1 < diffs.length) {
            continue;
        }
        // We do not push the currentSectionPeak to the peaks yet because currentSectionPeak is still in a jelly state and
        // can be improved by the future hit objects in the same section.
        const peaksWithCurrent = [...peaks, currentSectionPeak];
        const descending = (a, b) => b - a;
        peaksWithCurrent.sort(descending);
        // This is now part of DifficultyValue()
        for (let i = 0; i < Math.min(peaksWithCurrent.length, reducedSectionCount); i++) {
            // Scale might be precalculated since it uses some expensive operation (log10)
            const scale = Math.log10((0, index_1.lerp)(1, 10, (0, index_1.clamp)(i / reducedSectionCount, 0, 1)));
            peaksWithCurrent[i] *= (0, index_1.lerp)(REDUCED_STRAIN_BASELINE, 1.0, scale);
        }
        let weight = 1;
        // Decreasingly
        peaksWithCurrent.sort(descending);
        let difficultyValue = 0;
        for (const peak of peaksWithCurrent) {
            difficultyValue += peak * weight;
            weight *= decayWeight;
        }
        difficultyValues.push(difficultyValue * difficultyMultiplier);
    }
    return difficultyValues;
}
exports.calculateDifficultyValues = calculateDifficultyValues;


/***/ }),

/***/ "./src/math/Vec2.ts":
/*!**************************!*\
  !*** ./src/math/Vec2.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Vec2 = void 0;
const float32_1 = __webpack_require__(/*! ./float32 */ "./src/math/float32.ts");
// TODO: Using 32-bit float as return result everywhere?
// For example Vector2.Length is returned as float
class Vec2 {
    constructor(x, y) {
        this.x = (0, float32_1.float32)(x);
        this.y = (0, float32_1.float32)(y);
    }
    // This should be preferred since it avoids using sqrt
    // TODO: however this might be TOO precise that we will have matching issue with osu!lazer
    static withinDistance(a, b, d) {
        return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 <= d ** 2;
    }
    // returns float
    static distance(a, b) {
        return Math.fround(Math.sqrt(Vec2.distanceSquared(a, b)));
    }
    static distanceSquared(a, b) {
        const dx = a.x - b.x, dy = a.y - b.y;
        return dx ** 2 + dy ** 2;
    }
    static equal(a, b) {
        // I commented out my original solution and replaced it with osu!framework variant (which is very strict)
        // return floatEqual(a.x, b.x) && floatEqual(a.y, b.y);
        return a.x === b.x && a.y === b.y;
    }
    static add(a, b) {
        return new Vec2((0, float32_1.float32)(a.x) + (0, float32_1.float32)(b.x), (0, float32_1.float32)(a.y) + (0, float32_1.float32)(b.y));
    }
    static dot(a, b) {
        return Math.fround(a.x * b.x + a.y * b.y);
    }
    static sub(a, b) {
        return new Vec2((0, float32_1.float32)(a.x) - (0, float32_1.float32)(b.x), (0, float32_1.float32)(a.y) - (0, float32_1.float32)(b.y));
    }
    // c: float
    static scale(a, c) {
        return new Vec2((0, float32_1.float32_mul)(a.x, c), (0, float32_1.float32_mul)(a.y, c));
    }
    // c: float
    static divide(a, c) {
        return new Vec2((0, float32_1.float32_div)(a.x, c), (0, float32_1.float32_div)(a.y, c));
    }
    // Order is important
    static interpolate(a, b, p) {
        return Vec2.add(a, Vec2.sub(b, a).scale(p));
    }
    add(b) {
        return Vec2.add(this, b);
    }
    sub(b) {
        return Vec2.sub(this, b);
    }
    divide(c) {
        return Vec2.divide(this, c);
    }
    scale(c) {
        return Vec2.scale(this, c);
    }
    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }
    length() {
        return (0, float32_1.float32)(Math.sqrt(this.x ** 2 + this.y ** 2));
    }
    equals(b) {
        return Vec2.equal(this, b);
    }
    normalized() {
        const num = this.length();
        this.x = (0, float32_1.float32_div)(this.x, num);
        this.y = (0, float32_1.float32_div)(this.y, num);
        return this;
    }
}
exports.Vec2 = Vec2;
Vec2.Zero = new Vec2(0, 0);


/***/ }),

/***/ "./src/math/colors.ts":
/*!****************************!*\
  !*** ./src/math/colors.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.rgbToInt = void 0;
function rgbToInt(rgb) {
    if (rgb.length < 3) {
        throw Error("Not at least three values provided");
    }
    let val = 0;
    for (let i = 0; i < 3; i++) {
        val = val * 256 + rgb[i];
    }
    return val;
}
exports.rgbToInt = rgbToInt;


/***/ }),

/***/ "./src/math/difficulty.ts":
/*!********************************!*\
  !*** ./src/math/difficulty.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.overallDifficultyToHitWindowGreat = exports.hitWindowsForOD = exports.hitWindowGreatToOD = exports.difficultyRangeForOd = exports.getFadeInDuration = exports.approachDurationToApproachRate = exports.approachRateToApproachDuration = exports.difficultyRange = exports.circleSizeToScale = void 0;
/**
 * Converts the circle size to a normalized scaling value.
 * @param CS the circle size value
 */
const float32_1 = __webpack_require__(/*! ./float32 */ "./src/math/float32.ts");
function circleSizeToScale(CS) {
    return (0, float32_1.float32)((1.0 - (0.7 * (CS - 5)) / 5) / 2);
}
exports.circleSizeToScale = circleSizeToScale;
// Just a helper function that is commonly used for OD, AR calculation
function difficultyRange(difficulty, min, mid, max) {
    if (difficulty > 5.0)
        return mid + ((max - mid) * (difficulty - 5.0)) / 5.0;
    return difficulty < 5.0 ? mid - ((mid - min) * (5.0 - difficulty)) / 5.0 : mid;
}
exports.difficultyRange = difficultyRange;
// Minimum preempt time at AR=10
const PREEMPT_MIN = 450;
/**
 * Returns the approach duration depending on the abstract AR value.
 * @param AR the approach rate value
 */
function approachRateToApproachDuration(AR) {
    return difficultyRange(AR, 1800, 1200, PREEMPT_MIN);
}
exports.approachRateToApproachDuration = approachRateToApproachDuration;
function approachDurationToApproachRate(approachDurationInMs) {
    return approachDurationInMs > 1200 ? (1800 - approachDurationInMs) / 120 : (1200 - approachDurationInMs) / 150 + 5;
}
exports.approachDurationToApproachRate = approachDurationToApproachRate;
function getFadeInDuration(AR) {
    const TimePreempt = approachRateToApproachDuration(AR);
    return 400 * Math.min(1, TimePreempt / PREEMPT_MIN);
}
exports.getFadeInDuration = getFadeInDuration;
function difficultyRangeForOd(difficulty, range) {
    return difficultyRange(difficulty, range.od0, range.od5, range.od10);
}
exports.difficultyRangeForOd = difficultyRangeForOd;
function hitWindowGreatToOD(hitWindowGreat) {
    return (80 - hitWindowGreat) / 6;
}
exports.hitWindowGreatToOD = hitWindowGreatToOD;
const OSU_STD_HIT_WINDOW_RANGES = [
    [80, 50, 20],
    [140, 100, 60],
    [200, 150, 100],
    [400, 400, 400], // Miss
];
/**
 * Returns the hit windows in the following order:
 * [Hit300, Hit100, Hit50, HitMiss]
 * @param overallDifficulty
 * @param lazerStyle
 */
function hitWindowsForOD(overallDifficulty, lazerStyle) {
    function lazerHitWindowsForOD(od) {
        return OSU_STD_HIT_WINDOW_RANGES.map(([od0, od5, od10]) => difficultyRange(od, od0, od5, od10));
    }
    // Short explanation: currently in lazer the hit windows are actually +1ms bigger due to them using the LTE <=
    // operator instead of LT <  <= instead of < check.
    if (lazerStyle) {
        return lazerHitWindowsForOD(overallDifficulty);
    }
    // https://github.com/ppy/osu/issues/11311
    return lazerHitWindowsForOD(overallDifficulty).map((w) => w - 1);
}
exports.hitWindowsForOD = hitWindowsForOD;
// Lazer style
function overallDifficultyToHitWindowGreat(od) {
    const [od0, od5, od10] = OSU_STD_HIT_WINDOW_RANGES[0];
    return difficultyRange(od, od0, od5, od10);
}
exports.overallDifficultyToHitWindowGreat = overallDifficultyToHitWindowGreat;


/***/ }),

/***/ "./src/math/easing.ts":
/*!****************************!*\
  !*** ./src/math/easing.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.lerp = exports.applyInterpolation = exports.applyEasing = exports.Easing = void 0;
// https://github.com/ppy/osu-framework/blob/master/osu.Framework/Graphics/Transforms/DefaultEasingFunction.cs
var Easing;
(function (Easing) {
    Easing[Easing["LINEAR"] = 0] = "LINEAR";
    Easing[Easing["OUT"] = 1] = "OUT";
    Easing[Easing["OUT_QUINT"] = 2] = "OUT_QUINT";
    Easing[Easing["OUT_ELASTIC"] = 3] = "OUT_ELASTIC";
    Easing[Easing["IN_CUBIC"] = 4] = "IN_CUBIC";
})(Easing = exports.Easing || (exports.Easing = {}));
const elastic_const = (2 * Math.PI) / 0.3;
const elastic_const2 = 0.3 / 4;
const back_const = 1.70158;
const back_const2 = back_const * 1.525;
const bounce_const = 1 / 2.75;
// constants used to fix expo and elastic curves to start/end at 0/1
const expo_offset = Math.pow(2, -10);
const elastic_offset_full = Math.pow(2, -11);
const elastic_offset_half = Math.pow(2, -10) * Math.sin((0.5 - elastic_const2) * elastic_const);
const elastic_offset_quarter = Math.pow(2, -10) * Math.sin((0.25 - elastic_const2) * elastic_const);
const in_out_elastic_offset = Math.pow(2, -10) * Math.sin(((1 - elastic_const2 * 1.5) * elastic_const) / 1.5);
function applyEasing(t, easing) {
    switch (easing) {
        case Easing.LINEAR:
            return t;
        case Easing.OUT:
            return t * (2 - t);
        case Easing.OUT_QUINT:
            return --t * t * t * t * t + 1;
        case Easing.OUT_ELASTIC:
            return Math.pow(2, -10 * t) * Math.sin((t - elastic_const2) * elastic_const) + 1 - elastic_offset_full * t;
        case Easing.IN_CUBIC:
            return t * t * t;
    }
    return t;
}
exports.applyEasing = applyEasing;
function applyInterpolation(time, startTime, endTime, valA, valB, easing = Easing.LINEAR) {
    // Or floatEqual ...
    if (startTime >= endTime) {
        console.error("startTime should be less than endTime");
        return valA; // or throw Error?
    }
    const p = applyEasing((time - startTime) / (endTime - startTime), easing);
    return (valB - valA) * p + valA;
}
exports.applyInterpolation = applyInterpolation;
/**
 * Linear interpolation
 * @param start start value
 * @param final final value
 * @param amount number between 0 and 1
 */
function lerp(start, final, amount) {
    return start + (final - start) * amount;
}
exports.lerp = lerp;


/***/ }),

/***/ "./src/math/float32.ts":
/*!*****************************!*\
  !*** ./src/math/float32.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.float32_sqrt = exports.float32_div = exports.float32_mul = exports.float32_add = exports.float32 = void 0;
function float32(a) {
    return Math.fround(a);
}
exports.float32 = float32;
function float32_add(a, b) {
    return float32(float32(a) + float32(b));
}
exports.float32_add = float32_add;
function float32_mul(a, b) {
    return float32(float32(a) * float32(b));
}
exports.float32_mul = float32_mul;
function float32_div(a, b) {
    return float32(float32(a) / float32(b));
}
exports.float32_div = float32_div;
function float32_sqrt(a) {
    return float32(Math.sqrt(float32(a)));
}
exports.float32_sqrt = float32_sqrt;


/***/ }),

/***/ "./src/math/index.ts":
/*!***************************!*\
  !*** ./src/math/index.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./colors */ "./src/math/colors.ts"), exports);
__exportStar(__webpack_require__(/*! ./difficulty */ "./src/math/difficulty.ts"), exports);
__exportStar(__webpack_require__(/*! ./easing */ "./src/math/easing.ts"), exports);
__exportStar(__webpack_require__(/*! ./time */ "./src/math/time.ts"), exports);
__exportStar(__webpack_require__(/*! ./utils */ "./src/math/utils.ts"), exports);
__exportStar(__webpack_require__(/*! ./sliders */ "./src/math/sliders.ts"), exports);
__exportStar(__webpack_require__(/*! ./Vec2 */ "./src/math/Vec2.ts"), exports);
__exportStar(__webpack_require__(/*! ./float32 */ "./src/math/float32.ts"), exports);


/***/ }),

/***/ "./src/math/sliders.ts":
/*!*****************************!*\
  !*** ./src/math/sliders.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sliderRepeatAngle = void 0;
const Vec2_1 = __webpack_require__(/*! ./Vec2 */ "./src/math/Vec2.ts");
// TODO: Maybe move this to osu/Math
// Maybe this is slow because of atan2() calculation
function sliderRepeatAngle(curve, isRepeatAtEnd) {
    if (curve.length < 2) {
        return 0.0;
    }
    const searchStart = isRepeatAtEnd ? curve.length - 1 : 0;
    const searchDir = isRepeatAtEnd ? -1 : +1;
    // I think the special case happening in DrawableRepeatSlider only occurs at snaking (which we don't have right
    // now).
    // So TODO: implement searching for two unique points when we do snaking
    const p1 = curve[searchStart];
    const p2 = curve[searchStart + searchDir];
    const direction = Vec2_1.Vec2.sub(p2, p1);
    return Math.atan2(direction.y, direction.x);
}
exports.sliderRepeatAngle = sliderRepeatAngle;


/***/ }),

/***/ "./src/math/time.ts":
/*!**************************!*\
  !*** ./src/math/time.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.beatLengthToBPM = exports.formatGameTime = exports.parseMs = exports.addZero = void 0;
function addZero(value, digits = 2) {
    const isNegative = Number(value) < 0;
    let buffer = value.toString();
    let size = 0;
    // Strip minus sign if number is negative
    if (isNegative) {
        buffer = buffer.slice(1);
    }
    size = digits - buffer.length + 1;
    buffer = new Array(size).join("0").concat(buffer);
    // Adds back minus sign if needed
    return (isNegative ? "-" : "") + buffer;
}
exports.addZero = addZero;
// courtesy to parse-ms
function parseMs(milliseconds) {
    const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;
    return {
        days: roundTowardsZero(milliseconds / 86400000),
        hours: roundTowardsZero(milliseconds / 3600000) % 24,
        minutes: roundTowardsZero(milliseconds / 60000) % 60,
        seconds: roundTowardsZero(milliseconds / 1000) % 60,
        milliseconds: roundTowardsZero(milliseconds) % 1000,
        microseconds: roundTowardsZero(milliseconds * 1000) % 1000,
        nanoseconds: roundTowardsZero(milliseconds * 1e6) % 1000,
    };
}
exports.parseMs = parseMs;
function formatGameTime(timeInMs, withMs) {
    // new Date(timeInMs) actually considers timezone
    const { hours, seconds, minutes, milliseconds } = parseMs(timeInMs);
    let s = hours > 0 ? `${hours}:` : "";
    s = s + (hours > 0 ? addZero(minutes) : minutes) + ":";
    s = s + addZero(seconds);
    return withMs ? s + "." + addZero(milliseconds, 3) : s;
}
exports.formatGameTime = formatGameTime;
function beatLengthToBPM(beatLength) {
    return 60 * 1000 / beatLength;
}
exports.beatLengthToBPM = beatLengthToBPM;


/***/ }),

/***/ "./src/math/utils.ts":
/*!***************************!*\
  !*** ./src/math/utils.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.clamp = exports.doubleEqual = exports.floatEqual = exports.approximatelyEqual = void 0;
function approximatelyEqual(x, y, delta) {
    return Math.abs(x - y) < delta;
}
exports.approximatelyEqual = approximatelyEqual;
// https://github.com/ppy/osu-framework/blob/105a17bc99cad251fa730b54c615d2b0d9a409d3/osu.Framework/Utils/Precision.cs
const FLOAT_EPS = 1e-3;
function floatEqual(value1, value2) {
    return approximatelyEqual(value1, value2, FLOAT_EPS);
}
exports.floatEqual = floatEqual;
const DOUBLE_EPS = 1e-7;
// Used in certain cases when x and y are `double`s
function doubleEqual(x, y) {
    return approximatelyEqual(x, y, DOUBLE_EPS);
}
exports.doubleEqual = doubleEqual;
function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}
exports.clamp = clamp;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	osuPerformance = __webpack_exports__;
/******/ 	
/******/ })()
;

export default osuPerformance;

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEIsWUFBWTtBQUN4QyxLQUFLO0FBQ0wsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEM7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMERBQTBEO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsb0NBQW9DO0FBQ3pHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyREFBMkQsUUFBUTtBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxNQUFNO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQ7QUFD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QUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUV0QkE7VUFDQTtVQUNBO1VBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2F1ZGlvL0hpdFNhbXBsZUluZm8udHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9hdWRpby9MZWdhY3lTYW1wbGVCYW5rLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvYmVhdG1hcC9CZWF0bWFwLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvYmVhdG1hcC9CZWF0bWFwQnVpbGRlci50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2JlYXRtYXAvQmVhdG1hcERpZmZpY3VsdHkudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9iZWF0bWFwL0NvbnRyb2xQb2ludHMvQ29udHJvbFBvaW50LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvYmVhdG1hcC9Db250cm9sUG9pbnRzL0NvbnRyb2xQb2ludEdyb3VwLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvYmVhdG1hcC9Db250cm9sUG9pbnRzL0NvbnRyb2xQb2ludEluZm8udHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9iZWF0bWFwL0NvbnRyb2xQb2ludHMvRGlmZmljdWx0eUNvbnRyb2xQb2ludC50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2JlYXRtYXAvQ29udHJvbFBvaW50cy9FZmZlY3RDb250cm9sUG9pbnQudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9iZWF0bWFwL0NvbnRyb2xQb2ludHMvU2FtcGxlQ29udHJvbFBvaW50LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvYmVhdG1hcC9Db250cm9sUG9pbnRzL1RpbWluZ0NvbnRyb2xQb2ludC50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2JlYXRtYXAvTGVnYWN5RWZmZWN0RmxhZy50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2JlYXRtYXAvVGltZVNpZ25hdHVyZXMudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9ibHVlcHJpbnQvQmx1ZXByaW50LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvYmx1ZXByaW50L0JsdWVwcmludFBhcnNlci50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2JsdWVwcmludC9IaXRPYmplY3RTZXR0aW5ncy50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2dhbWVwbGF5L0dhbWVTdGF0ZS50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2dhbWVwbGF5L0dhbWVTdGF0ZUV2YWx1YXRvci50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2dhbWVwbGF5L0dhbWVTdGF0ZVRpbWVNYWNoaW5lLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvZ2FtZXBsYXkvR2FtZXBsYXlBbmFseXNpc0V2ZW50LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvZ2FtZXBsYXkvR2FtZXBsYXlJbmZvLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvZ2FtZXBsYXkvVmVyZGljdHMudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9oaXRvYmplY3RzL0hpdENpcmNsZS50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2hpdG9iamVjdHMvU2xpZGVyLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvaGl0b2JqZWN0cy9TbGlkZXJDaGVja1BvaW50LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvaGl0b2JqZWN0cy9TcGlubmVyLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvaGl0b2JqZWN0cy9UeXBlcy50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2hpdG9iamVjdHMvc2xpZGVyL1BhdGhBcHByb3hpbWF0b3IudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9oaXRvYmplY3RzL3NsaWRlci9QYXRoQ29udHJvbFBvaW50LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvaGl0b2JqZWN0cy9zbGlkZXIvUGF0aFR5cGUudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9oaXRvYmplY3RzL3NsaWRlci9TbGlkZXJDaGVja1BvaW50R2VuZXJhdG9yLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvaGl0b2JqZWN0cy9zbGlkZXIvU2xpZGVyUGF0aC50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL2luZGV4LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvbW9kcy9FYXN5TW9kLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvbW9kcy9IYXJkUm9ja01vZC50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL21vZHMvTW9kcy50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL21vZHMvU3RhY2tpbmdNb2QudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9wbGF5ZmllbGQudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9yZXBsYXlzL1Jhd1JlcGxheURhdGEudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS9yZXBsYXlzL1JlcGxheS50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9jb3JlL3JlcGxheXMvUmVwbGF5Q2xpY2tzLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvcmVwbGF5cy9SZXBsYXlQYXJzZXIudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvY29yZS91dGlscy9Tb3J0ZWRMaXN0LnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2NvcmUvdXRpbHMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvbGliL2RpZmYudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvbGliL3BwLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2xpYi9za2lsbHMvYWltLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2xpYi9za2lsbHMvZmxhc2hsaWdodC50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9saWIvc2tpbGxzL3NwZWVkLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL2xpYi9za2lsbHMvc3RyYWluLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL21hdGgvVmVjMi50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9tYXRoL2NvbG9ycy50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9tYXRoL2RpZmZpY3VsdHkudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvbWF0aC9lYXNpbmcudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvbWF0aC9mbG9hdDMyLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL21hdGgvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2UvLi9zcmMvbWF0aC9zbGlkZXJzLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlLy4vc3JjL21hdGgvdGltZS50cyIsIndlYnBhY2s6Ly9vc3VQZXJmb3JtYW5jZS8uL3NyYy9tYXRoL3V0aWxzLnRzIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlL3dlYnBhY2svYmVmb3JlLXN0YXJ0dXAiLCJ3ZWJwYWNrOi8vb3N1UGVyZm9ybWFuY2Uvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL29zdVBlcmZvcm1hbmNlL3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkhpdFNhbXBsZUluZm8gPSB2b2lkIDA7XHJcbmNsYXNzIEhpdFNhbXBsZUluZm8ge1xyXG4gICAgY29uc3RydWN0b3IobmFtZSwgYmFuayA9IG51bGwsIHN1ZmZpeCA9IG51bGwsIHZvbHVtZSA9IDApIHtcclxuICAgICAgICB0aGlzLnZvbHVtZSA9IDA7XHJcbiAgICAgICAgLy8gbmFtZSBjb3VsZCBiZSBvbmUgb2YgdGhvc2UgSElUX1dISVNUTEUsIC4uLlxyXG4gICAgICAgIHRoaXMubmFtZSA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLmJhbmsgPSBiYW5rO1xyXG4gICAgICAgIHRoaXMuc3VmZml4ID0gc3VmZml4O1xyXG4gICAgICAgIHRoaXMudm9sdW1lID0gdm9sdW1lO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuSGl0U2FtcGxlSW5mbyA9IEhpdFNhbXBsZUluZm87XHJcbkhpdFNhbXBsZUluZm8uSElUX1dISVNUTEUgPSBcImhpdHdoaXN0bGVcIjtcclxuSGl0U2FtcGxlSW5mby5ISVRfRklOSVNIID0gXCJoaXRmaW5pc2hcIjtcclxuSGl0U2FtcGxlSW5mby5ISVRfTk9STUFMID0gXCJoaXRub3JtYWxcIjtcclxuSGl0U2FtcGxlSW5mby5ISVRfQ0xBUCA9IFwiaGl0Y2xhcFwiO1xyXG5IaXRTYW1wbGVJbmZvLkFMTF9BRERJVElPTlMgPSBbSGl0U2FtcGxlSW5mby5ISVRfV0hJU1RMRSwgSGl0U2FtcGxlSW5mby5ISVRfQ0xBUCwgSGl0U2FtcGxlSW5mby5ISVRfRklOSVNIXTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5MZWdhY3lTYW1wbGVCYW5rID0gdm9pZCAwO1xyXG52YXIgTGVnYWN5U2FtcGxlQmFuaztcclxuKGZ1bmN0aW9uIChMZWdhY3lTYW1wbGVCYW5rKSB7XHJcbiAgICBMZWdhY3lTYW1wbGVCYW5rW0xlZ2FjeVNhbXBsZUJhbmtbXCJOb25lXCJdID0gMF0gPSBcIk5vbmVcIjtcclxuICAgIExlZ2FjeVNhbXBsZUJhbmtbTGVnYWN5U2FtcGxlQmFua1tcIk5vcm1hbFwiXSA9IDFdID0gXCJOb3JtYWxcIjtcclxuICAgIExlZ2FjeVNhbXBsZUJhbmtbTGVnYWN5U2FtcGxlQmFua1tcIlNvZnRcIl0gPSAyXSA9IFwiU29mdFwiO1xyXG4gICAgTGVnYWN5U2FtcGxlQmFua1tMZWdhY3lTYW1wbGVCYW5rW1wiRHJ1bVwiXSA9IDNdID0gXCJEcnVtXCI7XHJcbn0pKExlZ2FjeVNhbXBsZUJhbmsgPSBleHBvcnRzLkxlZ2FjeVNhbXBsZUJhbmsgfHwgKGV4cG9ydHMuTGVnYWN5U2FtcGxlQmFuayA9IHt9KSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMubW9zdENvbW1vbkJlYXRMZW5ndGggPSBleHBvcnRzLkJlYXRtYXAgPSB2b2lkIDA7XHJcbmNvbnN0IEJlYXRtYXBEaWZmaWN1bHR5XzEgPSByZXF1aXJlKFwiLi9CZWF0bWFwRGlmZmljdWx0eVwiKTtcclxuY29uc3QgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi91dGlscy9pbmRleFwiKTtcclxuY29uc3QgVHlwZXNfMSA9IHJlcXVpcmUoXCIuLi9oaXRvYmplY3RzL1R5cGVzXCIpO1xyXG5jb25zdCBDb250cm9sUG9pbnRJbmZvXzEgPSByZXF1aXJlKFwiLi9Db250cm9sUG9pbnRzL0NvbnRyb2xQb2ludEluZm9cIik7XHJcbi8qKlxyXG4gKiBBIGJ1aWx0IGJlYXRtYXAgdGhhdCBpcyBub3Qgc3VwcG9zZWQgdG8gYmUgbW9kaWZpZWQuXHJcbiAqL1xyXG5jbGFzcyBCZWF0bWFwIHtcclxuICAgIGNvbnN0cnVjdG9yKGhpdE9iamVjdHMsIGRpZmZpY3VsdHksIGFwcGxpZWRNb2RzLCBjb250cm9sUG9pbnRJbmZvKSB7XHJcbiAgICAgICAgdGhpcy5oaXRPYmplY3RzID0gaGl0T2JqZWN0cztcclxuICAgICAgICB0aGlzLmRpZmZpY3VsdHkgPSBkaWZmaWN1bHR5O1xyXG4gICAgICAgIHRoaXMuYXBwbGllZE1vZHMgPSBhcHBsaWVkTW9kcztcclxuICAgICAgICB0aGlzLmNvbnRyb2xQb2ludEluZm8gPSBjb250cm9sUG9pbnRJbmZvO1xyXG4gICAgICAgIHRoaXMuaGl0T2JqZWN0RGljdCA9ICgwLCBpbmRleF8xLm5vcm1hbGl6ZUhpdE9iamVjdHMpKGhpdE9iamVjdHMpO1xyXG4gICAgICAgIHRoaXMuZ2FtZUNsb2NrUmF0ZSA9ICgwLCBpbmRleF8xLmRldGVybWluZURlZmF1bHRQbGF5YmFja1NwZWVkKShhcHBsaWVkTW9kcyk7XHJcbiAgICB9XHJcbiAgICBnZXRIaXRPYmplY3QoaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oaXRPYmplY3REaWN0W2lkXTtcclxuICAgIH1cclxuICAgIC8vIFRPRE86IFBlcmZvcm0gc29tZSAudHlwZSBjaGVja3Mgb3RoZXJ3aXNlIHRoZXNlIGRvbid0IG1ha2Ugc2Vuc2VcclxuICAgIGdldFNsaWRlckNoZWNrUG9pbnQoaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oaXRPYmplY3REaWN0W2lkXTtcclxuICAgIH1cclxuICAgIGdldFNsaWRlcihpZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhpdE9iamVjdERpY3RbaWRdO1xyXG4gICAgfVxyXG4gICAgZ2V0SGl0Q2lyY2xlKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGl0T2JqZWN0RGljdFtpZF07XHJcbiAgICB9XHJcbiAgICBnZXRTcGlubmVyKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGl0T2JqZWN0RGljdFtpZF07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5CZWF0bWFwID0gQmVhdG1hcDtcclxuQmVhdG1hcC5FTVBUWV9CRUFUTUFQID0gbmV3IEJlYXRtYXAoW10sIEJlYXRtYXBEaWZmaWN1bHR5XzEuREVGQVVMVF9CRUFUTUFQX0RJRkZJQ1VMVFksIFtdLCBuZXcgQ29udHJvbFBvaW50SW5mb18xLkNvbnRyb2xQb2ludEluZm8oKSk7XHJcbi8vIFV0aWxpdHk/XHJcbmNvbnN0IGVuZFRpbWUgPSAobykgPT4gKCgwLCBUeXBlc18xLmlzSGl0Q2lyY2xlKShvKSA/IG8uaGl0VGltZSA6IG8uZW5kVGltZSk7XHJcbmZ1bmN0aW9uIG1vc3RDb21tb25CZWF0TGVuZ3RoKHsgaGl0T2JqZWN0cywgdGltaW5nUG9pbnRzLCB9KSB7XHJcbiAgICAvLyBUaGUgbGFzdCBwbGF5YWJsZSB0aW1lIGluIHRoZSBiZWF0bWFwIC0gdGhlIGxhc3QgdGltaW5nIHBvaW50IGV4dGVuZHMgdG8gdGhpcyB0aW1lLlxyXG4gICAgLy8gTm90ZTogVGhpcyBpcyBtb3JlIGFjY3VyYXRlIGFuZCBtYXkgcHJlc2VudCBkaWZmZXJlbnQgcmVzdWx0cyBiZWNhdXNlIG9zdS1zdGFibGUgZGlkbid0IGhhdmUgdGhlIGFiaWxpdHkgdG9cclxuICAgIC8vIGNhbGN1bGF0ZSBzbGlkZXIgZHVyYXRpb25zIGluIHRoaXMgY29udGV4dC5cclxuICAgIGxldCBsYXN0VGltZSA9IDA7XHJcbiAgICBpZiAoaGl0T2JqZWN0cy5sZW5ndGggPiAwKVxyXG4gICAgICAgIGxhc3RUaW1lID0gZW5kVGltZShoaXRPYmplY3RzW2hpdE9iamVjdHMubGVuZ3RoIC0gMV0pO1xyXG4gICAgZWxzZSBpZiAodGltaW5nUG9pbnRzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgbGFzdFRpbWUgPSB0aW1pbmdQb2ludHNbdGltaW5nUG9pbnRzLmxlbmd0aCAtIDFdLnRpbWU7XHJcbiAgICAvLyAxLiBHcm91cCB0aGUgYmVhdCBsZW5ndGhzIGFuZCBhZ2dyZWdhdGUgdGhlIGR1cmF0aW9uc1xyXG4gICAgY29uc3QgZHVyYXRpb25zID0gbmV3IE1hcCgpO1xyXG4gICAgZnVuY3Rpb24gYWRkKGQsIHgpIHtcclxuICAgICAgICBkID0gTWF0aC5yb3VuZChkICogMTAwMCkgLyAxMDAwO1xyXG4gICAgICAgIGNvbnN0IGEgPSBkdXJhdGlvbnMuZ2V0KGQpO1xyXG4gICAgICAgIGlmIChhID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGR1cmF0aW9ucy5zZXQoZCwgeCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkdXJhdGlvbnMuc2V0KGQsIGEgKyB4KTtcclxuICAgIH1cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGltaW5nUG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgdCA9IHRpbWluZ1BvaW50c1tpXTtcclxuICAgICAgICBpZiAodC50aW1lID4gbGFzdFRpbWUpIHtcclxuICAgICAgICAgICAgYWRkKHQuYmVhdExlbmd0aCwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBvc3Utc3RhYmxlIGZvcmNlZCB0aGUgZmlyc3QgY29udHJvbCBwb2ludCB0byBzdGFydCBhdCAwLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIHJlcHJvZHVjZWQgaGVyZSB0byBtYWludGFpbiBjb21wYXRpYmlsaXR5IGFyb3VuZCBvc3UhbWFuaWEgc2Nyb2xsIHNwZWVkIGFuZCBzb25nIHNlbGVjdCBkaXNwbGF5LlxyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50VGltZSA9IGkgPT09IDAgPyAwIDogdC50aW1lO1xyXG4gICAgICAgICAgICBjb25zdCBuZXh0VGltZSA9IGkgKyAxID09PSB0aW1pbmdQb2ludHMubGVuZ3RoID8gbGFzdFRpbWUgOiB0aW1pbmdQb2ludHNbaSArIDFdLnRpbWU7XHJcbiAgICAgICAgICAgIGFkZCh0LmJlYXRMZW5ndGgsIG5leHRUaW1lIC0gY3VycmVudFRpbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIDIuIFNvcnQgYnkgZHVyYXRpb24gZGVzY2VuZGluZ2x5XHJcbiAgICBjb25zdCBsaXN0ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGJlYXRMZW5ndGggb2YgZHVyYXRpb25zLmtleXMoKSkge1xyXG4gICAgICAgIGxpc3QucHVzaCh7IGJlYXRMZW5ndGg6IGJlYXRMZW5ndGgsIGR1cmF0aW9uOiBkdXJhdGlvbnMuZ2V0KGJlYXRMZW5ndGgpIH0pO1xyXG4gICAgfVxyXG4gICAgbGlzdC5zb3J0KChhLCBiKSA9PiBiLmR1cmF0aW9uIC0gYS5kdXJhdGlvbik7XHJcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGxpc3RbMF0uYmVhdExlbmd0aDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLm1vc3RDb21tb25CZWF0TGVuZ3RoID0gbW9zdENvbW1vbkJlYXRMZW5ndGg7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuYnVpbGRCZWF0bWFwID0gdm9pZCAwO1xyXG5jb25zdCBIaXRDaXJjbGVfMSA9IHJlcXVpcmUoXCIuLi9oaXRvYmplY3RzL0hpdENpcmNsZVwiKTtcclxuY29uc3QgTW9kc18xID0gcmVxdWlyZShcIi4uL21vZHMvTW9kc1wiKTtcclxuY29uc3QgU3RhY2tpbmdNb2RfMSA9IHJlcXVpcmUoXCIuLi9tb2RzL1N0YWNraW5nTW9kXCIpO1xyXG5jb25zdCBTbGlkZXJDaGVja1BvaW50R2VuZXJhdG9yXzEgPSByZXF1aXJlKFwiLi4vaGl0b2JqZWN0cy9zbGlkZXIvU2xpZGVyQ2hlY2tQb2ludEdlbmVyYXRvclwiKTtcclxuY29uc3QgU2xpZGVyUGF0aF8xID0gcmVxdWlyZShcIi4uL2hpdG9iamVjdHMvc2xpZGVyL1NsaWRlclBhdGhcIik7XHJcbmNvbnN0IFNsaWRlcl8xID0gcmVxdWlyZShcIi4uL2hpdG9iamVjdHMvU2xpZGVyXCIpO1xyXG5jb25zdCBTbGlkZXJDaGVja1BvaW50XzEgPSByZXF1aXJlKFwiLi4vaGl0b2JqZWN0cy9TbGlkZXJDaGVja1BvaW50XCIpO1xyXG5jb25zdCBCZWF0bWFwXzEgPSByZXF1aXJlKFwiLi9CZWF0bWFwXCIpO1xyXG5jb25zdCBTcGlubmVyXzEgPSByZXF1aXJlKFwiLi4vaGl0b2JqZWN0cy9TcGlubmVyXCIpO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uL21hdGgvaW5kZXhcIik7XHJcbmNvbnN0IEhhcmRSb2NrTW9kXzEgPSByZXF1aXJlKFwiLi4vbW9kcy9IYXJkUm9ja01vZFwiKTtcclxuZnVuY3Rpb24gY29weVBvc2l0aW9uKHsgeCwgeSB9KSB7XHJcbiAgICByZXR1cm4geyB4LCB5IH07XHJcbn1cclxuZnVuY3Rpb24gY3JlYXRlSGl0Q2lyY2xlKGlkLCBoaXRDaXJjbGVTZXR0aW5ncywgY29udHJvbFBvaW50SW5mbywgYmVhdG1hcERpZmZpY3VsdHkpIHtcclxuICAgIGNvbnN0IGhpdENpcmNsZSA9IG5ldyBIaXRDaXJjbGVfMS5IaXRDaXJjbGUoKTtcclxuICAgIGhpdENpcmNsZS5pZCA9IGlkO1xyXG4gICAgaGl0Q2lyY2xlLnBvc2l0aW9uID0gY29weVBvc2l0aW9uKGhpdENpcmNsZVNldHRpbmdzLnBvc2l0aW9uKTtcclxuICAgIGhpdENpcmNsZS51bnN0YWNrZWRQb3NpdGlvbiA9IGNvcHlQb3NpdGlvbihoaXRDaXJjbGVTZXR0aW5ncy5wb3NpdGlvbik7XHJcbiAgICBoaXRDaXJjbGUuaGl0VGltZSA9IGhpdENpcmNsZVNldHRpbmdzLnRpbWU7XHJcbiAgICBoaXRDaXJjbGUuc2NhbGUgPSAoMCwgaW5kZXhfMS5jaXJjbGVTaXplVG9TY2FsZSkoYmVhdG1hcERpZmZpY3VsdHkuY2lyY2xlU2l6ZSk7XHJcbiAgICBoaXRDaXJjbGUuYXBwcm9hY2hEdXJhdGlvbiA9ICgwLCBpbmRleF8xLmFwcHJvYWNoUmF0ZVRvQXBwcm9hY2hEdXJhdGlvbikoYmVhdG1hcERpZmZpY3VsdHkuYXBwcm9hY2hSYXRlKTtcclxuICAgIGhpdENpcmNsZS5mYWRlSW5EdXJhdGlvbiA9ICgwLCBpbmRleF8xLmdldEZhZGVJbkR1cmF0aW9uKShiZWF0bWFwRGlmZmljdWx0eS5hcHByb2FjaFJhdGUpO1xyXG4gICAgcmV0dXJuIGhpdENpcmNsZTtcclxufVxyXG5mdW5jdGlvbiBjcmVhdGVTbGlkZXJDaGVja1BvaW50KHNsaWRlciwgaWQsIGRlc2NyaXB0b3IpIHtcclxuICAgIGNvbnN0IGNoZWNrUG9pbnQgPSBuZXcgU2xpZGVyQ2hlY2tQb2ludF8xLlNsaWRlckNoZWNrUG9pbnQoc2xpZGVyKTtcclxuICAgIGNvbnN0IHsgdGltZSwgc3BhblN0YXJ0VGltZSwgc3BhbkluZGV4LCBzcGFuUHJvZ3Jlc3MgfSA9IGRlc2NyaXB0b3I7XHJcbiAgICBjaGVja1BvaW50LmlkID0gaWQ7XHJcbiAgICBjaGVja1BvaW50Lm9mZnNldCA9IHNsaWRlci5wYXRoLnBvc2l0aW9uQXQoc3BhblByb2dyZXNzKTtcclxuICAgIGNoZWNrUG9pbnQudHlwZSA9IGRlc2NyaXB0b3IudHlwZTtcclxuICAgIGNoZWNrUG9pbnQuaGl0VGltZSA9IHRpbWU7XHJcbiAgICBjaGVja1BvaW50LnNwYW5JbmRleCA9IHNwYW5JbmRleDtcclxuICAgIGNoZWNrUG9pbnQuc3BhblN0YXJ0VGltZSA9IHNwYW5TdGFydFRpbWU7XHJcbiAgICBjaGVja1BvaW50LnNwYW5Qcm9ncmVzcyA9IHNwYW5Qcm9ncmVzcztcclxuICAgIHJldHVybiBjaGVja1BvaW50O1xyXG59XHJcbmZ1bmN0aW9uIGNyZWF0ZVNsaWRlckNoZWNrUG9pbnRzKHNsaWRlcikge1xyXG4gICAgY29uc3QgY2hlY2tQb2ludHMgPSBbXTtcclxuICAgIGxldCBjaGVja3BvaW50SW5kZXggPSAwO1xyXG4gICAgZm9yIChjb25zdCBlIG9mICgwLCBTbGlkZXJDaGVja1BvaW50R2VuZXJhdG9yXzEuZ2VuZXJhdGVTbGlkZXJDaGVja3BvaW50cykoc2xpZGVyLnN0YXJ0VGltZSwgc2xpZGVyLnNwYW5EdXJhdGlvbiwgc2xpZGVyLnZlbG9jaXR5LCBzbGlkZXIudGlja0Rpc3RhbmNlLCBzbGlkZXIucGF0aC5kaXN0YW5jZSwgc2xpZGVyLnNwYW5Db3VudCwgc2xpZGVyLmxlZ2FjeUxhc3RUaWNrT2Zmc2V0KSkge1xyXG4gICAgICAgIGNvbnN0IGlkID0gYCR7c2xpZGVyLmlkfS8ke2NoZWNrcG9pbnRJbmRleCsrfWA7XHJcbiAgICAgICAgY2hlY2tQb2ludHMucHVzaChjcmVhdGVTbGlkZXJDaGVja1BvaW50KHNsaWRlciwgaWQsIGUpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjaGVja1BvaW50cztcclxufVxyXG5mdW5jdGlvbiBjb3B5UGF0aFBvaW50cyhwYXRoUG9pbnRzKSB7XHJcbiAgICByZXR1cm4gcGF0aFBvaW50cy5tYXAoKHsgdHlwZSwgb2Zmc2V0IH0pID0+ICh7XHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICBvZmZzZXQ6IGNvcHlQb3NpdGlvbihvZmZzZXQpLFxyXG4gICAgfSkpO1xyXG59XHJcbmZ1bmN0aW9uIGNyZWF0ZVNsaWRlcihpbmRleCwgc2xpZGVyU2V0dGluZ3MsIGNvbnRyb2xQb2ludEluZm8sIGRpZmZpY3VsdHkpIHtcclxuICAgIGNvbnN0IGFwcHJvYWNoRHVyYXRpb24gPSAoMCwgaW5kZXhfMS5hcHByb2FjaFJhdGVUb0FwcHJvYWNoRHVyYXRpb24pKGRpZmZpY3VsdHkuYXBwcm9hY2hSYXRlKTtcclxuICAgIGNvbnN0IGZhZGVJbkR1cmF0aW9uID0gKDAsIGluZGV4XzEuZ2V0RmFkZUluRHVyYXRpb24pKGRpZmZpY3VsdHkuYXBwcm9hY2hSYXRlKTtcclxuICAgIGNvbnN0IHNjYWxlID0gKDAsIGluZGV4XzEuY2lyY2xlU2l6ZVRvU2NhbGUpKGRpZmZpY3VsdHkuY2lyY2xlU2l6ZSk7XHJcbiAgICBjb25zdCBoaXRUaW1lID0gc2xpZGVyU2V0dGluZ3MudGltZTtcclxuICAgIGNvbnN0IHRpbWluZ1BvaW50ID0gY29udHJvbFBvaW50SW5mby50aW1pbmdQb2ludEF0KGhpdFRpbWUpO1xyXG4gICAgY29uc3QgZGlmZmljdWx0eVBvaW50ID0gY29udHJvbFBvaW50SW5mby5kaWZmaWN1bHR5UG9pbnRBdChoaXRUaW1lKTtcclxuICAgIGNvbnN0IHNjb3JpbmdEaXN0YW5jZSA9IFNsaWRlcl8xLlNsaWRlci5CQVNFX1NDT1JJTkdfRElTVEFOQ0UgKiBkaWZmaWN1bHR5LnNsaWRlck11bHRpcGxpZXIgKiBkaWZmaWN1bHR5UG9pbnQuc3BlZWRNdWx0aXBsaWVyO1xyXG4gICAgY29uc3Qgc2xpZGVySWQgPSBpbmRleC50b1N0cmluZygpO1xyXG4gICAgY29uc3QgaGVhZCA9IG5ldyBIaXRDaXJjbGVfMS5IaXRDaXJjbGUoKTtcclxuICAgIGhlYWQuaWQgPSBgJHtpbmRleC50b1N0cmluZygpfS9IRUFEYDtcclxuICAgIGhlYWQudW5zdGFja2VkUG9zaXRpb24gPSBjb3B5UG9zaXRpb24oc2xpZGVyU2V0dGluZ3MucG9zaXRpb24pO1xyXG4gICAgaGVhZC5wb3NpdGlvbiA9IGNvcHlQb3NpdGlvbihzbGlkZXJTZXR0aW5ncy5wb3NpdGlvbik7XHJcbiAgICBoZWFkLmhpdFRpbWUgPSBzbGlkZXJTZXR0aW5ncy50aW1lO1xyXG4gICAgaGVhZC5hcHByb2FjaER1cmF0aW9uID0gYXBwcm9hY2hEdXJhdGlvbjtcclxuICAgIGhlYWQuc2NhbGUgPSBzY2FsZTtcclxuICAgIGhlYWQuc2xpZGVySWQgPSBzbGlkZXJJZDtcclxuICAgIGNvbnN0IHNsaWRlciA9IG5ldyBTbGlkZXJfMS5TbGlkZXIoaGVhZCk7XHJcbiAgICBzbGlkZXIuaWQgPSBzbGlkZXJJZDtcclxuICAgIHNsaWRlci5yZXBlYXRDb3VudCA9IHNsaWRlclNldHRpbmdzLnJlcGVhdENvdW50O1xyXG4gICAgc2xpZGVyLmxlZ2FjeUxhc3RUaWNrT2Zmc2V0ID0gc2xpZGVyU2V0dGluZ3MubGVnYWN5TGFzdFRpY2tPZmZzZXQ7XHJcbiAgICBzbGlkZXIudmVsb2NpdHkgPSBzY29yaW5nRGlzdGFuY2UgLyB0aW1pbmdQb2ludC5iZWF0TGVuZ3RoO1xyXG4gICAgc2xpZGVyLnRpY2tEaXN0YW5jZSA9IChzY29yaW5nRGlzdGFuY2UgLyBkaWZmaWN1bHR5LnNsaWRlclRpY2tSYXRlKSAqIHNsaWRlclNldHRpbmdzLnRpY2tEaXN0YW5jZU11bHRpcGxpZXI7XHJcbiAgICBzbGlkZXIucGF0aCA9IG5ldyBTbGlkZXJQYXRoXzEuU2xpZGVyUGF0aChjb3B5UGF0aFBvaW50cyhzbGlkZXJTZXR0aW5ncy5wYXRoUG9pbnRzKSwgc2xpZGVyU2V0dGluZ3MubGVuZ3RoKTtcclxuICAgIHNsaWRlci5jaGVja1BvaW50cyA9IGNyZWF0ZVNsaWRlckNoZWNrUG9pbnRzKHNsaWRlcik7XHJcbiAgICByZXR1cm4gc2xpZGVyO1xyXG59XHJcbmZ1bmN0aW9uIGNyZWF0ZVNwaW5uZXIoaWQsIHNldHRpbmdzLCBjb250cm9sUG9pbnRJbmZvLCBkaWZmaWN1bHR5KSB7XHJcbiAgICBjb25zdCBzcGlubmVyID0gbmV3IFNwaW5uZXJfMS5TcGlubmVyKCk7XHJcbiAgICBzcGlubmVyLmlkID0gaWQ7XHJcbiAgICBzcGlubmVyLnN0YXJ0VGltZSA9IHNldHRpbmdzLnRpbWU7XHJcbiAgICBzcGlubmVyLmR1cmF0aW9uID0gc2V0dGluZ3MuZHVyYXRpb247XHJcbiAgICByZXR1cm4gc3Bpbm5lcjtcclxufVxyXG5mdW5jdGlvbiBjcmVhdGVTdGF0aWNIaXRPYmplY3QoaW5kZXgsIGhpdE9iamVjdFNldHRpbmcsIGNvbnRyb2xQb2ludEluZm8sIGJlYXRtYXBEaWZmaWN1bHR5KSB7XHJcbiAgICBzd2l0Y2ggKGhpdE9iamVjdFNldHRpbmcudHlwZSkge1xyXG4gICAgICAgIGNhc2UgXCJISVRfQ0lSQ0xFXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVIaXRDaXJjbGUoaW5kZXgudG9TdHJpbmcoKSwgaGl0T2JqZWN0U2V0dGluZywgY29udHJvbFBvaW50SW5mbywgYmVhdG1hcERpZmZpY3VsdHkpO1xyXG4gICAgICAgIGNhc2UgXCJTTElERVJcIjpcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVNsaWRlcihpbmRleCwgaGl0T2JqZWN0U2V0dGluZywgY29udHJvbFBvaW50SW5mbywgYmVhdG1hcERpZmZpY3VsdHkpO1xyXG4gICAgICAgIGNhc2UgXCJTUElOTkVSXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVTcGlubmVyKGluZGV4LnRvU3RyaW5nKCksIGhpdE9iamVjdFNldHRpbmcsIGNvbnRyb2xQb2ludEluZm8sIGJlYXRtYXBEaWZmaWN1bHR5KTtcclxuICAgIH1cclxuICAgIHRocm93IG5ldyBFcnJvcihcIlR5cGUgbm90IHJlY29nbml6ZWQuLi5cIik7XHJcbn1cclxuLy8gTXV0YXRlcyB0aGUgaGl0T2JqZWN0IGNvbWJvIGluZGV4IHZhbHVlc1xyXG5mdW5jdGlvbiBhc3NpZ25Db21ib0luZGV4KGJsdWVQcmludFNldHRpbmdzLCBoaXRPYmplY3RzKSB7XHJcbiAgICBsZXQgY29tYm9TZXRJbmRleCA9IC0xLCB3aXRoaW5TZXRJbmRleCA9IDA7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhpdE9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB7IG5ld0NvbWJvLCBjb21ib1NraXAsIHR5cGUgfSA9IGJsdWVQcmludFNldHRpbmdzW2ldO1xyXG4gICAgICAgIGNvbnN0IGhpdE9iamVjdCA9IGhpdE9iamVjdHNbaV07IC8vIGNoYW5nZSAnY29uc3QnIC0+ICdsZXQnIGZvciBiZXR0ZXIgcmVhZGFiaWxpdHlcclxuICAgICAgICBpZiAoaSA9PT0gMCB8fCBuZXdDb21ibyB8fCB0eXBlID09PSBcIlNQSU5ORVJcIikge1xyXG4gICAgICAgICAgICBjb21ib1NldEluZGV4ICs9IGNvbWJvU2tpcCArIDE7XHJcbiAgICAgICAgICAgIHdpdGhpblNldEluZGV4ID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gU3Bpbm5lcnMgZG8gbm90IGhhdmUgY29tYm9TZXRJbmRleCBvciB3aXRoaW5Db21ib1NldEluZGV4XHJcbiAgICAgICAgaWYgKGhpdE9iamVjdCBpbnN0YW5jZW9mIEhpdENpcmNsZV8xLkhpdENpcmNsZSkge1xyXG4gICAgICAgICAgICBoaXRPYmplY3QuY29tYm9TZXRJbmRleCA9IGNvbWJvU2V0SW5kZXg7XHJcbiAgICAgICAgICAgIGhpdE9iamVjdC53aXRoaW5Db21ib1NldEluZGV4ID0gd2l0aGluU2V0SW5kZXgrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoaGl0T2JqZWN0IGluc3RhbmNlb2YgU2xpZGVyXzEuU2xpZGVyKSB7XHJcbiAgICAgICAgICAgIGhpdE9iamVjdC5oZWFkLmNvbWJvU2V0SW5kZXggPSBjb21ib1NldEluZGV4O1xyXG4gICAgICAgICAgICBoaXRPYmplY3QuaGVhZC53aXRoaW5Db21ib1NldEluZGV4ID0gd2l0aGluU2V0SW5kZXgrKztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy8gVGhlcmUgc2hvdWxkIG9ubHkgYmUgb25lLCBvdGhlcndpc2UgLi4uXHJcbmZ1bmN0aW9uIGZpbmREaWZmaWN1bHR5QXBwbGllcihtb2RzKSB7XHJcbiAgICBmb3IgKGNvbnN0IG0gb2YgbW9kcykge1xyXG4gICAgICAgIGNvbnN0IGFkanVzdGVyID0gTW9kc18xLk1vZFNldHRpbmdzW21dLmRpZmZpY3VsdHlBZGp1c3RlcjtcclxuICAgICAgICBpZiAoYWRqdXN0ZXIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWRqdXN0ZXI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIChkKSA9PiBkOyAvLyBUaGUgaWRlbnRpdHkgZnVuY3Rpb25cclxufVxyXG5jb25zdCBkZWZhdWx0QmVhdG1hcEJ1aWxkZXJPcHRpb25zID0ge1xyXG4gICAgYWRkU3RhY2tpbmc6IHRydWUsXHJcbiAgICBtb2RzOiBbXSxcclxufTtcclxuLyoqXHJcbiAqIEJ1aWxkcyB0aGUgYmVhdG1hcCBmcm9tIHRoZSBnaXZlbiBibHVlcHJpbnQgYW5kIG9wdGlvbnMuXHJcbiAqXHJcbiAqIEl0IERPRVMgbm90IHBlcmZvcm0gYSBjaGVjayBvbiB0aGUgZ2l2ZW4gc3Vic2V0IG9mIG1vZHMuIFNvIGlmIHlvdSBlbnRlciBoYWxmLXRpbWUgYW5kIGRvdWJsZSB0aW1lIGF0IHRoZSBzYW1lIHRpbWUsXHJcbiAqIHRoZW4gdGhpcyBtaWdodCByZXR1cm4gYmFkIHJlc3VsdHMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Qmx1ZXByaW50fSBibHVlUHJpbnRcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcclxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmFkZFN0YWNraW5nIHdoZXRoZXIgdG8gYXBwbHkgc2V0dGluZyBvciBub3QgKGJ5IGRlZmF1bHQgdHJ1ZSlcclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkQmVhdG1hcChibHVlUHJpbnQsIG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHsgYmVhdG1hcFZlcnNpb24sIHN0YWNrTGVuaWVuY3kgfSA9IGJsdWVQcmludC5ibHVlcHJpbnRJbmZvO1xyXG4gICAgY29uc3QgeyBtb2RzLCBhZGRTdGFja2luZyB9ID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0QmVhdG1hcEJ1aWxkZXJPcHRpb25zKSwgb3B0aW9ucyk7XHJcbiAgICBjb25zdCBmaW5hbERpZmZpY3VsdHkgPSBmaW5kRGlmZmljdWx0eUFwcGxpZXIobW9kcykoYmx1ZVByaW50LmRlZmF1bHREaWZmaWN1bHR5KTtcclxuICAgIGNvbnN0IGhpdE9iamVjdHMgPSBibHVlUHJpbnQuaGl0T2JqZWN0U2V0dGluZ3MubWFwKChzZXR0aW5nLCBpbmRleCkgPT4gY3JlYXRlU3RhdGljSGl0T2JqZWN0KGluZGV4LCBzZXR0aW5nLCBibHVlUHJpbnQuY29udHJvbFBvaW50SW5mbywgZmluYWxEaWZmaWN1bHR5KSk7XHJcbiAgICBhc3NpZ25Db21ib0luZGV4KGJsdWVQcmludC5oaXRPYmplY3RTZXR0aW5ncywgaGl0T2JqZWN0cyk7XHJcbiAgICBpZiAobW9kcy5pbmNsdWRlcyhcIkhBUkRfUk9DS1wiKSkge1xyXG4gICAgICAgIEhhcmRSb2NrTW9kXzEuSGFyZFJvY2tNb2QuZmxpcFZlcnRpY2FsbHkoaGl0T2JqZWN0cyk7XHJcbiAgICB9XHJcbiAgICBpZiAoYWRkU3RhY2tpbmcpIHtcclxuICAgICAgICAoMCwgU3RhY2tpbmdNb2RfMS5tb2RpZnlTdGFja2luZ1Bvc2l0aW9uKShoaXRPYmplY3RzLCBzdGFja0xlbmllbmN5LCBiZWF0bWFwVmVyc2lvbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IEJlYXRtYXBfMS5CZWF0bWFwKGhpdE9iamVjdHMsIGZpbmFsRGlmZmljdWx0eSwgbW9kcywgYmx1ZVByaW50LmNvbnRyb2xQb2ludEluZm8pO1xyXG59XHJcbmV4cG9ydHMuYnVpbGRCZWF0bWFwID0gYnVpbGRCZWF0bWFwO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkRFRkFVTFRfQkVBVE1BUF9ESUZGSUNVTFRZID0gdm9pZCAwO1xyXG5leHBvcnRzLkRFRkFVTFRfQkVBVE1BUF9ESUZGSUNVTFRZID0gT2JqZWN0LmZyZWV6ZSh7XHJcbiAgICBkcmFpblJhdGU6IDUsXHJcbiAgICBjaXJjbGVTaXplOiA1LFxyXG4gICAgb3ZlcmFsbERpZmZpY3VsdHk6IDUsXHJcbiAgICAvLyBUZWNobmljYWxseSBzcGVha2luZyBkZWZhdWx0IHZhbHVlIG9mIEFSIGlzIDUgYmVjYXVzZSBPRCBpcyA1XHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcHB5L29zdS9ibG9iL2IxZmNiODQwYTlmZjRkODY2YWFjMjYyYWNlN2Y1NGZhODhiNWUwY2Uvb3N1LkdhbWUvQmVhdG1hcHMvQmVhdG1hcERpZmZpY3VsdHkuY3MjTDM1XHJcbiAgICBhcHByb2FjaFJhdGU6IDUsXHJcbiAgICBzbGlkZXJNdWx0aXBsaWVyOiAxLFxyXG4gICAgc2xpZGVyVGlja1JhdGU6IDEsXHJcbn0pO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkNvbnRyb2xQb2ludCA9IHZvaWQgMDtcclxuY2xhc3MgQ29udHJvbFBvaW50IHtcclxuICAgIGdldCB0aW1lKCkge1xyXG4gICAgICAgIHZhciBfYSwgX2I7XHJcbiAgICAgICAgcmV0dXJuIChfYiA9IChfYSA9IHRoaXMuY29udHJvbFBvaW50R3JvdXApID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS50aW1lKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiAwO1xyXG4gICAgfVxyXG4gICAgY29tcGFyZVRvKG90aGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGltZSAtIG90aGVyLnRpbWU7XHJcbiAgICB9XHJcbiAgICBhdHRhY2hHcm91cChwb2ludEdyb3VwKSB7XHJcbiAgICAgICAgdGhpcy5jb250cm9sUG9pbnRHcm91cCA9IHBvaW50R3JvdXA7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5Db250cm9sUG9pbnQgPSBDb250cm9sUG9pbnQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuQ29udHJvbFBvaW50R3JvdXAgPSB2b2lkIDA7XHJcbmNsYXNzIENvbnRyb2xQb2ludEdyb3VwIHtcclxuICAgIC8vIGl0ZW1SZW1vdmVkOiBhbnk7XHJcbiAgICAvLyBpdGVtQWRkZWQ6IGFueTtcclxuICAgIGNvbnN0cnVjdG9yKHRpbWUpIHtcclxuICAgICAgICB0aGlzLnRpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuY29udHJvbFBvaW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMudGltZSA9IHRpbWU7XHJcbiAgICB9XHJcbiAgICBhZGQocG9pbnQpIHtcclxuICAgICAgICB2YXIgX2EsIF9iO1xyXG4gICAgICAgIGNvbnN0IGkgPSB0aGlzLmNvbnRyb2xQb2ludHMuZmluZEluZGV4KCh2YWx1ZSkgPT4gdmFsdWUudHlwZSA9PT0gcG9pbnQudHlwZSk7XHJcbiAgICAgICAgaWYgKGkgPiAtMSkge1xyXG4gICAgICAgICAgICBjb25zdCBwID0gdGhpcy5jb250cm9sUG9pbnRzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xQb2ludHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAoX2EgPSB0aGlzLmNvbnRyb2xQb2ludEluZm8pID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5ncm91cEl0ZW1SZW1vdmVkKHApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwb2ludC5hdHRhY2hHcm91cCh0aGlzKTtcclxuICAgICAgICB0aGlzLmNvbnRyb2xQb2ludHMucHVzaChwb2ludCk7XHJcbiAgICAgICAgKF9iID0gdGhpcy5jb250cm9sUG9pbnRJbmZvKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ3JvdXBJdGVtQWRkZWQocG9pbnQpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQ29udHJvbFBvaW50R3JvdXAgPSBDb250cm9sUG9pbnRHcm91cDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5Db250cm9sUG9pbnRJbmZvID0gdm9pZCAwO1xyXG5jb25zdCBEaWZmaWN1bHR5Q29udHJvbFBvaW50XzEgPSByZXF1aXJlKFwiLi9EaWZmaWN1bHR5Q29udHJvbFBvaW50XCIpO1xyXG5jb25zdCBUaW1pbmdDb250cm9sUG9pbnRfMSA9IHJlcXVpcmUoXCIuL1RpbWluZ0NvbnRyb2xQb2ludFwiKTtcclxuY29uc3QgRWZmZWN0Q29udHJvbFBvaW50XzEgPSByZXF1aXJlKFwiLi9FZmZlY3RDb250cm9sUG9pbnRcIik7XHJcbmNvbnN0IFNhbXBsZUNvbnRyb2xQb2ludF8xID0gcmVxdWlyZShcIi4vU2FtcGxlQ29udHJvbFBvaW50XCIpO1xyXG5jb25zdCBDb250cm9sUG9pbnRHcm91cF8xID0gcmVxdWlyZShcIi4vQ29udHJvbFBvaW50R3JvdXBcIik7XHJcbmNvbnN0IGluZGV4XzEgPSByZXF1aXJlKFwiLi4vLi4vLi4vbWF0aC9pbmRleFwiKTtcclxuY29uc3QgU29ydGVkTGlzdF8xID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL1NvcnRlZExpc3RcIik7XHJcbmNsYXNzIENvbnRyb2xQb2ludEluZm8ge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5kaWZmaWN1bHR5UG9pbnRzID0gbmV3IFNvcnRlZExpc3RfMS5Tb3J0ZWRMaXN0KCk7XHJcbiAgICAgICAgdGhpcy50aW1pbmdQb2ludHMgPSBuZXcgU29ydGVkTGlzdF8xLlNvcnRlZExpc3QoKTtcclxuICAgICAgICB0aGlzLmVmZmVjdFBvaW50cyA9IG5ldyBTb3J0ZWRMaXN0XzEuU29ydGVkTGlzdCgpO1xyXG4gICAgICAgIHRoaXMuc2FtcGxlUG9pbnRzID0gbmV3IFNvcnRlZExpc3RfMS5Tb3J0ZWRMaXN0KCk7XHJcbiAgICAgICAgLy8gV2h5IG5vdCB1c2UgU29ydGVkTGlzdCBoZXJlID9cclxuICAgICAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgfVxyXG4gICAgZGlmZmljdWx0eVBvaW50QXQodGltZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJpbmFyeVNlYXJjaFdpdGhGYWxsYmFjayh0aGlzLmRpZmZpY3VsdHlQb2ludHMubGlzdCwgdGltZSwgRGlmZmljdWx0eUNvbnRyb2xQb2ludF8xLkRpZmZpY3VsdHlDb250cm9sUG9pbnQuREVGQVVMVCk7XHJcbiAgICB9XHJcbiAgICBzYW1wbGVQb2ludEF0KHRpbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5iaW5hcnlTZWFyY2hXaXRoRmFsbGJhY2sodGhpcy5zYW1wbGVQb2ludHMubGlzdCwgdGltZSwgdGhpcy5zYW1wbGVQb2ludHMubGVuZ3RoID4gMCA/IHRoaXMuc2FtcGxlUG9pbnRzLmxpc3RbMF0gOiBTYW1wbGVDb250cm9sUG9pbnRfMS5TYW1wbGVDb250cm9sUG9pbnQuREVGQVVMVCk7XHJcbiAgICB9XHJcbiAgICBhZGQodGltZSwgY29udHJvbFBvaW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY2hlY2tBbHJlYWR5RXhpc3RpbmcodGltZSwgY29udHJvbFBvaW50KSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGcgPSB0aGlzLmdyb3VwQXQodGltZSwgdHJ1ZSk7XHJcbiAgICAgICAgZy5hZGQoY29udHJvbFBvaW50KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGdyb3VwQXQodGltZSwgYWRkSWZOb3RFeGlzdGluZyA9IGZhbHNlKSB7XHJcbiAgICAgICAgY29uc3QgbmV3R3JvdXAgPSBuZXcgQ29udHJvbFBvaW50R3JvdXBfMS5Db250cm9sUG9pbnRHcm91cCh0aW1lKTtcclxuICAgICAgICBjb25zdCBmb3VuZCA9IHRoaXMuZ3JvdXBzLmZpbmQoKG8pID0+ICgwLCBpbmRleF8xLmZsb2F0RXF1YWwpKG8udGltZSwgdGltZSkpO1xyXG4gICAgICAgIGlmIChmb3VuZClcclxuICAgICAgICAgICAgcmV0dXJuIGZvdW5kO1xyXG4gICAgICAgIGlmIChhZGRJZk5vdEV4aXN0aW5nKSB7XHJcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgYSB3b3JrYXJvdW5kIGZvciB0aGUgZm9sbG93aW5nIHR3byB1bmNvbW1lbnRlZCBsaW5lc1xyXG4gICAgICAgICAgICBuZXdHcm91cC5jb250cm9sUG9pbnRJbmZvID0gdGhpcztcclxuICAgICAgICAgICAgLy8gbmV3R3JvdXAuaXRlbUFkZGVkID0gdGhpcy5ncm91cEl0ZW1BZGRlZDtcclxuICAgICAgICAgICAgLy8gbmV3R3JvdXAuaXRlbVJlbW92ZWQgPSB0aGlzLmdyb3VwSXRlbVJlbW92ZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzLnB1c2gobmV3R3JvdXApO1xyXG4gICAgICAgICAgICAvLyBvc3UhbGF6ZXIgdGhleSB1c2UgLmluc2VydCh+aSkgdG8gbWFpbnRhaW4gaXQgc29ydGVkIC4uLiAtPiBpc24ndCB0aGlzIE8obl4yKT9cclxuICAgICAgICAgICAgLy8gd2Ugc29ydCBjYXVzZSBsYXp5IHJuIChvcHRpbWl6ZSBsYXRlcilcclxuICAgICAgICAgICAgdGhpcy5ncm91cHMuc29ydCgoYSwgYikgPT4gYS50aW1lIC0gYi50aW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ld0dyb3VwO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIGdyb3VwSXRlbUFkZGVkKGNvbnRyb2xQb2ludCkge1xyXG4gICAgICAgIHN3aXRjaCAoY29udHJvbFBvaW50LnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBUaW1pbmdDb250cm9sUG9pbnRfMS5UaW1pbmdDb250cm9sUG9pbnQuVFlQRTpcclxuICAgICAgICAgICAgICAgIHRoaXMudGltaW5nUG9pbnRzLmFkZChjb250cm9sUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgRWZmZWN0Q29udHJvbFBvaW50XzEuRWZmZWN0Q29udHJvbFBvaW50LlRZUEU6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVmZmVjdFBvaW50cy5hZGQoY29udHJvbFBvaW50KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFNhbXBsZUNvbnRyb2xQb2ludF8xLlNhbXBsZUNvbnRyb2xQb2ludC5UWVBFOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zYW1wbGVQb2ludHMuYWRkKGNvbnRyb2xQb2ludCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBEaWZmaWN1bHR5Q29udHJvbFBvaW50XzEuRGlmZmljdWx0eUNvbnRyb2xQb2ludC5UWVBFOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5kaWZmaWN1bHR5UG9pbnRzLmFkZChjb250cm9sUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ3JvdXBJdGVtUmVtb3ZlZChjb250cm9sUG9pbnQpIHtcclxuICAgICAgICBzd2l0Y2ggKGNvbnRyb2xQb2ludC50eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgVGltaW5nQ29udHJvbFBvaW50XzEuVGltaW5nQ29udHJvbFBvaW50LlRZUEU6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWluZ1BvaW50cy5yZW1vdmUoY29udHJvbFBvaW50KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIEVmZmVjdENvbnRyb2xQb2ludF8xLkVmZmVjdENvbnRyb2xQb2ludC5UWVBFOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5lZmZlY3RQb2ludHMucmVtb3ZlKGNvbnRyb2xQb2ludCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBTYW1wbGVDb250cm9sUG9pbnRfMS5TYW1wbGVDb250cm9sUG9pbnQuVFlQRTpcclxuICAgICAgICAgICAgICAgIHRoaXMuc2FtcGxlUG9pbnRzLnJlbW92ZShjb250cm9sUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgRGlmZmljdWx0eUNvbnRyb2xQb2ludF8xLkRpZmZpY3VsdHlDb250cm9sUG9pbnQuVFlQRTpcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlmZmljdWx0eVBvaW50cy5yZW1vdmUoY29udHJvbFBvaW50KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRpbWluZ1BvaW50QXQodGltZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJpbmFyeVNlYXJjaFdpdGhGYWxsYmFjayh0aGlzLnRpbWluZ1BvaW50cy5saXN0LCB0aW1lLCB0aGlzLnRpbWluZ1BvaW50cy5sZW5ndGggPiAwID8gdGhpcy50aW1pbmdQb2ludHMuZ2V0KDApIDogVGltaW5nQ29udHJvbFBvaW50XzEuVGltaW5nQ29udHJvbFBvaW50LkRFRkFVTFQpO1xyXG4gICAgfVxyXG4gICAgZWZmZWN0UG9pbnRBdCh0aW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYmluYXJ5U2VhcmNoV2l0aEZhbGxiYWNrKHRoaXMuZWZmZWN0UG9pbnRzLmxpc3QsIHRpbWUsIEVmZmVjdENvbnRyb2xQb2ludF8xLkVmZmVjdENvbnRyb2xQb2ludC5ERUZBVUxUKTtcclxuICAgIH1cclxuICAgIGJpbmFyeVNlYXJjaFdpdGhGYWxsYmFjayhsaXN0LCB0aW1lLCBmYWxsYmFjaykge1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IHRoaXMuYmluYXJ5U2VhcmNoKGxpc3QsIHRpbWUpO1xyXG4gICAgICAgIHJldHVybiBvYmogIT09IG51bGwgJiYgb2JqICE9PSB2b2lkIDAgPyBvYmogOiBmYWxsYmFjaztcclxuICAgIH1cclxuICAgIC8vIEZpbmQgdGhlIGZpcnN0IGVsZW1lbnQgdGhhdCBoYXMgYSB0aW1lIG5vdCBsZXNzIHRoYW4gdGhlIGdpdmVuIHRpbWUuXHJcbiAgICBiaW5hcnlTZWFyY2gobGlzdCwgdGltZSkge1xyXG4gICAgICAgIGlmIChsaXN0ID09PSBudWxsKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBudWxsXCIpO1xyXG4gICAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCB8fCB0aW1lIDwgbGlzdFswXS50aW1lKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICBsZXQgbG8gPSAwO1xyXG4gICAgICAgIGxldCBoaSA9IGxpc3QubGVuZ3RoO1xyXG4gICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGluZGV4IHRoYXQgaGFzIGEgdGltZSBncmVhdGVyIHRoYW4gY3VycmVudCBvbmUuXHJcbiAgICAgICAgLy8gVGhlIHByZXZpb3VzIG9uZSB3aWxsIHRoZW4gYmUgdGhlIGFuc3dlci5cclxuICAgICAgICB3aGlsZSAobG8gPCBoaSkge1xyXG4gICAgICAgICAgICBjb25zdCBtaWQgPSBsbyArICgoaGkgLSBsbykgPj4gMSk7XHJcbiAgICAgICAgICAgIGlmIChsaXN0W21pZF0udGltZSA8PSB0aW1lKVxyXG4gICAgICAgICAgICAgICAgbG8gPSBtaWQgKyAxO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaSA9IG1pZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpc3RbbG8gLSAxXTtcclxuICAgIH1cclxuICAgIGNoZWNrQWxyZWFkeUV4aXN0aW5nKHRpbWUsIG5ld1BvaW50KSB7XHJcbiAgICAgICAgbGV0IGV4aXN0aW5nID0gbnVsbDtcclxuICAgICAgICBzd2l0Y2ggKG5ld1BvaW50LnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBUaW1pbmdDb250cm9sUG9pbnRfMS5UaW1pbmdDb250cm9sUG9pbnQuVFlQRTpcclxuICAgICAgICAgICAgICAgIGV4aXN0aW5nID0gdGhpcy5iaW5hcnlTZWFyY2godGhpcy50aW1pbmdQb2ludHMubGlzdCwgdGltZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBFZmZlY3RDb250cm9sUG9pbnRfMS5FZmZlY3RDb250cm9sUG9pbnQuVFlQRTpcclxuICAgICAgICAgICAgICAgIGV4aXN0aW5nID0gdGhpcy5lZmZlY3RQb2ludEF0KHRpbWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgU2FtcGxlQ29udHJvbFBvaW50XzEuU2FtcGxlQ29udHJvbFBvaW50LlRZUEU6XHJcbiAgICAgICAgICAgICAgICBleGlzdGluZyA9IHRoaXMuYmluYXJ5U2VhcmNoKHRoaXMuc2FtcGxlUG9pbnRzLmxpc3QsIHRpbWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgRGlmZmljdWx0eUNvbnRyb2xQb2ludF8xLkRpZmZpY3VsdHlDb250cm9sUG9pbnQuVFlQRTpcclxuICAgICAgICAgICAgICAgIGV4aXN0aW5nID0gdGhpcy5kaWZmaWN1bHR5UG9pbnRBdCh0aW1lKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUT0RPOiBpbiBvc3UhbGF6ZXIgaXQncyB3cml0dGVuIHdpdGggbmV3UG9pbnQ/LmlzUmVkdW5kYW50XHJcbiAgICAgICAgcmV0dXJuIGV4aXN0aW5nID8gbmV3UG9pbnQuaXNSZWR1bmRhbnQoZXhpc3RpbmcpIDogZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5Db250cm9sUG9pbnRJbmZvID0gQ29udHJvbFBvaW50SW5mbztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5EaWZmaWN1bHR5Q29udHJvbFBvaW50ID0gdm9pZCAwO1xyXG5jb25zdCBDb250cm9sUG9pbnRfMSA9IHJlcXVpcmUoXCIuL0NvbnRyb2xQb2ludFwiKTtcclxuY2xhc3MgRGlmZmljdWx0eUNvbnRyb2xQb2ludCBleHRlbmRzIENvbnRyb2xQb2ludF8xLkNvbnRyb2xQb2ludCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xyXG4gICAgICAgIHRoaXMuc3BlZWRNdWx0aXBsaWVyID0gMTtcclxuICAgIH1cclxuICAgIGdldCB0eXBlKCkge1xyXG4gICAgICAgIHJldHVybiBEaWZmaWN1bHR5Q29udHJvbFBvaW50LlRZUEU7XHJcbiAgICB9XHJcbiAgICBpc1JlZHVuZGFudChleGlzdGluZykge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkRpZmZpY3VsdHlDb250cm9sUG9pbnQgPSBEaWZmaWN1bHR5Q29udHJvbFBvaW50O1xyXG5EaWZmaWN1bHR5Q29udHJvbFBvaW50LkRFRkFVTFQgPSBuZXcgRGlmZmljdWx0eUNvbnRyb2xQb2ludCgpO1xyXG5EaWZmaWN1bHR5Q29udHJvbFBvaW50LlRZUEUgPSBcIkRpZmZpY3VsdHlDb250cm9sUG9pbnRcIjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5FZmZlY3RDb250cm9sUG9pbnQgPSB2b2lkIDA7XHJcbmNvbnN0IENvbnRyb2xQb2ludF8xID0gcmVxdWlyZShcIi4vQ29udHJvbFBvaW50XCIpO1xyXG5jbGFzcyBFZmZlY3RDb250cm9sUG9pbnQgZXh0ZW5kcyBDb250cm9sUG9pbnRfMS5Db250cm9sUG9pbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcclxuICAgICAgICB0aGlzLmtpYWlNb2RlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5vbWl0Rmlyc3RCYXJMaW5lID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlzUmVkdW5kYW50KGV4aXN0aW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub21pdEZpcnN0QmFyTGluZSB8fCBleGlzdGluZy50eXBlICE9PSBFZmZlY3RDb250cm9sUG9pbnQuVFlQRSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGUgPSBleGlzdGluZztcclxuICAgICAgICByZXR1cm4gdGhpcy5raWFpTW9kZSA9PT0gZS5raWFpTW9kZSAmJiB0aGlzLm9taXRGaXJzdEJhckxpbmUgPT09IGUub21pdEZpcnN0QmFyTGluZTtcclxuICAgIH1cclxuICAgIGdldCB0eXBlKCkge1xyXG4gICAgICAgIHJldHVybiBFZmZlY3RDb250cm9sUG9pbnQuVFlQRTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkVmZmVjdENvbnRyb2xQb2ludCA9IEVmZmVjdENvbnRyb2xQb2ludDtcclxuRWZmZWN0Q29udHJvbFBvaW50LlRZUEUgPSBcIkVmZmVjdENvbnRyb2xQb2ludFwiO1xyXG5FZmZlY3RDb250cm9sUG9pbnQuREVGQVVMVCA9IG5ldyBFZmZlY3RDb250cm9sUG9pbnQoKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5TYW1wbGVDb250cm9sUG9pbnQgPSB2b2lkIDA7XHJcbmNvbnN0IENvbnRyb2xQb2ludF8xID0gcmVxdWlyZShcIi4vQ29udHJvbFBvaW50XCIpO1xyXG5jbGFzcyBTYW1wbGVDb250cm9sUG9pbnQgZXh0ZW5kcyBDb250cm9sUG9pbnRfMS5Db250cm9sUG9pbnQge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcclxuICAgICAgICB0aGlzLnNhbXBsZUJhbmsgPSBTYW1wbGVDb250cm9sUG9pbnQuREVGQVVMVF9CQU5LO1xyXG4gICAgICAgIHRoaXMuc2FtcGxlVm9sdW1lID0gMTAwO1xyXG4gICAgfVxyXG4gICAgaXNSZWR1bmRhbnQoZXhpc3RpbmcpIHtcclxuICAgICAgICBpZiAoZXhpc3RpbmcudHlwZSAhPT0gU2FtcGxlQ29udHJvbFBvaW50LlRZUEUpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICBjb25zdCBlID0gZXhpc3Rpbmc7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2FtcGxlQmFuayA9PT0gZS5zYW1wbGVCYW5rICYmIHRoaXMuc2FtcGxlVm9sdW1lID09PSBlLnNhbXBsZVZvbHVtZTtcclxuICAgIH1cclxuICAgIGdldCB0eXBlKCkge1xyXG4gICAgICAgIHJldHVybiBTYW1wbGVDb250cm9sUG9pbnQuVFlQRTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLlNhbXBsZUNvbnRyb2xQb2ludCA9IFNhbXBsZUNvbnRyb2xQb2ludDtcclxuU2FtcGxlQ29udHJvbFBvaW50LlRZUEUgPSBcIlNhbXBsZUNvbnRyb2xQb2ludFwiO1xyXG5TYW1wbGVDb250cm9sUG9pbnQuREVGQVVMVF9CQU5LID0gXCJub3JtYWxcIjtcclxuU2FtcGxlQ29udHJvbFBvaW50LkRFRkFVTFQgPSBuZXcgU2FtcGxlQ29udHJvbFBvaW50KCk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuVGltaW5nQ29udHJvbFBvaW50ID0gdm9pZCAwO1xyXG5jb25zdCBDb250cm9sUG9pbnRfMSA9IHJlcXVpcmUoXCIuL0NvbnRyb2xQb2ludFwiKTtcclxuY29uc3QgVGltZVNpZ25hdHVyZXNfMSA9IHJlcXVpcmUoXCIuLi9UaW1lU2lnbmF0dXJlc1wiKTtcclxuY2xhc3MgVGltaW5nQ29udHJvbFBvaW50IGV4dGVuZHMgQ29udHJvbFBvaW50XzEuQ29udHJvbFBvaW50IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XHJcbiAgICAgICAgdGhpcy5iZWF0TGVuZ3RoID0gMTAwMDtcclxuICAgICAgICAvLyBUT0RPOiBJcyB0aGlzIHRoZSBkZWZhdWx0IHZhbHVlP1xyXG4gICAgICAgIHRoaXMudGltZVNpZ25hdHVyZSA9IFRpbWVTaWduYXR1cmVzXzEuVGltZVNpZ25hdHVyZXMuU2ltcGxlUXVhZHJ1cGxlO1xyXG4gICAgfVxyXG4gICAgLy8gVGhlIEJQTSBhdCB0aGlzIGNvbnRyb2wgcG9pbnRcclxuICAgIGdldCBCUE0oKSB7XHJcbiAgICAgICAgcmV0dXJuIDYwMDAwIC8gdGhpcy5iZWF0TGVuZ3RoO1xyXG4gICAgfVxyXG4gICAgZ2V0IHR5cGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIFRpbWluZ0NvbnRyb2xQb2ludC5UWVBFO1xyXG4gICAgfVxyXG4gICAgaXNSZWR1bmRhbnQoZXhpc3RpbmcpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5UaW1pbmdDb250cm9sUG9pbnQgPSBUaW1pbmdDb250cm9sUG9pbnQ7XHJcblRpbWluZ0NvbnRyb2xQb2ludC5UWVBFID0gXCJUaW1pbmdDb250cm9sUG9pbnRcIjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5MZWdhY3lFZmZlY3RGbGFncyA9IHZvaWQgMDtcclxudmFyIExlZ2FjeUVmZmVjdEZsYWdzO1xyXG4oZnVuY3Rpb24gKExlZ2FjeUVmZmVjdEZsYWdzKSB7XHJcbiAgICBMZWdhY3lFZmZlY3RGbGFnc1tMZWdhY3lFZmZlY3RGbGFnc1tcIk5vbmVcIl0gPSAwXSA9IFwiTm9uZVwiO1xyXG4gICAgTGVnYWN5RWZmZWN0RmxhZ3NbTGVnYWN5RWZmZWN0RmxhZ3NbXCJLaWFpXCJdID0gMV0gPSBcIktpYWlcIjtcclxuICAgIExlZ2FjeUVmZmVjdEZsYWdzW0xlZ2FjeUVmZmVjdEZsYWdzW1wiT21pdEZpcnN0QmFyTGluZVwiXSA9IDhdID0gXCJPbWl0Rmlyc3RCYXJMaW5lXCI7XHJcbn0pKExlZ2FjeUVmZmVjdEZsYWdzID0gZXhwb3J0cy5MZWdhY3lFZmZlY3RGbGFncyB8fCAoZXhwb3J0cy5MZWdhY3lFZmZlY3RGbGFncyA9IHt9KSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuVGltZVNpZ25hdHVyZXMgPSB2b2lkIDA7XHJcbnZhciBUaW1lU2lnbmF0dXJlcztcclxuKGZ1bmN0aW9uIChUaW1lU2lnbmF0dXJlcykge1xyXG4gICAgVGltZVNpZ25hdHVyZXNbVGltZVNpZ25hdHVyZXNbXCJTaW1wbGVRdWFkcnVwbGVcIl0gPSA0XSA9IFwiU2ltcGxlUXVhZHJ1cGxlXCI7XHJcbiAgICBUaW1lU2lnbmF0dXJlc1tUaW1lU2lnbmF0dXJlc1tcIlNpbXBsZVRyaXBsZVwiXSA9IDNdID0gXCJTaW1wbGVUcmlwbGVcIjtcclxufSkoVGltZVNpZ25hdHVyZXMgPSBleHBvcnRzLlRpbWVTaWduYXR1cmVzIHx8IChleHBvcnRzLlRpbWVTaWduYXR1cmVzID0ge30pKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5wYXJzZUJsdWVwcmludCA9IGV4cG9ydHMuQmx1ZXByaW50U2VjdGlvbnMgPSBleHBvcnRzLnBhcnNlT3N1SGl0T2JqZWN0U2V0dGluZyA9IGV4cG9ydHMuTGVnYWN5SGl0U2FtcGxlSW5mbyA9IHZvaWQgMDtcclxuY29uc3QgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi8uLi9tYXRoL2luZGV4XCIpO1xyXG5jb25zdCBQYXRoVHlwZV8xID0gcmVxdWlyZShcIi4uL2hpdG9iamVjdHMvc2xpZGVyL1BhdGhUeXBlXCIpO1xyXG5jb25zdCBUaW1lU2lnbmF0dXJlc18xID0gcmVxdWlyZShcIi4uL2JlYXRtYXAvVGltZVNpZ25hdHVyZXNcIik7XHJcbmNvbnN0IExlZ2FjeUVmZmVjdEZsYWdfMSA9IHJlcXVpcmUoXCIuLi9iZWF0bWFwL0xlZ2FjeUVmZmVjdEZsYWdcIik7XHJcbmNvbnN0IFRpbWluZ0NvbnRyb2xQb2ludF8xID0gcmVxdWlyZShcIi4uL2JlYXRtYXAvQ29udHJvbFBvaW50cy9UaW1pbmdDb250cm9sUG9pbnRcIik7XHJcbmNvbnN0IERpZmZpY3VsdHlDb250cm9sUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9iZWF0bWFwL0NvbnRyb2xQb2ludHMvRGlmZmljdWx0eUNvbnRyb2xQb2ludFwiKTtcclxuY29uc3QgRWZmZWN0Q29udHJvbFBvaW50XzEgPSByZXF1aXJlKFwiLi4vYmVhdG1hcC9Db250cm9sUG9pbnRzL0VmZmVjdENvbnRyb2xQb2ludFwiKTtcclxuY29uc3QgU2FtcGxlQ29udHJvbFBvaW50XzEgPSByZXF1aXJlKFwiLi4vYmVhdG1hcC9Db250cm9sUG9pbnRzL1NhbXBsZUNvbnRyb2xQb2ludFwiKTtcclxuY29uc3QgSGl0U2FtcGxlSW5mb18xID0gcmVxdWlyZShcIi4uL2F1ZGlvL0hpdFNhbXBsZUluZm9cIik7XHJcbmNvbnN0IExlZ2FjeVNhbXBsZUJhbmtfMSA9IHJlcXVpcmUoXCIuLi9hdWRpby9MZWdhY3lTYW1wbGVCYW5rXCIpO1xyXG5jb25zdCBDb250cm9sUG9pbnRJbmZvXzEgPSByZXF1aXJlKFwiLi4vYmVhdG1hcC9Db250cm9sUG9pbnRzL0NvbnRyb2xQb2ludEluZm9cIik7XHJcbmNvbnN0IFNFQ1RJT05fUkVHRVggPSAvXlxccypcXFsoLis/KV1cXHMqJC87XHJcbmNvbnN0IERFRkFVTFRfTEVHQUNZX1RJQ0tfT0ZGU0VUID0gMzY7XHJcbi8qKlxyXG4gKiAgV2lsbCBtYWtlIHN1cmUgdGhhdCB0aGUgY29tbWVudCBhdCB0aGUgZW5kIG9mIGxpbmUgaXMgcmVtb3ZlZFxyXG4gKiAgR2l2ZW4gXCIwLCAxLCAyIC8vIDwtIFRlc3RcIlxyXG4gKiAgUmV0dXJucyBcIjAsIDEsIDJcIlxyXG4gKi9cclxuZnVuY3Rpb24gc3RyaXBDb21tZW50cyhsaW5lKSB7XHJcbiAgICBjb25zdCBpbmRleCA9IGxpbmUuaW5kZXhPZihcIi8vXCIpO1xyXG4gICAgaWYgKGluZGV4ID49IDApIHtcclxuICAgICAgICByZXR1cm4gbGluZS5zdWJzdHIoMCwgaW5kZXgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGxpbmU7XHJcbiAgICB9XHJcbn1cclxudmFyIExlZ2FjeUhpdE9iamVjdFR5cGU7XHJcbihmdW5jdGlvbiAoTGVnYWN5SGl0T2JqZWN0VHlwZSkge1xyXG4gICAgTGVnYWN5SGl0T2JqZWN0VHlwZVtMZWdhY3lIaXRPYmplY3RUeXBlW1wiQ2lyY2xlXCJdID0gMV0gPSBcIkNpcmNsZVwiO1xyXG4gICAgTGVnYWN5SGl0T2JqZWN0VHlwZVtMZWdhY3lIaXRPYmplY3RUeXBlW1wiU2xpZGVyXCJdID0gMl0gPSBcIlNsaWRlclwiO1xyXG4gICAgTGVnYWN5SGl0T2JqZWN0VHlwZVtMZWdhY3lIaXRPYmplY3RUeXBlW1wiTmV3Q29tYm9cIl0gPSA0XSA9IFwiTmV3Q29tYm9cIjtcclxuICAgIExlZ2FjeUhpdE9iamVjdFR5cGVbTGVnYWN5SGl0T2JqZWN0VHlwZVtcIlNwaW5uZXJcIl0gPSA4XSA9IFwiU3Bpbm5lclwiO1xyXG4gICAgTGVnYWN5SGl0T2JqZWN0VHlwZVtMZWdhY3lIaXRPYmplY3RUeXBlW1wiQ29tYm9Ta2lwXCJdID0gMTEyXSA9IFwiQ29tYm9Ta2lwXCI7XHJcbiAgICBMZWdhY3lIaXRPYmplY3RUeXBlW0xlZ2FjeUhpdE9iamVjdFR5cGVbXCJIb2xkXCJdID0gMTI4XSA9IFwiSG9sZFwiO1xyXG59KShMZWdhY3lIaXRPYmplY3RUeXBlIHx8IChMZWdhY3lIaXRPYmplY3RUeXBlID0ge30pKTtcclxudmFyIExlZ2FjeUhpdFNvdW5kVHlwZTtcclxuKGZ1bmN0aW9uIChMZWdhY3lIaXRTb3VuZFR5cGUpIHtcclxuICAgIExlZ2FjeUhpdFNvdW5kVHlwZVtMZWdhY3lIaXRTb3VuZFR5cGVbXCJOb25lXCJdID0gMF0gPSBcIk5vbmVcIjtcclxuICAgIExlZ2FjeUhpdFNvdW5kVHlwZVtMZWdhY3lIaXRTb3VuZFR5cGVbXCJOb3JtYWxcIl0gPSAxXSA9IFwiTm9ybWFsXCI7XHJcbiAgICBMZWdhY3lIaXRTb3VuZFR5cGVbTGVnYWN5SGl0U291bmRUeXBlW1wiV2hpc3RsZVwiXSA9IDJdID0gXCJXaGlzdGxlXCI7XHJcbiAgICBMZWdhY3lIaXRTb3VuZFR5cGVbTGVnYWN5SGl0U291bmRUeXBlW1wiRmluaXNoXCJdID0gNF0gPSBcIkZpbmlzaFwiO1xyXG4gICAgTGVnYWN5SGl0U291bmRUeXBlW0xlZ2FjeUhpdFNvdW5kVHlwZVtcIkNsYXBcIl0gPSA4XSA9IFwiQ2xhcFwiO1xyXG59KShMZWdhY3lIaXRTb3VuZFR5cGUgfHwgKExlZ2FjeUhpdFNvdW5kVHlwZSA9IHt9KSk7XHJcbmNsYXNzIExlZ2FjeUhpdFNhbXBsZUluZm8gZXh0ZW5kcyBIaXRTYW1wbGVJbmZvXzEuSGl0U2FtcGxlSW5mbyB7XHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBiYW5rID0gbnVsbCwgdm9sdW1lID0gMCwgY3VzdG9tU2FtcGxlQmFuayA9IDAsIGlzTGF5ZXJlZCA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3VwZXIobmFtZSwgYmFuaywgY3VzdG9tU2FtcGxlQmFuayA+PSAyID8gY3VzdG9tU2FtcGxlQmFuay50b1N0cmluZygpIDogbnVsbCwgdm9sdW1lKTtcclxuICAgICAgICB0aGlzLmlzTGF5ZXJlZCA9IGlzTGF5ZXJlZDtcclxuICAgICAgICB0aGlzLmN1c3RvbVNhbXBsZUJhbmsgPSBjdXN0b21TYW1wbGVCYW5rO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuTGVnYWN5SGl0U2FtcGxlSW5mbyA9IExlZ2FjeUhpdFNhbXBsZUluZm87XHJcbmZ1bmN0aW9uIGhhc0ZsYWcoYml0bWFzaywgZmxhZykge1xyXG4gICAgcmV0dXJuIChiaXRtYXNrICYgZmxhZykgIT09IDA7XHJcbn1cclxuZnVuY3Rpb24gc3BsaXRLZXlWYWwobGluZSwgc2VwYXJhdG9yID0gXCI6XCIpIHtcclxuICAgIHZhciBfYSwgX2I7XHJcbiAgICBjb25zdCBzcGxpdCA9IGxpbmUuc3BsaXQoc2VwYXJhdG9yLCAyKTtcclxuICAgIHJldHVybiBbc3BsaXRbMF0udHJpbSgpLCAoX2IgPSAoX2EgPSBzcGxpdFsxXSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnRyaW0oKSkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogXCJcIl07XHJcbn1cclxuZnVuY3Rpb24gY29udmVydFBhdGhUeXBlKHZhbHVlKSB7XHJcbiAgICBzd2l0Y2ggKHZhbHVlWzBdKSB7XHJcbiAgICAgICAgLy8gVE9ETzogPz8/XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICBjYXNlIFwiQ1wiOlxyXG4gICAgICAgICAgICByZXR1cm4gUGF0aFR5cGVfMS5QYXRoVHlwZS5DYXRtdWxsO1xyXG4gICAgICAgIGNhc2UgXCJCXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBQYXRoVHlwZV8xLlBhdGhUeXBlLkJlemllcjtcclxuICAgICAgICBjYXNlIFwiTFwiOlxyXG4gICAgICAgICAgICByZXR1cm4gUGF0aFR5cGVfMS5QYXRoVHlwZS5MaW5lYXI7XHJcbiAgICAgICAgY2FzZSBcIlBcIjpcclxuICAgICAgICAgICAgcmV0dXJuIFBhdGhUeXBlXzEuUGF0aFR5cGUuUGVyZmVjdEN1cnZlO1xyXG4gICAgfVxyXG59XHJcbi8vID8/P1xyXG5jbGFzcyBMZWdhY3lEaWZmaWN1bHR5Q29udHJvbFBvaW50IGV4dGVuZHMgRGlmZmljdWx0eUNvbnRyb2xQb2ludF8xLkRpZmZpY3VsdHlDb250cm9sUG9pbnQge1xyXG4gICAgY29uc3RydWN0b3IoYmVhdExlbmd0aCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgLy8gTm90ZTogSW4gc3RhYmxlLCB0aGUgZGl2aXNpb24gb2NjdXJzIG9uIGZsb2F0cywgYnV0IHdpdGggY29tcGlsZXIgb3B0aW1pc2F0aW9ucyB0dXJuZWQgb24gYWN0dWFsbHkgc2VlbXMgdG9cclxuICAgICAgICAvLyBvY2N1ciBvbiBkb3VibGVzIHZpYSBzb21lIC5ORVQgYmxhY2sgbWFnaWMgKHBvc3NpYmx5IGlubGluaW5nPykuXHJcbiAgICAgICAgdGhpcy5icG1NdWx0aXBsaWVyID0gYmVhdExlbmd0aCA8IDAgPyAoMCwgaW5kZXhfMS5jbGFtcCkoLWJlYXRMZW5ndGgsIDEwLCAxMDAwMCkgLyAxMDAuMCA6IDE7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gY29udmVydFBhdGhTdHJpbmcocG9pbnRTdHJpbmcsIG9mZnNldCkge1xyXG4gICAgY29uc3QgcG9pbnRTcGxpdCA9IHBvaW50U3RyaW5nLnNwbGl0KFwifFwiKTtcclxuICAgIGNvbnN0IGNvbnRyb2xQb2ludHMgPSBbXTtcclxuICAgIGxldCBzdGFydEluZGV4ID0gMDtcclxuICAgIGxldCBlbmRJbmRleCA9IDA7XHJcbiAgICBsZXQgZmlyc3QgPSB0cnVlO1xyXG4gICAgd2hpbGUgKCsrZW5kSW5kZXggPCBwb2ludFNwbGl0Lmxlbmd0aCkge1xyXG4gICAgICAgIC8vIEtlZXAgaW5jcmVtZW50aW5nIGVuZEluZGV4IHdoaWxlIGl0J3Mgbm90IHRoZSBzdGFydCBvZiBhIG5ldyBzZWdtZW50IChpbmRpY2F0ZWQgYnkgaGF2aW5nIGEgdHlwZSBkZXNjcmlwdG9yIG9mXHJcbiAgICAgICAgLy8gbGVuZ3RoIDEpLlxyXG4gICAgICAgIGlmIChwb2ludFNwbGl0W2VuZEluZGV4XS5sZW5ndGggPiAxKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAvLyBNdWx0aS1zZWdtZW50ZWQgc2xpZGVycyBET04nVCBjb250YWluIHRoZSBlbmQgcG9pbnQgYXMgcGFydCBvZiB0aGUgY3VycmVudCBzZWdtZW50IGFzIGl0J3MgYXNzdW1lZCB0byBiZSB0aGVcclxuICAgICAgICAvLyBzdGFydCBvZiB0aGUgbmV4dCBzZWdtZW50LiBUaGUgc3RhcnQgb2YgdGhlIG5leHQgc2VnbWVudCBpcyB0aGUgaW5kZXggYWZ0ZXIgdGhlIHR5cGUgZGVzY3JpcHRvci5cclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGVuZEluZGV4IDwgcG9pbnRTcGxpdC5sZW5ndGggLSAxID8gcG9pbnRTcGxpdFtlbmRJbmRleCArIDFdIDogbnVsbDtcclxuICAgICAgICBjb25zdCBwb2ludHMgPSBjb252ZXJ0UG9pbnRzKHBvaW50U3BsaXQuc2xpY2Uoc3RhcnRJbmRleCwgZW5kSW5kZXgpLCBlbmRQb2ludCwgZmlyc3QsIG9mZnNldCk7XHJcbiAgICAgICAgY29udHJvbFBvaW50cy5wdXNoKC4uLnBvaW50cyk7XHJcbiAgICAgICAgc3RhcnRJbmRleCA9IGVuZEluZGV4O1xyXG4gICAgICAgIGZpcnN0ID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBpZiAoZW5kSW5kZXggPiBzdGFydEluZGV4KSB7XHJcbiAgICAgICAgY29udHJvbFBvaW50cy5wdXNoKC4uLmNvbnZlcnRQb2ludHMocG9pbnRTcGxpdC5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleCksIG51bGwsIGZpcnN0LCBvZmZzZXQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBjb250cm9sUG9pbnRzO1xyXG59XHJcbi8vIHJlYWRzIHRoZSByZWxhdGl2ZSBwb3NpdGlvbiBmcm9tIHRoZSBnaXZlbiBgc3RhcnRQb3NgXHJcbmZ1bmN0aW9uIHJlYWRQb2ludCh2YWx1ZSwgc3RhcnRQb3MsIHBvaW50cywgaW5kZXgpIHtcclxuICAgIGNvbnN0IFt4LCB5XSA9IHZhbHVlLnNwbGl0KFwiOlwiKS5tYXAocGFyc2VGbG9hdCk7XHJcbiAgICBjb25zdCBwb3NpdGlvbiA9IGluZGV4XzEuVmVjMi5zdWIoeyB4LCB5IH0sIHN0YXJ0UG9zKTtcclxuICAgIHBvaW50c1tpbmRleF0gPSB7IG9mZnNldDogcG9zaXRpb24gfTtcclxufVxyXG5mdW5jdGlvbiBpc0xpbmVhcihwKSB7XHJcbiAgICByZXR1cm4gKDAsIGluZGV4XzEuZmxvYXRFcXVhbCkoMCwgKHBbMV0ueSAtIHBbMF0ueSkgKiAocFsyXS54IC0gcFswXS54KSAtIChwWzFdLnggLSBwWzBdLngpICogKHBbMl0ueSAtIHBbMF0ueSkpO1xyXG59XHJcbmZ1bmN0aW9uIGNvbnZlcnRQb2ludHMocG9pbnRzLCBlbmRQb2ludCwgZmlyc3QsIG9mZnNldCkge1xyXG4gICAgbGV0IHR5cGUgPSBjb252ZXJ0UGF0aFR5cGUocG9pbnRzWzBdKTtcclxuICAgIGNvbnN0IHJlYWRPZmZzZXQgPSBmaXJzdCA/IDEgOiAwO1xyXG4gICAgY29uc3QgcmVhZGFibGVQb2ludHMgPSBwb2ludHMubGVuZ3RoIC0gMTtcclxuICAgIGNvbnN0IGVuZFBvaW50TGVuZ3RoID0gZW5kUG9pbnQgIT09IG51bGwgPyAxIDogMDtcclxuICAgIGNvbnN0IHZlcnRpY2VzID0gbmV3IEFycmF5KHJlYWRPZmZzZXQgKyByZWFkYWJsZVBvaW50cyArIGVuZFBvaW50TGVuZ3RoKTtcclxuICAgIC8vIEZpbGwgYW55IG5vbi1yZWFkIHBvaW50c1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWFkT2Zmc2V0OyBpKyspXHJcbiAgICAgICAgdmVydGljZXNbaV0gPSB7IG9mZnNldDogaW5kZXhfMS5WZWMyLlplcm8gfTtcclxuICAgIC8vIFBhcnNlIGludG8gY29udHJvbCBwb2ludHMuXHJcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKylcclxuICAgICAgICByZWFkUG9pbnQocG9pbnRzW2ldLCBvZmZzZXQsIHZlcnRpY2VzLCByZWFkT2Zmc2V0ICsgaSAtIDEpO1xyXG4gICAgaWYgKGVuZFBvaW50ICE9PSBudWxsKVxyXG4gICAgICAgIHJlYWRQb2ludChlbmRQb2ludCwgb2Zmc2V0LCB2ZXJ0aWNlcywgdmVydGljZXMubGVuZ3RoIC0gMSk7XHJcbiAgICBpZiAodHlwZSA9PT0gUGF0aFR5cGVfMS5QYXRoVHlwZS5QZXJmZWN0Q3VydmUpIHtcclxuICAgICAgICBpZiAodmVydGljZXMubGVuZ3RoICE9PSAzKVxyXG4gICAgICAgICAgICB0eXBlID0gUGF0aFR5cGVfMS5QYXRoVHlwZS5CZXppZXI7XHJcbiAgICAgICAgZWxzZSBpZiAoaXNMaW5lYXIodmVydGljZXMubWFwKCh2KSA9PiB2Lm9mZnNldCkpKVxyXG4gICAgICAgICAgICB0eXBlID0gUGF0aFR5cGVfMS5QYXRoVHlwZS5MaW5lYXI7XHJcbiAgICB9XHJcbiAgICB2ZXJ0aWNlc1swXS50eXBlID0gdHlwZTtcclxuICAgIGxldCBzdGFydEluZGV4ID0gMDtcclxuICAgIGxldCBlbmRJbmRleCA9IDA7XHJcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcclxuICAgIC8vIHRoaXMgaXMganVzdCBzb21lIGxvZ2ljIHRvIG5vdCBoYXZlIGR1cGxpY2F0ZWQgcG9zaXRpb25zIGF0IHRoZSBlbmRcclxuICAgIHdoaWxlICgrK2VuZEluZGV4IDwgdmVydGljZXMubGVuZ3RoIC0gZW5kUG9pbnRMZW5ndGgpIHtcclxuICAgICAgICBpZiAoIWluZGV4XzEuVmVjMi5lcXVhbCh2ZXJ0aWNlc1tlbmRJbmRleF0ub2Zmc2V0LCB2ZXJ0aWNlc1tlbmRJbmRleCAtIDFdLm9mZnNldCkpIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFRoZSBsYXN0IGNvbnRyb2wgcG9pbnQgb2YgZWFjaCBzZWdtZW50IGlzIG5vdCBhbGxvd2VkIHRvIHN0YXJ0IGEgbmV3IGltcGxpY2l0IHNlZ21lbnQuXHJcbiAgICAgICAgaWYgKGVuZEluZGV4ID09PSB2ZXJ0aWNlcy5sZW5ndGggLSBlbmRQb2ludExlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZlcnRpY2VzW2VuZEluZGV4IC0gMV0udHlwZSA9IHR5cGU7XHJcbiAgICAgICAgcmVzdWx0LnB1c2goLi4udmVydGljZXMuc2xpY2Uoc3RhcnRJbmRleCwgZW5kSW5kZXgpKTtcclxuICAgICAgICBzdGFydEluZGV4ID0gZW5kSW5kZXggKyAxO1xyXG4gICAgfVxyXG4gICAgaWYgKGVuZEluZGV4ID4gc3RhcnRJbmRleCkge1xyXG4gICAgICAgIHJlc3VsdC5wdXNoKC4uLnZlcnRpY2VzLnNsaWNlKHN0YXJ0SW5kZXgsIGVuZEluZGV4KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmZ1bmN0aW9uIHBhcnNlT3N1SGl0T2JqZWN0U2V0dGluZyhsaW5lKSB7XHJcbiAgICBjb25zdCBzcGxpdCA9IGxpbmUuc3BsaXQoXCIsXCIpO1xyXG4gICAgLy8gVE9ETzogVGhpcyBoYXMgTUFYX0NPT1JESU5BVEVfVkFMVUUgZm9yIHNhbml0eSBjaGVja1xyXG4gICAgY29uc3QgcG9zaXRpb24gPSB7IHg6IHBhcnNlRmxvYXQoc3BsaXRbMF0pLCB5OiBwYXJzZUZsb2F0KHNwbGl0WzFdKSB9O1xyXG4gICAgLy8gVE9ETzogVGhpcyBoYXMgK29mZnNldCAoMjRtcykgZm9yIGJlYXRtYXBWZXJzaW9uIDw9IDQgKGluY2x1ZGUgaW4gQmVhdG1hcEJ1aWxkZXIpXHJcbiAgICBjb25zdCBvZmZzZXQgPSAwOyAvL1xyXG4gICAgY29uc3QgdGltZSA9IHBhcnNlRmxvYXQoc3BsaXRbMl0pICsgb2Zmc2V0O1xyXG4gICAgY29uc3QgX3R5cGUgPSBwYXJzZUludChzcGxpdFszXSk7IC8vIGFsc28gaGFzIGNvbWJvIGluZm9ybWF0aW9uXHJcbiAgICBjb25zdCBjb21ib1NraXAgPSAoX3R5cGUgJiBMZWdhY3lIaXRPYmplY3RUeXBlLkNvbWJvU2tpcCkgPj4gNDtcclxuICAgIGNvbnN0IG5ld0NvbWJvID0gaGFzRmxhZyhfdHlwZSwgTGVnYWN5SGl0T2JqZWN0VHlwZS5OZXdDb21ibyk7XHJcbiAgICBjb25zdCB0eXBlQml0bWFzayA9IF90eXBlICYgfkxlZ2FjeUhpdE9iamVjdFR5cGUuQ29tYm9Ta2lwICYgfkxlZ2FjeUhpdE9iamVjdFR5cGUuTmV3Q29tYm87XHJcbiAgICAvLyBUT0RPOiBzYW1wbGVzXHJcbiAgICBjb25zdCBzb3VuZFR5cGUgPSBwYXJzZUludChzcGxpdFs0XSk7XHJcbiAgICBjb25zdCBiYW5rSW5mbyA9IHtcclxuICAgICAgICBhZGQ6IFwiXCIsXHJcbiAgICAgICAgY3VzdG9tU2FtcGxlQmFuazogMCxcclxuICAgICAgICBmaWxlTmFtZTogXCJcIixcclxuICAgICAgICBub3JtYWw6IFwiXCIsXHJcbiAgICAgICAgdm9sdW1lOiAwLFxyXG4gICAgfTtcclxuICAgIGlmIChoYXNGbGFnKHR5cGVCaXRtYXNrLCBMZWdhY3lIaXRPYmplY3RUeXBlLkNpcmNsZSkpIHtcclxuICAgICAgICAvLyBUT0RPOiBDdXN0b21TYW1wbGVCYW5rcyBub3Qgc3VwcG9ydGVkIHlldFxyXG4gICAgICAgIC8vIGlmIChzcGxpdC5sZW5ndGggPiA1KSByZWFkQ3VzdG9tU2FtcGxlQmFua3Moc3BsaXRbNV0sIGJhbmtJbmZvKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiBcIkhJVF9DSVJDTEVcIixcclxuICAgICAgICAgICAgdGltZSxcclxuICAgICAgICAgICAgcG9zaXRpb24sXHJcbiAgICAgICAgICAgIG5ld0NvbWJvLFxyXG4gICAgICAgICAgICBjb21ib1NraXAsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGlmIChoYXNGbGFnKHR5cGVCaXRtYXNrLCBMZWdhY3lIaXRPYmplY3RUeXBlLlNsaWRlcikpIHtcclxuICAgICAgICBsZXQgbGVuZ3RoO1xyXG4gICAgICAgIGNvbnN0IHNsaWRlcyA9IHBhcnNlSW50KHNwbGl0WzZdKTtcclxuICAgICAgICBpZiAoc2xpZGVzID4gOTAwMClcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2xpZGVzIGNvdW50IGlzIHdheSB0b28gaGlnaFwiKTtcclxuICAgICAgICBjb25zdCByZXBlYXRDb3VudCA9IE1hdGgubWF4KDAsIHNsaWRlcyAtIDEpO1xyXG4gICAgICAgIGNvbnN0IHBhdGhQb2ludHMgPSBjb252ZXJ0UGF0aFN0cmluZyhzcGxpdFs1XSwgcG9zaXRpb24pO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPiA3KSB7XHJcbiAgICAgICAgICAgIGxlbmd0aCA9IE1hdGgubWF4KDAsIHBhcnNlRmxvYXQoc3BsaXRbN10pKTtcclxuICAgICAgICAgICAgaWYgKGxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHlwZTogXCJTTElERVJcIixcclxuICAgICAgICAgICAgdGltZSxcclxuICAgICAgICAgICAgcG9zaXRpb24sXHJcbiAgICAgICAgICAgIHJlcGVhdENvdW50LFxyXG4gICAgICAgICAgICBjb21ib1NraXAsXHJcbiAgICAgICAgICAgIG5ld0NvbWJvLFxyXG4gICAgICAgICAgICBwYXRoUG9pbnRzLFxyXG4gICAgICAgICAgICBsZW5ndGgsXHJcbiAgICAgICAgICAgIGxlZ2FjeUxhc3RUaWNrT2Zmc2V0OiBERUZBVUxUX0xFR0FDWV9USUNLX09GRlNFVCxcclxuICAgICAgICAgICAgdGlja0Rpc3RhbmNlTXVsdGlwbGllcjogMSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgaWYgKGhhc0ZsYWcodHlwZUJpdG1hc2ssIExlZ2FjeUhpdE9iamVjdFR5cGUuU3Bpbm5lcikpIHtcclxuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IE1hdGgubWF4KDAsIHBhcnNlRmxvYXQoc3BsaXRbNV0pICsgb2Zmc2V0IC0gdGltZSk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHlwZTogXCJTUElOTkVSXCIsXHJcbiAgICAgICAgICAgIGNvbWJvU2tpcCxcclxuICAgICAgICAgICAgbmV3Q29tYm8sXHJcbiAgICAgICAgICAgIHRpbWUsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uLFxyXG4gICAgICAgICAgICBkdXJhdGlvbixcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgdGhyb3cgRXJyb3IoXCJVbmtub3duIHR5cGVcIik7XHJcbn1cclxuZXhwb3J0cy5wYXJzZU9zdUhpdE9iamVjdFNldHRpbmcgPSBwYXJzZU9zdUhpdE9iamVjdFNldHRpbmc7XHJcbmNvbnN0IGRlZmF1bHRCbHVlcHJpbnRJbmZvID0gKCkgPT4gKHtcclxuICAgIGF1ZGlvTGVhZEluOiAwLFxyXG4gICAgYmVhdG1hcFZlcnNpb246IDAsXHJcbiAgICBzdGFja0xlbmllbmN5OiAwLjcsXHJcbiAgICBvbmxpbmVCZWF0bWFwSWQ6IHVuZGVmaW5lZCxcclxuICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgYXJ0aXN0OiBcIlwiLFxyXG4gICAgICAgIHRpdGxlOiBcIlwiLFxyXG4gICAgICAgIHRpdGxlVW5pY29kZTogXCJcIixcclxuICAgICAgICBhdWRpb0ZpbGU6IFwiXCIsXHJcbiAgICAgICAgYXJ0aXN0VW5pY29kZTogXCJcIixcclxuICAgICAgICBzb3VyY2U6IFwiXCIsXHJcbiAgICAgICAgdGFnczogXCJcIixcclxuICAgICAgICBwcmV2aWV3VGltZTogMCxcclxuICAgICAgICBiYWNrZ3JvdW5kRmlsZTogXCJcIixcclxuICAgICAgICBiYWNrZ3JvdW5kT2Zmc2V0OiB7IHg6IDAsIHk6IDAgfSxcclxuICAgIH0sXHJcbn0pO1xyXG5jb25zdCBkZWZhdWx0Qmx1ZXByaW50RGlmZmljdWx0eSA9ICgpID0+ICh7XHJcbiAgICBjaXJjbGVTaXplOiA1LFxyXG4gICAgZHJhaW5SYXRlOiA1LFxyXG4gICAgb3ZlcmFsbERpZmZpY3VsdHk6IDUsXHJcbiAgICAvLyBhcHByb2FjaFJhdGUgb21pdHRlZCBiZWNhdXNlIGl0IGRlcGVuZHMgb24gT0RcclxuICAgIHNsaWRlck11bHRpcGxpZXI6IDEsXHJcbiAgICBzbGlkZXJUaWNrUmF0ZTogMSxcclxufSk7XHJcbmNsYXNzIEJsdWVwcmludFBhcnNlciB7XHJcbiAgICBjb25zdHJ1Y3RvcihkYXRhLCBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnMpIHtcclxuICAgICAgICAvLyBEaXNhYmxlIGZvciB0ZXN0aW5nIHB1cnBvc2VzXHJcbiAgICAgICAgdGhpcy5hcHBseU9mZnNldHMgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFNhbXBsZVZvbHVtZSA9IDEwMDtcclxuICAgICAgICB0aGlzLmhpdE9iamVjdFNldHRpbmdzID0gW107XHJcbiAgICAgICAgdGhpcy5jb250cm9sUG9pbnRJbmZvID0gbmV3IENvbnRyb2xQb2ludEluZm9fMS5Db250cm9sUG9pbnRJbmZvKCk7XHJcbiAgICAgICAgdGhpcy5kZWZhdWx0U2FtcGxlQmFuayA9IExlZ2FjeVNhbXBsZUJhbmtfMS5MZWdhY3lTYW1wbGVCYW5rLk5vbmU7XHJcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29udHJvbFBvaW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMucGVuZGluZ0NvbnRyb2xQb2ludFR5cGVzID0ge307XHJcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29udHJvbFBvaW50c1RpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgLy8gdGhpcy5ibHVlcHJpbnQgPSBuZXcgQmx1ZXByaW50KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50U2VjdGlvbiA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5mb3JtYXRWZXJzaW9uID0gb3B0aW9ucy5mb3JtYXRWZXJzaW9uO1xyXG4gICAgICAgIHRoaXMuc2VjdGlvbnNUb1JlYWQgPSBvcHRpb25zLnNlY3Rpb25zVG9SZWFkO1xyXG4gICAgICAgIHRoaXMuYmx1ZXByaW50SW5mbyA9IGRlZmF1bHRCbHVlcHJpbnRJbmZvKCk7XHJcbiAgICAgICAgdGhpcy5ibHVlcHJpbnREaWZmaWN1bHR5ID0gZGVmYXVsdEJsdWVwcmludERpZmZpY3VsdHkoKTtcclxuICAgICAgICB0aGlzLnNlY3Rpb25zRmluaXNoZWRSZWFkaW5nID0gW107XHJcbiAgICAgICAgLy8gQmVhdG1hcFZlcnNpb24gNCBhbmQgbG93ZXIgaGFkIGFuIGluY29ycmVjdCBvZmZzZXQgKHN0YWJsZSBoYXMgdGhpcyBzZXQgYXMgMjRtcyBvZmYpXHJcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmZvcm1hdFZlcnNpb24gPD0gNCA/IDI0IDogMDtcclxuICAgICAgICAvLyB0aGlzLmhpdE9iamVjdFBhcnNlciA9IG5ldyBPc3VIaXRPYmplY3RQYXJzZXIodGhpcy5vZmZzZXQsIHRoaXMuZm9ybWF0VmVyc2lvbik7XHJcbiAgICB9XHJcbiAgICBpc0ZpbmlzaGVkUmVhZGluZygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZWN0aW9uc1RvUmVhZCA8PSB0aGlzLnNlY3Rpb25zRmluaXNoZWRSZWFkaW5nO1xyXG4gICAgfVxyXG4gICAgcGFyc2VMaW5lKGxpbmUpIHtcclxuICAgICAgICBjb25zdCBzdHJpcHBlZExpbmUgPSBzdHJpcENvbW1lbnRzKGxpbmUpO1xyXG4gICAgICAgIC8vIHN0cmlwcGVkTGluZSBjYW4gYmUgZW1wdHlcclxuICAgICAgICBpZiAoIXN0cmlwcGVkTGluZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIFBhcnNlIHRoZSBmaWxlIGZvcm1hdFxyXG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50U2VjdGlvbiAmJiBzdHJpcHBlZExpbmUuaW5jbHVkZXMoXCJvc3UgZmlsZSBmb3JtYXQgdlwiKSkge1xyXG4gICAgICAgICAgICB0aGlzLmJsdWVwcmludEluZm8uYmVhdG1hcFZlcnNpb24gPSBwYXJzZUludChzdHJpcHBlZExpbmUuc3BsaXQoXCJvc3UgZmlsZSBmb3JtYXQgdlwiKVsxXSwgMTApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChTRUNUSU9OX1JFR0VYLnRlc3Qoc3RyaXBwZWRMaW5lKSkge1xyXG4gICAgICAgICAgICAvLyBXZSBvbmx5IGFkZCBzZWN0aW9ucyB3ZSB3YW50IHRvIHJlYWQgdG8gdGhlIGxpc3RcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFNlY3Rpb24gIT09IG51bGwgJiYgdGhpcy5zZWN0aW9uc1RvUmVhZC5pbmNsdWRlcyh0aGlzLmN1cnJlbnRTZWN0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWN0aW9uc0ZpbmlzaGVkUmVhZGluZy5wdXNoKHRoaXMuY3VycmVudFNlY3Rpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNlY3Rpb24gPSBTRUNUSU9OX1JFR0VYLmV4ZWMoc3RyaXBwZWRMaW5lKVsxXTtcclxuICAgICAgICAgICAgLy8gSXQgd2lsbCBzdG9wIHdoZW4gd2UgYXJlIGRvbmUgd2l0aCByZWFkaW5nIGFsbCByZXF1aXJlZCBzZWN0aW9uc1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFdlIHNraXAgcmVhZGluZyBzZWN0aW9ucyB3ZSBkb24ndCB3YW50IHRvIHJlYWQgZm9yIG9wdGltaXphdGlvblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTZWN0aW9uID09PSBudWxsIHx8IHRoaXMuc2VjdGlvbnNUb1JlYWQuaW5kZXhPZih0aGlzLmN1cnJlbnRTZWN0aW9uKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzd2l0Y2ggKHRoaXMuY3VycmVudFNlY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSBcIkdlbmVyYWxcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlR2VuZXJhbChzdHJpcHBlZExpbmUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJNZXRhZGF0YVwiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVNZXRhZGF0YShzdHJpcHBlZExpbmUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJEaWZmaWN1bHR5XCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZURpZmZpY3VsdHkoc3RyaXBwZWRMaW5lKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiSGl0T2JqZWN0c1wiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVIaXRPYmplY3RzKHN0cmlwcGVkTGluZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIlRpbWluZ1BvaW50c1wiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVUaW1pbmdQb2ludHMoc3RyaXBwZWRMaW5lKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAvLyBCZWxvdyBhcmUgbG93IHByaW9yaXR5IHNlY3Rpb25zXHJcbiAgICAgICAgICAgIGNhc2UgXCJFdmVudHNcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRXZlbnRzKHN0cmlwcGVkTGluZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIkVkaXRvclwiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVFZGl0b3Ioc3RyaXBwZWRMaW5lKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiQ29sb3Vyc1wiOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaGFuZGxlRXZlbnRzKGxpbmUpIHtcclxuICAgICAgICBjb25zdCBbZXZlbnRUeXBlLCBfc3RhcnRUaW1lLCAuLi5ldmVudFBhcmFtc10gPSBsaW5lLnNwbGl0KFwiLFwiKTtcclxuICAgICAgICBzd2l0Y2ggKGV2ZW50VHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwiMFwiOiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBbZmlsZW5hbWUsIHhPZmZzZXQsIHlPZmZzZXRdID0gZXZlbnRQYXJhbXM7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgcXVvdGVzIGNhbiBvcHRpb25hbGx5IGJlIGdpdmVuIC4uLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5ibHVlcHJpbnRJbmZvLm1ldGFkYXRhLmJhY2tncm91bmRGaWxlID0gZmlsZW5hbWUucmVwbGFjZSgvXCIvZywgXCJcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJsdWVwcmludEluZm8ubWV0YWRhdGEuYmFja2dyb3VuZE9mZnNldCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIHRoZXkgd2VyZW4ndCBwcm92aWRlZDogMCwwIHNob3VsZCBiZSB1c2VkIGFjY29yZGluZyB0byBkb2NzLlxyXG4gICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KHhPZmZzZXQgIT09IG51bGwgJiYgeE9mZnNldCAhPT0gdm9pZCAwID8geE9mZnNldCA6IFwiMFwiKSxcclxuICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCh5T2Zmc2V0ICE9PSBudWxsICYmIHlPZmZzZXQgIT09IHZvaWQgMCA/IHlPZmZzZXQgOiBcIjBcIiksXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFZpZGVvcyBhbmQgU3Rvcnlib2FyZCBpZ25vcmVkIGZvciBmaXJzdC4uLlxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGhhbmRsZUdlbmVyYWwobGluZSkge1xyXG4gICAgICAgIGNvbnN0IFtrZXksIHZhbHVlXSA9IHNwbGl0S2V5VmFsKGxpbmUpO1xyXG4gICAgICAgIGNvbnN0IGJsdWVwcmludEluZm8gPSB0aGlzLmJsdWVwcmludEluZm87XHJcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBibHVlcHJpbnRJbmZvLm1ldGFkYXRhO1xyXG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJBdWRpb0ZpbGVuYW1lXCI6XHJcbiAgICAgICAgICAgICAgICBtZXRhZGF0YS5hdWRpb0ZpbGUgPSB2YWx1ZTsgLy8gVE9ETzogdG9TdGFuZGFyZGlzZWRQYXRoKClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiQXVkaW9MZWFkSW5cIjpcclxuICAgICAgICAgICAgICAgIGJsdWVwcmludEluZm8uYXVkaW9MZWFkSW4gPSBwYXJzZUludCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIlByZXZpZXdUaW1lXCI6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIkNvdW50ZG93blwiOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJTYW1wbGVTZXRcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdFNhbXBsZUJhbmsgPSBwYXJzZUludCh2YWx1ZSk7IC8vIGhvcGVmdWxseSBpdCBpcyBvbmUgb2YgdGhvc2UgNFxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJTYW1wbGVWb2x1bWVcIjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiU3RhY2tMZW5pZW5jeVwiOlxyXG4gICAgICAgICAgICAgICAgYmx1ZXByaW50SW5mby5zdGFja0xlbmllbmN5ID0gTWF0aC5mcm91bmQocGFyc2VGbG9hdCh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJNb2RlXCI6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIkxldHRlcmJveEluQnJlYWtzXCI6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIlNwZWNpYWxTdHlsZVwiOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJXaWRlc2NyZWVuU3Rvcnlib2FyZFwiOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJFcGlsZXBzeVdhcm5pbmdcIjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGhhbmRsZUVkaXRvcihsaW5lKSB7XHJcbiAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0gc3BsaXRLZXlWYWwobGluZSk7XHJcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcclxuICAgICAgICAgICAgY2FzZSBcIkJvb2ttYXJrc1wiOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJEaXN0YW5jZVNwYWNpbmdcIjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiQmVhdERpdmlzb3JcIjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiR3JpZFNpemVcIjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiVGltZWxpbmVab29tXCI6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBoYW5kbGVNZXRhZGF0YShsaW5lKSB7XHJcbiAgICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0gc3BsaXRLZXlWYWwobGluZSk7XHJcbiAgICAgICAgY29uc3QgYmx1ZXByaW50SW5mbyA9IHRoaXMuYmx1ZXByaW50SW5mbztcclxuICAgICAgICBjb25zdCBtZXRhRGF0YSA9IGJsdWVwcmludEluZm8ubWV0YWRhdGE7XHJcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcclxuICAgICAgICAgICAgY2FzZSBcIlRpdGxlXCI6XHJcbiAgICAgICAgICAgICAgICBtZXRhRGF0YS50aXRsZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJUaXRsZVVuaWNvZGVcIjpcclxuICAgICAgICAgICAgICAgIG1ldGFEYXRhLnRpdGxlVW5pY29kZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJBcnRpc3RcIjpcclxuICAgICAgICAgICAgICAgIG1ldGFEYXRhLmFydGlzdCA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJBcnRpc3RVbmljb2RlXCI6XHJcbiAgICAgICAgICAgICAgICBtZXRhRGF0YS5hcnRpc3RVbmljb2RlID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIkNyZWF0b3JcIjpcclxuICAgICAgICAgICAgICAgIC8vIG1ldGFEYXRhLmF1dGhvclN0cmluZyA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJWZXJzaW9uXCI6XHJcbiAgICAgICAgICAgICAgICAvLyBiZWF0bWFwSW5mby5iZWF0bWFwVmVyc2lvbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJTb3VyY2VcIjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiVGFnc1wiOlxyXG4gICAgICAgICAgICAgICAgbWV0YURhdGEudGFncyA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJCZWF0bWFwSWRcIjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiQmVhdG1hcFNldElEXCI6XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBoYW5kbGVEaWZmaWN1bHR5KGxpbmUpIHtcclxuICAgICAgICBjb25zdCBba2V5LCB2YWx1ZV0gPSBzcGxpdEtleVZhbChsaW5lKTtcclxuICAgICAgICBjb25zdCBkaWZmaWN1bHR5ID0gdGhpcy5ibHVlcHJpbnREaWZmaWN1bHR5O1xyXG4gICAgICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJIUERyYWluUmF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgZGlmZmljdWx0eS5kcmFpblJhdGUgPSBwYXJzZUZsb2F0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiQ2lyY2xlU2l6ZVwiOlxyXG4gICAgICAgICAgICAgICAgZGlmZmljdWx0eS5jaXJjbGVTaXplID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIk92ZXJhbGxEaWZmaWN1bHR5XCI6XHJcbiAgICAgICAgICAgICAgICBkaWZmaWN1bHR5Lm92ZXJhbGxEaWZmaWN1bHR5ID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIkFwcHJvYWNoUmF0ZVwiOlxyXG4gICAgICAgICAgICAgICAgZGlmZmljdWx0eS5hcHByb2FjaFJhdGUgPSBwYXJzZUZsb2F0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiU2xpZGVyTXVsdGlwbGllclwiOlxyXG4gICAgICAgICAgICAgICAgZGlmZmljdWx0eS5zbGlkZXJNdWx0aXBsaWVyID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIlNsaWRlclRpY2tSYXRlXCI6XHJcbiAgICAgICAgICAgICAgICBkaWZmaWN1bHR5LnNsaWRlclRpY2tSYXRlID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBoYW5kbGVIaXRPYmplY3RzKGxpbmUpIHtcclxuICAgICAgICBjb25zdCBvYmogPSBwYXJzZU9zdUhpdE9iamVjdFNldHRpbmcobGluZSk7XHJcbiAgICAgICAgaWYgKG9iaikge1xyXG4gICAgICAgICAgICB0aGlzLmhpdE9iamVjdFNldHRpbmdzLnB1c2gob2JqKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBoYW5kbGVUaW1pbmdQb2ludHMobGluZSkge1xyXG4gICAgICAgIGNvbnN0IHNwbGl0ID0gbGluZS5zcGxpdChcIixcIik7XHJcbiAgICAgICAgY29uc3QgdGltZSA9IHRoaXMuZ2V0T2Zmc2V0VGltZShwYXJzZUZsb2F0KHNwbGl0WzBdLnRyaW0oKSkpO1xyXG4gICAgICAgIGNvbnN0IGJlYXRMZW5ndGggPSBwYXJzZUZsb2F0KHNwbGl0WzFdLnRyaW0oKSk7XHJcbiAgICAgICAgY29uc3Qgc3BlZWRNdWx0aXBsaWVyID0gYmVhdExlbmd0aCA8IDAgPyAxMDAuMCAvIC1iZWF0TGVuZ3RoIDogMTtcclxuICAgICAgICBsZXQgdGltZVNpZ25hdHVyZSA9IFRpbWVTaWduYXR1cmVzXzEuVGltZVNpZ25hdHVyZXMuU2ltcGxlUXVhZHJ1cGxlO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPj0gMylcclxuICAgICAgICAgICAgdGltZVNpZ25hdHVyZSA9IHNwbGl0WzJdWzBdID09PSBcIjBcIiA/IFRpbWVTaWduYXR1cmVzXzEuVGltZVNpZ25hdHVyZXMuU2ltcGxlUXVhZHJ1cGxlIDogcGFyc2VJbnQoc3BsaXRbMl0pO1xyXG4gICAgICAgIC8vIFRPRE86IHNhbXBsZVNldCBkZWZhdWx0XHJcbiAgICAgICAgbGV0IHNhbXBsZVNldCA9IHRoaXMuZGVmYXVsdFNhbXBsZUJhbms7XHJcbiAgICAgICAgaWYgKHNwbGl0Lmxlbmd0aCA+PSA0KVxyXG4gICAgICAgICAgICBzYW1wbGVTZXQgPSBwYXJzZUludChzcGxpdFszXSk7XHJcbiAgICAgICAgbGV0IGN1c3RvbVNhbXBsZUJhbmsgPSAwO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPj0gNSlcclxuICAgICAgICAgICAgY3VzdG9tU2FtcGxlQmFuayA9IHBhcnNlSW50KHNwbGl0WzRdKTtcclxuICAgICAgICBsZXQgc2FtcGxlVm9sdW1lID0gdGhpcy5kZWZhdWx0U2FtcGxlVm9sdW1lO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPj0gNilcclxuICAgICAgICAgICAgc2FtcGxlVm9sdW1lID0gcGFyc2VJbnQoc3BsaXRbNV0pO1xyXG4gICAgICAgIGxldCB0aW1pbmdDaGFuZ2UgPSB0cnVlO1xyXG4gICAgICAgIGlmIChzcGxpdC5sZW5ndGggPj0gNylcclxuICAgICAgICAgICAgdGltaW5nQ2hhbmdlID0gc3BsaXRbNl1bMF0gPT09IFwiMVwiO1xyXG4gICAgICAgIGxldCBraWFpTW9kZSA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBvbWl0Rmlyc3RCYXJTaWduYXR1cmUgPSBmYWxzZTtcclxuICAgICAgICBpZiAoc3BsaXQubGVuZ3RoID49IDgpIHtcclxuICAgICAgICAgICAgY29uc3QgZWZmZWN0RmxhZ3MgPSBwYXJzZUludChzcGxpdFs3XSk7XHJcbiAgICAgICAgICAgIGtpYWlNb2RlID0gaGFzRmxhZyhlZmZlY3RGbGFncywgTGVnYWN5RWZmZWN0RmxhZ18xLkxlZ2FjeUVmZmVjdEZsYWdzLktpYWkpO1xyXG4gICAgICAgICAgICBvbWl0Rmlyc3RCYXJTaWduYXR1cmUgPSBoYXNGbGFnKGVmZmVjdEZsYWdzLCBMZWdhY3lFZmZlY3RGbGFnXzEuTGVnYWN5RWZmZWN0RmxhZ3MuT21pdEZpcnN0QmFyTGluZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFRoaXMgd2lsbCByZWNlaXZlIHRoZSBzdHJpbmcgdmFsdWUgZnJvbSB0aGUgZW51bVxyXG4gICAgICAgIGxldCBzdHJpbmdTYW1wbGVTZXQgPSBMZWdhY3lTYW1wbGVCYW5rXzEuTGVnYWN5U2FtcGxlQmFua1tzYW1wbGVTZXRdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgaWYgKHN0cmluZ1NhbXBsZVNldCA9PT0gXCJub25lXCIpXHJcbiAgICAgICAgICAgIHN0cmluZ1NhbXBsZVNldCA9IFwibm9ybWFsXCI7XHJcbiAgICAgICAgaWYgKHRpbWluZ0NoYW5nZSkge1xyXG4gICAgICAgICAgICBjb25zdCBjb250cm9sUG9pbnQgPSB0aGlzLmNyZWF0ZVRpbWluZ0NvbnRyb2xQb2ludCgpO1xyXG4gICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGJlYXRMZW5ndGgpKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOYU5cIik7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGNvbnRyb2xQb2ludC5iZWF0TGVuZ3RoID0gKDAsIGluZGV4XzEuY2xhbXApKGJlYXRMZW5ndGgsIE1JTl9CRUFUX0xFTkdUSCwgTUFYX0JFQVRfTEVOR1RIKTtcclxuICAgICAgICAgICAgY29udHJvbFBvaW50LnRpbWVTaWduYXR1cmUgPSB0aW1lU2lnbmF0dXJlO1xyXG4gICAgICAgICAgICB0aGlzLmFkZENvbnRyb2xQb2ludCh0aW1lLCBjb250cm9sUG9pbnQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHAgPSBuZXcgTGVnYWN5RGlmZmljdWx0eUNvbnRyb2xQb2ludChiZWF0TGVuZ3RoKTtcclxuICAgICAgICAgICAgcC5zcGVlZE11bHRpcGxpZXIgPSBiaW5kYWJsZU51bWJlck5ldyhzcGVlZE11bHRpcGxpZXIsIHsgbWluOiAwLjEsIG1heDogMTAsIHByZWNpc2lvbjogMC4wMSB9KTtcclxuICAgICAgICAgICAgdGhpcy5hZGRDb250cm9sUG9pbnQodGltZSwgcCwgdGltaW5nQ2hhbmdlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBwID0gbmV3IEVmZmVjdENvbnRyb2xQb2ludF8xLkVmZmVjdENvbnRyb2xQb2ludCgpO1xyXG4gICAgICAgICAgICBwLmtpYWlNb2RlID0ga2lhaU1vZGU7XHJcbiAgICAgICAgICAgIHAub21pdEZpcnN0QmFyTGluZSA9IG9taXRGaXJzdEJhclNpZ25hdHVyZTtcclxuICAgICAgICAgICAgdGhpcy5hZGRDb250cm9sUG9pbnQodGltZSwgcCwgdGltaW5nQ2hhbmdlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBwID0gbmV3IFNhbXBsZUNvbnRyb2xQb2ludF8xLlNhbXBsZUNvbnRyb2xQb2ludCgpO1xyXG4gICAgICAgICAgICBwLnNhbXBsZUJhbmsgPSBzdHJpbmdTYW1wbGVTZXQ7XHJcbiAgICAgICAgICAgIHAuc2FtcGxlVm9sdW1lID0gc2FtcGxlVm9sdW1lO1xyXG4gICAgICAgICAgICAvLyBUT0RPOiAgTmVlZCBMZWdhY3lTYW1wbGVDb250cm9sUG9pbnQsIGJ1dCB0aGlzIGlzIHNvbWV0aGluZyB3ZSBzdXBwb3J0IGxhdGVyIG9uXHJcbiAgICAgICAgICAgIC8vIHAuY3VzdG9tU2FtcGxlQmFuayA9IGN1c3RvbVNhbXBsZUJhbms7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkQ29udHJvbFBvaW50KHRpbWUsIHAsIHRpbWluZ0NoYW5nZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY3JlYXRlVGltaW5nQ29udHJvbFBvaW50KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVGltaW5nQ29udHJvbFBvaW50XzEuVGltaW5nQ29udHJvbFBvaW50KCk7XHJcbiAgICB9XHJcbiAgICBhZGRDb250cm9sUG9pbnQodGltZSwgcG9pbnQsIHRpbWluZ0NoYW5nZSkge1xyXG4gICAgICAgIGlmICghKDAsIGluZGV4XzEuZmxvYXRFcXVhbCkodGltZSwgdGhpcy5wZW5kaW5nQ29udHJvbFBvaW50c1RpbWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmx1c2hQZW5kaW5nUG9pbnRzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aW1pbmdDaGFuZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ29udHJvbFBvaW50cy5zcGxpY2UoMCwgMCwgcG9pbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wZW5kaW5nQ29udHJvbFBvaW50cy5wdXNoKHBvaW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29udHJvbFBvaW50c1RpbWUgPSB0aW1lO1xyXG4gICAgfVxyXG4gICAgZmx1c2hQZW5kaW5nUG9pbnRzKCkge1xyXG4gICAgICAgIC8vIENoYW5nZXMgZnJvbSBub24tdGltaW5nLXBvaW50cyBhcmUgYWRkZWQgdG8gdGhlIGVuZCBvZiB0aGUgbGlzdCAoc2VlIGFkZENvbnRyb2xQb2ludCgpKSBhbmQgc2hvdWxkIG92ZXJyaWRlIGFueVxyXG4gICAgICAgIC8vIGNoYW5nZXMgZnJvbSB0aW1pbmctcG9pbnRzIChhZGRlZCB0byB0aGUgc3RhcnQgb2YgdGhlIGxpc3QpLlxyXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLnBlbmRpbmdDb250cm9sUG9pbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLnBlbmRpbmdDb250cm9sUG9pbnRzW2ldLnR5cGU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBlbmRpbmdDb250cm9sUG9pbnRUeXBlc1t0eXBlXSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdDb250cm9sUG9pbnRUeXBlc1t0eXBlXSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuY29udHJvbFBvaW50SW5mby5hZGQodGhpcy5wZW5kaW5nQ29udHJvbFBvaW50c1RpbWUsIHRoaXMucGVuZGluZ0NvbnRyb2xQb2ludHNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBlbmRpbmdDb250cm9sUG9pbnRzID0gW107XHJcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29udHJvbFBvaW50VHlwZXMgPSB7fTtcclxuICAgIH1cclxuICAgIGdldE9mZnNldFRpbWUodGltZSkge1xyXG4gICAgICAgIHJldHVybiB0aW1lICsgKHRoaXMuYXBwbHlPZmZzZXRzID8gdGhpcy5vZmZzZXQgOiAwKTtcclxuICAgIH1cclxuICAgIHBhcnNlKCkge1xyXG4gICAgICAgIHZhciBfYTtcclxuICAgICAgICBpZiAoIXRoaXMuZGF0YSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gZGF0YSBnaXZlblwiKTtcclxuICAgICAgICBjb25zdCBsaW5lcyA9IHRoaXMuZGF0YS5zcGxpdChcIlxcblwiKS5tYXAoKHYpID0+IHYudHJpbSgpKTtcclxuICAgICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFyc2VMaW5lKGxpbmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byBwYXJzZSBsaW5lICR7bGluZX0gZHVlIHRvOiBgLCBlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzRmluaXNoZWRSZWFkaW5nKCkpIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZmx1c2hQZW5kaW5nUG9pbnRzKCk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYmx1ZXByaW50SW5mbzogdGhpcy5ibHVlcHJpbnRJbmZvLFxyXG4gICAgICAgICAgICBkZWZhdWx0RGlmZmljdWx0eTogT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCB0aGlzLmJsdWVwcmludERpZmZpY3VsdHkpLCB7IFxyXG4gICAgICAgICAgICAgICAgLy8gUmVhc29uaW5nOlxyXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BweS9vc3UvYmxvYi9iMWZjYjg0MGE5ZmY0ZDg2NmFhYzI2MmFjZTdmNTRmYTg4YjVlMGNlL29zdS5HYW1lL0JlYXRtYXBzL0JlYXRtYXBEaWZmaWN1bHR5LmNzI0wzNVxyXG4gICAgICAgICAgICAgICAgYXBwcm9hY2hSYXRlOiAoX2EgPSB0aGlzLmJsdWVwcmludERpZmZpY3VsdHkuYXBwcm9hY2hSYXRlKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiB0aGlzLmJsdWVwcmludERpZmZpY3VsdHkub3ZlcmFsbERpZmZpY3VsdHkgfSksXHJcbiAgICAgICAgICAgIGhpdE9iamVjdFNldHRpbmdzOiB0aGlzLmhpdE9iamVjdFNldHRpbmdzLFxyXG4gICAgICAgICAgICBjb250cm9sUG9pbnRJbmZvOiB0aGlzLmNvbnRyb2xQb2ludEluZm8sXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5CbHVlcHJpbnRQYXJzZXIuTEFURVNUX1ZFUlNJT04gPSAxNDtcclxuY29uc3QgTUlOX0JFQVRfTEVOR1RIID0gNjtcclxuY29uc3QgTUFYX0JFQVRfTEVOR1RIID0gNjAwMDA7XHJcbmNvbnN0IERFRkFVTFRfQkVBVF9MRU5HVEggPSAxMDAwO1xyXG4vLyBTbyBwcmVjaXNpb24gaXMgb25seSB1c2VkIHdoZW4gbm90IGluaXRpYWxpemluZz9cclxuLy8gVGhlIEJpbmRhYmxlTnVtYmVyIGhhcyBhIHByZWNpc2lvbiB2YWx1ZSBidXQgaXMgbm90IHVzZWQgd2hlbiBpbml0aWFsaXplZFxyXG5mdW5jdGlvbiBiaW5kYWJsZU51bWJlck5ldyh2YWwsIHsgbWluLCBtYXgsIHByZWNpc2lvbiB9KSB7XHJcbiAgICByZXR1cm4gKDAsIGluZGV4XzEuY2xhbXApKHZhbCwgbWluLCBtYXgpO1xyXG4gICAgLy8gcmV0dXJuIE1hdGgucm91bmQodmFsIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbjtcclxufVxyXG5leHBvcnRzLkJsdWVwcmludFNlY3Rpb25zID0gW1xyXG4gICAgXCJHZW5lcmFsXCIsXHJcbiAgICBcIk1ldGFkYXRhXCIsXHJcbiAgICBcIkRpZmZpY3VsdHlcIixcclxuICAgIFwiSGl0T2JqZWN0c1wiLFxyXG4gICAgXCJUaW1pbmdQb2ludHNcIixcclxuICAgIFwiRXZlbnRzXCIsXHJcbiAgICBcIkVkaXRvclwiLFxyXG4gICAgXCJDb2xvdXJzXCIsXHJcbl07XHJcbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xyXG4gICAgLy8gVE9ETzogRm9ybWF0IHZlcnNpb24gc2hvdWxkIGFjdHVhbGx5IGJlIHBhcnNlZFxyXG4gICAgZm9ybWF0VmVyc2lvbjogQmx1ZXByaW50UGFyc2VyLkxBVEVTVF9WRVJTSU9OLFxyXG4gICAgc2VjdGlvbnNUb1JlYWQ6IGV4cG9ydHMuQmx1ZXByaW50U2VjdGlvbnMsXHJcbn07XHJcbi8qKlxyXG4gKiBQYXJzZXMgdGhlIGJsdWVwcmludCB0aGF0IGlzIGdpdmVuIGluIHRoZSBsZWdhY3kgYC5vc3VgIGZvcm1hdC5cclxuICogQHBhcmFtIGRhdGEgdGhlIC5vc3UgZmlsZSBzdHJpbmdcclxuICogQHBhcmFtIHtCbHVlcHJpbnRQYXJzZU9wdGlvbnN9IG9wdGlvbnMgY29uZmlnIG9wdGlvbnNcclxuICogQHBhcmFtIHtCbHVlcHJpbnRQYXJzZU9wdGlvbnN9IG9wdGlvbnMuc2VjdGlvbnNUb1JlYWQgbGlzdCBvZiBzZWN0aW9ucyB0aGF0IHNob3VsZCBiZSByZWFkXHJcbiAqL1xyXG5mdW5jdGlvbiBwYXJzZUJsdWVwcmludChkYXRhLCBvcHRpb25zKSB7XHJcbiAgICBjb25zdCBhbGxPcHRpb25zID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucyksIG9wdGlvbnMpO1xyXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IEJsdWVwcmludFBhcnNlcihkYXRhLCBhbGxPcHRpb25zKTtcclxuICAgIHJldHVybiBwYXJzZXIucGFyc2UoKTtcclxufVxyXG5leHBvcnRzLnBhcnNlQmx1ZXByaW50ID0gcGFyc2VCbHVlcHJpbnQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuY2xvbmVHYW1lU3RhdGUgPSBleHBvcnRzLmRlZmF1bHRHYW1lU3RhdGUgPSBleHBvcnRzLk5PVF9QUkVTU0lORyA9IHZvaWQgMDtcclxuY29uc3QgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi8uLi9tYXRoL2luZGV4XCIpO1xyXG5leHBvcnRzLk5PVF9QUkVTU0lORyA9ICs3Mjc3Mjc3Mjc7XHJcbmNvbnN0IEhpdENpcmNsZU1pc3NSZWFzb25zID0gW1xyXG4gICAgLy8gV2hlbiB0aGUgdGltZSBoYXMgZXhwaXJlZCBhbmQgdGhlIGNpcmNsZSBnb3QgZm9yY2Uga2lsbGVkLlxyXG4gICAgXCJUSU1FX0VYUElSRURcIixcclxuICAgIC8vIFRoZXJlIGlzIG5vIEhJVF9UT09fTEFURSBiZWNhdXNlIFRJTUVfRVhQSVJFRCB3b3VsZCBvY2N1ciBlYXJsaWVyLlxyXG4gICAgXCJISVRfVE9PX0VBUkxZXCIsXHJcbiAgICAvLyBUaGlzIGlzIG9ubHkgcG9zc2libGUgaW4gb3N1IWxhemVyIHdoZXJlIGNsaWNraW5nIGEgbGF0ZXIgY2lyY2xlIGNhbiBjYXVzZSB0aGlzIGNpcmNsZSB0byBiZSBmb3JjZSBtaXNzZWQuXHJcbiAgICBcIkZPUkNFX01JU1NfTk9URUxPQ0tcIixcclxuICAgIC8vIElmIHRoZSB1c2VyIGhhZCB0aW1lIHRvIHByZXNzIHRoZSBoaXRDaXJjbGUgdW50aWwgdGltZSAzMDAsIGJ1dCB0aGUgc2xpZGVyIGlzIHNvIHNob3J0IHRoYXQgaXQgZW5kcyBhdCAyMDAsXHJcbiAgICAvLyB0aGVuIHRoZSB1c2VyIGFjdHVhbGx5IGhhcyBhIHJlZHVjZWQgaGl0IHdpbmRvdyBmb3IgaGl0dGluZyBpdC5cclxuICAgIFwiU0xJREVSX0ZJTklTSEVEX0ZBU1RFUlwiLFxyXG5dO1xyXG5jb25zdCBkZWZhdWx0R2FtZVN0YXRlID0gKCkgPT4gKHtcclxuICAgIGV2ZW50SW5kZXg6IDAsXHJcbiAgICBjdXJyZW50VGltZTogMCxcclxuICAgIGN1cnNvclBvc2l0aW9uOiBpbmRleF8xLlZlYzIuWmVybyxcclxuICAgIGhpdENpcmNsZVZlcmRpY3Q6IHt9LFxyXG4gICAgc2xpZGVyQm9keVN0YXRlOiBuZXcgTWFwKCksXHJcbiAgICBjaGVja1BvaW50VmVyZGljdDoge30sXHJcbiAgICBzcGlubmVyU3RhdGU6IG5ldyBNYXAoKSxcclxuICAgIHNsaWRlclZlcmRpY3Q6IHt9LFxyXG4gICAgY2xpY2tXYXNVc2VmdWw6IGZhbHNlLFxyXG4gICAgLy8gUmVzdCBhcmUgdXNlZCBmb3Igb3B0aW1pemF0aW9uc1xyXG4gICAgbGF0ZXN0SGl0T2JqZWN0SW5kZXg6IDAsXHJcbiAgICBhbGl2ZUhpdENpcmNsZUlkczogbmV3IFNldCgpLFxyXG4gICAgYWxpdmVTbGlkZXJJZHM6IG5ldyBTZXQoKSxcclxuICAgIGFsaXZlU3Bpbm5lcklkczogbmV3IFNldCgpLFxyXG4gICAgLy8gQWxzbyB1c2VkIGFzIGFuIG9wdGltaXphdGlvblxyXG4gICAganVkZ2VkT2JqZWN0czogW10sXHJcbiAgICBwcmVzc2luZ1NpbmNlOiBbZXhwb3J0cy5OT1RfUFJFU1NJTkcsIGV4cG9ydHMuTk9UX1BSRVNTSU5HXSxcclxufSk7XHJcbmV4cG9ydHMuZGVmYXVsdEdhbWVTdGF0ZSA9IGRlZmF1bHRHYW1lU3RhdGU7XHJcbmZ1bmN0aW9uIGNsb25lR2FtZVN0YXRlKHJlcGxheVN0YXRlKSB7XHJcbiAgICBjb25zdCB7IGFsaXZlSGl0Q2lyY2xlSWRzLCBhbGl2ZVNsaWRlcklkcywgYWxpdmVTcGlubmVySWRzLCBzcGlubmVyU3RhdGUsIHNsaWRlckJvZHlTdGF0ZSwgY2hlY2tQb2ludFZlcmRpY3QsIGhpdENpcmNsZVZlcmRpY3QsIHNsaWRlclZlcmRpY3QsIGV2ZW50SW5kZXgsIGNsaWNrV2FzVXNlZnVsLCBjdXJyZW50VGltZSwgY3Vyc29yUG9zaXRpb24sIGxhdGVzdEhpdE9iamVjdEluZGV4LCBwcmVzc2luZ1NpbmNlLCBqdWRnZWRPYmplY3RzLCB9ID0gcmVwbGF5U3RhdGU7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGV2ZW50SW5kZXg6IGV2ZW50SW5kZXgsXHJcbiAgICAgICAgYWxpdmVIaXRDaXJjbGVJZHM6IG5ldyBTZXQoYWxpdmVIaXRDaXJjbGVJZHMpLFxyXG4gICAgICAgIGFsaXZlU2xpZGVySWRzOiBuZXcgU2V0KGFsaXZlU2xpZGVySWRzKSxcclxuICAgICAgICBhbGl2ZVNwaW5uZXJJZHM6IG5ldyBTZXQoYWxpdmVTcGlubmVySWRzKSxcclxuICAgICAgICBoaXRDaXJjbGVWZXJkaWN0OiBPYmplY3QuYXNzaWduKHt9LCBoaXRDaXJjbGVWZXJkaWN0KSxcclxuICAgICAgICBzbGlkZXJWZXJkaWN0OiBPYmplY3QuYXNzaWduKHt9LCBzbGlkZXJWZXJkaWN0KSxcclxuICAgICAgICBjaGVja1BvaW50VmVyZGljdDogT2JqZWN0LmFzc2lnbih7fSwgY2hlY2tQb2ludFZlcmRpY3QpLFxyXG4gICAgICAgIGN1cnJlbnRUaW1lOiBjdXJyZW50VGltZSxcclxuICAgICAgICBjdXJzb3JQb3NpdGlvbjogY3Vyc29yUG9zaXRpb24sXHJcbiAgICAgICAgbGF0ZXN0SGl0T2JqZWN0SW5kZXg6IGxhdGVzdEhpdE9iamVjdEluZGV4LFxyXG4gICAgICAgIGp1ZGdlZE9iamVjdHM6IFsuLi5qdWRnZWRPYmplY3RzXSxcclxuICAgICAgICBjbGlja1dhc1VzZWZ1bDogY2xpY2tXYXNVc2VmdWwsXHJcbiAgICAgICAgc2xpZGVyQm9keVN0YXRlOiBuZXcgTWFwKHNsaWRlckJvZHlTdGF0ZSksXHJcbiAgICAgICAgc3Bpbm5lclN0YXRlOiBuZXcgTWFwKHNwaW5uZXJTdGF0ZSksXHJcbiAgICAgICAgcHJlc3NpbmdTaW5jZTogcHJlc3NpbmdTaW5jZS5zbGljZSgpLFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmNsb25lR2FtZVN0YXRlID0gY2xvbmVHYW1lU3RhdGU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMubmV3UHJlc3NpbmdTaW5jZSA9IGV4cG9ydHMuR2FtZVN0YXRlRXZhbHVhdG9yID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uL21hdGgvaW5kZXhcIik7XHJcbmNvbnN0IEdhbWVTdGF0ZV8xID0gcmVxdWlyZShcIi4vR2FtZVN0YXRlXCIpO1xyXG5jb25zdCBUeXBlc18xID0gcmVxdWlyZShcIi4uL2hpdG9iamVjdHMvVHlwZXNcIik7XHJcbmNvbnN0IFJlcGxheV8xID0gcmVxdWlyZShcIi4uL3JlcGxheXMvUmVwbGF5XCIpO1xyXG5jb25zdCBNb2RzXzEgPSByZXF1aXJlKFwiLi4vbW9kcy9Nb2RzXCIpO1xyXG5mdW5jdGlvbiBnZW5lcmF0ZUV2ZW50cyhiZWF0bWFwLCBoaXRXaW5kb3dzKSB7XHJcbiAgICBjb25zdCBldmVudHMgPSBbXTtcclxuICAgIGNvbnN0IG1laEhpdFdpbmRvdyA9IGhpdFdpbmRvd3NbMl07XHJcbiAgICBjb25zdCBwdXNoSGl0Q2lyY2xlRXZlbnRzID0gKGgpID0+IHtcclxuICAgICAgICBldmVudHMucHVzaCh7IHRpbWU6IGguaGl0VGltZSAtIGguYXBwcm9hY2hEdXJhdGlvbiwgaGl0T2JqZWN0SWQ6IGguaWQsIHR5cGU6IFwiSElUX0NJUkNMRV9TUEFXTlwiIH0pO1xyXG4gICAgICAgIC8vIFRPRE86IEluIGNhc2UgeW91IGFyZSBhbGxvd2VkIHRvIHByZXNzIGxhdGUgLT4gKzEgYWRkaXRpb25hbFxyXG4gICAgICAgIGV2ZW50cy5wdXNoKHsgdGltZTogaC5oaXRUaW1lICsgbWVoSGl0V2luZG93ICsgMSwgaGl0T2JqZWN0SWQ6IGguaWQsIHR5cGU6IFwiSElUX0NJUkNMRV9GT1JDRV9LSUxMXCIgfSk7XHJcbiAgICB9O1xyXG4gICAgZm9yIChjb25zdCBoIG9mIGJlYXRtYXAuaGl0T2JqZWN0cykge1xyXG4gICAgICAgIGlmICgoMCwgVHlwZXNfMS5pc0hpdENpcmNsZSkoaCkpIHtcclxuICAgICAgICAgICAgcHVzaEhpdENpcmNsZUV2ZW50cyhoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoKDAsIFR5cGVzXzEuaXNTbGlkZXIpKGgpKSB7XHJcbiAgICAgICAgICAgIHB1c2hIaXRDaXJjbGVFdmVudHMoaC5oZWFkKTtcclxuICAgICAgICAgICAgZXZlbnRzLnB1c2goeyB0aW1lOiBoLnN0YXJ0VGltZSwgaGl0T2JqZWN0SWQ6IGguaWQsIHR5cGU6IFwiU0xJREVSX1NUQVJUXCIgfSk7XHJcbiAgICAgICAgICAgIGV2ZW50cy5wdXNoKHsgdGltZTogaC5lbmRUaW1lLCBoaXRPYmplY3RJZDogaC5pZCwgdHlwZTogXCJTTElERVJfRU5EXCIgfSk7XHJcbiAgICAgICAgICAgIGguY2hlY2tQb2ludHMuZm9yRWFjaCgoYykgPT4ge1xyXG4gICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goeyB0aW1lOiBjLmhpdFRpbWUsIGhpdE9iamVjdElkOiBjLmlkLCB0eXBlOiBcIlNMSURFUl9DSEVDS19QT0lOVFwiIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoKDAsIFR5cGVzXzEuaXNTcGlubmVyKShoKSkge1xyXG4gICAgICAgICAgICBldmVudHMucHVzaCh7IHRpbWU6IGguc3RhcnRUaW1lLCBoaXRPYmplY3RJZDogaC5pZCwgdHlwZTogXCJTUElOTkVSX1NUQVJUXCIgfSk7XHJcbiAgICAgICAgICAgIGV2ZW50cy5wdXNoKHsgdGltZTogaC5lbmRUaW1lLCBoaXRPYmplY3RJZDogaC5pZCwgdHlwZTogXCJTUElOTkVSX0VORFwiIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFRPRE86IFdoYXQgaWYgMkIgbWFwcz9cclxuICAgIGV2ZW50cy5zb3J0KChhLCBiKSA9PiBhLnRpbWUgLSBiLnRpbWUpO1xyXG4gICAgcmV0dXJuIGV2ZW50cztcclxufVxyXG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcclxuICAgIG5vdGVMb2NrU3R5bGU6IFwiU1RBQkxFXCIsXHJcbiAgICBoaXRXaW5kb3dTdHlsZTogXCJPU1VfU1RBQkxFXCIsXHJcbn07XHJcbmNvbnN0IEhpdE9iamVjdFZlcmRpY3RzID0ge1xyXG4gICAgR1JFQVQ6IDAsXHJcbiAgICBPSzogMSxcclxuICAgIE1FSDogMixcclxuICAgIE1JU1M6IDMsXHJcbn07XHJcbmZ1bmN0aW9uIGlzV2l0aGluSGl0V2luZG93KGhpdFdpbmRvdywgZGVsdGEsIHZlcmRpY3QpIHtcclxuICAgIHJldHVybiBNYXRoLmFicyhkZWx0YSkgPD0gaGl0V2luZG93W0hpdE9iamVjdFZlcmRpY3RzW3ZlcmRpY3RdXTtcclxufVxyXG5jbGFzcyBHYW1lU3RhdGVFdmFsdWF0b3Ige1xyXG4gICAgY29uc3RydWN0b3IoYmVhdG1hcCwgb3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMuYmVhdG1hcCA9IGJlYXRtYXA7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUgPSAoMCwgR2FtZVN0YXRlXzEuZGVmYXVsdEdhbWVTdGF0ZSkoKTtcclxuICAgICAgICB0aGlzLmZyYW1lID0geyB0aW1lOiAwLCBwb3NpdGlvbjogeyB4OiAwLCB5OiAwIH0sIGFjdGlvbnM6IFtdIH07XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucyksIG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuaGl0V2luZG93cyA9ICgwLCBpbmRleF8xLmhpdFdpbmRvd3NGb3JPRCkoYmVhdG1hcC5kaWZmaWN1bHR5Lm92ZXJhbGxEaWZmaWN1bHR5LCB0aGlzLm9wdGlvbnMuaGl0V2luZG93U3R5bGUgPT09IFwiT1NVX0xBWkVSXCIpO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzID0gZ2VuZXJhdGVFdmVudHMoYmVhdG1hcCwgdGhpcy5oaXRXaW5kb3dzKTtcclxuICAgIH1cclxuICAgIGp1ZGdlSGl0Q2lyY2xlKGlkLCB2ZXJkaWN0KSB7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUuaGl0Q2lyY2xlVmVyZGljdFtpZF0gPSB2ZXJkaWN0O1xyXG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlLmFsaXZlSGl0Q2lyY2xlSWRzLmRlbGV0ZShpZCk7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUuanVkZ2VkT2JqZWN0cy5wdXNoKGlkKTtcclxuICAgIH1cclxuICAgIGhhbmRsZUhpdENpcmNsZVNwYXduKHRpbWUsIGhpdENpcmNsZUlkKSB7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUuYWxpdmVIaXRDaXJjbGVJZHMuYWRkKGhpdENpcmNsZUlkKTtcclxuICAgIH1cclxuICAgIGhhbmRsZUhpdENpcmNsZUZvcmNlS2lsbCh0aW1lLCBoaXRDaXJjbGVJZCkge1xyXG4gICAgICAgIC8vIEFscmVhZHkgZGVhZD8gVGhlIHNoaW5pZ2FtaSB3aWxsIGp1c3QgbGVhdmUuLi5cclxuICAgICAgICBpZiAoIXRoaXMuZ2FtZVN0YXRlLmFsaXZlSGl0Q2lyY2xlSWRzLmhhcyhoaXRDaXJjbGVJZCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPdGhlcndpc2Ugd2UgZm9yY2Uga2lsbCBmb3Igbm90IGJlaW5nIGhpdCBieSB0aGUgcGxheWVyIC4uLlxyXG4gICAgICAgIGNvbnN0IHZlcmRpY3QgPSB7IGp1ZGdlbWVudFRpbWU6IHRpbWUsIHR5cGU6IFwiTUlTU1wiLCBtaXNzUmVhc29uOiBcIlRJTUVfRVhQSVJFRFwiIH07XHJcbiAgICAgICAgdGhpcy5qdWRnZUhpdENpcmNsZShoaXRDaXJjbGVJZCwgdmVyZGljdCk7XHJcbiAgICB9XHJcbiAgICBoYW5kbGVTbGlkZXJTdGFydCh0aW1lLCBzbGlkZXJJZCkge1xyXG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlLmFsaXZlU2xpZGVySWRzLmFkZChzbGlkZXJJZCk7XHJcbiAgICB9XHJcbiAgICBoYW5kbGVTbGlkZXJFbmRpbmcodGltZSwgc2xpZGVySWQpIHtcclxuICAgICAgICB2YXIgX2E7XHJcbiAgICAgICAgY29uc3Qgc2xpZGVyID0gdGhpcy5iZWF0bWFwLmdldFNsaWRlcihzbGlkZXJJZCk7XHJcbiAgICAgICAgY29uc3QgaGVhZFZlcmRpY3QgPSB0aGlzLmdhbWVTdGF0ZS5oaXRDaXJjbGVWZXJkaWN0W3NsaWRlci5oZWFkLmlkXTtcclxuICAgICAgICAvLyBDbGVhbiB1cCB0aGUgaGVhZCBpZiBpdCBoYXNuJ3QgYmVlbiBpbnRlcmFjdGVkIHdpdGggdGhlIHBsYXllciBpbiBhbnkgd2F5LlxyXG4gICAgICAgIGlmIChoZWFkVmVyZGljdCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuanVkZ2VIaXRDaXJjbGUoc2xpZGVyLmhlYWQuaWQsIHtcclxuICAgICAgICAgICAgICAgIGp1ZGdlbWVudFRpbWU6IHNsaWRlci5lbmRUaW1lLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJNSVNTXCIsXHJcbiAgICAgICAgICAgICAgICBtaXNzUmVhc29uOiBcIlNMSURFUl9GSU5JU0hFRF9GQVNURVJcIixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5vdyBjb3VudCB0aGUgaGl0IGNoZWNrcG9pbnRzIGFuZCBnZXQgdGhlIHZlcmRpY3RcclxuICAgICAgICBjb25zdCB0b3RhbENoZWNrcG9pbnRzID0gc2xpZGVyLmNoZWNrUG9pbnRzLmxlbmd0aCArIDE7XHJcbiAgICAgICAgbGV0IGhpdENoZWNrcG9pbnRzID0gMDtcclxuICAgICAgICBpZiAoIShoZWFkVmVyZGljdCA9PT0gdW5kZWZpbmVkIHx8IGhlYWRWZXJkaWN0LnR5cGUgPT09IFwiTUlTU1wiKSlcclxuICAgICAgICAgICAgaGl0Q2hlY2twb2ludHMrKztcclxuICAgICAgICBmb3IgKGNvbnN0IGMgb2Ygc2xpZGVyLmNoZWNrUG9pbnRzKSB7XHJcbiAgICAgICAgICAgIGhpdENoZWNrcG9pbnRzICs9ICgoX2EgPSB0aGlzLmdhbWVTdGF0ZS5jaGVja1BvaW50VmVyZGljdFtjLmlkXSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmhpdCkgPyAxIDogMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUuc2xpZGVyVmVyZGljdFtzbGlkZXIuaWRdID0gc2xpZGVyVmVyZGljdEJhc2VkT25DaGVja3BvaW50cyh0b3RhbENoZWNrcG9pbnRzLCBoaXRDaGVja3BvaW50cyk7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUuanVkZ2VkT2JqZWN0cy5wdXNoKHNsaWRlci5pZCk7XHJcbiAgICAgICAgLy8gVGhlIGhlYWQgc2hvdWxkIG5vdCBiZSBhbGl2ZVxyXG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlLmFsaXZlU2xpZGVySWRzLmRlbGV0ZShzbGlkZXJJZCk7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUuc2xpZGVyQm9keVN0YXRlLmRlbGV0ZShzbGlkZXJJZCk7XHJcbiAgICB9XHJcbiAgICBwcmVkaWN0ZWRDdXJzb3JQb3NpdGlvbkF0KHRpbWUpIHtcclxuICAgICAgICBjb25zdCBwcmV2aW91c1RpbWUgPSB0aGlzLmdhbWVTdGF0ZS5jdXJyZW50VGltZTtcclxuICAgICAgICBjb25zdCBuZXh0VGltZSA9IHRoaXMuZnJhbWUudGltZTtcclxuICAgICAgICBjb25zdCBwcmV2aW91c1Bvc2l0aW9uID0gdGhpcy5nYW1lU3RhdGUuY3Vyc29yUG9zaXRpb247XHJcbiAgICAgICAgY29uc3QgbmV4dFBvc2l0aW9uID0gdGhpcy5mcmFtZS5wb3NpdGlvbjtcclxuICAgICAgICBpZiAocHJldmlvdXNUaW1lID09PSBuZXh0VGltZSlcclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzUG9zaXRpb247XHJcbiAgICAgICAgY29uc3QgZiA9ICh0aW1lIC0gcHJldmlvdXNUaW1lKSAvIChuZXh0VGltZSAtIHByZXZpb3VzVGltZSk7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4XzEuVmVjMi5pbnRlcnBvbGF0ZShwcmV2aW91c1Bvc2l0aW9uLCBuZXh0UG9zaXRpb24sIGYpO1xyXG4gICAgfVxyXG4gICAgaGFuZGxlU2xpZGVyQ2hlY2tQb2ludCh0aW1lLCBpZCkge1xyXG4gICAgICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gdGhpcy5wcmVkaWN0ZWRDdXJzb3JQb3NpdGlvbkF0KHRpbWUpO1xyXG4gICAgICAgIGNvbnN0IGNoZWNrUG9pbnQgPSB0aGlzLmJlYXRtYXAuZ2V0U2xpZGVyQ2hlY2tQb2ludChpZCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVTbGlkZXJCb2R5VHJhY2tpbmcodGltZSwgY3Vyc29yUG9zaXRpb24sIHRoaXMuZ2FtZVN0YXRlLnByZXNzaW5nU2luY2UpO1xyXG4gICAgICAgIGNvbnN0IHNsaWRlcklkID0gY2hlY2tQb2ludC5zbGlkZXIuaWQ7XHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLmdhbWVTdGF0ZS5zbGlkZXJCb2R5U3RhdGUuZ2V0KHNsaWRlcklkKTtcclxuICAgICAgICBpZiAoc3RhdGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIlNvbWVob3cgdGhlIHNsaWRlciBib2R5IGhhcyBubyBzdGF0ZSB3aGlsZSB0aGVyZSBpcyBhIGNoZWNrcG9pbnQgYWxpdmUuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmdhbWVTdGF0ZS5jaGVja1BvaW50VmVyZGljdFtpZF0gPSB7IGhpdDogc3RhdGUuaXNUcmFja2luZyB9O1xyXG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlLmp1ZGdlZE9iamVjdHMucHVzaChpZCk7XHJcbiAgICB9XHJcbiAgICBoYW5kbGVTcGlubmVyU3RhcnQoaWQpIHtcclxuICAgICAgICB0aGlzLmdhbWVTdGF0ZS5hbGl2ZVNwaW5uZXJJZHMuYWRkKGlkKTtcclxuICAgIH1cclxuICAgIGhhbmRsZVNwaW5uZXJFbmQoaWQpIHtcclxuICAgICAgICB0aGlzLmdhbWVTdGF0ZS5hbGl2ZVNwaW5uZXJJZHMuZGVsZXRlKGlkKTtcclxuICAgICAgICB0aGlzLmdhbWVTdGF0ZS5qdWRnZWRPYmplY3RzLnB1c2goaWQpO1xyXG4gICAgfVxyXG4gICAgaGFuZGxlRXZlbnQoZXZlbnQpIHtcclxuICAgICAgICBjb25zdCB7IGhpdE9iamVjdElkLCB0aW1lLCB0eXBlIH0gPSBldmVudDtcclxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBcIkhJVF9DSVJDTEVfU1BBV05cIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlSGl0Q2lyY2xlU3Bhd24odGltZSwgaGl0T2JqZWN0SWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJISVRfQ0lSQ0xFX0ZPUkNFX0tJTExcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlSGl0Q2lyY2xlRm9yY2VLaWxsKHRpbWUsIGhpdE9iamVjdElkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiU0xJREVSX1NUQVJUXCI6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVNsaWRlclN0YXJ0KHRpbWUsIGhpdE9iamVjdElkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiU0xJREVSX0VORFwiOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVTbGlkZXJFbmRpbmcodGltZSwgaGl0T2JqZWN0SWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJTTElERVJfQ0hFQ0tfUE9JTlRcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlU2xpZGVyQ2hlY2tQb2ludCh0aW1lLCBoaXRPYmplY3RJZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIlNQSU5ORVJfU1RBUlRcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlU3Bpbm5lclN0YXJ0KGhpdE9iamVjdElkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiU1BJTk5FUl9FTkRcIjpcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlU3Bpbm5lckVuZChoaXRPYmplY3RJZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBoYW5kbGVBbGl2ZUhpdENpcmNsZXMoKSB7XHJcbiAgICAgICAgLy8gVGhlcmUgaXMgb25seSBhY3Rpb24gaWYgdGhlcmUgaXMgYWxzbyBhIGNsaWNrIGluIHRoaXMgZnJhbWUgLi4uXHJcbiAgICAgICAgY29uc3QgaGFzUmVsYXggPSB0aGlzLmJlYXRtYXAuYXBwbGllZE1vZHMuaW5jbHVkZXMoXCJSRUxBWFwiKTtcclxuICAgICAgICBpZiAoIXRoaXMuaGFzRnJlc2hDbGlja1RoaXNGcmFtZSAmJiAhaGFzUmVsYXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB7IG5vdGVMb2NrU3R5bGUgfSA9IHRoaXMub3B0aW9ucztcclxuICAgICAgICBjb25zdCBjdXJyZW50VGltZSA9IHRoaXMuZ2FtZVN0YXRlLmN1cnJlbnRUaW1lO1xyXG4gICAgICAgIGxldCBub3RlTG9ja2VkID0gZmFsc2U7XHJcbiAgICAgICAgLy8gSmF2YVNjcmlwdCBgU2V0YCBtYWludGFpbnMgaXRzIGVsZW1lbnRzIGluIGluc2VydGlvbiBvcmRlciBzbyB0aGUgZWFybHkgb25lc1xyXG4gICAgICAgIC8vIHdlIGl0ZXJhdGUgb24gYXJlIGFsc28gdGhlIG9uZXMgdGhhdCBhcmUgc3VwcG9zZWQgdG8gYmUgaGl0IGZpcnN0IC4uLlxyXG4gICAgICAgIC8vIFdlIGNvcHkgYmVjYXVzZSB0aGUgdmFsdWVzIGludG8gYW4gYXJyYXkgYmVjYXVzZSB3ZSBtaWdodCBkZWxldGUgdGhlbSAuLi5cclxuICAgICAgICBjb25zdCBoaXRDaXJjbGVJZHMgPSBBcnJheS5mcm9tKHRoaXMuZ2FtZVN0YXRlLmFsaXZlSGl0Q2lyY2xlSWRzLnZhbHVlcygpKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhpdENpcmNsZUlkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IGhpdENpcmNsZUlkc1tpXTtcclxuICAgICAgICAgICAgY29uc3QgaGl0Q2lyY2xlID0gdGhpcy5iZWF0bWFwLmdldEhpdENpcmNsZShpZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvckluc2lkZSA9IGluZGV4XzEuVmVjMi53aXRoaW5EaXN0YW5jZShoaXRDaXJjbGUucG9zaXRpb24sIHRoaXMuZ2FtZVN0YXRlLmN1cnNvclBvc2l0aW9uLCBNYXRoLmZyb3VuZChoaXRDaXJjbGUucmFkaXVzKSk7XHJcbiAgICAgICAgICAgIGlmICghY3Vyc29ySW5zaWRlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBwdXQgYSBsb2NrIG9uIHRoZSBvdGhlciBjaXJjbGVzIGJlY2F1c2UgdGhlIGZpcnN0IGFsaXZlIEhpdENpcmNsZSBpcyB0aGUgb25seSBjaXJjbGUgd2UgY2FuIGludGVyYWN0IHdpdGguXHJcbiAgICAgICAgICAgICAgICBpZiAobm90ZUxvY2tTdHlsZSA9PT0gXCJTVEFCTEVcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGVMb2NrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gSXQncyBhIGJpdCBmYWlyZXIgYmVjYXVzZSB0aGlzIGFsbG93cyB1cyB0byBmb3JjZSBtaXNzIG5vdGVzIHRoYXQgYXJlIGluIHRoZSBwYXN0LlxyXG4gICAgICAgICAgICAgICAgaWYgKG5vdGVMb2NrU3R5bGUgPT09IFwiTEFaRVJcIiAmJiBjdXJyZW50VGltZSA8PSBoaXRDaXJjbGUuaGl0VGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vdGVMb2NrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWYgd2UgZ290IG5vdGUgbG9ja2VkLCB3ZSB3YW50IHRvIHNldCBhbiBhbmltYXRpb24gdGhlbiBpZ25vcmUgdGhlIG90aGVyIGhpdCBjaXJjbGVzXHJcbiAgICAgICAgICAgIGlmIChub3RlTG9ja2VkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTZXQgc3RhdGUgb2YgYGlkYCB0byBiZSBub3RlTG9ja2VkIGF0IHRoZSBjdXJyZW50IHRpbWUgKHRoaXMgYWxsb3dzIHVzIHRvIHNob3cgYW4gXCJzaGFraW5nXCIgYW5pbWF0aW9uKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWYgdGhpcyBoaXRvYmplY3QgaXMgdG9vIGVhcmx5IGZvciByZWxheCwgdGhlbiB0aGUgb3RoZXIgb25lcyB3aWxsIGJlIGFzIHdlbGwsIHNvIGJyZWFrLlxyXG4gICAgICAgICAgICBjb25zdCBkZWx0YSA9IGN1cnJlbnRUaW1lIC0gaGl0Q2lyY2xlLmhpdFRpbWU7XHJcbiAgICAgICAgICAgIGlmIChoYXNSZWxheCAmJiBkZWx0YSA8IC1Nb2RzXzEuUkVMQVhfTEVOSUVOQ1kpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgbGV0IGp1ZGdlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHZlcmRpY3Qgb2YgW1wiR1JFQVRcIiwgXCJPS1wiLCBcIk1FSFwiXSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzV2l0aGluSGl0V2luZG93KHRoaXMuaGl0V2luZG93cywgZGVsdGEsIHZlcmRpY3QpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5qdWRnZUhpdENpcmNsZShoaXRDaXJjbGUuaWQsIHsganVkZ2VtZW50VGltZTogY3VycmVudFRpbWUsIHR5cGU6IHZlcmRpY3QgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAganVkZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBUT0RPOiBGb3JjZSBtaXNzIG90aGVyIG5vdGVzIGxlc3MgdGhhbiBpIGZvciBsYXplciBzdHlsZVxyXG4gICAgICAgICAgICBpZiAoanVkZ2VkKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGlmIChpc1dpdGhpbkhpdFdpbmRvdyh0aGlzLmhpdFdpbmRvd3MsIGRlbHRhLCBcIk1JU1NcIikpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IEFkZCBhIFwiSElUX1RPT19MQVRFXCIgKGV2ZW4gdGhvdWdoIGl0J3Mga2luZGEgdW5mYWlyLCBidXQgdGhpcyBpcyBvc3Uhc3RhYmxlIGJlaGF2aW9yKVxyXG4gICAgICAgICAgICAgICAgLy8gRm9yIHNvbWUgcmVhc29uIGluIG9zdSFzdGFibGUgdGhlIEhpdENpcmNsZSB0aGF0IGhhcyBhIE1FSCB0aW1lIG9mIGxldCdzIHNheSArLTEwOS41bXMgaXMgc3RpbGwgYWxpdmUgYXRcclxuICAgICAgICAgICAgICAgIC8vIHQrMTEwbXMgYW5kIGNhbiBiZSBcImNsaWNrZWRcIiBieSB0aGUgdXNlciBhdCB0aW1lIHQrMTEwbXMsIGJ1dCBpdCB3aWxsIGp1c3QgcmVzdWx0IGluIGEgbWlzcy4gVGhlIHByb2JsZW0gaXNcclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgdGhlIHVuZGVybHlpbmcgbm90ZSB3aWxsIHRoZW4gYmUgaWdub3JlZCBiZWNhdXNlIHRoZSBjbGljayBpcyBcIndhc3RlZFwiIGZvciB0aGUgYWxyZWFkeSBleHBpcmVkIGhpdFxyXG4gICAgICAgICAgICAgICAgLy8gY2lyY2xlLiA9PiBUaGlzIG1pZ2h0IGJlIGEgc3RhYmxlIGJ1ZyBvciBmZWF0dXJlP1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qdWRnZUhpdENpcmNsZShoaXRDaXJjbGUuaWQsIHsganVkZ2VtZW50VGltZTogY3VycmVudFRpbWUsIHR5cGU6IFwiTUlTU1wiLCBtaXNzUmVhc29uOiBcIkhJVF9UT09fRUFSTFlcIiB9KTtcclxuICAgICAgICAgICAgICAgIGp1ZGdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gVE9ETzogRG8gd2UgZm9yY2UgbWlzcyBvdGhlciBub3RlcyBhcyB3ZWxsPyBmb3IgbGF6ZXIgc3R5bGVcclxuICAgICAgICAgICAgaWYgKGp1ZGdlZClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGdldCBoYXNGcmVzaENsaWNrVGhpc0ZyYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdhbWVTdGF0ZS5wcmVzc2luZ1NpbmNlLmluY2x1ZGVzKHRoaXMuZ2FtZVN0YXRlLmN1cnJlbnRUaW1lKTtcclxuICAgIH1cclxuICAgIGhlYWRIaXRUaW1lKGhlYWRJZCkge1xyXG4gICAgICAgIGNvbnN0IHZlcmRpY3QgPSB0aGlzLmdhbWVTdGF0ZS5oaXRDaXJjbGVWZXJkaWN0W2hlYWRJZF07XHJcbiAgICAgICAgaWYgKCF2ZXJkaWN0IHx8IHZlcmRpY3QudHlwZSA9PT0gXCJNSVNTXCIpXHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgcmV0dXJuIHZlcmRpY3QuanVkZ2VtZW50VGltZTtcclxuICAgIH1cclxuICAgIHVwZGF0ZVNsaWRlckJvZHlUcmFja2luZyh0aW1lLCBjdXJzb3JQb3NpdGlvbiwgcHJlc3NpbmdTaW5jZSkge1xyXG4gICAgICAgIHZhciBfYSwgX2I7XHJcbiAgICAgICAgZm9yIChjb25zdCBpZCBvZiB0aGlzLmdhbWVTdGF0ZS5hbGl2ZVNsaWRlcklkcykge1xyXG4gICAgICAgICAgICBjb25zdCBzbGlkZXIgPSB0aGlzLmJlYXRtYXAuZ2V0U2xpZGVyKGlkKTtcclxuICAgICAgICAgICAgY29uc3QgaGVhZEhpdFRpbWUgPSB0aGlzLmhlYWRIaXRUaW1lKHNsaWRlci5oZWFkLmlkKTtcclxuICAgICAgICAgICAgY29uc3Qgd2FzVHJhY2tpbmcgPSAoX2IgPSAoX2EgPSB0aGlzLmdhbWVTdGF0ZS5zbGlkZXJCb2R5U3RhdGUuZ2V0KGlkKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmlzVHJhY2tpbmcpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IGZhbHNlO1xyXG4gICAgICAgICAgICBjb25zdCBoYXNSZWxheCA9IHRoaXMuYmVhdG1hcC5hcHBsaWVkTW9kcy5pbmNsdWRlcyhcIlJFTEFYXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBpc1RyYWNraW5nID0gZGV0ZXJtaW5lVHJhY2tpbmcod2FzVHJhY2tpbmcsIHNsaWRlciwgY3Vyc29yUG9zaXRpb24sIHRpbWUsIHByZXNzaW5nU2luY2UsIGhlYWRIaXRUaW1lLCBoYXNSZWxheCk7XHJcbiAgICAgICAgICAgIHRoaXMuZ2FtZVN0YXRlLnNsaWRlckJvZHlTdGF0ZS5zZXQoaWQsIHsgaXNUcmFja2luZyB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBQcm9jZXNzIHRoZSBldmVudHMgdW50aWwgZXZlbnRbaV0udGltZSA8PSBtYXhUaW1lSW5jbHVzaXZlIGlzIG5vIGxvbmdlciB2YWxpZC5cclxuICAgIGhhbmRsZUV2ZW50c1VudGlsVGltZShtYXhUaW1lSW5jbHVzaXZlKSB7XHJcbiAgICAgICAgY29uc3QgeyBnYW1lU3RhdGUsIGV2ZW50cyB9ID0gdGhpcztcclxuICAgICAgICB3aGlsZSAoZ2FtZVN0YXRlLmV2ZW50SW5kZXggPCBldmVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gZXZlbnRzW2dhbWVTdGF0ZS5ldmVudEluZGV4XTtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LnRpbWUgPiBtYXhUaW1lSW5jbHVzaXZlKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnYW1lU3RhdGUuZXZlbnRJbmRleCArPSAxO1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUV2ZW50KGV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBldmFsdWF0ZShnYW1lU3RhdGUsIGZyYW1lKSB7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUgPSBnYW1lU3RhdGU7XHJcbiAgICAgICAgdGhpcy5mcmFtZSA9IGZyYW1lO1xyXG4gICAgICAgIC8vIDEuIERlYWwgd2l0aCBoaXQgb2JqZWN0cyB0aGF0IGFyZSBvbmx5IGFmZmVjdGVkIHdpdGggbW92ZW1lbnQgKHNsaWRlcnMsIHNwaW5uZXJzKVxyXG4gICAgICAgIC8vIFRiaCBpbiBteSBmaXJzdCB2ZXJzaW9uIEkgaGF2ZSB0aGlzLmhhbmRsZUV2ZW50c1VudGlsVGltZShmcmFtZS50aW1lKSByaWdodCBub3csIHdoaWNoIG1ha2VzIG1vcmUgc2Vuc2UuXHJcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudHNVbnRpbFRpbWUoZnJhbWUudGltZSAtIDEpO1xyXG4gICAgICAgIC8vIDIuIE5vdyBjb25zaWRlciB0aGluZ3MgdGhhdCBnZXQgYWZmZWN0ZWQgYnkgcmVsZWFzaW5nIC8gY2xpY2tpbmcgYXQgdGhpcyBwYXJ0aWN1bGFyIHRpbWUuXHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUuY3Vyc29yUG9zaXRpb24gPSBmcmFtZS5wb3NpdGlvbjtcclxuICAgICAgICB0aGlzLmdhbWVTdGF0ZS5jdXJyZW50VGltZSA9IGZyYW1lLnRpbWU7XHJcbiAgICAgICAgdGhpcy5nYW1lU3RhdGUucHJlc3NpbmdTaW5jZSA9ICgwLCBleHBvcnRzLm5ld1ByZXNzaW5nU2luY2UpKHRoaXMuZ2FtZVN0YXRlLnByZXNzaW5nU2luY2UsIGZyYW1lLmFjdGlvbnMsIGZyYW1lLnRpbWUpO1xyXG4gICAgICAgIHRoaXMuZ2FtZVN0YXRlLmNsaWNrV2FzVXNlZnVsID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5oYW5kbGVBbGl2ZUhpdENpcmNsZXMoKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVNsaWRlckJvZHlUcmFja2luZyhmcmFtZS50aW1lLCBmcmFtZS5wb3NpdGlvbiwgdGhpcy5nYW1lU3RhdGUucHJlc3NpbmdTaW5jZSk7XHJcbiAgICAgICAgLy8gMy4gRGVhbCB3aXRoIGV2ZW50cyBhZnRlciB0aGUgY2xpY2sgc3VjaCBhcyBmb3JjZSBraWxsaW5nIGEgSGl0Q2lyY2xlXHJcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudHNVbnRpbFRpbWUoZnJhbWUudGltZSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5HYW1lU3RhdGVFdmFsdWF0b3IgPSBHYW1lU3RhdGVFdmFsdWF0b3I7XHJcbmNvbnN0IHNsaWRlclByb2dyZXNzID0gKHNsaWRlciwgdGltZSkgPT4gKHRpbWUgLSBzbGlkZXIuc3RhcnRUaW1lKSAvIHNsaWRlci5kdXJhdGlvbjtcclxuLyoqXHJcbiAqIFNsaWRlclRyYWNraW5nIGlzIGRlc2NyaWJlZCBpbiBhIGNvbXBsaWNhdGVkIHdheSBpbiBvc3UhbGF6ZXIsIGJ1dCBpdCBjYW4gYmUgYm9pbGVkIGRvd24gdG86XHJcbiAqXHJcbiAqICogQSBrZXkgbXVzdCBiZSBwcmVzc2VkICg/KVxyXG4gKiAqIFNsaWRlciB0cmFja2luZyBpcyBvbmx5IGRvbmUgYmV0d2VlbiBzbGlkZXIuc3RhcnRUaW1lIChpbmNsdXNpdmVseSkgYW5kIHNsaWRlci5lbmRUaW1lXHJcbiAqIChleGNsdXNpdmVseSkuXHJcbiAqICogVGhlIGZvbGxvdyBjaXJjbGUgaXMgc2NhbGVkIHVwIHRvIDIuNCBpZiB0cmFja2luZywgYW5kIGRvd24gdG8gMS4wIGlmIG5vdCB0cmFja2luZywgdGhlIGN1cnNvciBzaG91bGQgYmVcclxuICogaW4gdGhlIGZvbGxvdyBjaXJjbGUuXHJcbiAqICogQWRkaXRpb25hbGx5IHRoZXJlIGFyZSB0d28gc3RhdGVzIG9mIGEgc2xpZGVyOlxyXG4gKiAgLSBFaXRoZXIgdGhlIGhlYWRlciB3YXMgbm90IGhpdCwgdGhlbiB3ZSBjYW4gYWNjZXB0IGFueSBrZXkgZm9yIHNsaWRlciB0cmFja2luZy5cclxuICpcclxuICogIC0gSWYgdGhlIGhlYWQgd2FzIGhpdCBhdCBgdGAsIHRoZW4gd2UgY2FuIG9ubHkgcmVzdHJpY3QgdGhlIGtleXMgdG8gXCJmcmVzaFwiIGNsaWNrcywgd2hpY2ggbWVhbnMgY2xpY2tzIG5vdFxyXG4gKiBiZWZvcmUgdC5cclxuICpcclxuICogTm90ZSB0aGF0IHRoZSBzdGF0ZSBjYW4gYmUgMS4gYXQgZmlyc3QgYW5kIHRoZW4gdHJhbnNpdGlvbiB0byAyLlxyXG4gKlxyXG4gKiBJbiBvc3UhbGF6ZXIgdGhlIHRyYWNraW5nIGZvbGxvd3MgdGhlIHZpc3VhbCB0cmFja2luZzpcclxuICogaHR0cHM6Ly9kaXNjb3JkLmNvbS9jaGFubmVscy8xODg2MzA0ODEzMDEwMTI0ODEvMTg4NjMwNjUyMzQwNDA0MjI0Lzg2NTY0ODc0MDgxMDg4MzExMlxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vcHB5L29zdS9ibG9iLzZjZWMxMTQ1ZTM1MTBlYjI3YzZmYmViMGY5Mzk2N2QyZDg3MmU2MDAvb3N1LkdhbWUuUnVsZXNldHMuT3N1L01vZHMvT3N1TW9kQ2xhc3NpYy5jcyNMNjFcclxuICogVGhlIHNsaWRlciBiYWxsIGFjdHVhbGx5IGdyYWR1YWxseSBzY2FsZXMgdG8gMi40IChkdXJhdGlvbjogMzAwbXMsIG1ldGhvZDogRWFzaW5nLk91dFF1aW50KSB3aGljaCBtZWFucyB0aGF0IGF0IHRoZVxyXG4gKiBiZWdpbm5pbmcgdGhlIGN1cnNvciBoYXMgbGVzcyBsZWV3YXkgdGhhbiBhZnRlciAzMDBtcywgd2hpbGUgaW4gb3N1IXN0YWJsZSB5b3UgaW5zdGFudGx5IGhhdmUgdGhlIG1heGltdW0gbGVld2F5LiBJblxyXG4gKiBvc3UhbGF6ZXIgaXQncyBhY3R1YWxseSBhIGxpdHRsZSBiaXQgaGFyZGVyIHRoYW4gb3N1IXN0YWJsZS5cclxuICovXHJcbmZ1bmN0aW9uIGRldGVybWluZVRyYWNraW5nKHByZXZpb3VzbHlUcmFja2luZywgc2xpZGVyLCBjdXJzb3JQb3NpdGlvbiwgdGltZSwgcHJlc3NpbmdTaW5jZSwgaGVhZEhpdFRpbWUsIGhhc1JlbGF4KSB7XHJcbiAgICBjb25zdCBrZXlJc0JlaW5nUHJlc3NlZCA9IHByZXNzaW5nU2luY2UuZmluZEluZGV4KCh4KSA9PiB4ICE9PSBHYW1lU3RhdGVfMS5OT1RfUFJFU1NJTkcpID49IDA7XHJcbiAgICAvLyBaZXJvdGggY29uZGl0aW9uXHJcbiAgICBpZiAoIWtleUlzQmVpbmdQcmVzc2VkICYmICFoYXNSZWxheClcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAvLyBGaXJzdCBjb25kaXRpb25cclxuICAgIGlmICh0aW1lIDwgc2xpZGVyLnN0YXJ0VGltZSB8fCBzbGlkZXIuZW5kVGltZSA8PSB0aW1lKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIC8vIFNlY29uZCBjb25kaXRpb25cclxuICAgIGNvbnN0IHByb2dyZXNzID0gc2xpZGVyUHJvZ3Jlc3Moc2xpZGVyLCB0aW1lKTtcclxuICAgIGNvbnN0IGZvbGxvd0NpcmNsZVJhZGl1cyA9IChwcmV2aW91c2x5VHJhY2tpbmcgPyAyLjQgOiAxLjApICogc2xpZGVyLnJhZGl1cztcclxuICAgIGNvbnN0IGRpc3RhbmNlQ3Vyc29yVG9CYWxsID0gaW5kZXhfMS5WZWMyLmRpc3RhbmNlKHNsaWRlci5iYWxsUG9zaXRpb25BdChwcm9ncmVzcyksIGN1cnNvclBvc2l0aW9uKTtcclxuICAgIGlmIChkaXN0YW5jZUN1cnNvclRvQmFsbCA+IGZvbGxvd0NpcmNsZVJhZGl1cylcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAvLyBOb3cgbGFzdCBjb25kaXRpb25cclxuICAgIC8vIFN0YXRlIDFcclxuICAgIGlmIChoZWFkSGl0VGltZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBTaW5jZSBhbnkga2V5IGlzIG9rXHJcbiAgICAvLyBGb3IgdGhlIGNsaWNrIHRoYXQgd2FzIGRvbmUgYXQgdD1oZWFkSGl0VGltZTogdCA+PSBoZWFkSGl0VGltZSBpcyB0cnVlLlxyXG4gICAgLy8gSW4gdGhlIG90aGVyIGNhc2UsIHdlIHJlcXVpcmUgYSBmcmVzaCBjbGlja1xyXG4gICAgLy8gU3RhdGUgMiAocmVxdWlyaW5nIGEgZnJlc2ggY2xpY2spXHJcbiAgICByZXR1cm4gcHJlc3NpbmdTaW5jZS5maW5kSW5kZXgoKHgpID0+IHggPj0gaGVhZEhpdFRpbWUpID49IDA7XHJcbn1cclxuZnVuY3Rpb24gc2xpZGVyVmVyZGljdEJhc2VkT25DaGVja3BvaW50cyh0b3RhbENoZWNrcG9pbnRzLCBoaXRDaGVja3BvaW50cykge1xyXG4gICAgaWYgKGhpdENoZWNrcG9pbnRzID09PSB0b3RhbENoZWNrcG9pbnRzKVxyXG4gICAgICAgIHJldHVybiBcIkdSRUFUXCI7XHJcbiAgICBpZiAoaGl0Q2hlY2twb2ludHMgPT09IDApXHJcbiAgICAgICAgcmV0dXJuIFwiTUlTU1wiO1xyXG4gICAgaWYgKGhpdENoZWNrcG9pbnRzICogMiA+PSB0b3RhbENoZWNrcG9pbnRzKVxyXG4gICAgICAgIHJldHVybiBcIk9LXCI7XHJcbiAgICByZXR1cm4gXCJNRUhcIjtcclxufVxyXG4vLyBNYXliZSBoaXRPYmplY3RzIHNob3VsZCBiZSBmbGF0dGVuZWQgb3V0IChuZXN0ZWQgcHVsbGVkIG91dClcclxuLy8gVGhlIG1vZHMgc2hvdWxkIGJlIGFwcGxpZWQgdG8gdGhvc2UgdGhlbSAuLi5cclxuY29uc3QgYWN0aW9uc1RvQm9vbGVhbnMgPSAob3N1QWN0aW9ucykgPT4gW1xyXG4gICAgb3N1QWN0aW9ucy5pbmNsdWRlcyhSZXBsYXlfMS5Pc3VBY3Rpb24ubGVmdEJ1dHRvbiksXHJcbiAgICBvc3VBY3Rpb25zLmluY2x1ZGVzKFJlcGxheV8xLk9zdUFjdGlvbi5yaWdodEJ1dHRvbiksXHJcbl07XHJcbmNvbnN0IG5ld1ByZXNzaW5nU2luY2UgPSAocHJlc3NpbmdTaW5jZSwgb3N1QWN0aW9ucywgdGltZSkgPT4ge1xyXG4gICAgY29uc3QgcHJlc3NlZCA9IGFjdGlvbnNUb0Jvb2xlYW5zKG9zdUFjdGlvbnMpO1xyXG4gICAgY29uc3QgbmV3UHJlc3NpbmdTaW5jZSA9IFsuLi5wcmVzc2luZ1NpbmNlXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmV3UHJlc3NpbmdTaW5jZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChwcmVzc2VkW2ldKSB7XHJcbiAgICAgICAgICAgIG5ld1ByZXNzaW5nU2luY2VbaV0gPSBNYXRoLm1pbihuZXdQcmVzc2luZ1NpbmNlW2ldLCB0aW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG5ld1ByZXNzaW5nU2luY2VbaV0gPSBHYW1lU3RhdGVfMS5OT1RfUFJFU1NJTkc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ld1ByZXNzaW5nU2luY2U7XHJcbn07XHJcbmV4cG9ydHMubmV3UHJlc3NpbmdTaW5jZSA9IG5ld1ByZXNzaW5nU2luY2U7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuQnVja2V0ZWRHYW1lU3RhdGVUaW1lTWFjaGluZSA9IHZvaWQgMDtcclxuY29uc3QgR2FtZVN0YXRlXzEgPSByZXF1aXJlKFwiLi9HYW1lU3RhdGVcIik7XHJcbmNvbnN0IGluZGV4XzEgPSByZXF1aXJlKFwiLi4vLi4vbWF0aC9pbmRleFwiKTtcclxuY29uc3QgR2FtZVN0YXRlRXZhbHVhdG9yXzEgPSByZXF1aXJlKFwiLi9HYW1lU3RhdGVFdmFsdWF0b3JcIik7XHJcbi8qKlxyXG4gKiBCeSBkZWZhdWx0IE8oUiBzcXJ0IG4pIG1lbW9yeSBhbmQgTyhzcXJ0IG4pIHRpbWUsIHdoZXJlIFIgaXMgdGhlIHNpemUgb2YgYSByZXBsYXkgc3RhdGUuXHJcbiAqIFN0b3JlcyByZXBsYXlzIGF0IHRoZSBpbmRpY2VzIFswLCBzcXJ0IG4sIDIgKnNxcnQgbiwgLi4uLCBzcXJ0IG4gKiBzcXJ0IG5dIGFuZCB0aGUgb3RoZXJzIGFyZSBpbmZlcnJlZC5cclxuICpcclxuICogVE9ETzogV2UgY291bGQgZG8gY2FjaGluZyBsaWtlIGRlc2NyaWJlZCBpbiBtZXRob2QgNCBvZlxyXG4gKiBodHRwczovL2dhbWVkZXYuc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzYwODAvaG93LXRvLWRlc2lnbi1hLXJlcGxheS1zeXN0ZW0vODM3MiM4MzcyIFRPRE86IFNob3VsZCB3ZVxyXG4gKiBPYmplY3QuZnJlZXplKC4uLikgdGhlIGNhY2hlZCBvbmVzIGluIG9yZGVyIHRvIHByZXZlbnQgYWNjaWRlbnRhbCBtdXRhdGlvbnM/XHJcbiAqL1xyXG5jbGFzcyBCdWNrZXRlZEdhbWVTdGF0ZVRpbWVNYWNoaW5lIHtcclxuICAgIGNvbnN0cnVjdG9yKGluaXRpYWxLbm93bkZyYW1lcywgYmVhdG1hcCwgXHJcbiAgICAvLyBwcml2YXRlIHJlYWRvbmx5IGhpdE9iamVjdHM6IE9zdUhpdE9iamVjdFtdLFxyXG4gICAgc2V0dGluZ3MsIGJ1Y2tldFNpemUpIHtcclxuICAgICAgICB0aGlzLmJlYXRtYXAgPSBiZWF0bWFwO1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcclxuICAgICAgICAvLyAwIHN0YW5kcyBmb3IgaW5pdGlhbCBzdGF0ZVxyXG4gICAgICAgIC8vIGFuZCBpIG1lYW5zIHRoYXQgaSBmcmFtZXMgaGF2ZSBiZWVuIHByb2Nlc3NlZFxyXG4gICAgICAgIHRoaXMuY3VycmVudEluZGV4ID0gMDtcclxuICAgICAgICB0aGlzLnN0b3JlZEdhbWVTdGF0ZSA9IFtdO1xyXG4gICAgICAgIC8vIEFkZCBhIGR1bW15IHJlcGxheSBmcmFtZSBhdCB0aGUgYmVnaW5uaW5nLlxyXG4gICAgICAgIHRoaXMuZnJhbWVzID0gW3sgdGltZTogLTcyNzcyNywgcG9zaXRpb246IG5ldyBpbmRleF8xLlZlYzIoMCwgMCksIGFjdGlvbnM6IFtdIH0sIC4uLmluaXRpYWxLbm93bkZyYW1lc107XHJcbiAgICAgICAgdGhpcy5idWNrZXRTaXplID0gYnVja2V0U2l6ZSAhPT0gbnVsbCAmJiBidWNrZXRTaXplICE9PSB2b2lkIDAgPyBidWNrZXRTaXplIDogTWF0aC5jZWlsKE1hdGguc3FydCh0aGlzLmZyYW1lcy5sZW5ndGgpKTtcclxuICAgICAgICB0aGlzLnN0b3JlZEdhbWVTdGF0ZVswXSA9ICgwLCBHYW1lU3RhdGVfMS5kZWZhdWx0R2FtZVN0YXRlKSgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudEdhbWVTdGF0ZSA9ICgwLCBHYW1lU3RhdGVfMS5jbG9uZUdhbWVTdGF0ZSkodGhpcy5zdG9yZWRHYW1lU3RhdGVbMF0pO1xyXG4gICAgICAgIHRoaXMuZXZhbHVhdG9yID0gbmV3IEdhbWVTdGF0ZUV2YWx1YXRvcl8xLkdhbWVTdGF0ZUV2YWx1YXRvcihiZWF0bWFwLCBzZXR0aW5ncyk7XHJcbiAgICB9XHJcbiAgICBnZXRIaWdoZXN0Q2FjaGVkSW5kZXgodGltZSkge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mcmFtZXMubGVuZ3RoOyBpICs9IHRoaXMuYnVja2V0U2l6ZSkge1xyXG4gICAgICAgICAgICAvLyBUaGUgc2Vjb25kIGNvbmRpdGlvbiBzaG91bGQgbm90IGhhcHBlbiBpbiBvdXIgdmVyc2lvbiBvZiBpbXBsZW1lbnRhdGlvbiB3aGVyZSB3ZSB0cmF2ZWwgZm9yd2FyZC5cclxuICAgICAgICAgICAgaWYgKHRpbWUgPCB0aGlzLmZyYW1lc1tpXS50aW1lIHx8ICF0aGlzLnN0b3JlZEdhbWVTdGF0ZVtpXSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGkgLSB0aGlzLmJ1Y2tldFNpemU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcbiAgICBnYW1lU3RhdGVBdCh0aW1lKSB7XHJcbiAgICAgICAgY29uc3QgaGlnaGVzdENhY2hlZEluZGV4ID0gdGhpcy5nZXRIaWdoZXN0Q2FjaGVkSW5kZXgodGltZSk7XHJcbiAgICAgICAgLy8gVE9ETzogSnVzdCBjaGVjayBpZiB3ZSBoYWQgbm9ybWFsIGZvcndhcmQgYmVoYXZpb3Igb3Igbm90LCB0aGlzIGNhbiBkcmFzdGljYWxseSBpbXByb3ZlIHBlcmZvcm1hbmNlXHJcbiAgICAgICAgLy8gSWYgbm90LCB3ZSBuZWVkIHRvIHJlc2V0IHNvbWV0aGluZyBzdWNoIGFzIHRoZSBkZXJpdmVkIGRhdGEuXHJcbiAgICAgICAgLy8gRWl0aGVyIHdlIGhhdmUgdG8gdHJhdmVsIGJhY2sgYW55d2F5cyBvciB0aGVyZSBpcyBhIGZ1dHVyZSBpbmRleCBhdmFpbGFibGUgZm9yIHRoYXQgdGltZS5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXggPCBoaWdoZXN0Q2FjaGVkSW5kZXggfHwgdGltZSA8IHRoaXMuZnJhbWVzW3RoaXMuY3VycmVudEluZGV4XS50aW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEluZGV4ID0gaGlnaGVzdENhY2hlZEluZGV4O1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRHYW1lU3RhdGUgPSAoMCwgR2FtZVN0YXRlXzEuY2xvbmVHYW1lU3RhdGUpKHRoaXMuc3RvcmVkR2FtZVN0YXRlW3RoaXMuY3VycmVudEluZGV4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gbW92ZSBmb3J3YXJkIGluIHRpbWVcclxuICAgICAgICB3aGlsZSAodGhpcy5jdXJyZW50SW5kZXggKyAxIDwgdGhpcy5mcmFtZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5leHRGcmFtZSA9IHRoaXMuZnJhbWVzW3RoaXMuY3VycmVudEluZGV4ICsgMV07XHJcbiAgICAgICAgICAgIGlmICh0aW1lIDwgbmV4dEZyYW1lLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZXZhbHVhdG9yLmV2YWx1YXRlKHRoaXMuY3VycmVudEdhbWVTdGF0ZSwgbmV4dEZyYW1lKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50SW5kZXggKz0gMTtcclxuICAgICAgICAgICAgLy8gQ2FjaGluZyB0aGUgc3RhdGUgYXQgYSBtdWx0aXBsZSBvZiBidWNrZXRTaXplXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCAlIHRoaXMuYnVja2V0U2l6ZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9yZWRHYW1lU3RhdGVbdGhpcy5jdXJyZW50SW5kZXhdID0gKDAsIEdhbWVTdGF0ZV8xLmNsb25lR2FtZVN0YXRlKSh0aGlzLmN1cnJlbnRHYW1lU3RhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRHYW1lU3RhdGU7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5CdWNrZXRlZEdhbWVTdGF0ZVRpbWVNYWNoaW5lID0gQnVja2V0ZWRHYW1lU3RhdGVUaW1lTWFjaGluZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5yZXRyaWV2ZUV2ZW50cyA9IGV4cG9ydHMuaXNIaXRPYmplY3RKdWRnZW1lbnQgPSB2b2lkIDA7XHJcbmNvbnN0IGluZGV4XzEgPSByZXF1aXJlKFwiLi4vdXRpbHMvaW5kZXhcIik7XHJcbi8vIFR5cGUgcHJlZGljYXRlc1xyXG5jb25zdCBpc0hpdE9iamVjdEp1ZGdlbWVudCA9IChoKSA9PiBoLnR5cGUgPT09IFwiSGl0T2JqZWN0SnVkZ2VtZW50XCI7XHJcbmV4cG9ydHMuaXNIaXRPYmplY3RKdWRnZW1lbnQgPSBpc0hpdE9iamVjdEp1ZGdlbWVudDtcclxuLy8gVGhpcyBpcyBvc3Uhc3RhYmxlIHN0eWxlIGFuZCBpcyBhbHNvIG9ubHkgcmVjb21tZW5kZWQgZm9yIG9mZmxpbmUgcHJvY2Vzc2luZy5cclxuLy8gSW4gdGhlIGZ1dHVyZSwgd2hlcmUgc29tZXRoaW5nIGxpa2Ugb25saW5lIHJlcGxheSBzdHJlYW1pbmcgaXMgaW1wbGVtZW50ZWQsIHRoaXMgaW1wbGVtZW50YXRpb24gd2lsbCBvZmMgYmUgdG9vIHNsb3cuXHJcbmZ1bmN0aW9uIHJldHJpZXZlRXZlbnRzKGdhbWVTdGF0ZSwgaGl0T2JqZWN0cykge1xyXG4gICAgdmFyIF9hO1xyXG4gICAgY29uc3QgZXZlbnRzID0gW107XHJcbiAgICBjb25zdCBkaWN0ID0gKDAsIGluZGV4XzEubm9ybWFsaXplSGl0T2JqZWN0cykoaGl0T2JqZWN0cyk7XHJcbiAgICAvLyBIaXRDaXJjbGUganVkZ2VtZW50cyAoU2xpZGVySGVhZHMgaW5jbHVkZWQgYW5kIGluZGljYXRlZClcclxuICAgIGZvciAoY29uc3QgaWQgaW4gZ2FtZVN0YXRlLmhpdENpcmNsZVZlcmRpY3QpIHtcclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGdhbWVTdGF0ZS5oaXRDaXJjbGVWZXJkaWN0W2lkXTtcclxuICAgICAgICBjb25zdCBoaXRDaXJjbGUgPSBkaWN0W2lkXTtcclxuICAgICAgICBjb25zdCBpc1NsaWRlckhlYWQgPSBoaXRDaXJjbGUuc2xpZGVySWQgIT09IHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCB2ZXJkaWN0ID0gc3RhdGUudHlwZTtcclxuICAgICAgICBldmVudHMucHVzaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiSGl0T2JqZWN0SnVkZ2VtZW50XCIsXHJcbiAgICAgICAgICAgIHRpbWU6IHN0YXRlLmp1ZGdlbWVudFRpbWUsXHJcbiAgICAgICAgICAgIGhpdE9iamVjdElkOiBpZCxcclxuICAgICAgICAgICAgcG9zaXRpb246IGhpdENpcmNsZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgdmVyZGljdCxcclxuICAgICAgICAgICAgaXNTbGlkZXJIZWFkLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZm9yIChjb25zdCBpZCBpbiBnYW1lU3RhdGUuc2xpZGVyVmVyZGljdCkge1xyXG4gICAgICAgIGNvbnN0IHZlcmRpY3QgPSBnYW1lU3RhdGUuc2xpZGVyVmVyZGljdFtpZF07XHJcbiAgICAgICAgLy8gU2xpZGVyIGp1ZGdlbWVudCBldmVudHNcclxuICAgICAgICBjb25zdCBzbGlkZXIgPSBkaWN0W2lkXTtcclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHNsaWRlci5lbmRQb3NpdGlvbjtcclxuICAgICAgICBldmVudHMucHVzaCh7IHRpbWU6IHNsaWRlci5lbmRUaW1lLCBoaXRPYmplY3RJZDogaWQsIHBvc2l0aW9uLCB2ZXJkaWN0LCB0eXBlOiBcIkhpdE9iamVjdEp1ZGdlbWVudFwiIH0pO1xyXG4gICAgICAgIC8vIENoZWNrcG9pbnRFdmVudHNcclxuICAgICAgICBmb3IgKGNvbnN0IHBvaW50IG9mIHNsaWRlci5jaGVja1BvaW50cykge1xyXG4gICAgICAgICAgICBjb25zdCBjaGVja1BvaW50U3RhdGUgPSBnYW1lU3RhdGUuY2hlY2tQb2ludFZlcmRpY3RbcG9pbnQuaWRdO1xyXG4gICAgICAgICAgICBjb25zdCBoaXQgPSAoX2EgPSBjaGVja1BvaW50U3RhdGUgPT09IG51bGwgfHwgY2hlY2tQb2ludFN0YXRlID09PSB2b2lkIDAgPyB2b2lkIDAgOiBjaGVja1BvaW50U3RhdGUuaGl0KSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBmYWxzZTtcclxuICAgICAgICAgICAgY29uc3QgaXNMYXN0VGljayA9IHBvaW50LnR5cGUgPT09IFwiTEFTVF9MRUdBQ1lfVElDS1wiO1xyXG4gICAgICAgICAgICBldmVudHMucHVzaCh7IHRpbWU6IHNsaWRlci5lbmRUaW1lLCBwb3NpdGlvbjogcG9pbnQucG9zaXRpb24sIHR5cGU6IFwiQ2hlY2twb2ludEp1ZGdlbWVudFwiLCBoaXQsIGlzTGFzdFRpY2sgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gVE9ETzogU3Bpbm5lciBuZXN0ZWQgdGlja3MgZXZlbnRzXHJcbiAgICByZXR1cm4gZXZlbnRzO1xyXG59XHJcbmV4cG9ydHMucmV0cmlldmVFdmVudHMgPSByZXRyaWV2ZUV2ZW50cztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4gKiBTaG93cyB0aGUgc3RhdGlzdGljc1xyXG4gKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkdhbWVwbGF5SW5mb0V2YWx1YXRvciA9IGV4cG9ydHMuZGVmYXVsdEdhbWVwbGF5SW5mbyA9IGV4cG9ydHMub3N1U3RhYmxlQWNjdXJhY3kgPSB2b2lkIDA7XHJcbmNvbnN0IEhpdENpcmNsZV8xID0gcmVxdWlyZShcIi4uL2hpdG9iamVjdHMvSGl0Q2lyY2xlXCIpO1xyXG5jb25zdCBTbGlkZXJfMSA9IHJlcXVpcmUoXCIuLi9oaXRvYmplY3RzL1NsaWRlclwiKTtcclxuY29uc3QgU2xpZGVyQ2hlY2tQb2ludF8xID0gcmVxdWlyZShcIi4uL2hpdG9iamVjdHMvU2xpZGVyQ2hlY2tQb2ludFwiKTtcclxuZnVuY3Rpb24gdXBkYXRlQ29tYm9JbmZvKGNvbWJvLCB0eXBlLCBoaXQpIHtcclxuICAgIGxldCBjdXJyZW50Q29tYm8gPSBjb21iby5jdXJyZW50Q29tYm87XHJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICBjYXNlIFwiSElUX0NJUkNMRVwiOlxyXG4gICAgICAgIGNhc2UgXCJUSUNLXCI6XHJcbiAgICAgICAgY2FzZSBcIlJFUEVBVFwiOlxyXG4gICAgICAgIGNhc2UgXCJTUElOTkVSXCI6XHJcbiAgICAgICAgICAgIGN1cnJlbnRDb21ibyA9IGhpdCA/IGN1cnJlbnRDb21ibyArIDEgOiAwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFwiTEFTVF9MRUdBQ1lfVElDS1wiOlxyXG4gICAgICAgICAgICAvLyBTbGlkZXIgZW5kcyBkbyBub3QgYnJlYWsgdGhlIGNvbWJvLCBidXQgdGhleSBjYW4gaW5jcmVhc2UgdGhlbVxyXG4gICAgICAgICAgICBjdXJyZW50Q29tYm8gKz0gaGl0ID8gMSA6IDA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgXCJTTElERVJcIjpcclxuICAgICAgICAgICAgLy8gRm9yIHNsaWRlcnMgdGhlcmUgaXMgbm8gY29tYm8gdXBkYXRlXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHsgY3VycmVudENvbWJvLCBtYXhDb21ib1NvRmFyOiBNYXRoLm1heChjb21iby5tYXhDb21ib1NvRmFyLCBjdXJyZW50Q29tYm8pIH07XHJcbn1cclxuLyoqIEFDQyAqKi9cclxuLyoqXHJcbiAqIFJldHVybnMgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIHVzaW5nIG9zdSFzdGFibGUgYWNjdXJhY3kgbG9naWMuXHJcbiAqIEFsc28gcmV0dXJucyB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm8gY291bnRcclxuICpcclxuICogQHBhcmFtIGNvdW50IGNvdW50cyBvZiAzMDAsIDEwMCwgNTAsIDAgKGluIHRoaXMgb3JkZXIpXHJcbiAqL1xyXG5mdW5jdGlvbiBvc3VTdGFibGVBY2N1cmFjeShjb3VudCkge1xyXG4gICAgaWYgKGNvdW50Lmxlbmd0aCAhPT0gNCkge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBjb25zdCBKdWRnZW1lbnRTY29yZXMgPSBbMzAwLCAxMDAsIDUwLCAwXTtcclxuICAgIGxldCBwZXJmZWN0ID0gMCwgYWN0dWFsID0gMDtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBhY3R1YWwgKz0gSnVkZ2VtZW50U2NvcmVzW2ldICogY291bnRbaV07XHJcbiAgICAgICAgcGVyZmVjdCArPSBKdWRnZW1lbnRTY29yZXNbMF0gKiBjb3VudFtpXTtcclxuICAgIH1cclxuICAgIGlmIChwZXJmZWN0ID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHJldHVybiBhY3R1YWwgLyBwZXJmZWN0O1xyXG59XHJcbmV4cG9ydHMub3N1U3RhYmxlQWNjdXJhY3kgPSBvc3VTdGFibGVBY2N1cmFjeTtcclxuLy9odHRwczovL29zdS5wcHkuc2gvd2lraS9lbi9TY29yZS9TY29yZVYxXHJcbmNvbnN0IGRlZmF1bHRFdmFsdWF0aW9uT3B0aW9ucyA9IHtcclxuICAgIHNjb3JpbmdTeXN0ZW06IFwiU2NvcmVWMVwiLFxyXG59O1xyXG5leHBvcnRzLmRlZmF1bHRHYW1lcGxheUluZm8gPSBPYmplY3QuZnJlZXplKHtcclxuICAgIGN1cnJlbnRDb21ibzogMCxcclxuICAgIG1heENvbWJvU29GYXI6IDAsXHJcbiAgICB2ZXJkaWN0Q291bnRzOiBbMCwgMCwgMCwgMF0sXHJcbiAgICBhY2N1cmFjeTogMCxcclxuICAgIHNjb3JlOiAwLFxyXG59KTtcclxuLyoqXHJcbiAqIENhbGN1bGF0aW5nOiBDb3VudCwgQWNjdXJhY3ksIENvbWJvLCBNYXhDb21ib1xyXG4gKiBUaGUgb25lIHdobyBpcyBjYWxsaW5nIHRoaXMgaGFzIHRvIG1ha2Ugc3VyZSB0aGF0IHNsaWRlciBoZWFkcyBhcmUgbm90IGNvbnNpZGVyZWQgaW4gY2FzZSB0aGV5IGFyZSB1c2luZyBvc3Uhc3RhYmxlXHJcbiAqIGNhbGN1bGF0aW9uLlxyXG4gKi9cclxuY2xhc3MgR2FtZXBsYXlJbmZvRXZhbHVhdG9yIHtcclxuICAgIGNvbnN0cnVjdG9yKGJlYXRtYXAsIG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLmJlYXRtYXAgPSBiZWF0bWFwO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdEV2YWx1YXRpb25PcHRpb25zKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5jb21ib0luZm8gPSB7IG1heENvbWJvU29GYXI6IDAsIGN1cnJlbnRDb21ibzogMCB9O1xyXG4gICAgICAgIHRoaXMudmVyZGljdENvdW50ID0geyBNSVNTOiAwLCBNRUg6IDAsIEdSRUFUOiAwLCBPSzogMCB9O1xyXG4gICAgICAgIHRoaXMuanVkZ2VkT2JqZWN0c0luZGV4ID0gMDtcclxuICAgICAgICAvLyBUT0RPOiBEbyBzb21lIGluaXRpYWxpemF0aW9uIGZvciBjYWxjdWxhdGluZyBTY29yZVYyIChsaWtlIG1heCBzY29yZSlcclxuICAgIH1cclxuICAgIGV2YWx1YXRlSGl0T2JqZWN0KGhpdE9iamVjdFR5cGUsIHZlcmRpY3QsIGlzU2xpZGVySGVhZCkge1xyXG4gICAgICAgIHRoaXMuY29tYm9JbmZvID0gdXBkYXRlQ29tYm9JbmZvKHRoaXMuY29tYm9JbmZvLCBoaXRPYmplY3RUeXBlLCB2ZXJkaWN0ICE9PSBcIk1JU1NcIik7XHJcbiAgICAgICAgaWYgKCFpc1NsaWRlckhlYWQpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJkaWN0Q291bnRbdmVyZGljdF0gKz0gMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBldmFsdWF0ZVNsaWRlckNoZWNrcG9pbnQoaGl0T2JqZWN0VHlwZSwgaGl0KSB7XHJcbiAgICAgICAgdGhpcy5jb21ib0luZm8gPSB1cGRhdGVDb21ib0luZm8odGhpcy5jb21ib0luZm8sIGhpdE9iamVjdFR5cGUsIGhpdCk7XHJcbiAgICB9XHJcbiAgICBjb3VudEFzQXJyYXkoKSB7XHJcbiAgICAgICAgcmV0dXJuIFtcIkdSRUFUXCIsIFwiT0tcIiwgXCJNRUhcIiwgXCJNSVNTXCJdLm1hcCgodikgPT4gdGhpcy52ZXJkaWN0Q291bnRbdl0pO1xyXG4gICAgfVxyXG4gICAgZXZhbHVhdGVSZXBsYXlTdGF0ZShyZXBsYXlTdGF0ZSkge1xyXG4gICAgICAgIHZhciBfYTtcclxuICAgICAgICAvLyBBc3N1bWUgc29tZXRoaW5nIGxpa2Ugc2Vla2luZyBiYWNrd2FyZHMgaGFwcGVuZWQgYXQgcmVldmFsdWF0ZVxyXG4gICAgICAgIGlmICh0aGlzLmp1ZGdlZE9iamVjdHNJbmRleCA+PSByZXBsYXlTdGF0ZS5qdWRnZWRPYmplY3RzLmxlbmd0aCArIDEpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21ib0luZm8gPSB7IG1heENvbWJvU29GYXI6IDAsIGN1cnJlbnRDb21ibzogMCB9O1xyXG4gICAgICAgICAgICB0aGlzLnZlcmRpY3RDb3VudCA9IHsgTUlTUzogMCwgTUVIOiAwLCBHUkVBVDogMCwgT0s6IDAgfTtcclxuICAgICAgICAgICAgdGhpcy5qdWRnZWRPYmplY3RzSW5kZXggPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aGlsZSAodGhpcy5qdWRnZWRPYmplY3RzSW5kZXggPCByZXBsYXlTdGF0ZS5qdWRnZWRPYmplY3RzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBpZCA9IHJlcGxheVN0YXRlLmp1ZGdlZE9iamVjdHNbdGhpcy5qdWRnZWRPYmplY3RzSW5kZXgrK107XHJcbiAgICAgICAgICAgIGNvbnN0IGhpdE9iamVjdCA9IHRoaXMuYmVhdG1hcC5nZXRIaXRPYmplY3QoaWQpO1xyXG4gICAgICAgICAgICBpZiAoaGl0T2JqZWN0IGluc3RhbmNlb2YgU2xpZGVyQ2hlY2tQb2ludF8xLlNsaWRlckNoZWNrUG9pbnQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhpdCA9IHJlcGxheVN0YXRlLmNoZWNrUG9pbnRWZXJkaWN0W2hpdE9iamVjdC5pZF0uaGl0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ldmFsdWF0ZVNsaWRlckNoZWNrcG9pbnQoaGl0T2JqZWN0LnR5cGUsIGhpdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoaGl0T2JqZWN0IGluc3RhbmNlb2YgSGl0Q2lyY2xlXzEuSGl0Q2lyY2xlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJkaWN0ID0gcmVwbGF5U3RhdGUuaGl0Q2lyY2xlVmVyZGljdFtpZF0udHlwZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGlzU2xpZGVySGVhZCA9IGhpdE9iamVjdC5zbGlkZXJJZCAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ldmFsdWF0ZUhpdE9iamVjdChoaXRPYmplY3QudHlwZSwgdmVyZGljdCwgaXNTbGlkZXJIZWFkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChoaXRPYmplY3QgaW5zdGFuY2VvZiBTbGlkZXJfMS5TbGlkZXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZlcmRpY3QgPSByZXBsYXlTdGF0ZS5zbGlkZXJWZXJkaWN0W2hpdE9iamVjdC5pZF07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV2YWx1YXRlSGl0T2JqZWN0KGhpdE9iamVjdC50eXBlLCB2ZXJkaWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFNwaW5uZXJcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IFdlIGp1c3QgZ29pbmcgdG8gYXNzdW1lIHRoYXQgdGhleSBoaXQgaXRcclxuICAgICAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVIaXRPYmplY3QoXCJTUElOTkVSXCIsIFwiR1JFQVRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY291bnRzID0gdGhpcy5jb3VudEFzQXJyYXkoKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzY29yZTogMCxcclxuICAgICAgICAgICAgdmVyZGljdENvdW50czogY291bnRzLFxyXG4gICAgICAgICAgICBhY2N1cmFjeTogKF9hID0gb3N1U3RhYmxlQWNjdXJhY3koY291bnRzKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMS4wLFxyXG4gICAgICAgICAgICBjdXJyZW50Q29tYm86IHRoaXMuY29tYm9JbmZvLmN1cnJlbnRDb21ibyxcclxuICAgICAgICAgICAgbWF4Q29tYm9Tb0ZhcjogdGhpcy5jb21ib0luZm8ubWF4Q29tYm9Tb0ZhcixcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuR2FtZXBsYXlJbmZvRXZhbHVhdG9yID0gR2FtZXBsYXlJbmZvRXZhbHVhdG9yO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkhpdENpcmNsZSA9IHZvaWQgMDtcclxuY2xhc3MgSGl0Q2lyY2xlIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaWQgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuaGl0VGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5hcHByb2FjaER1cmF0aW9uID0gMDtcclxuICAgICAgICB0aGlzLmZhZGVJbkR1cmF0aW9uID0gMDtcclxuICAgICAgICB0aGlzLmNvbWJvU2V0SW5kZXggPSAwO1xyXG4gICAgICAgIHRoaXMud2l0aGluQ29tYm9TZXRJbmRleCA9IDA7XHJcbiAgICAgICAgdGhpcy5zY2FsZSA9IDE7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xyXG4gICAgICAgIC8vIE9ubHkgdXNlZCBiZWNhdXNlIHRoZXJlJ3MgYSBidWcgaW4gdGhlIEZsYXNobGlnaHQgZGlmZmljdWx0eSBwcm9jZXNzaW5nXHJcbiAgICAgICAgdGhpcy51bnN0YWNrZWRQb3NpdGlvbiA9IHsgeDogMCwgeTogMCB9O1xyXG4gICAgfVxyXG4gICAgZ2V0IHR5cGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiSElUX0NJUkNMRVwiO1xyXG4gICAgfVxyXG4gICAgZ2V0IHJhZGl1cygpIHtcclxuICAgICAgICByZXR1cm4gSGl0Q2lyY2xlLk9CSkVDVF9SQURJVVMgKiB0aGlzLnNjYWxlO1xyXG4gICAgfVxyXG4gICAgZ2V0IHNwYXduVGltZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oaXRUaW1lIC0gdGhpcy5hcHByb2FjaER1cmF0aW9uO1xyXG4gICAgfVxyXG4gICAgZ2V0IHRpbWVGYWRlSW4oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmFkZUluRHVyYXRpb247XHJcbiAgICB9XHJcbiAgICBvcGFjaXR5QXQodGltZSwgaGlkZGVuKSB7XHJcbiAgICAgICAgaWYgKHRpbWUgPiB0aGlzLmhpdFRpbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDAuMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGZhZGVJblN0YXJ0VGltZSA9IHRoaXMuc3Bhd25UaW1lO1xyXG4gICAgICAgIGxldCBmYWRlSW5EdXJhdGlvbiA9IHRoaXMudGltZUZhZGVJbjtcclxuICAgICAgICBpZiAoaGlkZGVuKSB7XHJcbiAgICAgICAgICAgIGxldCBmYWRlT3V0U3RhcnRUaW1lID0gZmFkZUluU3RhcnRUaW1lICsgZmFkZUluRHVyYXRpb247XHJcbiAgICAgICAgICAgIGxldCBmYWRlT3V0RHVyYXRpb24gPSB0aGlzLmFwcHJvYWNoRHVyYXRpb24gKiAwLjM7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1pbihNYXRoLm1heCgodGltZSAtIGZhZGVJblN0YXJ0VGltZSkgLyBmYWRlSW5EdXJhdGlvbiwgMCksIDEpLCAxLjAgLSBNYXRoLm1pbihNYXRoLm1heCgodGltZSAtIGZhZGVPdXRTdGFydFRpbWUpIC8gZmFkZU91dER1cmF0aW9uLCAwKSwgMSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgoKHRpbWUgLSBmYWRlSW5TdGFydFRpbWUpIC8gZmFkZUluRHVyYXRpb24sIDApLCAxKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkhpdENpcmNsZSA9IEhpdENpcmNsZTtcclxuSGl0Q2lyY2xlLk9CSkVDVF9SQURJVVMgPSA2NDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5TbGlkZXIgPSB2b2lkIDA7XHJcbmNvbnN0IFNsaWRlclBhdGhfMSA9IHJlcXVpcmUoXCIuL3NsaWRlci9TbGlkZXJQYXRoXCIpO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uL21hdGgvaW5kZXhcIik7XHJcbmNsYXNzIFNsaWRlciB7XHJcbiAgICBjb25zdHJ1Y3RvcihoaXRDaXJjbGUpIHtcclxuICAgICAgICB0aGlzLmlkID0gXCJcIjtcclxuICAgICAgICB0aGlzLnBhdGggPSBuZXcgU2xpZGVyUGF0aF8xLlNsaWRlclBhdGgoW10pO1xyXG4gICAgICAgIHRoaXMuY2hlY2tQb2ludHMgPSBbXTtcclxuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gMTtcclxuICAgICAgICB0aGlzLnRpY2tEaXN0YW5jZSA9IDA7XHJcbiAgICAgICAgdGhpcy50aWNrRGlzdGFuY2VNdWx0aXBsaWVyID0gMTtcclxuICAgICAgICB0aGlzLnJlcGVhdENvdW50ID0gMDtcclxuICAgICAgICB0aGlzLmhlYWQgPSBoaXRDaXJjbGU7XHJcbiAgICB9XHJcbiAgICBnZXQgdHlwZSgpIHtcclxuICAgICAgICByZXR1cm4gXCJTTElERVJcIjtcclxuICAgIH1cclxuICAgIGdldCBzcGF3blRpbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGVhZC5zcGF3blRpbWU7XHJcbiAgICB9XHJcbiAgICAvLyBOdW1iZXIgb2YgdGltZXMgdGhlIHNsaWRlciBzcGFucyBvdmVyIHRoZSBzY3JlZW4uXHJcbiAgICBnZXQgc3BhbkNvdW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlcGVhdENvdW50ICsgMTtcclxuICAgIH1cclxuICAgIGdldCBzY2FsZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oZWFkLnNjYWxlO1xyXG4gICAgfVxyXG4gICAgZ2V0IHJhZGl1cygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5oZWFkLnJhZGl1cztcclxuICAgIH1cclxuICAgIGdldCBzcGFuRHVyYXRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZHVyYXRpb24gLyB0aGlzLnNwYW5Db3VudDtcclxuICAgIH1cclxuICAgIGdldCBkdXJhdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbmRUaW1lIC0gdGhpcy5zdGFydFRpbWU7XHJcbiAgICB9XHJcbiAgICBnZXQgc3RhcnRUaW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmhlYWQuaGl0VGltZTtcclxuICAgIH1cclxuICAgIGdldCBlbmRUaW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXJ0VGltZSArICh0aGlzLnNwYW5Db3VudCAqIHRoaXMucGF0aC5kaXN0YW5jZSkgLyB0aGlzLnZlbG9jaXR5O1xyXG4gICAgfVxyXG4gICAgZ2V0IHN0YXJ0UG9zaXRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaGVhZC5wb3NpdGlvbjtcclxuICAgIH1cclxuICAgIGdldCBlbmRQb3NpdGlvbigpIHtcclxuICAgICAgICAvLyBUT0RPOiBDYWNoaW5nIGxpa2UgaW4gb3N1IWxhemVyIHNpbmNlIHRoaXMgdGFrZXMgYSBsb3Qgb2YgdGltZVxyXG4gICAgICAgIHJldHVybiBpbmRleF8xLlZlYzIuYWRkKHRoaXMuaGVhZC5wb3NpdGlvbiwgdGhpcy5iYWxsT2Zmc2V0QXQoMS4wKSk7XHJcbiAgICB9XHJcbiAgICBnZXQgdW5zdGFja2VkRW5kUG9zaXRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4XzEuVmVjMi5hZGQodGhpcy5oZWFkLnVuc3RhY2tlZFBvc2l0aW9uLCB0aGlzLmJhbGxPZmZzZXRBdCgxLjApKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgYWJzb2x1dGUgcG9zaXRpb24gb2YgdGhlIGJhbGwgZ2l2ZW4gdGhlIHByb2dyZXNzIHAsIHdoZXJlIHAgaXMgdGhlIHBlcmNlbnRhZ2Ugb2YgdGltZSBwYXNzZWRcclxuICAgICAqIGJldHdlZW4gc3RhcnRUaW1lIGFuZCBlbmRUaW1lLlxyXG4gICAgICogQHBhcmFtIHByb2dyZXNzXHJcbiAgICAgKi9cclxuICAgIGJhbGxQb3NpdGlvbkF0KHByb2dyZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4XzEuVmVjMi5hZGQodGhpcy5oZWFkLnBvc2l0aW9uLCB0aGlzLmJhbGxPZmZzZXRBdChwcm9ncmVzcykpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBwb3NpdGlvbiBnaXZlbiB0aGUgKHRpbWUpIHByb2dyZXNzLiBCYXNpY2FsbHkgaXQganVzdCB0ZWxscyB5b3Ugd2hlcmUgdGhlIHNsaWRlciBiYWxsIHNob3VsZCBiZSBhZnRlclxyXG4gICAgICogcCUgb2YgdGltZSBoYXMgcGFzc2VkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwcm9ncmVzcyBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIGRldGVybWluaW5nIHRoZSB0aW1lIHByb2dyZXNzXHJcbiAgICAgKi9cclxuICAgIGJhbGxPZmZzZXRBdChwcm9ncmVzcykge1xyXG4gICAgICAgIGNvbnN0IHNwYW5Qcm9ncmVzcyA9IHByb2dyZXNzICogdGhpcy5zcGFuQ291bnQ7XHJcbiAgICAgICAgbGV0IHByb2dyZXNzSW5TcGFuID0gc3BhblByb2dyZXNzICUgMS4wO1xyXG4gICAgICAgIC8vIFdoZW4gaXQncyBcInJldHVybmluZ1wiIHdlIHNob3VsZCBjb25zaWRlciB0aGUgcHJvZ3Jlc3MgaW4gYW4gaW52ZXJ0ZWQgd2F5LlxyXG4gICAgICAgIGlmIChNYXRoLmZsb29yKHNwYW5Qcm9ncmVzcykgJSAyID09PSAxKSB7XHJcbiAgICAgICAgICAgIHByb2dyZXNzSW5TcGFuID0gMS4wIC0gcHJvZ3Jlc3NJblNwYW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnBhdGgucG9zaXRpb25BdChwcm9ncmVzc0luU3Bhbik7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5TbGlkZXIgPSBTbGlkZXI7XHJcbi8vIHNjb3JpbmcgZGlzdGFuY2Ugd2l0aCBhIHNwZWVkLWFkanVzdGVkIGJlYXQgbGVuZ3RoIG9mIDEgc2Vjb25kIChpLmUuIHRoZSBzcGVlZCBzbGlkZXIgYmFsbHNcclxuLy8gbW92ZSB0aHJvdWdoIHRoZWlyIHRyYWNrKS5cclxuU2xpZGVyLkJBU0VfU0NPUklOR19ESVNUQU5DRSA9IDEwMDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5TbGlkZXJDaGVja1BvaW50ID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uL21hdGgvaW5kZXhcIik7XHJcbi8vIEltcG9ydGFudCBwb2ludHMgb24gdGhlIHNsaWRlci4gRGVwZW5kaW5nIG9uIGlmIHRoZXkgd2VyZSBcImhpdFwiIG9yIG5vdCwgd2Ugd2lsbCBoYXZlIGEgZGlmZmVyZW50IGp1ZGdlbWVudCBvbiB0aGVcclxuLy8gc2xpZGVyLlxyXG5jbGFzcyBTbGlkZXJDaGVja1BvaW50IHtcclxuICAgIGNvbnN0cnVjdG9yKHNsaWRlcikge1xyXG4gICAgICAgIHRoaXMuc2xpZGVyID0gc2xpZGVyO1xyXG4gICAgICAgIHRoaXMuaWQgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFwiVElDS1wiO1xyXG4gICAgICAgIHRoaXMuc3BhbkluZGV4ID0gMDtcclxuICAgICAgICAvLyBUaGUgYHNwYW5Qcm9ncmVzc2AgaXMgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIHRoYXQgZGV0ZXJtaW5lcyB0aGUgcG9zaXRpb24gb24gdGhlIHNsaWRlciBwYXRoLlxyXG4gICAgICAgIHRoaXMuc3BhblByb2dyZXNzID0gMDtcclxuICAgICAgICB0aGlzLnNwYW5TdGFydFRpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0ID0geyB4OiAwLCB5OiAwIH07XHJcbiAgICAgICAgdGhpcy5oaXRUaW1lID0gMDtcclxuICAgIH1cclxuICAgIGdldCBwb3NpdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gaW5kZXhfMS5WZWMyLmFkZCh0aGlzLnNsaWRlci5zdGFydFBvc2l0aW9uLCB0aGlzLm9mZnNldCk7XHJcbiAgICB9XHJcbiAgICBnZXQgc2NhbGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2xpZGVyLnNjYWxlO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuU2xpZGVyQ2hlY2tQb2ludCA9IFNsaWRlckNoZWNrUG9pbnQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuU3Bpbm5lciA9IHZvaWQgMDtcclxuLyoqXHJcbiAqIExvZ2ljOlxyXG4gKlxyXG4gKiAqIEFzc3VtcHRpb24gaXMgdGhhdCB0aGUgdXNlciBjYW4ndCBzcGluIG1vcmUgdGhhbiA4IHRpbWVzIHBlciBzZWNvbmQgYG1heF9yb3RhdGlvbnNfcGVyX3NlY29uZD04YC5cclxuICogKiBcIk1heFNwaW5zUG9zc2libGVcIiBcIk1pblNwaW5zTmVlZGVkXCJcclxuICpcclxuICpcclxuICogVGhlbiB0aGVyZSBhcmUgbGlrZSBcIk1heFNwaW5zUG9zc2libGVcIiBzcGlubmVyIHRpY2tzIGdlbmVyYXRlZCAoPz8/KSB3aGljaCBoYXZlIGEgc3RhcnQgdGltZSBvZiBbMCwgZCwgMmQsIC4uLixcclxuICogbWF4U3BpbnNQb3NzaWJsZSAqIGRdIHdoZXJlIGQgaXMgdGhlIGR1cmF0aW9uIG9mIG9uZSBzcGluLlxyXG4gKlxyXG4gKiAxMDAlIG1pbiBzcGlubmVkIC0+IEdSRUFUXHJcbiAqID4gOTAlLT4gT0tcclxuICogPiA3NSUgLT4gTUVIXHJcbiAqIG90aGVyd2lzZSBtaXNzXHJcbiAqIHJlcXVpcmVzIGdhbWVDbG9jayBwbGF5UmF0ZVxyXG4gKlxyXG4gKlxyXG4gKiAgICAgICAgICAgICAgICAgaWYgKEhpdE9iamVjdC5TcGluc1JlcXVpcmVkID09IDApXHJcbiAvLyBzb21lIHNwaW5uZXJzIGFyZSBzbyBzaG9ydCB0aGV5IGNhbid0IHJlcXVpcmUgYW4gaW50ZWdlciBzcGluIGNvdW50LlxyXG4gLy8gdGhlc2UgYmVjb21lIGltcGxpY2l0bHkgaGl0LlxyXG4gcmV0dXJuIDE7XHJcbiAqIFNQTSBjb3VudCBpcyBjYWxjdWxhdGVkIGFzIGZvbGxvd3M6XHJcbiAqXHJcbiAqIEZpcnN0IGRlZmluZSBhIHRpbWUgd2luZG93IHNwbV9jb3VudF9kdXJhdGlvbiA9IDU5NW1zIGZvciBleGFtcGxlIHRoZW4gZmluZCBvdXQgaG93IG11Y2ggeW91IGhhdmUgc3Bpbm5lZCBhdCB0XHJcbiAqIGNvbXBhcmVkIHRvIHQgLSBzcG1fY291bnRfZHVyYXRpb24uXHJcbiAqXHJcbiAqIFRoaXMgaXMgZG9uZSBieSBrZWVwaW5nIHRyYWNrIHdpdGggYSBxdWV1ZSBvZiAodCwgdG90YWxfcm90YXRpb24pIGJ5IG1vc3QgcGVvcGxlXHJcbiAqXHJcbiAqL1xyXG4vLyBTb3VyY2VzOiBodHRwczovL2dpdGh1Yi5jb20vaXRkZWxhdHJpc3Uvb3BzdS9ibG9iL21hc3Rlci9zcmMvaXRkZWxhdHJpc3Uvb3BzdS9vYmplY3RzL1NwaW5uZXIuamF2YVxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vTWNLYXk0Mi9NY09zdS9ibG9iL21hc3Rlci9zcmMvQXBwL09zdS9Pc3VTcGlubmVyLmNwcFxyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcHB5L29zdS9ibG9iL21hc3Rlci9vc3UuR2FtZS5SdWxlc2V0cy5Pc3UvT2JqZWN0cy9EcmF3YWJsZXMvRHJhd2FibGVTcGlubmVyLmNzXHJcbmZ1bmN0aW9uIGRpZmZSYW5nZShkaWZmaWN1bHR5LCBtaW4sIG1pZCwgbWF4KSB7XHJcbiAgICBpZiAoZGlmZmljdWx0eSA+IDUpXHJcbiAgICAgICAgcmV0dXJuIG1pZCArICgobWF4IC0gbWlkKSAqIChkaWZmaWN1bHR5IC0gNSkpIC8gNTtcclxuICAgIGlmIChkaWZmaWN1bHR5IDwgNSlcclxuICAgICAgICByZXR1cm4gbWlkIC0gKChtaWQgLSBtaW4pICogKDUgLSBkaWZmaWN1bHR5KSkgLyA1O1xyXG4gICAgcmV0dXJuIG1pZDtcclxufVxyXG5jbGFzcyBTcGlubmVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuaWQgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcclxuICAgICAgICB0aGlzLmR1cmF0aW9uID0gMDtcclxuICAgICAgICB0aGlzLnNwaW5zUmVxdWlyZWQgPSAxO1xyXG4gICAgICAgIHRoaXMubWF4aW11bUJvbnVzU3BpbnMgPSAxO1xyXG4gICAgfVxyXG4gICAgLy8gVGhlIHNwaW5uZXIgaXMgdmlzaWJsZSB3YXkgZWFybGllciwgYnV0IGNhbiBvbmx5IGJlIGludGVyYWN0ZWQgd2l0aCBhdCBbc3RhcnRUaW1lLCBlbmRUaW1lXVxyXG4gICAgZ2V0IHNwYXduVGltZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGFydFRpbWU7XHJcbiAgICB9XHJcbiAgICBnZXQgZW5kVGltZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdGFydFRpbWUgKyB0aGlzLmR1cmF0aW9uO1xyXG4gICAgfVxyXG4gICAgZ2V0IHR5cGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiU1BJTk5FUlwiO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuU3Bpbm5lciA9IFNwaW5uZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuaXNTcGlubmVyID0gZXhwb3J0cy5pc1NsaWRlciA9IGV4cG9ydHMuaXNIaXRDaXJjbGUgPSB2b2lkIDA7XHJcbmNvbnN0IGlzSGl0Q2lyY2xlID0gKG8pID0+IG8udHlwZSA9PT0gXCJISVRfQ0lSQ0xFXCI7XHJcbmV4cG9ydHMuaXNIaXRDaXJjbGUgPSBpc0hpdENpcmNsZTtcclxuY29uc3QgaXNTbGlkZXIgPSAobykgPT4gby50eXBlID09PSBcIlNMSURFUlwiO1xyXG5leHBvcnRzLmlzU2xpZGVyID0gaXNTbGlkZXI7XHJcbmNvbnN0IGlzU3Bpbm5lciA9IChvKSA9PiBvLnR5cGUgPT09IFwiU1BJTk5FUlwiO1xyXG5leHBvcnRzLmlzU3Bpbm5lciA9IGlzU3Bpbm5lcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5QYXRoQXBwcm94aW1hdG9yID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL21hdGgvaW5kZXhcIik7XHJcbi8vIFRPRE86IE1vdmUgdG8gb3N1LW1hdGhcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3BweS9vc3UtZnJhbWV3b3JrL2Jsb2IvZjlkNDRiMTQxNGUzMGFkNTA3ODk0ZWY3ZWFhZjVkMWIwMTE4YmU4Mi9vc3UuRnJhbWV3b3JrL1V0aWxzL1BhdGhBcHByb3hpbWF0b3IuY3NcclxuY29uc3QgYmV6aWVyVG9sZXJhbmNlID0gTWF0aC5mcm91bmQoMC4yNSk7XHJcbmNvbnN0IGNpcmN1bGFyQXJjVG9sZXJhbmNlID0gTWF0aC5mcm91bmQoMC4xKTtcclxuLy8gVGhlIGFtb3VudCBvZiBwaWVjZXMgdG8gY2FsY3VsYXRlIGZvciBlYWNoIGNvbnRyb2wgcG9pbnQgcXVhZHJ1cGxldC5cclxuY29uc3QgY2F0bXVsbERldGFpbCA9IDUwO1xyXG5jb25zdCB0b0Zsb2F0ID0gKHgpID0+IE1hdGguZnJvdW5kKHgpO1xyXG4vKipcclxuICogSGVscGVyIG1ldGhvZHMgdG8gYXBwcm94aW1hdGUgYSBwYXRoIGJ5IGludGVycG9sYXRpbmcgYSBzZXF1ZW5jZSBvZiBjb250cm9sIHBvaW50cy5cclxuICovXHJcbmNsYXNzIFBhdGhBcHByb3hpbWF0b3Ige1xyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgcGllY2V3aXNlLWxpbmVhciBhcHByb3hpbWF0aW9uIG9mIGEgYmV6aWVyIGN1cnZlLCBieSBhZGFwdGl2ZWx5IHJlcGVhdGVkbHkgc3ViZGl2aWRpbmdcclxuICAgICAqIHRoZSBjb250cm9sIHBvaW50cyB1bnRpbCB0aGVpciBhcHByb3hpbWF0aW9uIGVycm9yIHZhbmlzaGVzIGJlbG93IGEgZ2l2ZW4gdGhyZXNob2xkLlxyXG4gICAgICogQHJldHVybnMgQSBsaXN0IG9mIHZlY3RvcnMgcmVwcmVzZW50aW5nIHRoZSBwaWVjZXdpc2UtbGluZWFyIGFwcHJveGltYXRpb24uXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhcHByb3hpbWF0ZUJlemllcihjb250cm9sUG9pbnRzLCBwID0gMCkge1xyXG4gICAgICAgIHZhciBfYTtcclxuICAgICAgICBjb25zdCBvdXRwdXQgPSBbXTtcclxuICAgICAgICBjb25zdCBuID0gY29udHJvbFBvaW50cy5sZW5ndGggLSAxO1xyXG4gICAgICAgIGlmIChuIDwgMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBCb3RoIFN0YWNrczw+XHJcbiAgICAgICAgY29uc3QgdG9GbGF0dGVuID0gW107XHJcbiAgICAgICAgY29uc3QgZnJlZUJ1ZmZlcnMgPSBbXTtcclxuICAgICAgICAvLyBDcmVhdGVzIGEgY29weSBvZiBjb250cm9sUG9pbnRzXHJcbiAgICAgICAgY29uc3QgcG9pbnRzID0gWy4uLmNvbnRyb2xQb2ludHNdO1xyXG4gICAgICAgIGlmIChwID4gMCAmJiBwIDwgbikge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG4gLSBwOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN1YkJlemllciA9IG5ldyBBcnJheShwICsgMSk7XHJcbiAgICAgICAgICAgICAgICBzdWJCZXppZXJbMF0gPSBwb2ludHNbaV07XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHAgLSAxOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzdWJCZXppZXJbaiArIDFdID0gcG9pbnRzW2kgKyAxXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMTsgayA8IHAgLSBqOyBrKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbCA9IE1hdGgubWluKGssIG4gLSBwIC0gaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50c1tpICsga10gPSBwb2ludHNbaSArIGtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2NhbGUobClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQocG9pbnRzW2kgKyBrICsgMV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2NhbGUoMSAvIChsICsgMSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN1YkJlemllcltwXSA9IHBvaW50c1tpICsgMV07XHJcbiAgICAgICAgICAgICAgICB0b0ZsYXR0ZW4ucHVzaChzdWJCZXppZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFRPRE86IElzIHRoaXMgc2FtZSBhcyAgcG9pbnRzWyhuLXApLi5dKSBhcyBpbiBDIyA/XHJcbiAgICAgICAgICAgIHRvRmxhdHRlbi5wdXNoKHBvaW50cy5zbGljZShuIC0gcCwgcG9pbnRzLmxlbmd0aCkpO1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBJcyB0aGlzIGFzIGluIHRoZSBvc3UhbGF6ZXIgY29kZT9cclxuICAgICAgICAgICAgLy8gUmV2ZXJzZSB0aGUgc3RhY2sgc28gZWxlbWVudHMgY2FuIGJlIGFjY2Vzc2VkIGluIG9yZGVyXHJcbiAgICAgICAgICAgIHRvRmxhdHRlbi5yZXZlcnNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBCLXNwbGluZSBzdWJkaXZpc2lvbnMgdW5uZWNlc3NhcnksIGRlZ2VuZXJhdGUgdG8gc2luZ2xlIGJlemllclxyXG4gICAgICAgICAgICBwID0gbjtcclxuICAgICAgICAgICAgdG9GbGF0dGVuLnB1c2gocG9pbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc3ViZGl2aXNpb25CdWZmZXIxID0gbmV3IEFycmF5KHAgKyAxKTtcclxuICAgICAgICBjb25zdCBzdWJkaXZpc2lvbkJ1ZmZlcjIgPSBuZXcgQXJyYXkocCAqIDIgKyAxKTtcclxuICAgICAgICBjb25zdCBsZWZ0Q2hpbGQgPSBzdWJkaXZpc2lvbkJ1ZmZlcjI7XHJcbiAgICAgICAgLy8gbGV0IGxlZnRDaGlsZCA9IHN1YmRpdmlzaW9uQnVmZmVyMjtcclxuICAgICAgICB3aGlsZSAodG9GbGF0dGVuLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgLy8gQ2FuJ3QgYmUgdW5kZWZpbmVkIGR1ZGVcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gdG9GbGF0dGVuLnBvcCgpO1xyXG4gICAgICAgICAgICBpZiAoUGF0aEFwcHJveGltYXRvci5fYmV6aWVySXNGbGF0RW5vdWdoKHBhcmVudCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjb250cm9sIHBvaW50cyB3ZSBjdXJyZW50bHkgb3BlcmF0ZSBvbiBhcmUgc3VmZmljaWVudGx5IFwiZmxhdFwiLCB3ZSB1c2VcclxuICAgICAgICAgICAgICAgIC8vIGFuIGV4dGVuc2lvbiB0byBEZSBDYXN0ZWxqYXUncyBhbGdvcml0aG0gdG8gb2J0YWluIGEgcGllY2V3aXNlLWxpbmVhciBhcHByb3hpbWF0aW9uXHJcbiAgICAgICAgICAgICAgICAvLyBvZiB0aGUgYmV6aWVyIGN1cnZlIHJlcHJlc2VudGVkIGJ5IG91ciBjb250cm9sIHBvaW50cywgY29uc2lzdGluZyBvZiB0aGUgc2FtZSBhbW91bnRcclxuICAgICAgICAgICAgICAgIC8vIG9mIHBvaW50cyBhcyB0aGVyZSBhcmUgY29udHJvbCBwb2ludHMuXHJcbiAgICAgICAgICAgICAgICBQYXRoQXBwcm94aW1hdG9yLl9iZXppZXJBcHByb3hpbWF0ZShwYXJlbnQsIG91dHB1dCwgc3ViZGl2aXNpb25CdWZmZXIxLCBzdWJkaXZpc2lvbkJ1ZmZlcjIsIHAgKyAxKTtcclxuICAgICAgICAgICAgICAgIGZyZWVCdWZmZXJzLnB1c2gocGFyZW50KTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIElmIHdlIGRvIG5vdCB5ZXQgaGF2ZSBhIHN1ZmZpY2llbnRseSBcImZsYXRcIiAoaW4gb3RoZXIgd29yZHMsIGRldGFpbGVkKSBhcHByb3hpbWF0aW9uIHdlIGtlZXBcclxuICAgICAgICAgICAgLy8gc3ViZGl2aWRpbmcgdGhlIGN1cnZlIHdlIGFyZSBjdXJyZW50bHkgb3BlcmF0aW5nIG9uLlxyXG4gICAgICAgICAgICBjb25zdCByaWdodENoaWxkID0gKF9hID0gZnJlZUJ1ZmZlcnMucG9wKCkpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IG5ldyBBcnJheShwICsgMSk7XHJcbiAgICAgICAgICAgIFBhdGhBcHByb3hpbWF0b3IuX2JlemllclN1YmRpdmlkZShwYXJlbnQsIGxlZnRDaGlsZCwgcmlnaHRDaGlsZCwgc3ViZGl2aXNpb25CdWZmZXIxLCBwICsgMSk7XHJcbiAgICAgICAgICAgIC8vIFdlIHJlLXVzZSB0aGUgYnVmZmVyIG9mIHRoZSBwYXJlbnQgZm9yIG9uZSBvZiB0aGUgY2hpbGRyZW4sIHNvIHRoYXQgd2Ugc2F2ZSBvbmUgYWxsb2NhdGlvbiBwZXIgaXRlcmF0aW9uLlxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHAgKyAxOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudFtpXSA9IGxlZnRDaGlsZFtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0b0ZsYXR0ZW4ucHVzaChyaWdodENoaWxkKTtcclxuICAgICAgICAgICAgdG9GbGF0dGVuLnB1c2gocGFyZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3V0cHV0LnB1c2goY29udHJvbFBvaW50c1tuXSk7XHJcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIHBpZWNld2lzZS1saW5lYXIgYXBwcm94aW1hdGlvbiBvZiBhIENhdG11bGwtUm9tIHNwbGluZS5cclxuICAgICAqIEByZXR1cm5zIEEgbGlzdCBvZiB2ZWN0b3JzIHJlcHJlc2VudGluZyB0aGUgcGllY2V3aXNlLWxpbmVhciBhcHByb3hpbWF0aW9uLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXBwcm94aW1hdGVDYXRtdWxsKGNvbnRyb2xQb2ludHMpIHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcclxuICAgICAgICBjb25zdCBjb250cm9sUG9pbnRzTGVuZ3RoID0gY29udHJvbFBvaW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250cm9sUG9pbnRzTGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHYxID0gaSA+IDAgPyBjb250cm9sUG9pbnRzW2kgLSAxXSA6IGNvbnRyb2xQb2ludHNbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IHYyID0gY29udHJvbFBvaW50c1tpXTtcclxuICAgICAgICAgICAgY29uc3QgdjMgPSBpIDwgY29udHJvbFBvaW50c0xlbmd0aCAtIDEgPyBjb250cm9sUG9pbnRzW2kgKyAxXSA6IHYyLmFkZCh2Mikuc3ViKHYxKTtcclxuICAgICAgICAgICAgY29uc3QgdjQgPSBpIDwgY29udHJvbFBvaW50c0xlbmd0aCAtIDIgPyBjb250cm9sUG9pbnRzW2kgKyAyXSA6IHYzLmFkZCh2Mykuc3ViKHYyKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgYyA9IDA7IGMgPCBjYXRtdWxsRGV0YWlsOyBjKyspIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKFBhdGhBcHByb3hpbWF0b3IuX2NhdG11bGxGaW5kUG9pbnQodjEsIHYyLCB2MywgdjQsIE1hdGguZnJvdW5kKGMgLyBjYXRtdWxsRGV0YWlsKSkpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goUGF0aEFwcHJveGltYXRvci5fY2F0bXVsbEZpbmRQb2ludCh2MSwgdjIsIHYzLCB2NCwgTWF0aC5mcm91bmQoKGMgKyAxKSAvIGNhdG11bGxEZXRhaWwpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIC8vIFRPRE86IFVzZSBNYXRoLmZyb3VuZCBtYXliZVxyXG4gICAgc3RhdGljIGNpcmN1bGFyQXJjUHJvcGVydGllcyhjb250cm9sUG9pbnRzKSB7XHJcbiAgICAgICAgY29uc3QgYSA9IGNvbnRyb2xQb2ludHNbMF07XHJcbiAgICAgICAgY29uc3QgYiA9IGNvbnRyb2xQb2ludHNbMV07XHJcbiAgICAgICAgY29uc3QgYyA9IGNvbnRyb2xQb2ludHNbMl07XHJcbiAgICAgICAgaWYgKCgwLCBpbmRleF8xLmZsb2F0RXF1YWwpKDAsICgwLCBpbmRleF8xLmZsb2F0MzIpKCgwLCBpbmRleF8xLmZsb2F0MzJfbXVsKShiLnkgLSBhLnksIGMueCAtIGEueCkgLSAoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoYi54IC0gYS54LCBjLnkgLSBhLnkpKSkpXHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7IC8vID0gaW52YWxpZFxyXG4gICAgICAgIGNvbnN0IGQgPSAoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoMiwgKDAsIGluZGV4XzEuZmxvYXQzMl9hZGQpKCgwLCBpbmRleF8xLmZsb2F0MzJfYWRkKSgoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoYS54LCBiLnN1YihjKS55KSwgKDAsIGluZGV4XzEuZmxvYXQzMl9tdWwpKGIueCwgYy5zdWIoYSkueSkpLCAoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoYy54LCBhLnN1YihiKS55KSkpO1xyXG4gICAgICAgIGNvbnN0IGFTcSA9IHRvRmxvYXQoYS5sZW5ndGhTcXVhcmVkKCkpO1xyXG4gICAgICAgIGNvbnN0IGJTcSA9IHRvRmxvYXQoYi5sZW5ndGhTcXVhcmVkKCkpO1xyXG4gICAgICAgIGNvbnN0IGNTcSA9IHRvRmxvYXQoYy5sZW5ndGhTcXVhcmVkKCkpO1xyXG4gICAgICAgIC8vIE5vdCByZWFsbHkgZXhhY3RcclxuICAgICAgICBjb25zdCBjZW50ZXJYID0gdG9GbG9hdCgoMCwgaW5kZXhfMS5mbG9hdDMyX2FkZCkoKDAsIGluZGV4XzEuZmxvYXQzMl9hZGQpKCgwLCBpbmRleF8xLmZsb2F0MzJfbXVsKShhU3EsIGIuc3ViKGMpLnkpLCAoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoYlNxLCBjLnN1YihhKS55KSksICgwLCBpbmRleF8xLmZsb2F0MzJfbXVsKShjU3EsIGEuc3ViKGIpLnkpKSk7XHJcbiAgICAgICAgY29uc3QgY2VudGVyWSA9IHRvRmxvYXQoKDAsIGluZGV4XzEuZmxvYXQzMl9hZGQpKCgwLCBpbmRleF8xLmZsb2F0MzJfYWRkKSgoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoYVNxLCBjLnN1YihiKS54KSwgKDAsIGluZGV4XzEuZmxvYXQzMl9tdWwpKGJTcSwgYS5zdWIoYykueCkpLCAoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoY1NxLCBiLnN1YihhKS54KSkpO1xyXG4gICAgICAgIGNvbnN0IGNlbnRlciA9IG5ldyBpbmRleF8xLlZlYzIoY2VudGVyWCwgY2VudGVyWSkuZGl2aWRlKGQpO1xyXG4gICAgICAgIGNvbnN0IGRBID0gYS5zdWIoY2VudGVyKTtcclxuICAgICAgICBjb25zdCBkQyA9IGMuc3ViKGNlbnRlcik7XHJcbiAgICAgICAgLy8gQWxzbyBub3QgZXhhY3RcclxuICAgICAgICBjb25zdCByID0gdG9GbG9hdChkQS5sZW5ndGgoKSk7XHJcbiAgICAgICAgY29uc3QgdGhldGFTdGFydCA9IE1hdGguYXRhbjIoZEEueSwgZEEueCk7XHJcbiAgICAgICAgbGV0IHRoZXRhRW5kID0gTWF0aC5hdGFuMihkQy55LCBkQy54KTtcclxuICAgICAgICB3aGlsZSAodGhldGFFbmQgPCB0aGV0YVN0YXJ0KVxyXG4gICAgICAgICAgICB0aGV0YUVuZCArPSAyICogTWF0aC5QSTtcclxuICAgICAgICBsZXQgZGlyID0gMTtcclxuICAgICAgICBsZXQgdGhldGFSYW5nZSA9IHRoZXRhRW5kIC0gdGhldGFTdGFydDtcclxuICAgICAgICBsZXQgb3J0aG9BdG9DID0gYy5zdWIoYSk7XHJcbiAgICAgICAgb3J0aG9BdG9DID0gbmV3IGluZGV4XzEuVmVjMihvcnRob0F0b0MueSwgLW9ydGhvQXRvQy54KTtcclxuICAgICAgICBpZiAoaW5kZXhfMS5WZWMyLmRvdChvcnRob0F0b0MsIGIuc3ViKGEpKSA8IDApIHtcclxuICAgICAgICAgICAgZGlyID0gLWRpcjtcclxuICAgICAgICAgICAgdGhldGFSYW5nZSA9IDIgKiBNYXRoLlBJIC0gdGhldGFSYW5nZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgdGhldGFTdGFydCwgdGhldGFSYW5nZSwgZGlyZWN0aW9uOiBkaXIsIHJhZGl1czogciwgY2VudGVyIH07XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYSBwaWVjZXdpc2UtbGluZWFyIGFwcHJveGltYXRpb24gb2YgYSBjaXJjdWxhciBhcmMgY3VydmUuXHJcbiAgICAgKiBAcmV0dXJucyBBIGxpc3Qgb2YgdmVjdG9ycyByZXByZXNlbnRpbmcgdGhlIHBpZWNld2lzZS1saW5lYXIgYXBwcm94aW1hdGlvbi5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFwcHJveGltYXRlQ2lyY3VsYXJBcmMoY29udHJvbFBvaW50cykge1xyXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBQYXRoQXBwcm94aW1hdG9yLmNpcmN1bGFyQXJjUHJvcGVydGllcyhjb250cm9sUG9pbnRzKTtcclxuICAgICAgICBpZiAoIXByb3BlcnRpZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFBhdGhBcHByb3hpbWF0b3IuYXBwcm94aW1hdGVCZXppZXIoY29udHJvbFBvaW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHsgcmFkaXVzLCBjZW50ZXIsIHRoZXRhUmFuZ2UsIHRoZXRhU3RhcnQsIGRpcmVjdGlvbiB9ID0gcHJvcGVydGllcztcclxuICAgICAgICBjb25zdCBhbW91bnRQb2ludHMgPSAyICogcmFkaXVzIDw9IGNpcmN1bGFyQXJjVG9sZXJhbmNlXHJcbiAgICAgICAgICAgID8gMlxyXG4gICAgICAgICAgICA6IE1hdGgubWF4KDIsIE1hdGguY2VpbCh0aGV0YVJhbmdlIC8gKDIgKiBNYXRoLmFjb3MoMSAtICgwLCBpbmRleF8xLmZsb2F0MzJfZGl2KShjaXJjdWxhckFyY1RvbGVyYW5jZSwgcmFkaXVzKSkpKSk7XHJcbiAgICAgICAgLy8gV2Ugc2VsZWN0IHRoZSBhbW91bnQgb2YgcG9pbnRzIGZvciB0aGUgYXBwcm94aW1hdGlvbiBieSByZXF1aXJpbmcgdGhlIGRpc2NyZXRlIGN1cnZhdHVyZVxyXG4gICAgICAgIC8vIHRvIGJlIHNtYWxsZXIgdGhhbiB0aGUgcHJvdmlkZWQgdG9sZXJhbmNlLiBUaGUgZXhhY3QgYW5nbGUgcmVxdWlyZWQgdG8gbWVldCB0aGUgdG9sZXJhbmNlXHJcbiAgICAgICAgLy8gaXM6IDIgKiBNYXRoLkFjb3MoMSAtIFRPTEVSQU5DRSAvIHIpXHJcbiAgICAgICAgLy8gVGhlIHNwZWNpYWwgY2FzZSBpcyByZXF1aXJlZCBmb3IgZXh0cmVtZWx5IHNob3J0IHNsaWRlcnMgd2hlcmUgdGhlIHJhZGl1cyBpcyBzbWFsbGVyIHRoYW5cclxuICAgICAgICAvLyB0aGUgdG9sZXJhbmNlLiBUaGlzIGlzIGEgcGF0aG9sb2dpY2FsIHJhdGhlciB0aGFuIGEgcmVhbGlzdGljIGNhc2UuXHJcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhbW91bnRQb2ludHM7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBmcmFjdCA9IGkgLyAoYW1vdW50UG9pbnRzIC0gMSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRoZXRhID0gdGhldGFTdGFydCArIGRpcmVjdGlvbiAqIGZyYWN0ICogdGhldGFSYW5nZTtcclxuICAgICAgICAgICAgY29uc3QgbyA9IG5ldyBpbmRleF8xLlZlYzIodG9GbG9hdChNYXRoLmNvcyh0aGV0YSkpLCB0b0Zsb2F0KE1hdGguc2luKHRoZXRhKSkpLnNjYWxlKHJhZGl1cyk7XHJcbiAgICAgICAgICAgIG91dHB1dC5wdXNoKGNlbnRlci5hZGQobykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb3V0cHV0O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgcGllY2V3aXNlLWxpbmVhciBhcHByb3hpbWF0aW9uIG9mIGEgbGluZWFyIGN1cnZlLlxyXG4gICAgICogQmFzaWNhbGx5LCByZXR1cm5zIHRoZSBpbnB1dC5cclxuICAgICAqIEByZXR1cm5zIEEgbGlzdCBvZiB2ZWN0b3JzIHJlcHJlc2VudGluZyB0aGUgcGllY2V3aXNlLWxpbmVhciBhcHByb3hpbWF0aW9uLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYXBwcm94aW1hdGVMaW5lYXIoY29udHJvbFBvaW50cykge1xyXG4gICAgICAgIHJldHVybiBbLi4uY29udHJvbFBvaW50c107XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYSBwaWVjZXdpc2UtbGluZWFyIGFwcHJveGltYXRpb24gb2YgYSBsYWdyYW5nZSBwb2x5bm9taWFsLlxyXG4gICAgICogQHJldHVybnMgQSBsaXN0IG9mIHZlY3RvcnMgcmVwcmVzZW50aW5nIHRoZSBwaWVjZXdpc2UtbGluZWFyIGFwcHJveGltYXRpb24uXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBhcHByb3hpbWF0ZUxhZ3JhbmdlUG9seW5vbWlhbChjb250cm9sUG9pbnRzKSB7XHJcbiAgICAgICAgLy8gVE9ETzogYWRkIHNvbWUgc21hcnRlciBsb2dpYyBoZXJlLCBjaGVieXNoZXYgbm9kZXM/XHJcbiAgICAgICAgY29uc3QgbnVtU3RlcHMgPSA1MTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcclxuICAgICAgICBjb25zdCB3ZWlnaHRzID0gUGF0aEFwcHJveGltYXRvci5fYmFyeWNlbnRyaWNXZWlnaHRzKGNvbnRyb2xQb2ludHMpO1xyXG4gICAgICAgIGxldCBtaW5YID0gY29udHJvbFBvaW50c1swXS54O1xyXG4gICAgICAgIGxldCBtYXhYID0gY29udHJvbFBvaW50c1swXS54O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgY29udHJvbFBvaW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBtaW5YID0gTWF0aC5taW4obWluWCwgY29udHJvbFBvaW50c1tpXS54KTtcclxuICAgICAgICAgICAgbWF4WCA9IE1hdGgubWF4KG1heFgsIGNvbnRyb2xQb2ludHNbaV0ueCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGR4ID0gbWF4WCAtIG1pblg7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TdGVwczsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHggPSBtaW5YICsgKGR4IC8gKG51bVN0ZXBzIC0gMSkpICogaTtcclxuICAgICAgICAgICAgY29uc3QgeSA9IE1hdGguZnJvdW5kKFBhdGhBcHByb3hpbWF0b3IuX2JhcnljZW50cmljTGFncmFuZ2UoY29udHJvbFBvaW50cywgd2VpZ2h0cywgeCkpO1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChuZXcgaW5kZXhfMS5WZWMyKHgsIHkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogQ2FsY3VsYXRlcyB0aGUgQmFyeWNlbnRyaWMgd2VpZ2h0cyBmb3IgYSBMYWdyYW5nZSBwb2x5bm9taWFsIGZvciBhIGdpdmVuIHNldCBvZiBjb29yZGluYXRlcy5cclxuICAgICAqIENhbiBiZSB1c2VkIGFzIGEgaGVscGVyIGZ1bmN0aW9uIHRvIGNvbXB1dGUgYSBMYWdyYW5nZSBwb2x5bm9taWFsIHJlcGVhdGVkbHkuXHJcbiAgICAgKiBAcGFyYW0gcG9pbnRzIEFuIGFycmF5IG9mIGNvb3JkaW5hdGVzLiBObyB0d28geCBzaG91bGQgYmUgdGhlIHNhbWUuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBfYmFyeWNlbnRyaWNXZWlnaHRzKHBvaW50cykge1xyXG4gICAgICAgIGNvbnN0IG4gPSBwb2ludHMubGVuZ3RoO1xyXG4gICAgICAgIGNvbnN0IHcgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiB3W2ldLnB1c2goKSAtPiB1bmhvbGV5XHJcbiAgICAgICAgICAgIHdbaV0gPSAxO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG47IGorKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgIT09IGopIHtcclxuICAgICAgICAgICAgICAgICAgICB3W2ldICo9IHBvaW50c1tpXS54IC0gcG9pbnRzW2pdLng7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd1tpXSA9IDEuMCAvIHdbaV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB3O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxjdWxhdGVzIHRoZSBMYWdyYW5nZSBiYXNpcyBwb2x5bm9taWFsIGZvciBhIGdpdmVuIHNldCBvZiB4IGNvb3JkaW5hdGVzIGJhc2VkIG9uIHByZXZpb3VzbHkgY29tcHV0ZWQgYmFyeWNlbnRyaWNcclxuICAgICAqIHdlaWdodHMuXHJcbiAgICAgKiBAcGFyYW0gcG9pbnRzIEFuIGFycmF5IG9mIGNvb3JkaW5hdGVzLiBObyB0d28geCBzaG91bGQgYmUgdGhlIHNhbWUuXHJcbiAgICAgKiBAcGFyYW0gd2VpZ2h0cyBBbiBhcnJheSBvZiBwcmVjb21wdXRlZCBiYXJ5Y2VudHJpYyB3ZWlnaHRzLlxyXG4gICAgICogQHBhcmFtIHRpbWUgVGhlIHggY29vcmRpbmF0ZSB0byBjYWxjdWxhdGUgdGhlIGJhc2lzIHBvbHlub21pYWwgZm9yLlxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgX2JhcnljZW50cmljTGFncmFuZ2UocG9pbnRzLCB3ZWlnaHRzLCB0aW1lKSB7XHJcbiAgICAgICAgaWYgKHBvaW50cyA9PT0gbnVsbCB8fCBwb2ludHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInBvaW50cyBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIHBvaW50XCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocG9pbnRzLmxlbmd0aCAhPT0gd2VpZ2h0cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwicG9pbnRzIG11c3QgY29udGFpbiBleGFjdGx5IGFzIG1hbnkgaXRlbXMgYXMge25hbWVvZih3ZWlnaHRzKX1cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBudW1lcmF0b3IgPSAwO1xyXG4gICAgICAgIGxldCBkZW5vbWluYXRvciA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBvaW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAvLyB3aGlsZSB0aGlzIGlzIG5vdCBncmVhdCB3aXRoIGJyYW5jaCBwcmVkaWN0aW9uLCBpdCBwcmV2ZW50cyBOYU4gYXQgY29udHJvbCBwb2ludCBYIGNvb3JkaW5hdGVzXHJcbiAgICAgICAgICAgIGlmICh0aW1lID09PSBwb2ludHNbaV0ueCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvaW50c1tpXS55O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGxpID0gd2VpZ2h0c1tpXSAvICh0aW1lIC0gcG9pbnRzW2ldLngpO1xyXG4gICAgICAgICAgICBudW1lcmF0b3IgKz0gbGkgKiBwb2ludHNbaV0ueTtcclxuICAgICAgICAgICAgZGVub21pbmF0b3IgKz0gbGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudW1lcmF0b3IgLyBkZW5vbWluYXRvcjtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogTWFrZSBzdXJlIHRoZSAybmQgb3JkZXIgZGVyaXZhdGl2ZSAoYXBwcm94aW1hdGVkIHVzaW5nIGZpbml0ZSBlbGVtZW50cykgaXMgd2l0aGluIHRvbGVyYWJsZSBib3VuZHMuXHJcbiAgICAgKiBOT1RFOiBUaGUgMm5kIG9yZGVyIGRlcml2YXRpdmUgb2YgYSAyZCBjdXJ2ZSByZXByZXNlbnRzIGl0cyBjdXJ2YXR1cmUsIHNvIGludHVpdGl2ZWx5IHRoaXMgZnVuY3Rpb25cclxuICAgICAqICAgICAgIGNoZWNrcyAoYXMgdGhlIG5hbWUgc3VnZ2VzdHMpIHdoZXRoZXIgb3VyIGFwcHJveGltYXRpb24gaXMgX2xvY2FsbHlfIFwiZmxhdFwiLiBNb3JlIGN1cnZ5IHBhcnRzXHJcbiAgICAgKiAgICAgICBuZWVkIHRvIGhhdmUgYSBkZW5zZXIgYXBwcm94aW1hdGlvbiB0byBiZSBtb3JlIFwiZmxhdFwiLlxyXG4gICAgICogQHBhcmFtIGNvbnRyb2xQb2ludHMgVGhlIGNvbnRyb2wgcG9pbnRzIHRvIGNoZWNrIGZvciBmbGF0bmVzcy5cclxuICAgICAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIGNvbnRyb2wgcG9pbnRzIGFyZSBmbGF0IGVub3VnaC5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIF9iZXppZXJJc0ZsYXRFbm91Z2goY29udHJvbFBvaW50cykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgY29udHJvbFBvaW50cy5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdG1wID0gY29udHJvbFBvaW50c1tpIC0gMV0uc3ViKGNvbnRyb2xQb2ludHNbaV0uc2NhbGUoMikpLmFkZChjb250cm9sUG9pbnRzW2kgKyAxXSk7XHJcbiAgICAgICAgICAgIGlmICh0bXAubGVuZ3RoU3F1YXJlZCgpID4gYmV6aWVyVG9sZXJhbmNlICoqIDIgKiA0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFN1YmRpdmlkZXMgbiBjb250cm9sIHBvaW50cyByZXByZXNlbnRpbmcgYSBiZXppZXIgY3VydmUgaW50byAyIHNldHMgb2YgbiBjb250cm9sIHBvaW50cywgZWFjaFxyXG4gICAgICogZGVzY3JpYmluZyBhIGJlemllciBjdXJ2ZSBlcXVpdmFsZW50IHRvIGEgaGFsZiBvZiB0aGUgb3JpZ2luYWwgY3VydmUuIEVmZmVjdGl2ZWx5IHRoaXMgc3BsaXRzXHJcbiAgICAgKiB0aGUgb3JpZ2luYWwgY3VydmUgaW50byAyIGN1cnZlcyB3aGljaCByZXN1bHQgaW4gdGhlIG9yaWdpbmFsIGN1cnZlIHdoZW4gcGllY2VkIGJhY2sgdG9nZXRoZXIuXHJcbiAgICAgKiBAcGFyYW0gY29udHJvbFBvaW50cyBUaGUgY29udHJvbCBwb2ludHMgdG8gc3BsaXQuXHJcbiAgICAgKiBAcGFyYW0gbCBPdXRwdXQ6IFRoZSBjb250cm9sIHBvaW50cyBjb3JyZXNwb25kaW5nIHRvIHRoZSBsZWZ0IGhhbGYgb2YgdGhlIGN1cnZlLlxyXG4gICAgICogQHBhcmFtIHIgT3V0cHV0OiBUaGUgY29udHJvbCBwb2ludHMgY29ycmVzcG9uZGluZyB0byB0aGUgcmlnaHQgaGFsZiBvZiB0aGUgY3VydmUuXHJcbiAgICAgKiBAcGFyYW0gc3ViZGl2aXNpb25CdWZmZXIgVGhlIGZpcnN0IGJ1ZmZlciBjb250YWluaW5nIHRoZSBjdXJyZW50IHN1YmRpdmlzaW9uIHN0YXRlLlxyXG4gICAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2YgY29udHJvbCBwb2ludHMgaW4gdGhlIG9yaWdpbmFsIGxpc3QuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBfYmV6aWVyU3ViZGl2aWRlKGNvbnRyb2xQb2ludHMsIGwsIHIsIHN1YmRpdmlzaW9uQnVmZmVyLCBjb3VudCkge1xyXG4gICAgICAgIGNvbnN0IG1pZHBvaW50cyA9IHN1YmRpdmlzaW9uQnVmZmVyO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xyXG4gICAgICAgICAgICBtaWRwb2ludHNbaV0gPSBjb250cm9sUG9pbnRzW2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcclxuICAgICAgICAgICAgbFtpXSA9IG1pZHBvaW50c1swXTtcclxuICAgICAgICAgICAgcltjb3VudCAtIGkgLSAxXSA9IG1pZHBvaW50c1tjb3VudCAtIGkgLSAxXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb3VudCAtIGkgLSAxOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIG1pZHBvaW50c1tqXSA9IG1pZHBvaW50c1tqXS5hZGQobWlkcG9pbnRzW2ogKyAxXSk7XHJcbiAgICAgICAgICAgICAgICBtaWRwb2ludHNbal0gPSBtaWRwb2ludHNbal0uZGl2aWRlKDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIHVzZXMgPGEgaHJlZj1cImh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0RlX0Nhc3RlbGphdSUyN3NfYWxnb3JpdGhtIERlIENhc3RlbGphdSdzIGFsZ29yaXRobTwvYT4gdG8gb2J0YWluXHJcbiAgICAgKiBhbiBvcHRpbWFsIHBpZWNld2lzZS1saW5lYXIgYXBwcm94aW1hdGlvbiBvZiB0aGUgYmV6aWVyIGN1cnZlIHdpdGggdGhlIHNhbWUgYW1vdW50IG9mIHBvaW50cyBhcyB0aGVyZSBhcmUgY29udHJvbFxyXG4gICAgICogcG9pbnRzLlxyXG4gICAgICogQHBhcmFtIGNvbnRyb2xQb2ludHMgVGhlIGNvbnRyb2wgcG9pbnRzIGRlc2NyaWJpbmcgdGhlIGJlemllciBjdXJ2ZSB0byBiZSBhcHByb3hpbWF0ZWQuXHJcbiAgICAgKiBAcGFyYW0gb3V0cHV0IFRoZSBwb2ludHMgcmVwcmVzZW50aW5nIHRoZSByZXN1bHRpbmcgcGllY2V3aXNlLWxpbmVhciBhcHByb3hpbWF0aW9uLlxyXG4gICAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2YgY29udHJvbCBwb2ludHMgaW4gdGhlIG9yaWdpbmFsIGxpc3QuXHJcbiAgICAgKiBAcGFyYW0gc3ViZGl2aXNpb25CdWZmZXIxIFRoZSBmaXJzdCBidWZmZXIgY29udGFpbmluZyB0aGUgY3VycmVudCBzdWJkaXZpc2lvbiBzdGF0ZS5cclxuICAgICAqIEBwYXJhbSBzdWJkaXZpc2lvbkJ1ZmZlcjIgVGhlIHNlY29uZCBidWZmZXIgY29udGFpbmluZyB0aGUgY3VycmVudCBzdWJkaXZpc2lvbiBzdGF0ZS5cclxuICAgICAqL1xyXG4gICAgc3RhdGljIF9iZXppZXJBcHByb3hpbWF0ZShjb250cm9sUG9pbnRzLCBvdXRwdXQsIHN1YmRpdmlzaW9uQnVmZmVyMSwgc3ViZGl2aXNpb25CdWZmZXIyLCBjb3VudCkge1xyXG4gICAgICAgIGNvbnN0IGwgPSBzdWJkaXZpc2lvbkJ1ZmZlcjI7XHJcbiAgICAgICAgY29uc3QgciA9IHN1YmRpdmlzaW9uQnVmZmVyMTtcclxuICAgICAgICBQYXRoQXBwcm94aW1hdG9yLl9iZXppZXJTdWJkaXZpZGUoY29udHJvbFBvaW50cywgbCwgciwgc3ViZGl2aXNpb25CdWZmZXIxLCBjb3VudCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudCAtIDE7ICsraSkge1xyXG4gICAgICAgICAgICBsW2NvdW50ICsgaV0gPSByW2kgKyAxXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb3V0cHV0LnB1c2goY29udHJvbFBvaW50c1swXSk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBjb3VudCAtIDE7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IDIgKiBpO1xyXG4gICAgICAgICAgICBsZXQgcCA9IGxbaW5kZXggLSAxXS5hZGQobFtpbmRleF0uc2NhbGUoMikpLmFkZChsW2luZGV4ICsgMV0pO1xyXG4gICAgICAgICAgICBwID0gcC5zY2FsZShNYXRoLmZyb3VuZCgwLjI1KSk7XHJcbiAgICAgICAgICAgIG91dHB1dC5wdXNoKHApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogRmluZHMgYSBwb2ludCBvbiB0aGUgc3BsaW5lIGF0IHRoZSBwb3NpdGlvbiBvZiBhIHBhcmFtZXRlci5cclxuICAgICAqIEBwYXJhbSB2ZWMxIFRoZSBmaXJzdCB2ZWN0b3IuXHJcbiAgICAgKiBAcGFyYW0gdmVjMiBUaGUgc2Vjb25kIHZlY3Rvci5cclxuICAgICAqIEBwYXJhbSB2ZWMzIFRoZSB0aGlyZCB2ZWN0b3IuXHJcbiAgICAgKiBAcGFyYW0gdmVjNCBUaGUgZm91cnRoIHZlY3Rvci5cclxuICAgICAqIEBwYXJhbSB0IFRoZSBwYXJhbWV0ZXIgYXQgd2hpY2ggdG8gZmluZCB0aGUgcG9pbnQgb24gdGhlIHNwbGluZSwgaW4gdGhlIHJhbmdlIFswLCAxXS5cclxuICAgICAqIEByZXR1cm5zIFRoZSBwb2ludCBvbiB0aGUgc3BsaW5lIGF0IHQuXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBfY2F0bXVsbEZpbmRQb2ludCh2ZWMxLCB2ZWMyLCB2ZWMzLCB2ZWM0LCB0KSB7XHJcbiAgICAgICAgY29uc3QgdDIgPSBNYXRoLmZyb3VuZCh0ICogdCk7XHJcbiAgICAgICAgY29uc3QgdDMgPSBNYXRoLmZyb3VuZCh0ICogdDIpO1xyXG4gICAgICAgIHJldHVybiBuZXcgaW5kZXhfMS5WZWMyKE1hdGguZnJvdW5kKDAuNSAqXHJcbiAgICAgICAgICAgICgyICogdmVjMi54ICtcclxuICAgICAgICAgICAgICAgICgtdmVjMS54ICsgdmVjMy54KSAqIHQgK1xyXG4gICAgICAgICAgICAgICAgKDIgKiB2ZWMxLnggLSA1ICogdmVjMi54ICsgNCAqIHZlYzMueCAtIHZlYzQueCkgKiB0MiArXHJcbiAgICAgICAgICAgICAgICAoLXZlYzEueCArIDMgKiB2ZWMyLnggLSAzICogdmVjMy54ICsgdmVjNC54KSAqIHQzKSksIE1hdGguZnJvdW5kKDAuNSAqXHJcbiAgICAgICAgICAgICgyICogdmVjMi55ICtcclxuICAgICAgICAgICAgICAgICgtdmVjMS55ICsgdmVjMy55KSAqIHQgK1xyXG4gICAgICAgICAgICAgICAgKDIgKiB2ZWMxLnkgLSA1ICogdmVjMi55ICsgNCAqIHZlYzMueSAtIHZlYzQueSkgKiB0MiArXHJcbiAgICAgICAgICAgICAgICAoLXZlYzEueSArIDMgKiB2ZWMyLnkgLSAzICogdmVjMy55ICsgdmVjNC55KSAqIHQzKSkpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuUGF0aEFwcHJveGltYXRvciA9IFBhdGhBcHByb3hpbWF0b3I7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuUGF0aFR5cGUgPSB2b2lkIDA7XHJcbnZhciBQYXRoVHlwZTtcclxuKGZ1bmN0aW9uIChQYXRoVHlwZSkge1xyXG4gICAgUGF0aFR5cGVbUGF0aFR5cGVbXCJDYXRtdWxsXCJdID0gMF0gPSBcIkNhdG11bGxcIjtcclxuICAgIFBhdGhUeXBlW1BhdGhUeXBlW1wiQmV6aWVyXCJdID0gMV0gPSBcIkJlemllclwiO1xyXG4gICAgUGF0aFR5cGVbUGF0aFR5cGVbXCJMaW5lYXJcIl0gPSAyXSA9IFwiTGluZWFyXCI7XHJcbiAgICBQYXRoVHlwZVtQYXRoVHlwZVtcIlBlcmZlY3RDdXJ2ZVwiXSA9IDNdID0gXCJQZXJmZWN0Q3VydmVcIjtcclxufSkoUGF0aFR5cGUgPSBleHBvcnRzLlBhdGhUeXBlIHx8IChleHBvcnRzLlBhdGhUeXBlID0ge30pKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5nZW5lcmF0ZVNsaWRlckNoZWNrcG9pbnRzID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uLy4uL21hdGgvaW5kZXhcIik7XHJcbmZ1bmN0aW9uKiBnZW5lcmF0ZVRpY2tzKHNwYW5JbmRleCwgc3BhblN0YXJ0VGltZSwgc3BhbkR1cmF0aW9uLCByZXZlcnNlZCwgbGVuZ3RoLCB0aWNrRGlzdGFuY2UsIG1pbkRpc3RhbmNlRnJvbUVuZCkge1xyXG4gICAgZm9yIChsZXQgZCA9IHRpY2tEaXN0YW5jZTsgZCA8PSBsZW5ndGg7IGQgKz0gdGlja0Rpc3RhbmNlKSB7XHJcbiAgICAgICAgaWYgKGQgPj0gbGVuZ3RoIC0gbWluRGlzdGFuY2VGcm9tRW5kKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzcGFuUHJvZ3Jlc3MgPSBkIC8gbGVuZ3RoO1xyXG4gICAgICAgIGNvbnN0IHRpbWVQcm9ncmVzcyA9IHJldmVyc2VkID8gMS4wIC0gc3BhblByb2dyZXNzIDogc3BhblByb2dyZXNzO1xyXG4gICAgICAgIHlpZWxkIHtcclxuICAgICAgICAgICAgdHlwZTogXCJUSUNLXCIsXHJcbiAgICAgICAgICAgIHNwYW5JbmRleCxcclxuICAgICAgICAgICAgc3BhblN0YXJ0VGltZSxcclxuICAgICAgICAgICAgdGltZTogc3BhblN0YXJ0VGltZSArIHRpbWVQcm9ncmVzcyAqIHNwYW5EdXJhdGlvbixcclxuICAgICAgICAgICAgc3BhblByb2dyZXNzLFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24qIGdlbmVyYXRlU2xpZGVyQ2hlY2twb2ludHMoc3RhcnRUaW1lLCBzcGFuRHVyYXRpb24sIHZlbG9jaXR5LCB0aWNrRGlzdGFuY2UsIHRvdGFsRGlzdGFuY2UsIHNwYW5Db3VudCwgbGVnYWN5TGFzdFRpY2tPZmZzZXQpIHtcclxuICAgIGNvbnN0IGxlbmd0aCA9IE1hdGgubWluKDEwMDAwMC4wLCB0b3RhbERpc3RhbmNlKTtcclxuICAgIHRpY2tEaXN0YW5jZSA9ICgwLCBpbmRleF8xLmNsYW1wKSh0aWNrRGlzdGFuY2UsIDAuMCwgbGVuZ3RoKTtcclxuICAgIGNvbnN0IG1pbkRpc3RhbmNlRnJvbUVuZCA9IHZlbG9jaXR5ICogMTA7XHJcbiAgICAvLyBHZW5lcmF0aW5nIHRpY2tzLCByZXBlYXRzXHJcbiAgICAvLyBVc2luZyBgZmxvYXRFcXVhbGAgd2FzIG15IHN1Z2dlc3Rpb24sIGJ1dCBvc3UhbGF6ZXIgdXNlcyB0aWNrRGlzdGFuY2UgIT0gMFxyXG4gICAgaWYgKHRpY2tEaXN0YW5jZSAhPT0gMCkge1xyXG4gICAgICAgIGZvciAobGV0IHNwYW4gPSAwOyBzcGFuIDwgc3BhbkNvdW50OyBzcGFuKyspIHtcclxuICAgICAgICAgICAgY29uc3Qgc3BhblN0YXJ0VGltZSA9IHN0YXJ0VGltZSArIHNwYW4gKiBzcGFuRHVyYXRpb247XHJcbiAgICAgICAgICAgIGNvbnN0IHJldmVyc2VkID0gc3BhbiAlIDIgPT09IDE7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ID0gZ2VuZXJhdGVUaWNrcyhzcGFuLCBzcGFuU3RhcnRUaW1lLCBzcGFuRHVyYXRpb24sIHJldmVyc2VkLCBsZW5ndGgsIHRpY2tEaXN0YW5jZSwgbWluRGlzdGFuY2VGcm9tRW5kKTtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgZmxhbWUgbWUgZm9yIHRoaXNcclxuICAgICAgICAgICAgY29uc3QgdGlja3MgPSBbXTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCB0IG9mIGl0KVxyXG4gICAgICAgICAgICAgICAgdGlja3MucHVzaCh0KTtcclxuICAgICAgICAgICAgaWYgKHJldmVyc2VkKVxyXG4gICAgICAgICAgICAgICAgdGlja3MucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHQgb2YgdGlja3MpXHJcbiAgICAgICAgICAgICAgICB5aWVsZCB0O1xyXG4gICAgICAgICAgICBpZiAoc3BhbiA8IHNwYW5Db3VudCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHlpZWxkIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlJFUEVBVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwYW5JbmRleDogc3BhbixcclxuICAgICAgICAgICAgICAgICAgICBzcGFuU3RhcnRUaW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbWU6IHNwYW5TdGFydFRpbWUgKyBzcGFuRHVyYXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3BhblByb2dyZXNzOiAoc3BhbiArIDEpICUgMixcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zdCB0b3RhbER1cmF0aW9uID0gc3BhbkNvdW50ICogc3BhbkR1cmF0aW9uO1xyXG4gICAgY29uc3QgZmluYWxTcGFuSW5kZXggPSBzcGFuQ291bnQgLSAxO1xyXG4gICAgY29uc3QgZmluYWxTcGFuU3RhcnRUaW1lID0gc3RhcnRUaW1lICsgZmluYWxTcGFuSW5kZXggKiBzcGFuRHVyYXRpb247XHJcbiAgICBjb25zdCBmaW5hbFNwYW5FbmRUaW1lID0gTWF0aC5tYXgoc3RhcnRUaW1lICsgdG90YWxEdXJhdGlvbiAvIDIuMCwgZmluYWxTcGFuU3RhcnRUaW1lICsgc3BhbkR1cmF0aW9uIC0gKGxlZ2FjeUxhc3RUaWNrT2Zmc2V0ICE9PSBudWxsICYmIGxlZ2FjeUxhc3RUaWNrT2Zmc2V0ICE9PSB2b2lkIDAgPyBsZWdhY3lMYXN0VGlja09mZnNldCA6IDApKTtcclxuICAgIGxldCBmaW5hbFByb2dyZXNzID0gKGZpbmFsU3BhbkVuZFRpbWUgLSBmaW5hbFNwYW5TdGFydFRpbWUpIC8gc3BhbkR1cmF0aW9uO1xyXG4gICAgaWYgKHNwYW5Db3VudCAlIDIgPT09IDApXHJcbiAgICAgICAgZmluYWxQcm9ncmVzcyA9IDEuMCAtIGZpbmFsUHJvZ3Jlc3M7XHJcbiAgICB5aWVsZCB7XHJcbiAgICAgICAgdHlwZTogXCJMQVNUX0xFR0FDWV9USUNLXCIsXHJcbiAgICAgICAgc3BhbkluZGV4OiBmaW5hbFNwYW5JbmRleCxcclxuICAgICAgICBzcGFuU3RhcnRUaW1lOiBmaW5hbFNwYW5TdGFydFRpbWUsXHJcbiAgICAgICAgdGltZTogZmluYWxTcGFuRW5kVGltZSxcclxuICAgICAgICBzcGFuUHJvZ3Jlc3M6IGZpbmFsUHJvZ3Jlc3MsXHJcbiAgICB9O1xyXG4gICAgLy8gVGVjaG5pY2FsbHkgc3BlYWtpbmcgdGhlIHRhaWwgaGFzIG5vIHJlYWwgcmVsZXZhbmN5IGZvciBnYW1lcGxheSwgaXQgaXMganVzdCBhIHZpc3VhbCBlbGVtZW50LlxyXG4gICAgLy8gSW4gU2xpZGVyLmNzIGl0IGlzIGV2ZW4gaWdub3JlZC4uLlxyXG4gICAgLy8geWllbGQge1xyXG4gICAgLy8gICB0eXBlOiBTbGlkZXJDaGVja1BvaW50VHlwZS5UQUlMLFxyXG4gICAgLy8gICBzcGFuSW5kZXg6IGZpbmFsU3BhbkluZGV4LFxyXG4gICAgLy8gICBzcGFuU3RhcnRUaW1lOiBzdGFydFRpbWUgKyAoc3BhbkNvdW50IC0gMSkgKiBzcGFuRHVyYXRpb24sXHJcbiAgICAvLyAgIHRpbWU6IHN0YXJ0VGltZSArIHRvdGFsRHVyYXRpb24sXHJcbiAgICAvLyAgIHBhdGhQcm9ncmVzczogc3BhbkNvdW50ICUgMlxyXG4gICAgLy8gfTtcclxufVxyXG5leHBvcnRzLmdlbmVyYXRlU2xpZGVyQ2hlY2twb2ludHMgPSBnZW5lcmF0ZVNsaWRlckNoZWNrcG9pbnRzO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLlNsaWRlclBhdGggPSB2b2lkIDA7XHJcbmNvbnN0IFBhdGhUeXBlXzEgPSByZXF1aXJlKFwiLi9QYXRoVHlwZVwiKTtcclxuY29uc3QgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi8uLi8uLi9tYXRoL2luZGV4XCIpO1xyXG5jb25zdCBQYXRoQXBwcm94aW1hdG9yXzEgPSByZXF1aXJlKFwiLi9QYXRoQXBwcm94aW1hdG9yXCIpO1xyXG5mdW5jdGlvbiBtYXBUb1ZlY3RvcjIocCkge1xyXG4gICAgcmV0dXJuIHAubWFwKChwKSA9PiBuZXcgaW5kZXhfMS5WZWMyKHAueCwgcC55KSk7XHJcbn1cclxuY2xhc3MgU2xpZGVyUGF0aCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihjb250cm9sUG9pbnRzLCBsZW5ndGgpIHtcclxuICAgICAgICB0aGlzLl9taW4gPSB7IHg6IDAsIHk6IDAgfTtcclxuICAgICAgICB0aGlzLl9tYXggPSB7IHg6IDAsIHk6IDAgfTtcclxuICAgICAgICB0aGlzLmNvbnRyb2xQb2ludHMgPSBjb250cm9sUG9pbnRzO1xyXG4gICAgICAgIHRoaXMuX2ludmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX2N1bXVsYXRpdmVMZW5ndGggPSBbXTtcclxuICAgICAgICB0aGlzLl9jYWxjdWxhdGVkUGF0aCA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2V4cGVjdGVkRGlzdGFuY2UgPSBsZW5ndGg7XHJcbiAgICB9XHJcbiAgICBnZXQgY3VtdWxhdGl2ZUxlbmd0aHMoKSB7XHJcbiAgICAgICAgdGhpcy5lbnN1cmVWYWxpZCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9jdW11bGF0aXZlTGVuZ3RoO1xyXG4gICAgfVxyXG4gICAgZ2V0IGNhbGN1bGF0ZWRQYXRoKCkge1xyXG4gICAgICAgIHRoaXMuZW5zdXJlVmFsaWQoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY2FsY3VsYXRlZFBhdGg7XHJcbiAgICB9XHJcbiAgICBtYWtlSW52YWxpZCgpIHtcclxuICAgICAgICB0aGlzLl9pbnZhbGlkID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIC8vIFJlY2FsY3VsYXRlcyB0aGUgaGVscGVyIGRhdGEgaWYgbmVlZGVkXHJcbiAgICBlbnN1cmVWYWxpZCgpIHtcclxuICAgICAgICBpZiAodGhpcy5faW52YWxpZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNhbGN1bGF0ZVBhdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVMZW5ndGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVCb3VuZGFyeUJveCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9pbnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY2FsY3VsYXRlU3ViUGF0aChzdWJDb250cm9sUG9pbnRzLCB0eXBlKSB7XHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgUGF0aFR5cGVfMS5QYXRoVHlwZS5DYXRtdWxsOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFBhdGhBcHByb3hpbWF0b3JfMS5QYXRoQXBwcm94aW1hdG9yLmFwcHJveGltYXRlQ2F0bXVsbChtYXBUb1ZlY3RvcjIoc3ViQ29udHJvbFBvaW50cykpO1xyXG4gICAgICAgICAgICBjYXNlIFBhdGhUeXBlXzEuUGF0aFR5cGUuTGluZWFyOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFBhdGhBcHByb3hpbWF0b3JfMS5QYXRoQXBwcm94aW1hdG9yLmFwcHJveGltYXRlTGluZWFyKG1hcFRvVmVjdG9yMihzdWJDb250cm9sUG9pbnRzKSk7XHJcbiAgICAgICAgICAgIGNhc2UgUGF0aFR5cGVfMS5QYXRoVHlwZS5QZXJmZWN0Q3VydmU6XHJcbiAgICAgICAgICAgICAgICBpZiAoc3ViQ29udHJvbFBvaW50cy5sZW5ndGggIT09IDMpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY2FzZS1kZWNsYXJhdGlvbnNcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnBhdGggPSBQYXRoQXBwcm94aW1hdG9yXzEuUGF0aEFwcHJveGltYXRvci5hcHByb3hpbWF0ZUNpcmN1bGFyQXJjKG1hcFRvVmVjdG9yMihzdWJDb250cm9sUG9pbnRzKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBmb3Igc29tZSByZWFzb24gYSBjaXJjdWxhciBhcmMgY291bGQgbm90IGJlIGZpdCB0byB0aGUgMyBnaXZlbiBwb2ludHMsIGZhbGwgYmFjayB0byBhIG51bWVyaWNhbGx5IHN0YWJsZVxyXG4gICAgICAgICAgICAgICAgLy8gYmV6aWVyIGFwcHJveGltYXRpb24uXHJcbiAgICAgICAgICAgICAgICBpZiAoc3VicGF0aC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VicGF0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFBhdGhBcHByb3hpbWF0b3JfMS5QYXRoQXBwcm94aW1hdG9yLmFwcHJveGltYXRlQmV6aWVyKG1hcFRvVmVjdG9yMihzdWJDb250cm9sUG9pbnRzKSk7XHJcbiAgICB9XHJcbiAgICBnZXQgYm91bmRhcnlCb3goKSB7XHJcbiAgICAgICAgdGhpcy5lbnN1cmVWYWxpZCgpO1xyXG4gICAgICAgIHJldHVybiBbdGhpcy5fbWluLCB0aGlzLl9tYXhdO1xyXG4gICAgfVxyXG4gICAgY2FsY3VsYXRlQm91bmRhcnlCb3goKSB7XHJcbiAgICAgICAgLy8gU2luY2UgaXQgaXMgb3N1IXB4ICwgaXQgc2hvdWxkIGJlIG5vIHByb2JsZW1cclxuICAgICAgICBsZXQgbWluWCA9IDMwMDAsIG1heFggPSAtMzAwMCwgbWluWSA9IDMwMDAsIG1heFkgPSAtMzAwMDtcclxuICAgICAgICB0aGlzLl9jYWxjdWxhdGVkUGF0aC5mb3JFYWNoKChwKSA9PiB7XHJcbiAgICAgICAgICAgIG1pblggPSBNYXRoLm1pbihtaW5YLCBwLngpO1xyXG4gICAgICAgICAgICBtYXhYID0gTWF0aC5tYXgobWF4WCwgcC54KTtcclxuICAgICAgICAgICAgbWluWSA9IE1hdGgubWluKG1pblksIHAueSk7XHJcbiAgICAgICAgICAgIG1heFkgPSBNYXRoLm1heChtYXhZLCBwLnkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX21pbiA9IG5ldyBpbmRleF8xLlZlYzIobWluWCwgbWluWSk7XHJcbiAgICAgICAgdGhpcy5fbWF4ID0gbmV3IGluZGV4XzEuVmVjMihtYXhYLCBtYXhZKTtcclxuICAgICAgICByZXR1cm4gW3RoaXMuX21pbiwgdGhpcy5fbWF4XTtcclxuICAgIH1cclxuICAgIGNhbGN1bGF0ZVBhdGgoKSB7XHJcbiAgICAgICAgdmFyIF9hO1xyXG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZWRQYXRoID0gW107XHJcbiAgICAgICAgY29uc3QgbnVtYmVyT2ZQb2ludHMgPSB0aGlzLmNvbnRyb2xQb2ludHMubGVuZ3RoO1xyXG4gICAgICAgIGlmIChudW1iZXJPZlBvaW50cyA9PT0gMClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IHZlcnRpY2VzID0gdGhpcy5jb250cm9sUG9pbnRzLm1hcCgocCkgPT4gcC5vZmZzZXQpO1xyXG4gICAgICAgIGxldCBzdGFydCA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXJPZlBvaW50czsgaSsrKSB7XHJcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gY2FsY3VsYXRlIHByZXZpb3VzIHNlZ21lbnRcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29udHJvbFBvaW50c1tpXS50eXBlID09PSB1bmRlZmluZWQgJiYgaSA8IG51bWJlck9mUG9pbnRzIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ3VycmVudCB2ZXJ0ZXggZW5kcyB0aGUgc2VnbWVudFxyXG4gICAgICAgICAgICBjb25zdCBzZWdtZW50VmVydGljZXMgPSB2ZXJ0aWNlcy5zbGljZShzdGFydCwgaSArIDEpO1xyXG4gICAgICAgICAgICBjb25zdCBzZWdtZW50VHlwZSA9IChfYSA9IHRoaXMuY29udHJvbFBvaW50c1tzdGFydF0udHlwZSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogUGF0aFR5cGVfMS5QYXRoVHlwZS5MaW5lYXI7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgdCBvZiB0aGlzLmNhbGN1bGF0ZVN1YlBhdGgoc2VnbWVudFZlcnRpY2VzLCBzZWdtZW50VHlwZSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLl9jYWxjdWxhdGVkUGF0aC5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBpZiAobiA9PT0gMCB8fCAhaW5kZXhfMS5WZWMyLmVxdWFsKHRoaXMuX2NhbGN1bGF0ZWRQYXRoW24gLSAxXSwgdCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVkUGF0aC5wdXNoKHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXJ0ID0gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjYWxjdWxhdGVMZW5ndGgoKSB7XHJcbiAgICAgICAgdGhpcy5fY3VtdWxhdGl2ZUxlbmd0aCA9IG5ldyBBcnJheSh0aGlzLl9jYWxjdWxhdGVkUGF0aC5sZW5ndGgpO1xyXG4gICAgICAgIHRoaXMuX2N1bXVsYXRpdmVMZW5ndGhbMF0gPSAwLjA7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aGlzLl9jYWxjdWxhdGVkUGF0aC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLl9jdW11bGF0aXZlTGVuZ3RoW2ldID1cclxuICAgICAgICAgICAgICAgIHRoaXMuX2N1bXVsYXRpdmVMZW5ndGhbaSAtIDFdICsgTWF0aC5mcm91bmQoaW5kZXhfMS5WZWMyLmRpc3RhbmNlKHRoaXMuX2NhbGN1bGF0ZWRQYXRoW2kgLSAxXSwgdGhpcy5fY2FsY3VsYXRlZFBhdGhbaV0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgY2FsY3VsYXRlZExlbmd0aCA9IHRoaXMuX2N1bXVsYXRpdmVMZW5ndGhbdGhpcy5fY3VtdWxhdGl2ZUxlbmd0aC5sZW5ndGggLSAxXTtcclxuICAgICAgICAvLyBUT0RPOiBJbiBsYXplciB0aGUgIT0gb3BlcmF0b3IgaXMgdXNlZCwgYnV0IHNob3VsZG4ndCB0aGUgYXBwcm94aW1hdGUgZXF1YWwgYmUgdXNlZD9cclxuICAgICAgICBpZiAodGhpcy5fZXhwZWN0ZWREaXN0YW5jZSAhPT0gdW5kZWZpbmVkICYmIGNhbGN1bGF0ZWRMZW5ndGggIT09IHRoaXMuX2V4cGVjdGVkRGlzdGFuY2UpIHtcclxuICAgICAgICAgICAgLy8gSW4gb3N1LXN0YWJsZSwgaWYgdGhlIGxhc3QgdHdvIGNvbnRyb2wgcG9pbnRzIG9mIGEgc2xpZGVyIGFyZSBlcXVhbCwgZXh0ZW5zaW9uIGlzIG5vdCBwZXJmb3JtZWQuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRyb2xQb2ludHMubGVuZ3RoID49IDIgJiYgaW5kZXhfMS5WZWMyLmVxdWFsKHRoaXMuY29udHJvbFBvaW50c1t0aGlzLmNvbnRyb2xQb2ludHMubGVuZ3RoIC0gMV0ub2Zmc2V0LCB0aGlzLmNvbnRyb2xQb2ludHNbdGhpcy5jb250cm9sUG9pbnRzLmxlbmd0aCAtIDJdLm9mZnNldClcclxuICAgICAgICAgICAgICAgICYmIHRoaXMuX2V4cGVjdGVkRGlzdGFuY2UgPiBjYWxjdWxhdGVkTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdW11bGF0aXZlTGVuZ3RoLnB1c2goY2FsY3VsYXRlZExlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gVGhlIGxhc3QgbGVuZ3RoIGlzIGFsd2F5cyBpbmNvcnJlY3RcclxuICAgICAgICAgICAgdGhpcy5fY3VtdWxhdGl2ZUxlbmd0aC5zcGxpY2UodGhpcy5fY3VtdWxhdGl2ZUxlbmd0aC5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgbGV0IHBhdGhFbmRJbmRleCA9IHRoaXMuX2NhbGN1bGF0ZWRQYXRoLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIGlmIChjYWxjdWxhdGVkTGVuZ3RoID4gdGhpcy5fZXhwZWN0ZWREaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuX2N1bXVsYXRpdmVMZW5ndGgubGVuZ3RoID4gMCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1bXVsYXRpdmVMZW5ndGhbdGhpcy5fY3VtdWxhdGl2ZUxlbmd0aC5sZW5ndGggLSAxXSA+PSB0aGlzLl9leHBlY3RlZERpc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VtdWxhdGl2ZUxlbmd0aC5zcGxpY2UodGhpcy5fY3VtdWxhdGl2ZUxlbmd0aC5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVkUGF0aC5zcGxpY2UocGF0aEVuZEluZGV4LS0sIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChwYXRoRW5kSW5kZXggPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogUGVyaGFwcyBuZWdhdGl2ZSBwYXRoIGxlbmd0aHMgc2hvdWxkIGJlIGRpc2FsbG93ZWQgdG9nZXRoZXJcclxuICAgICAgICAgICAgICAgIHRoaXMuX2N1bXVsYXRpdmVMZW5ndGgucHVzaCgwKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyB0aGUgZGlyZWN0aW9uIG9mIHRoZSBzZWdtZW50IHRvIHNob3J0ZW4gb3IgbGVuZ3RoZW5cclxuICAgICAgICAgICAgY29uc3QgZGlyID0gaW5kZXhfMS5WZWMyLnN1Yih0aGlzLl9jYWxjdWxhdGVkUGF0aFtwYXRoRW5kSW5kZXhdLCB0aGlzLl9jYWxjdWxhdGVkUGF0aFtwYXRoRW5kSW5kZXggLSAxXSkubm9ybWFsaXplZCgpO1xyXG4gICAgICAgICAgICBjb25zdCBmID0gdGhpcy5fZXhwZWN0ZWREaXN0YW5jZSAtIHRoaXMuX2N1bXVsYXRpdmVMZW5ndGhbdGhpcy5fY3VtdWxhdGl2ZUxlbmd0aC5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgdGhpcy5fY2FsY3VsYXRlZFBhdGhbcGF0aEVuZEluZGV4XSA9IGluZGV4XzEuVmVjMi5hZGQodGhpcy5fY2FsY3VsYXRlZFBhdGhbcGF0aEVuZEluZGV4IC0gMV0sIGRpci5zY2FsZShNYXRoLmZyb3VuZChmKSkpO1xyXG4gICAgICAgICAgICB0aGlzLl9jdW11bGF0aXZlTGVuZ3RoLnB1c2godGhpcy5fZXhwZWN0ZWREaXN0YW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ2V0IGRpc3RhbmNlKCkge1xyXG4gICAgICAgIGNvbnN0IGN1bXVsYXRpdmVMZW5ndGhzID0gdGhpcy5jdW11bGF0aXZlTGVuZ3RocztcclxuICAgICAgICBjb25zdCBjb3VudCA9IGN1bXVsYXRpdmVMZW5ndGhzLmxlbmd0aDtcclxuICAgICAgICByZXR1cm4gY291bnQgPiAwID8gY3VtdWxhdGl2ZUxlbmd0aHNbY291bnQgLSAxXSA6IDAuMDtcclxuICAgIH1cclxuICAgIGluZGV4T2ZEaXN0YW5jZShkaXN0YW5jZSkge1xyXG4gICAgICAgIC8vIFRPRE86IEJpbmFyeSBzZWFyY2ggdGhlIGZpcnN0IHZhbHVlIHRoYXQgaXMgbm90IGxlc3MgdGhhbiBwYXJ0aWFsRGlzdGFuY2VcclxuICAgICAgICBjb25zdCBpZHggPSB0aGlzLmN1bXVsYXRpdmVMZW5ndGhzLmZpbmRJbmRleCgodmFsdWUpID0+IHZhbHVlID49IGRpc3RhbmNlKTtcclxuICAgICAgICBpZiAoaWR4ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gU2hvdWxkIG5vdCBiZSBwb3NzaWJsZVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDdW11bGF0aXZlIGxlbmd0aHMgb3IgZGlzdGFuY2Ugd3JvbmdseSBwcm9ncmFtbWVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlkeDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIENhbGN1bGF0ZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBzbGlkZXIgYXQgdGhlIGdpdmVuIHByb2dyZXNzLlxyXG4gICAgICogQHBhcmFtIHByb2dyZXNzIGEgbnVtYmVyIGJldHdlZW4gMCAoaGVhZCkgYW5kIDEgKHRhaWwvcmVwZWF0KVxyXG4gICAgICovXHJcbiAgICBwb3NpdGlvbkF0KHByb2dyZXNzKSB7XHJcbiAgICAgICAgY29uc3QgcGFydGlhbERpc3RhbmNlID0gdGhpcy5kaXN0YW5jZSAqICgwLCBpbmRleF8xLmNsYW1wKShwcm9ncmVzcywgMCwgMSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJwb2xhdGVWZXJ0aWNlcyh0aGlzLmluZGV4T2ZEaXN0YW5jZShwYXJ0aWFsRGlzdGFuY2UpLCBwYXJ0aWFsRGlzdGFuY2UpO1xyXG4gICAgfVxyXG4gICAgLy8gZDogZG91YmxlXHJcbiAgICBpbnRlcnBvbGF0ZVZlcnRpY2VzKGksIGQpIHtcclxuICAgICAgICBjb25zdCBjYWxjdWxhdGVkUGF0aCA9IHRoaXMuY2FsY3VsYXRlZFBhdGg7XHJcbiAgICAgICAgaWYgKGNhbGN1bGF0ZWRQYXRoLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgcmV0dXJuIGluZGV4XzEuVmVjMi5aZXJvO1xyXG4gICAgICAgIGlmIChpIDw9IDApXHJcbiAgICAgICAgICAgIHJldHVybiBjYWxjdWxhdGVkUGF0aFswXTtcclxuICAgICAgICBpZiAoaSA+PSBjYWxjdWxhdGVkUGF0aC5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybiBjYWxjdWxhdGVkUGF0aFtjYWxjdWxhdGVkUGF0aC5sZW5ndGggLSAxXTtcclxuICAgICAgICBjb25zdCBwMSA9IGNhbGN1bGF0ZWRQYXRoW2kgLSAxXTtcclxuICAgICAgICBjb25zdCBwMiA9IGNhbGN1bGF0ZWRQYXRoW2ldO1xyXG4gICAgICAgIGNvbnN0IGQxID0gdGhpcy5jdW11bGF0aXZlTGVuZ3Roc1tpIC0gMV07XHJcbiAgICAgICAgY29uc3QgZDIgPSB0aGlzLmN1bXVsYXRpdmVMZW5ndGhzW2ldO1xyXG4gICAgICAgIGlmICgoMCwgaW5kZXhfMS5kb3VibGVFcXVhbCkoZDEsIGQyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE51bWJlciBiZXR3ZWVuIDAgYW5kIDFcclxuICAgICAgICBjb25zdCB6ID0gKGQgLSBkMSkgLyAoZDIgLSBkMSk7XHJcbiAgICAgICAgcmV0dXJuIGluZGV4XzEuVmVjMi5pbnRlcnBvbGF0ZShwMSwgcDIsIHopO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuU2xpZGVyUGF0aCA9IFNsaWRlclBhdGg7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19jcmVhdGVCaW5kaW5nID0gKHRoaXMgJiYgdGhpcy5fX2NyZWF0ZUJpbmRpbmcpIHx8IChPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG0sIGspO1xyXG4gICAgaWYgKCFkZXNjIHx8IChcImdldFwiIGluIGRlc2MgPyAhbS5fX2VzTW9kdWxlIDogZGVzYy53cml0YWJsZSB8fCBkZXNjLmNvbmZpZ3VyYWJsZSkpIHtcclxuICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgZGVzYyk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KSk7XHJcbnZhciBfX2V4cG9ydFN0YXIgPSAodGhpcyAmJiB0aGlzLl9fZXhwb3J0U3RhcikgfHwgZnVuY3Rpb24obSwgZXhwb3J0cykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRzLCBwKSkgX19jcmVhdGVCaW5kaW5nKGV4cG9ydHMsIG0sIHApO1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMucGFyc2VSZXBsYXlGcmFtZXNGcm9tUmF3ID0gZXhwb3J0cy5wYXJzZUJsdWVwcmludCA9IHZvaWQgMDtcclxuLy8gYXVkaW9cclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2F1ZGlvL0hpdFNhbXBsZUluZm9cIiksIGV4cG9ydHMpO1xyXG4vLyBiZWF0bWFwXHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9iZWF0bWFwL0NvbnRyb2xQb2ludHMvQ29udHJvbFBvaW50XCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2JlYXRtYXAvQ29udHJvbFBvaW50cy9Db250cm9sUG9pbnRHcm91cFwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9iZWF0bWFwL0NvbnRyb2xQb2ludHMvRGlmZmljdWx0eUNvbnRyb2xQb2ludFwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9iZWF0bWFwL0NvbnRyb2xQb2ludHMvVGltaW5nQ29udHJvbFBvaW50XCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL21vZHMvSGFyZFJvY2tNb2RcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vbW9kcy9Nb2RzXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL21vZHMvU3RhY2tpbmdNb2RcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vYmVhdG1hcC9CZWF0bWFwQnVpbGRlclwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9iZWF0bWFwL0JlYXRtYXBEaWZmaWN1bHR5XCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2JlYXRtYXAvQmVhdG1hcFwiKSwgZXhwb3J0cyk7XHJcbi8vIGJsdWVwcmludHNcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2JsdWVwcmludC9CbHVlcHJpbnRcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vYmx1ZXByaW50L0hpdE9iamVjdFNldHRpbmdzXCIpLCBleHBvcnRzKTtcclxudmFyIEJsdWVwcmludFBhcnNlcl8xID0gcmVxdWlyZShcIi4vYmx1ZXByaW50L0JsdWVwcmludFBhcnNlclwiKTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwicGFyc2VCbHVlcHJpbnRcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIEJsdWVwcmludFBhcnNlcl8xLnBhcnNlQmx1ZXByaW50OyB9IH0pO1xyXG4vLyBoaXRvYmplY3RzXHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9oaXRvYmplY3RzL3NsaWRlci9QYXRoQXBwcm94aW1hdG9yXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2hpdG9iamVjdHMvc2xpZGVyL1BhdGhDb250cm9sUG9pbnRcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vaGl0b2JqZWN0cy9zbGlkZXIvUGF0aFR5cGVcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vaGl0b2JqZWN0cy9zbGlkZXIvU2xpZGVyUGF0aFwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9oaXRvYmplY3RzL0hpdENpcmNsZVwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9oaXRvYmplY3RzL1R5cGVzXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2hpdG9iamVjdHMvU2xpZGVyXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2hpdG9iamVjdHMvU2xpZGVyQ2hlY2tQb2ludFwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9oaXRvYmplY3RzL1NwaW5uZXJcIiksIGV4cG9ydHMpO1xyXG4vLyBnYW1lcGxheVxyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZ2FtZXBsYXkvR2FtZXBsYXlBbmFseXNpc0V2ZW50XCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2dhbWVwbGF5L0dhbWVwbGF5SW5mb1wiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9nYW1lcGxheS9HYW1lU3RhdGVcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZ2FtZXBsYXkvR2FtZVN0YXRlRXZhbHVhdG9yXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2dhbWVwbGF5L0dhbWVTdGF0ZVRpbWVNYWNoaW5lXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2dhbWVwbGF5L1ZlcmRpY3RzXCIpLCBleHBvcnRzKTtcclxuLy8gcmVwbGF5c1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vcmVwbGF5cy9SYXdSZXBsYXlEYXRhXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3JlcGxheXMvUmVwbGF5XCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3JlcGxheXMvUmVwbGF5Q2xpY2tzXCIpLCBleHBvcnRzKTtcclxudmFyIFJlcGxheVBhcnNlcl8xID0gcmVxdWlyZShcIi4vcmVwbGF5cy9SZXBsYXlQYXJzZXJcIik7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcInBhcnNlUmVwbGF5RnJhbWVzRnJvbVJhd1wiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gUmVwbGF5UGFyc2VyXzEucGFyc2VSZXBsYXlGcmFtZXNGcm9tUmF3OyB9IH0pO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vcGxheWZpZWxkXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3V0aWxzL2luZGV4XCIpLCBleHBvcnRzKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5FYXN5TW9kID0gdm9pZCAwO1xyXG5jb25zdCByYXRpbyA9IDAuNTtcclxuY2xhc3MgRWFzeU1vZCB7XHJcbn1cclxuZXhwb3J0cy5FYXN5TW9kID0gRWFzeU1vZDtcclxuRWFzeU1vZC5kaWZmaWN1bHR5QWRqdXN0ZXIgPSAoYmFzZSkgPT4gKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgYmFzZSksIHsgb3ZlcmFsbERpZmZpY3VsdHk6IGJhc2Uub3ZlcmFsbERpZmZpY3VsdHkgKiByYXRpbywgYXBwcm9hY2hSYXRlOiBiYXNlLmFwcHJvYWNoUmF0ZSAqIHJhdGlvLCBkcmFpblJhdGU6IGJhc2UuZHJhaW5SYXRlICogcmF0aW8sIGNpcmNsZVNpemU6IGJhc2UuY2lyY2xlU2l6ZSAqIHJhdGlvIH0pKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5IYXJkUm9ja01vZCA9IHZvaWQgMDtcclxuY29uc3QgVHlwZXNfMSA9IHJlcXVpcmUoXCIuLi9oaXRvYmplY3RzL1R5cGVzXCIpO1xyXG5jb25zdCBwbGF5ZmllbGRfMSA9IHJlcXVpcmUoXCIuLi9wbGF5ZmllbGRcIik7XHJcbmZ1bmN0aW9uIGZsaXBZKHBvc2l0aW9uKSB7XHJcbiAgICBjb25zdCB7IHgsIHkgfSA9IHBvc2l0aW9uO1xyXG4gICAgcmV0dXJuIHsgeCwgeTogcGxheWZpZWxkXzEuT1NVX1BMQVlGSUVMRF9IRUlHSFQgLSB5IH07XHJcbn1cclxuY2xhc3MgSGFyZFJvY2tNb2Qge1xyXG59XHJcbmV4cG9ydHMuSGFyZFJvY2tNb2QgPSBIYXJkUm9ja01vZDtcclxuSGFyZFJvY2tNb2QuZGlmZmljdWx0eUFkanVzdGVyID0gKGJhc2UpID0+IChPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGJhc2UpLCB7IG92ZXJhbGxEaWZmaWN1bHR5OiBNYXRoLm1pbigxMCwgYmFzZS5vdmVyYWxsRGlmZmljdWx0eSAqIDEuNCksIGFwcHJvYWNoUmF0ZTogTWF0aC5taW4oMTAsIGJhc2UuYXBwcm9hY2hSYXRlICogMS40KSwgZHJhaW5SYXRlOiBNYXRoLm1pbigxMCwgYmFzZS5kcmFpblJhdGUgKiAxLjQpLCBjaXJjbGVTaXplOiBNYXRoLm1pbigxMCwgYmFzZS5jaXJjbGVTaXplICogMS4zKSB9KSk7XHJcbkhhcmRSb2NrTW9kLmZsaXBWZXJ0aWNhbGx5ID0gKGhpdE9iamVjdHMpID0+IHtcclxuICAgIGhpdE9iamVjdHMuZm9yRWFjaCgoaCkgPT4ge1xyXG4gICAgICAgIGlmICgoMCwgVHlwZXNfMS5pc0hpdENpcmNsZSkoaCkpIHtcclxuICAgICAgICAgICAgaC5wb3NpdGlvbiA9IGZsaXBZKGgucG9zaXRpb24pO1xyXG4gICAgICAgICAgICBoLnVuc3RhY2tlZFBvc2l0aW9uID0gZmxpcFkoaC51bnN0YWNrZWRQb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCgwLCBUeXBlc18xLmlzU2xpZGVyKShoKSkge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBOZWVkIHRvIHNldCBpbnZhbGlkIGFzIHdlbGwgb3IganVzdCByZWNyZWF0ZSB0aGUgY2hlY2twb2ludHMgZnJvbSBjb250cm9sIHBvaW50c1xyXG4gICAgICAgICAgICBoLmhlYWQucG9zaXRpb24gPSBmbGlwWShoLmhlYWQucG9zaXRpb24pO1xyXG4gICAgICAgICAgICBoLmhlYWQudW5zdGFja2VkUG9zaXRpb24gPSBmbGlwWShoLmhlYWQudW5zdGFja2VkUG9zaXRpb24pO1xyXG4gICAgICAgICAgICBoLnBhdGguY29udHJvbFBvaW50cy5mb3JFYWNoKChwKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBwLm9mZnNldC55ICo9IC0xO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaC5wYXRoLm1ha2VJbnZhbGlkKCk7XHJcbiAgICAgICAgICAgIGguY2hlY2tQb2ludHMuZm9yRWFjaCgocCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcC5vZmZzZXQueSAqPSAtMTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuUkVMQVhfTEVOSUVOQ1kgPSBleHBvcnRzLk1vZFNldHRpbmdzID0gZXhwb3J0cy5Pc3VDbGFzc2ljTW9kcyA9IHZvaWQgMDtcclxuY29uc3QgSGFyZFJvY2tNb2RfMSA9IHJlcXVpcmUoXCIuL0hhcmRSb2NrTW9kXCIpO1xyXG5jb25zdCBFYXN5TW9kXzEgPSByZXF1aXJlKFwiLi9FYXN5TW9kXCIpO1xyXG4vLyBodHRwczovL29zdS5wcHkuc2gvd2lraS9lbi9HYW1lX21vZGlmaWVyXHJcbmV4cG9ydHMuT3N1Q2xhc3NpY01vZHMgPSBbXHJcbiAgICBcIkVBU1lcIixcclxuICAgIFwiSEFMRl9USU1FXCIsXHJcbiAgICBcIk5PX0ZBSUxcIixcclxuICAgIFwiSEFSRF9ST0NLXCIsXHJcbiAgICBcIlNVRERFTl9ERUFUSFwiLFxyXG4gICAgXCJQRVJGRUNUXCIsXHJcbiAgICBcIkRPVUJMRV9USU1FXCIsXHJcbiAgICBcIk5JR0hUX0NPUkVcIixcclxuICAgIFwiSElEREVOXCIsXHJcbiAgICBcIkZMQVNIX0xJR0hUXCIsXHJcbiAgICBcIkFVVE9fUExBWVwiLFxyXG4gICAgXCJBVVRPX1BJTE9UXCIsXHJcbiAgICBcIlJFTEFYXCIsXHJcbiAgICBcIlNQVU5fT1VUXCIsXHJcbiAgICBcIlNDT1JFX1YyXCIsXHJcbl07XHJcbmV4cG9ydHMuTW9kU2V0dGluZ3MgPSB7XHJcbiAgICBFQVNZOiB7XHJcbiAgICAgICAgbmFtZTogXCJFYXN5XCIsXHJcbiAgICAgICAgZGlmZmljdWx0eUFkanVzdGVyOiBFYXN5TW9kXzEuRWFzeU1vZC5kaWZmaWN1bHR5QWRqdXN0ZXIsXHJcbiAgICAgICAgc2NvcmVNdWx0aXBsaWVyOiAwLjUsXHJcbiAgICB9LFxyXG4gICAgSEFSRF9ST0NLOiB7XHJcbiAgICAgICAgbmFtZTogXCJIYXJkIFJvY2tcIixcclxuICAgICAgICBzY29yZU11bHRpcGxpZXI6IDEuMDYsXHJcbiAgICAgICAgZGlmZmljdWx0eUFkanVzdGVyOiBIYXJkUm9ja01vZF8xLkhhcmRSb2NrTW9kLmRpZmZpY3VsdHlBZGp1c3RlcixcclxuICAgIH0sXHJcbiAgICBET1VCTEVfVElNRTogeyBuYW1lOiBcIkRvdWJsZSBUaW1lXCIsIHNjb3JlTXVsdGlwbGllcjogMS4xMiB9LFxyXG4gICAgRkxBU0hfTElHSFQ6IHsgbmFtZTogXCJGbGFzaCBMaWdodFwiLCBzY29yZU11bHRpcGxpZXI6IDEuMTIgfSxcclxuICAgIEhBTEZfVElNRTogeyBuYW1lOiBcIkhhbGYgVGltZVwiLCBzY29yZU11bHRpcGxpZXI6IDAuMyB9LFxyXG4gICAgSElEREVOOiB7IG5hbWU6IFwiSGlkZGVuXCIsIHNjb3JlTXVsdGlwbGllcjogMS4wNiB9LFxyXG4gICAgTklHSFRfQ09SRTogeyBuYW1lOiBcIk5pZ2h0IENvcmVcIiwgc2NvcmVNdWx0aXBsaWVyOiAxLjEyIH0sXHJcbiAgICBOT19GQUlMOiB7IG5hbWU6IFwiTm8gRmFpbFwiLCBzY29yZU11bHRpcGxpZXI6IDAuNSB9LFxyXG4gICAgQVVUT19QTEFZOiB7IG5hbWU6IFwiQXV0byBQbGF5XCIgfSxcclxuICAgIEFVVE9fUElMT1Q6IHsgbmFtZTogXCJBdXRvIFBpbG90XCIgfSxcclxuICAgIFBFUkZFQ1Q6IHsgbmFtZTogXCJQZXJmZWN0XCIgfSxcclxuICAgIFJFTEFYOiB7IG5hbWU6IFwiUmVsYXhcIiB9LFxyXG4gICAgU0NPUkVfVjI6IHsgbmFtZTogXCJTY29yZSBWMlwiIH0sXHJcbiAgICBTUFVOX09VVDogeyBuYW1lOiBcIlNwdW4gT3V0XCIgfSxcclxuICAgIFNVRERFTl9ERUFUSDogeyBuYW1lOiBcIlN1ZGRlbiBEZWF0aFwiIH0sXHJcbn07XHJcbi8vIEhvdyBlYXJseSBiZWZvcmUgYSBoaXRvYmplY3QncyB0aW1lIFJlbGF4IGNhbiBoaXQuIChpbiBtcylcclxuZXhwb3J0cy5SRUxBWF9MRU5JRU5DWSA9IDEyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLm1vZGlmeVN0YWNraW5nUG9zaXRpb24gPSB2b2lkIDA7XHJcbmNvbnN0IGluZGV4XzEgPSByZXF1aXJlKFwiLi4vLi4vbWF0aC9pbmRleFwiKTtcclxuY29uc3QgVHlwZXNfMSA9IHJlcXVpcmUoXCIuLi9oaXRvYmplY3RzL1R5cGVzXCIpO1xyXG5mdW5jdGlvbiBzdGFja09mZnNldChzdGFja0hlaWdodCwgc2NhbGUpIHtcclxuICAgIGNvbnN0IHZhbHVlID0gKDAsIGluZGV4XzEuZmxvYXQzMl9tdWwpKHN0YWNrSGVpZ2h0LCAoMCwgaW5kZXhfMS5mbG9hdDMyX211bCkoc2NhbGUsIC02LjQpKTtcclxuICAgIHJldHVybiB7IHg6IHZhbHVlLCB5OiB2YWx1ZSB9O1xyXG59XHJcbmZ1bmN0aW9uIHN0YWNrZWRQb3NpdGlvbihpbml0aWFsUG9zaXRpb24sIHN0YWNrSGVpZ2h0LCBzY2FsZSkge1xyXG4gICAgY29uc3Qgb2Zmc2V0ID0gc3RhY2tPZmZzZXQoc3RhY2tIZWlnaHQsIHNjYWxlKTtcclxuICAgIHJldHVybiBpbmRleF8xLlZlYzIuYWRkKGluaXRpYWxQb3NpdGlvbiwgb2Zmc2V0KTtcclxufVxyXG5jb25zdCBTVEFDS19ESVNUQU5DRSA9IDM7XHJcbi8vIEkgcmVmdXNlIHRvIHB1dCBhbiBlbmRQb3NpdGlvbiBhbmQgZW5kVGltZSBpbnRvIEhpdENpcmNsZSBqdXN0IGJlY2F1c2UgaXQncyB0aGVuIGVhc2llciB0byBjb2RlIGl0IGhlcmVcclxuLy8gSG93IGRvZXMgaXQgZXZlbiBtYWtlIHNlbnNlIHRoYXQgYW4gSGl0Q2lyY2xlIGhhcyBhbiBcImVuZFBvc2l0aW9uXCIgb3IgXCJlbmRUaW1lXCIuXHJcbi8vIE9yIGhvdyBkb2VzIGl0IG1ha2Ugc2Vuc2UgdGhhdCBhIFNwaW5uZXIgaGFzIGEgc3RhY2tpbmcgcG9zaXRpb24sIHdoZW4gaXQgZXZlbiBkb2Vzbid0IGhhdmUgYSBwb3NpdGlvbj9cclxuY29uc3QgaGl0Q2lyY2xlID0gKG8pID0+ICgoMCwgVHlwZXNfMS5pc1NsaWRlcikobykgPyBvLmhlYWQgOiBvKTtcclxuY29uc3QgYXBwcm9hY2hEdXJhdGlvbiA9IChvKSA9PiBoaXRDaXJjbGUobykuYXBwcm9hY2hEdXJhdGlvbjtcclxuY29uc3QgaGl0VGltZSA9IChvKSA9PiBoaXRDaXJjbGUobykuaGl0VGltZTtcclxuY29uc3QgcG9zaXRpb24gPSAobykgPT4gaGl0Q2lyY2xlKG8pLnBvc2l0aW9uO1xyXG5jb25zdCBlbmRQb3NpdGlvbiA9IChvKSA9PiAoKDAsIFR5cGVzXzEuaXNTbGlkZXIpKG8pID8gby5lbmRQb3NpdGlvbiA6IG8ucG9zaXRpb24pO1xyXG5jb25zdCBlbmRUaW1lID0gKG8pID0+ICgoMCwgVHlwZXNfMS5pc1NsaWRlcikobykgPyBvLmVuZFRpbWUgOiBvLmhpdFRpbWUpO1xyXG5mdW5jdGlvbiBjcmVhdGVTdGFja2luZ0hlaWdodHMoaGl0T2JqZWN0cykge1xyXG4gICAgY29uc3Qgc3RhY2tpbmdIZWlnaHRzID0gbmV3IE1hcCgpO1xyXG4gICAgZnVuY3Rpb24gc2V0SChvLCB2YWwpIHtcclxuICAgICAgICBzdGFja2luZ0hlaWdodHMuc2V0KGhpdENpcmNsZShvKS5pZCwgdmFsKTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEgobykge1xyXG4gICAgICAgIHZhciBfYTtcclxuICAgICAgICByZXR1cm4gKF9hID0gc3RhY2tpbmdIZWlnaHRzLmdldChoaXRDaXJjbGUobykuaWQpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiAwO1xyXG4gICAgfVxyXG4gICAgLy8gVGhleSBhbGwgaGF2ZSAwIGFzIHN0YWNrIGhlaWdodHNcclxuICAgIGZvciAoY29uc3QgaG8gb2YgaGl0T2JqZWN0cykge1xyXG4gICAgICAgIGlmICghKDAsIFR5cGVzXzEuaXNTcGlubmVyKShobykpIHtcclxuICAgICAgICAgICAgc2V0SChobywgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHsgc3RhY2tpbmdIZWlnaHRzLCBzZXRILCBIIH07XHJcbn1cclxuZnVuY3Rpb24gbmV3U3RhY2tpbmdIZWlnaHRzKGhpdE9iamVjdHMsIHN0YWNrTGVuaWVuY3kpIHtcclxuICAgIGNvbnN0IHN0YXJ0SW5kZXggPSAwO1xyXG4gICAgY29uc3QgZW5kSW5kZXggPSBoaXRPYmplY3RzLmxlbmd0aCAtIDE7XHJcbiAgICBjb25zdCBleHRlbmRlZEVuZEluZGV4ID0gZW5kSW5kZXg7XHJcbiAgICBjb25zdCB7IHN0YWNraW5nSGVpZ2h0cywgc2V0SCwgSCB9ID0gY3JlYXRlU3RhY2tpbmdIZWlnaHRzKGhpdE9iamVjdHMpO1xyXG4gICAgLy8gUmV2ZXJzZSBwYXNzIGZvciBzdGFjayBjYWxjdWxhdGlvblxyXG4gICAgbGV0IGV4dGVuZGVkU3RhcnRJbmRleCA9IHN0YXJ0SW5kZXg7XHJcbiAgICBmb3IgKGxldCBpID0gZXh0ZW5kZWRFbmRJbmRleDsgaSA+IHN0YXJ0SW5kZXg7IGktLSkge1xyXG4gICAgICAgIGxldCBuID0gaTtcclxuICAgICAgICBsZXQgb2JqZWN0SSA9IGhpdE9iamVjdHNbaV07XHJcbiAgICAgICAgaWYgKCgwLCBUeXBlc18xLmlzU3Bpbm5lcikob2JqZWN0SSkgfHwgSChvYmplY3RJKSAhPT0gMClcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgY29uc3Qgc3RhY2tUaHJlc2hvbGQgPSBhcHByb2FjaER1cmF0aW9uKG9iamVjdEkpICogc3RhY2tMZW5pZW5jeTtcclxuICAgICAgICBpZiAoKDAsIFR5cGVzXzEuaXNIaXRDaXJjbGUpKG9iamVjdEkpKSB7XHJcbiAgICAgICAgICAgIHdoaWxlICgtLW4gPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0TiA9IGhpdE9iamVjdHNbbl07XHJcbiAgICAgICAgICAgICAgICBpZiAoKDAsIFR5cGVzXzEuaXNTcGlubmVyKShvYmplY3ROKSlcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGlmIChoaXRUaW1lKG9iamVjdEkpIC0gZW5kVGltZShvYmplY3ROKSA+IHN0YWNrVGhyZXNob2xkKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgaWYgKG4gPCBleHRlbmRlZFN0YXJ0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRIKG9iamVjdE4sIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZGVkU3RhcnRJbmRleCA9IG47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoKDAsIFR5cGVzXzEuaXNTbGlkZXIpKG9iamVjdE4pICYmIGluZGV4XzEuVmVjMi5kaXN0YW5jZShlbmRQb3NpdGlvbihvYmplY3ROKSwgcG9zaXRpb24ob2JqZWN0SSkpIDwgU1RBQ0tfRElTVEFOQ0UpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSBIKG9iamVjdEkpIC0gSChvYmplY3ROKSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IG4gKyAxOyBqIDw9IGk7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmplY3RKID0gaGl0T2JqZWN0c1tqXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCgwLCBUeXBlc18xLmlzU3Bpbm5lcikob2JqZWN0SikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTsgLy8gVE9ETzogSW5zZXJ0ZWQsIGJ1dCBub3Qgc3VyZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXhfMS5WZWMyLmRpc3RhbmNlKGVuZFBvc2l0aW9uKG9iamVjdE4pLCBwb3NpdGlvbihvYmplY3RKKSkgPCBTVEFDS19ESVNUQU5DRSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SChvYmplY3RKLCBIKG9iamVjdEopIC0gb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpbmRleF8xLlZlYzIuZGlzdGFuY2UocG9zaXRpb24ob2JqZWN0TiksIHBvc2l0aW9uKG9iamVjdEkpKSA8IFNUQUNLX0RJU1RBTkNFKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0SChvYmplY3ROLCBIKG9iamVjdEkpICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0SSA9IG9iamVjdE47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHdoaWxlICgtLW4gPj0gc3RhcnRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0TiA9IGhpdE9iamVjdHNbbl07XHJcbiAgICAgICAgICAgICAgICBpZiAoKDAsIFR5cGVzXzEuaXNTcGlubmVyKShvYmplY3ROKSlcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGlmIChoaXRUaW1lKG9iamVjdEkpIC0gaGl0VGltZShvYmplY3ROKSA+IHN0YWNrVGhyZXNob2xkKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4XzEuVmVjMi5kaXN0YW5jZShlbmRQb3NpdGlvbihvYmplY3ROKSwgcG9zaXRpb24ob2JqZWN0SSkpIDwgU1RBQ0tfRElTVEFOQ0UpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRIKG9iamVjdE4sIEgob2JqZWN0SSkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICBvYmplY3RJID0gb2JqZWN0TjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzdGFja2luZ0hlaWdodHM7XHJcbn1cclxuZnVuY3Rpb24gb2xkU3RhY2tpbmdIZWlnaHRzKGhpdE9iamVjdHMsIHN0YWNrTGVuaWVuY3kpIHtcclxuICAgIGNvbnN0IHsgc3RhY2tpbmdIZWlnaHRzLCBILCBzZXRIIH0gPSBjcmVhdGVTdGFja2luZ0hlaWdodHMoaGl0T2JqZWN0cyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhpdE9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBjdXJySGl0T2JqZWN0ID0gaGl0T2JqZWN0c1tpXTtcclxuICAgICAgICBpZiAoKDAsIFR5cGVzXzEuaXNTcGlubmVyKShjdXJySGl0T2JqZWN0KSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgaWYgKEgoY3VyckhpdE9iamVjdCkgIT09IDAgJiYgISgwLCBUeXBlc18xLmlzU2xpZGVyKShjdXJySGl0T2JqZWN0KSkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHN0YXJ0VGltZSA9IGVuZFRpbWUoY3VyckhpdE9iamVjdCk7XHJcbiAgICAgICAgbGV0IHNsaWRlclN0YWNrID0gMDtcclxuICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBoaXRPYmplY3RzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YWNrVGhyZXNob2xkID0gYXBwcm9hY2hEdXJhdGlvbihjdXJySGl0T2JqZWN0KSAqIHN0YWNrTGVuaWVuY3k7XHJcbiAgICAgICAgICAgIGNvbnN0IG5leHRIaXRPYmplY3QgPSBoaXRPYmplY3RzW2pdO1xyXG4gICAgICAgICAgICBpZiAoKDAsIFR5cGVzXzEuaXNTcGlubmVyKShuZXh0SGl0T2JqZWN0KSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBpZiAoaGl0VGltZShuZXh0SGl0T2JqZWN0KSAtIHN0YWNrVGhyZXNob2xkID4gc3RhcnRUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbjIgPSAoMCwgVHlwZXNfMS5pc1NsaWRlcikoY3VyckhpdE9iamVjdCkgPyBjdXJySGl0T2JqZWN0LmVuZFBvc2l0aW9uIDogY3VyckhpdE9iamVjdC5wb3NpdGlvbjtcclxuICAgICAgICAgICAgaWYgKGluZGV4XzEuVmVjMi53aXRoaW5EaXN0YW5jZShwb3NpdGlvbihuZXh0SGl0T2JqZWN0KSwgcG9zaXRpb24oY3VyckhpdE9iamVjdCksIFNUQUNLX0RJU1RBTkNFKSkge1xyXG4gICAgICAgICAgICAgICAgc2V0SChjdXJySGl0T2JqZWN0LCBIKGN1cnJIaXRPYmplY3QpICsgMSk7XHJcbiAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSBlbmRUaW1lKG5leHRIaXRPYmplY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGluZGV4XzEuVmVjMi53aXRoaW5EaXN0YW5jZShwb3NpdGlvbihuZXh0SGl0T2JqZWN0KSwgcG9zaXRpb24yLCBTVEFDS19ESVNUQU5DRSkpIHtcclxuICAgICAgICAgICAgICAgIHNsaWRlclN0YWNrKys7XHJcbiAgICAgICAgICAgICAgICBzZXRIKG5leHRIaXRPYmplY3QsIEgobmV4dEhpdE9iamVjdCkgLSBzbGlkZXJTdGFjayk7XHJcbiAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSBlbmRUaW1lKG5leHRIaXRPYmplY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0YWNraW5nSGVpZ2h0cztcclxufVxyXG4vLyBNb2RpZmllcyB0aGUgaGl0T2JqZWN0cyBhY2NvcmRpbmcgdG8gdGhlIHN0YWNraW5nIGFsZ29yaXRobS5cclxuZnVuY3Rpb24gbW9kaWZ5U3RhY2tpbmdQb3NpdGlvbihoaXRPYmplY3RzLCBzdGFja0xlbmllbmN5LCBiZWF0bWFwVmVyc2lvbikge1xyXG4gICAgY29uc3QgaGVpZ2h0cyA9ICgoKSA9PiB7XHJcbiAgICAgICAgaWYgKGJlYXRtYXBWZXJzaW9uID49IDYpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ld1N0YWNraW5nSGVpZ2h0cyhoaXRPYmplY3RzLCBzdGFja0xlbmllbmN5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBvbGRTdGFja2luZ0hlaWdodHMoaGl0T2JqZWN0cywgc3RhY2tMZW5pZW5jeSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkoKTtcclxuICAgIGhpdE9iamVjdHMuZm9yRWFjaCgoaGl0T2JqZWN0KSA9PiB7XHJcbiAgICAgICAgaWYgKCgwLCBUeXBlc18xLmlzU3Bpbm5lcikoaGl0T2JqZWN0KSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGggPSBoaXRDaXJjbGUoaGl0T2JqZWN0KTtcclxuICAgICAgICBjb25zdCBoZWlnaHQgPSBoZWlnaHRzLmdldChoLmlkKTtcclxuICAgICAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJTdGFjayBoZWlnaHQgY2FuJ3QgYmUgdW5kZWZpbmVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBoLnBvc2l0aW9uID0gc3RhY2tlZFBvc2l0aW9uKGgucG9zaXRpb24sIGhlaWdodCwgaC5zY2FsZSk7XHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLm1vZGlmeVN0YWNraW5nUG9zaXRpb24gPSBtb2RpZnlTdGFja2luZ1Bvc2l0aW9uO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLk9TVV9QTEFZRklFTERfV0lEVEggPSBleHBvcnRzLk9TVV9QTEFZRklFTERfSEVJR0hUID0gdm9pZCAwO1xyXG5leHBvcnRzLk9TVV9QTEFZRklFTERfSEVJR0hUID0gMzg0O1xyXG5leHBvcnRzLk9TVV9QTEFZRklFTERfV0lEVEggPSA1MTI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMubW9kc1RvQml0bWFzayA9IGV4cG9ydHMubW9kc0Zyb21CaXRtYXNrID0gZXhwb3J0cy5SZXBsYXlNb2RCaXQgPSBleHBvcnRzLlJhd1JlcGxheURhdGEgPSB2b2lkIDA7XHJcbi8qKlxyXG4gKiBUaGUgb25lIHRoYXQgZ2V0cyBwYXJzZWQgZnJvbSBhbiAub3NyIGZpbGVcclxuICogVGhpcyBpcyBleGFjdGx5IGxpa2UgdGhlIG9uZSB5b3Ugd291bGQgZ2V0IGZyb20gb3NyLW5vZGVcclxuICovXHJcbmNvbnN0IE1vZHNfMSA9IHJlcXVpcmUoXCIuLi9tb2RzL01vZHNcIik7XHJcbmNsYXNzIFJhd1JlcGxheURhdGEge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5nYW1lTW9kZSA9IDA7XHJcbiAgICAgICAgdGhpcy5nYW1lVmVyc2lvbiA9IDA7XHJcbiAgICAgICAgdGhpcy5iZWF0bWFwTUQ1ID0gXCJcIjtcclxuICAgICAgICB0aGlzLnBsYXllck5hbWUgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMucmVwbGF5TUQ1ID0gXCJcIjtcclxuICAgICAgICB0aGlzLm51bWJlcl8zMDBzID0gMDtcclxuICAgICAgICB0aGlzLm51bWJlcl8xMDBzID0gMDtcclxuICAgICAgICB0aGlzLm51bWJlcl81MHMgPSAwO1xyXG4gICAgICAgIHRoaXMuZ2VraXMgPSAwO1xyXG4gICAgICAgIHRoaXMua2F0dXMgPSAwO1xyXG4gICAgICAgIHRoaXMubWlzc2VzID0gMDtcclxuICAgICAgICB0aGlzLnNjb3JlID0gMDtcclxuICAgICAgICB0aGlzLm1heF9jb21ibyA9IDA7XHJcbiAgICAgICAgdGhpcy5wZXJmZWN0X2NvbWJvID0gMDtcclxuICAgICAgICB0aGlzLm1vZHMgPSAwO1xyXG4gICAgICAgIHRoaXMubGlmZV9iYXIgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMudGltZXN0YW1wID0gMDtcclxuICAgICAgICB0aGlzLnJlcGxheV9sZW5ndGggPSAwO1xyXG4gICAgICAgIHRoaXMucmVwbGF5X2RhdGEgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMudW5rbm93biA9IDA7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5SYXdSZXBsYXlEYXRhID0gUmF3UmVwbGF5RGF0YTtcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3BweS9vc3UvYmxvYi83NjU0ZGY5NGY2ZjM3YjgzODJiZTdkZmNiNGY2NzRlMDNiZDM1NDI3L29zdS5HYW1lL0JlYXRtYXBzL0xlZ2FjeS9MZWdhY3lNb2RzLmNzXHJcbmV4cG9ydHMuUmVwbGF5TW9kQml0ID0ge1xyXG4gICAgTk9fRkFJTDogMSA8PCAwLFxyXG4gICAgRUFTWTogMSA8PCAxLFxyXG4gICAgLy8gXCJUT1VDSF9ERVZJQ0VcIjogMSA8PCAyLFxyXG4gICAgSElEREVOOiAxIDw8IDMsXHJcbiAgICBIQVJEX1JPQ0s6IDEgPDwgNCxcclxuICAgIFNVRERFTl9ERUFUSDogMSA8PCA1LFxyXG4gICAgRE9VQkxFX1RJTUU6IDEgPDwgNixcclxuICAgIFJFTEFYOiAxIDw8IDcsXHJcbiAgICBIQUxGX1RJTUU6IDEgPDwgOCxcclxuICAgIE5JR0hUX0NPUkU6IDEgPDwgOSxcclxuICAgIEZMQVNIX0xJR0hUOiAxIDw8IDEwLFxyXG4gICAgQVVUT19QTEFZOiAxIDw8IDExLFxyXG4gICAgU1BVTl9PVVQ6IDEgPDwgMTIsXHJcbiAgICBBVVRPX1BJTE9UOiAxIDw8IDEzLFxyXG4gICAgUEVSRkVDVDogMSA8PCAxNCxcclxuICAgIFNDT1JFX1YyOiAxIDw8IDI5LFxyXG59O1xyXG5mdW5jdGlvbiBtb2RzRnJvbUJpdG1hc2sobW9kTWFzaykge1xyXG4gICAgY29uc3QgbGlzdCA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBtb2Qgb2YgTW9kc18xLk9zdUNsYXNzaWNNb2RzKSB7XHJcbiAgICAgICAgY29uc3QgYml0ID0gZXhwb3J0cy5SZXBsYXlNb2RCaXRbbW9kXTtcclxuICAgICAgICBpZiAoKG1vZE1hc2sgJiBiaXQpID4gMCkge1xyXG4gICAgICAgICAgICBsaXN0LnB1c2gobW9kKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbGlzdDtcclxufVxyXG5leHBvcnRzLm1vZHNGcm9tQml0bWFzayA9IG1vZHNGcm9tQml0bWFzaztcclxuZnVuY3Rpb24gbW9kc1RvQml0bWFzayhtb2RzKSB7XHJcbiAgICBsZXQgbWFzayA9IDA7XHJcbiAgICBmb3IgKGNvbnN0IG1vZCBvZiBtb2RzKSB7XHJcbiAgICAgICAgbWFzayB8PSAxIDw8IGV4cG9ydHMuUmVwbGF5TW9kQml0W21vZF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWFzaztcclxufVxyXG5leHBvcnRzLm1vZHNUb0JpdG1hc2sgPSBtb2RzVG9CaXRtYXNrO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLlJlcGxheUJ1dHRvblN0YXRlID0gZXhwb3J0cy5Pc3VBY3Rpb24gPSB2b2lkIDA7XHJcbnZhciBPc3VBY3Rpb247XHJcbihmdW5jdGlvbiAoT3N1QWN0aW9uKSB7XHJcbiAgICBPc3VBY3Rpb25bT3N1QWN0aW9uW1wibGVmdEJ1dHRvblwiXSA9IDBdID0gXCJsZWZ0QnV0dG9uXCI7XHJcbiAgICBPc3VBY3Rpb25bT3N1QWN0aW9uW1wicmlnaHRCdXR0b25cIl0gPSAxXSA9IFwicmlnaHRCdXR0b25cIjtcclxufSkoT3N1QWN0aW9uID0gZXhwb3J0cy5Pc3VBY3Rpb24gfHwgKGV4cG9ydHMuT3N1QWN0aW9uID0ge30pKTtcclxudmFyIFJlcGxheUJ1dHRvblN0YXRlO1xyXG4oZnVuY3Rpb24gKFJlcGxheUJ1dHRvblN0YXRlKSB7XHJcbiAgICBSZXBsYXlCdXR0b25TdGF0ZVtSZXBsYXlCdXR0b25TdGF0ZVtcIk5vbmVcIl0gPSAwXSA9IFwiTm9uZVwiO1xyXG4gICAgUmVwbGF5QnV0dG9uU3RhdGVbUmVwbGF5QnV0dG9uU3RhdGVbXCJMZWZ0MVwiXSA9IDFdID0gXCJMZWZ0MVwiO1xyXG4gICAgUmVwbGF5QnV0dG9uU3RhdGVbUmVwbGF5QnV0dG9uU3RhdGVbXCJSaWdodDFcIl0gPSAyXSA9IFwiUmlnaHQxXCI7XHJcbiAgICBSZXBsYXlCdXR0b25TdGF0ZVtSZXBsYXlCdXR0b25TdGF0ZVtcIkxlZnQyXCJdID0gNF0gPSBcIkxlZnQyXCI7XHJcbiAgICBSZXBsYXlCdXR0b25TdGF0ZVtSZXBsYXlCdXR0b25TdGF0ZVtcIlJpZ2h0MlwiXSA9IDhdID0gXCJSaWdodDJcIjtcclxuICAgIFJlcGxheUJ1dHRvblN0YXRlW1JlcGxheUJ1dHRvblN0YXRlW1wiU21va2VcIl0gPSAxNl0gPSBcIlNtb2tlXCI7XHJcbn0pKFJlcGxheUJ1dHRvblN0YXRlID0gZXhwb3J0cy5SZXBsYXlCdXR0b25TdGF0ZSB8fCAoZXhwb3J0cy5SZXBsYXlCdXR0b25TdGF0ZSA9IHt9KSk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuY2FsY3VsYXRlUmVwbGF5Q2xpY2tzID0gdm9pZCAwO1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVSZXBsYXlDbGlja3MoZnJhbWVzKSB7XHJcbiAgICBjb25zdCBjbGlja3MgPSBbW10sIFtdXTtcclxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IFtudWxsLCBudWxsXTtcclxuICAgIGZvciAoY29uc3QgZnJhbWUgb2YgZnJhbWVzKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyOyBpKyspIHtcclxuICAgICAgICAgICAgLy8gRW51bXMgYXJlIHNvIGJhZCBpbiB0ZXJtcyBvZiB0eXBlIHNhZmV0eVxyXG4gICAgICAgICAgICBjb25zdCBpc1ByZXNzaW5nID0gZnJhbWUuYWN0aW9ucy5pbmNsdWRlcyhpKTtcclxuICAgICAgICAgICAgaWYgKCFpc1ByZXNzaW5nICYmIHN0YXJ0VGltZVtpXSkge1xyXG4gICAgICAgICAgICAgICAgY2xpY2tzW2ldLnB1c2goW3N0YXJ0VGltZVtpXSwgZnJhbWUudGltZV0pO1xyXG4gICAgICAgICAgICAgICAgc3RhcnRUaW1lW2ldID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChpc1ByZXNzaW5nICYmIHN0YXJ0VGltZVtpXSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgc3RhcnRUaW1lW2ldID0gZnJhbWUudGltZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHN0YXJ0VGltZVtpXSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjbGlja3NbaV0ucHVzaChbc3RhcnRUaW1lW2ldLCAxZTldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2xpY2tzO1xyXG59XHJcbmV4cG9ydHMuY2FsY3VsYXRlUmVwbGF5Q2xpY2tzID0gY2FsY3VsYXRlUmVwbGF5Q2xpY2tzO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnBhcnNlUmVwbGF5RnJhbWVzRnJvbVJhdyA9IHZvaWQgMDtcclxuY29uc3QgUmVwbGF5XzEgPSByZXF1aXJlKFwiLi9SZXBsYXlcIik7XHJcbmNvbnN0IE1BWF9DT09SRElOQVRFX1ZBTFVFID0gMTMxMDcyO1xyXG4vLyBMZWdhY3lTY29yZURlY29kZXIuY3NcclxuLy8gUG93ZXJPZlR3byBiaXRcclxuY29uc3QgYml0bWFza0NoZWNrID0gKG1hc2ssIGJpdCkgPT4gKG1hc2sgJiBiaXQpICE9PSAwO1xyXG5jb25zdCBwYXJzZVJlcGxheUZyYW1lc0Zyb21SYXcgPSAocmF3U3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBmcmFtZVN0cmluZ3MgPSByYXdTdHJpbmcuc3BsaXQoXCIsXCIpO1xyXG4gICAgbGV0IGxhc3RUaW1lID0gMDtcclxuICAgIGNvbnN0IGZyYW1lcyA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZVN0cmluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBzcGxpdCA9IGZyYW1lU3RyaW5nc1tpXS5zcGxpdChcInxcIik7XHJcbiAgICAgICAgaWYgKHNwbGl0Lmxlbmd0aCA8IDQpXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmIChzcGxpdFswXSA9PT0gXCItMTIzNDVcIikge1xyXG4gICAgICAgICAgICAvLyBvc3UtbGF6ZXItY29tbWVudDogVGhlIHNlZWQgaXMgcHJvdmlkZWQgaW4gc3BsaXRbM10sIHdoaWNoIHdlJ2xsIG5lZWQgdG8gdXNlIGF0IHNvbWUgcG9pbnRcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGRpZmYgPSBwYXJzZUZsb2F0KHNwbGl0WzBdKTtcclxuICAgICAgICBjb25zdCBtb3VzZVggPSBwYXJzZUZsb2F0KHNwbGl0WzFdKTtcclxuICAgICAgICBjb25zdCBtb3VzZVkgPSBwYXJzZUZsb2F0KHNwbGl0WzJdKTtcclxuICAgICAgICBpZiAoTWF0aC5hYnMobW91c2VYKSA+IE1BWF9DT09SRElOQVRFX1ZBTFVFIHx8IE1hdGguYWJzKG1vdXNlWSkgPiBNQVhfQ09PUkRJTkFURV9WQUxVRSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIlZhbHVlIG92ZXJmbG93IHdoaWxlIHBhcnNpbmcgbW91c2UgY29vcmRpbmF0ZXNcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxhc3RUaW1lICs9IGRpZmY7XHJcbiAgICAgICAgaWYgKGkgPCAyICYmIG1vdXNlWCA9PT0gMjU2ICYmIG1vdXNlWSA9PT0gLTUwMClcclxuICAgICAgICAgICAgLy8gYXQgdGhlIHN0YXJ0IG9mIHRoZSByZXBsYXksIHN0YWJsZSBwbGFjZXMgdHdvIHJlcGxheSBmcmFtZXMsIGF0IHRpbWUgMCBhbmQgU2tpcEJvdW5kYXJ5IC0gMSwgcmVzcGVjdGl2ZWx5LlxyXG4gICAgICAgICAgICAvLyBib3RoIGZyYW1lcyB1c2UgYSBwb3NpdGlvbiBvZiAoMjU2LCAtNTAwKS5cclxuICAgICAgICAgICAgLy8gaWdub3JlIHRoZXNlIGZyYW1lcyBhcyB0aGV5IHNlcnZlIG5vIHJlYWwgcHVycG9zZSAoYW5kIGNhbiBldmVuIG1pc2xlYWQgcnVsZXNldC1zcGVjaWZpYyBoYW5kbGVycyAtIHNlZSBtYW5pYSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgLy8gb3N1LWxhemVyLWNvbW1lbnQ6IEF0IHNvbWUgcG9pbnQgd2UgcHJvYmFibHkgd2FudCB0byByZXdpbmQgYW5kIHBsYXkgYmFjayB0aGUgbmVnYXRpdmUtdGltZSBmcmFtZXNcclxuICAgICAgICAvLyBidXQgZm9yIG5vdyB3ZSdsbCBhY2hpZXZlIGVxdWFsIHBsYXliYWNrIHRvIHN0YWJsZSBieSBza2lwcGluZyBuZWdhdGl2ZSBmcmFtZXNcclxuICAgICAgICBpZiAoZGlmZiA8IDApXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIGNvbnN0IGFjdGlvbnMgPSBbXTtcclxuICAgICAgICBjb25zdCBiID0gcGFyc2VJbnQoc3BsaXRbM10pO1xyXG4gICAgICAgIGlmIChiaXRtYXNrQ2hlY2soYiwgUmVwbGF5XzEuUmVwbGF5QnV0dG9uU3RhdGUuTGVmdDEpIHx8IGJpdG1hc2tDaGVjayhiLCBSZXBsYXlfMS5SZXBsYXlCdXR0b25TdGF0ZS5MZWZ0MikpXHJcbiAgICAgICAgICAgIGFjdGlvbnMucHVzaChSZXBsYXlfMS5Pc3VBY3Rpb24ubGVmdEJ1dHRvbik7XHJcbiAgICAgICAgaWYgKGJpdG1hc2tDaGVjayhiLCBSZXBsYXlfMS5SZXBsYXlCdXR0b25TdGF0ZS5SaWdodDEpIHx8IGJpdG1hc2tDaGVjayhiLCBSZXBsYXlfMS5SZXBsYXlCdXR0b25TdGF0ZS5SaWdodDIpKVxyXG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goUmVwbGF5XzEuT3N1QWN0aW9uLnJpZ2h0QnV0dG9uKTtcclxuICAgICAgICBmcmFtZXMucHVzaCh7IGFjdGlvbnMsIHBvc2l0aW9uOiB7IHg6IG1vdXNlWCwgeTogbW91c2VZIH0sIHRpbWU6IGxhc3RUaW1lIH0pO1xyXG4gICAgfVxyXG4gICAgLy8gV2UgZG8gdGhlIGZvbGxvd2luZyBtZXJnaW5nIGJlY2F1c2Ugc29tZSBmcmFtZXMgaGF2ZSB0aGUgc2FtZSB0aW1lLCBidXQgdGhlIGFjdGlvbnMgaGF2ZSB0byBiZSBtZXJnZWQgdG9nZXRoZXIuXHJcbiAgICBjb25zdCBtZXJnZWRGcmFtZXMgPSBbXTtcclxuICAgIGxldCBsYXN0O1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAobGFzdCA9PT0gdW5kZWZpbmVkIHx8IGZyYW1lc1tpXS50aW1lICE9PSBsYXN0LnRpbWUpIHtcclxuICAgICAgICAgICAgbWVyZ2VkRnJhbWVzLnB1c2goZnJhbWVzW2ldKTtcclxuICAgICAgICAgICAgbGFzdCA9IGZyYW1lc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZnJhbWVzW2ldLmFjdGlvbnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGEgPSBmcmFtZXNbaV0uYWN0aW9uc1tqXTtcclxuICAgICAgICAgICAgICAgIGlmICghbGFzdC5hY3Rpb25zLmluY2x1ZGVzKGEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdC5hY3Rpb25zLnB1c2goYSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGFzdC5hY3Rpb25zLnNvcnQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWVyZ2VkRnJhbWVzO1xyXG59O1xyXG5leHBvcnRzLnBhcnNlUmVwbGF5RnJhbWVzRnJvbVJhdyA9IHBhcnNlUmVwbGF5RnJhbWVzRnJvbVJhdztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5Tb3J0ZWRMaXN0ID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uL21hdGgvaW5kZXhcIik7XHJcbmNsYXNzIFNvcnRlZExpc3Qge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ID0gW107XHJcbiAgICB9XHJcbiAgICAvLyBiaW5hcnkgc2VhcmNoIG9yIG5vdCAtPiB0aGUgaW5zZXJ0L3JlbW92ZSBpcyBhbHNvIE8obikgLi4uLlxyXG4gICAgaW5kZXhPZih0KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdC5maW5kSW5kZXgoKHZhbHVlKSA9PiAoMCwgaW5kZXhfMS5mbG9hdEVxdWFsKSh0LmNvbXBhcmVUbyh2YWx1ZSksIDApKTtcclxuICAgIH1cclxuICAgIC8vIFRoaXMgd2lsbCBhbHNvIG1haW50YWluIGluc2VydGlvbiBvcmRlciwgd2hpY2ggbWVhbnMgdGhhdCBhZGRpbmcgYSAyJyB0byBbMSwgMiwgM10gd2lsbCByZXN1bHQgdG8gWzEsIDIsIDInLCAzXS5cclxuICAgIGFkZCh0KSB7XHJcbiAgICAgICAgY29uc3QgaSA9IHRoaXMubGlzdC5maW5kSW5kZXgoKHZhbHVlKSA9PiB0LmNvbXBhcmVUbyh2YWx1ZSkgPCAwKTtcclxuICAgICAgICBpZiAoaSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZXJlIGlzIG5vIGVsZW1lbnQgdGhhdCBpcyBsYXJnZXIgdGhhbiB0aGUgZ2l2ZW4gdmFsdWVcclxuICAgICAgICAgICAgdGhpcy5saXN0LnNwbGljZSh0aGlzLmxpc3QubGVuZ3RoLCAwLCB0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdC5zcGxpY2UoaSwgMCwgdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVtb3ZlKHQpIHtcclxuICAgICAgICBjb25zdCBpID0gdGhpcy5pbmRleE9mKHQpO1xyXG4gICAgICAgIGlmIChpID4gLTEpIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0LnNwbGljZShpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXQoaSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RbaV07XHJcbiAgICB9XHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxpc3QubGVuZ3RoO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuU29ydGVkTGlzdCA9IFNvcnRlZExpc3Q7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuZGV0ZXJtaW5lRGVmYXVsdFBsYXliYWNrU3BlZWQgPSBleHBvcnRzLm5vcm1hbGl6ZUhpdE9iamVjdHMgPSB2b2lkIDA7XHJcbmNvbnN0IFNsaWRlcl8xID0gcmVxdWlyZShcIi4uL2hpdG9iamVjdHMvU2xpZGVyXCIpO1xyXG5mdW5jdGlvbiBub3JtYWxpemVIaXRPYmplY3RzKGhpdE9iamVjdHMpIHtcclxuICAgIGNvbnN0IGhpdE9iamVjdEJ5SWQgPSB7fTtcclxuICAgIGhpdE9iamVjdHMuZm9yRWFjaCgoaCkgPT4ge1xyXG4gICAgICAgIGhpdE9iamVjdEJ5SWRbaC5pZF0gPSBoO1xyXG4gICAgICAgIGlmIChoIGluc3RhbmNlb2YgU2xpZGVyXzEuU2xpZGVyKSB7XHJcbiAgICAgICAgICAgIGhpdE9iamVjdEJ5SWRbaC5oZWFkLmlkXSA9IGguaGVhZDtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBjIG9mIGguY2hlY2tQb2ludHMpIHtcclxuICAgICAgICAgICAgICAgIGhpdE9iamVjdEJ5SWRbYy5pZF0gPSBjO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gaGl0T2JqZWN0QnlJZDtcclxufVxyXG5leHBvcnRzLm5vcm1hbGl6ZUhpdE9iamVjdHMgPSBub3JtYWxpemVIaXRPYmplY3RzO1xyXG5mdW5jdGlvbiBkZXRlcm1pbmVEZWZhdWx0UGxheWJhY2tTcGVlZChtb2RzKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAobW9kc1tpXSA9PT0gXCJET1VCTEVfVElNRVwiIHx8IG1vZHNbaV0gPT09IFwiTklHSFRfQ09SRVwiKVxyXG4gICAgICAgICAgICByZXR1cm4gMS41O1xyXG4gICAgICAgIGlmIChtb2RzW2ldID09PSBcIkhBTEZfVElNRVwiKVxyXG4gICAgICAgICAgICByZXR1cm4gMC43NTtcclxuICAgIH1cclxuICAgIHJldHVybiAxLjA7XHJcbn1cclxuZXhwb3J0cy5kZXRlcm1pbmVEZWZhdWx0UGxheWJhY2tTcGVlZCA9IGRldGVybWluZURlZmF1bHRQbGF5YmFja1NwZWVkO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgIGRlc2MgPSB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH07XHJcbiAgICB9XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSkpO1xyXG52YXIgX19leHBvcnRTdGFyID0gKHRoaXMgJiYgdGhpcy5fX2V4cG9ydFN0YXIpIHx8IGZ1bmN0aW9uKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0cywgcCkpIF9fY3JlYXRlQmluZGluZyhleHBvcnRzLCBtLCBwKTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmJ1aWxkQmVhdG1hcCA9IGV4cG9ydHMucGFyc2VCbHVlcHJpbnQgPSB2b2lkIDA7XHJcbnZhciBpbmRleF8xID0gcmVxdWlyZShcIi4vY29yZS9pbmRleFwiKTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwicGFyc2VCbHVlcHJpbnRcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGluZGV4XzEucGFyc2VCbHVlcHJpbnQ7IH0gfSk7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcImJ1aWxkQmVhdG1hcFwiLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gaW5kZXhfMS5idWlsZEJlYXRtYXA7IH0gfSk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9saWIvcHBcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vbGliL2RpZmZcIiksIGV4cG9ydHMpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmNhbGN1bGF0ZURpZmZpY3VsdHlBdHRyaWJ1dGVzID0gdm9pZCAwO1xyXG4vLyBTdHJhaW5cclxuY29uc3QgaW5kZXhfMSA9IHJlcXVpcmUoXCIuLi9jb3JlL2luZGV4XCIpO1xyXG5jb25zdCBpbmRleF8yID0gcmVxdWlyZShcIi4uL21hdGgvaW5kZXhcIik7XHJcbmNvbnN0IGFpbV8xID0gcmVxdWlyZShcIi4vc2tpbGxzL2FpbVwiKTtcclxuY29uc3Qgc3BlZWRfMSA9IHJlcXVpcmUoXCIuL3NraWxscy9zcGVlZFwiKTtcclxuY29uc3QgZmxhc2hsaWdodF8xID0gcmVxdWlyZShcIi4vc2tpbGxzL2ZsYXNobGlnaHRcIik7XHJcbi8vIFRPRE86IFV0aWxpdGl5IGZ1bmN0aW9ucz9cclxuY29uc3Qgc3RhcnRUaW1lID0gKG8pID0+ICgoMCwgaW5kZXhfMS5pc0hpdENpcmNsZSkobykgPyBvLmhpdFRpbWUgOiBvLnN0YXJ0VGltZSk7XHJcbmNvbnN0IGVuZFRpbWUgPSAobykgPT4gKCgwLCBpbmRleF8xLmlzSGl0Q2lyY2xlKShvKSA/IG8uaGl0VGltZSA6IG8uZW5kVGltZSk7XHJcbmNvbnN0IHBvc2l0aW9uID0gKG8pID0+ICgoMCwgaW5kZXhfMS5pc0hpdENpcmNsZSkobykgPyBvLnBvc2l0aW9uIDogby5oZWFkLnBvc2l0aW9uKTtcclxuY29uc3Qgbm9ybWFsaXNlZF9yYWRpdXMgPSA1MC4wO1xyXG5jb25zdCBtYXhpbXVtX3NsaWRlcl9yYWRpdXMgPSBub3JtYWxpc2VkX3JhZGl1cyAqIDIuNDtcclxuY29uc3QgYXNzdW1lZF9zbGlkZXJfcmFkaXVzID0gbm9ybWFsaXNlZF9yYWRpdXMgKiAxLjg7XHJcbmZ1bmN0aW9uIGNvbXB1dGVTbGlkZXJDdXJzb3JQb3NpdGlvbihzbGlkZXIpIHtcclxuICAgIGNvbnN0IGxhenlUcmF2ZWxUaW1lID0gc2xpZGVyLmNoZWNrUG9pbnRzW3NsaWRlci5jaGVja1BvaW50cy5sZW5ndGggLSAxXS5oaXRUaW1lIC0gc2xpZGVyLnN0YXJ0VGltZTtcclxuICAgIC8vIGZsb2F0XHJcbiAgICBsZXQgbGF6eVRyYXZlbERpc3RhbmNlID0gMDtcclxuICAgIGxldCBlbmRUaW1lTWluID0gbGF6eVRyYXZlbFRpbWUgLyBzbGlkZXIuc3BhbkR1cmF0aW9uO1xyXG4gICAgLy8gVE9ETzogQ29udHJvbCB0aGlzIGNvZGUgYWdhaW5cclxuICAgIGlmIChlbmRUaW1lTWluICUgMiA+PSAxKVxyXG4gICAgICAgIGVuZFRpbWVNaW4gPSAxIC0gKGVuZFRpbWVNaW4gJSAxKTtcclxuICAgIGVsc2VcclxuICAgICAgICBlbmRUaW1lTWluICU9IDE7XHJcbiAgICAvLyB0ZW1wb3JhcnkgbGF6eSBlbmQgcG9zaXRpb24gdW50aWwgYSByZWFsIHJlc3VsdCBjYW4gYmUgZGVyaXZlZC5cclxuICAgIGxldCBsYXp5RW5kUG9zaXRpb24gPSBpbmRleF8yLlZlYzIuYWRkKHNsaWRlci5zdGFydFBvc2l0aW9uLCBzbGlkZXIucGF0aC5wb3NpdGlvbkF0KGVuZFRpbWVNaW4pKTtcclxuICAgIGxldCBjdXJyQ3Vyc29yUG9zaXRpb24gPSBzbGlkZXIuc3RhcnRQb3NpdGlvbjtcclxuICAgIGNvbnN0IHNjYWxpbmdGYWN0b3IgPSBub3JtYWxpc2VkX3JhZGl1cyAvIHNsaWRlci5yYWRpdXM7IC8vIGxhenlTbGlkZXJEaXN0YW5jZSBpcyBjb2RlZCB0byBiZSBzZW5zaXRpdmUgdG8gc2NhbGluZyxcclxuICAgIC8vIHRoaXMgbWFrZXMgdGhlIG1hdGhzIGVhc2llciB3aXRoIHRoZSB0aHJlc2hvbGRzIGJlaW5nXHJcbiAgICAvLyB1c2VkLlxyXG4gICAgY29uc3QgbnVtQ2hlY2tQb2ludHMgPSBzbGlkZXIuY2hlY2tQb2ludHMubGVuZ3RoO1xyXG4gICAgLy8gV2Ugc3RhcnQgZnJvbSAwIGJlY2F1c2UgdGhlIGhlYWQgaXMgTk9UIGEgc2xpZGVyIGNoZWNrcG9pbnQgaGVyZVxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1DaGVja1BvaW50czsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgY3Vyck1vdmVtZW50T2JqID0gc2xpZGVyLmNoZWNrUG9pbnRzW2ldO1xyXG4gICAgICAgIC8vIFRoaXMgaXMgd2hlcmUgd2UgaGF2ZSB0byBiZSB2ZXJ5IGNhcmVmdWwgZHVlIHRvIG9zdSFsYXplciB1c2luZyB0aGVpciBWSVNVQUwgUkVOREVSSU5HIFBPU0lUSU9OIGluc3RlYWQgb2ZcclxuICAgICAgICAvLyBKVURHRU1FTlQgUE9TSVRJT04gZm9yIHRoZWlyIGxhc3QgdGljay4gYnJ1aFxyXG4gICAgICAgIGNvbnN0IGN1cnJNb3ZlbWVudE9ialBvc2l0aW9uID0gY3Vyck1vdmVtZW50T2JqLnR5cGUgPT09IFwiTEFTVF9MRUdBQ1lfVElDS1wiID8gc2xpZGVyLmVuZFBvc2l0aW9uIDogY3Vyck1vdmVtZW50T2JqLnBvc2l0aW9uO1xyXG4gICAgICAgIGxldCBjdXJyTW92ZW1lbnQgPSBpbmRleF8yLlZlYzIuc3ViKGN1cnJNb3ZlbWVudE9ialBvc2l0aW9uLCBjdXJyQ3Vyc29yUG9zaXRpb24pO1xyXG4gICAgICAgIGxldCBjdXJyTW92ZW1lbnRMZW5ndGggPSBzY2FsaW5nRmFjdG9yICogY3Vyck1vdmVtZW50Lmxlbmd0aCgpO1xyXG4gICAgICAgIC8vIEFtb3VudCBvZiBtb3ZlbWVudCByZXF1aXJlZCBzbyB0aGF0IHRoZSBjdXJzb3IgcG9zaXRpb24gbmVlZHMgdG8gYmUgdXBkYXRlZC5cclxuICAgICAgICBsZXQgcmVxdWlyZWRNb3ZlbWVudCA9IGFzc3VtZWRfc2xpZGVyX3JhZGl1cztcclxuICAgICAgICBpZiAoaSA9PT0gbnVtQ2hlY2tQb2ludHMgLSAxKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSBlbmQgb2YgYSBzbGlkZXIgaGFzIHNwZWNpYWwgYWltIHJ1bGVzIGR1ZSB0byB0aGUgcmVsYXhlZCB0aW1lIGNvbnN0cmFpbnQgb24gcG9zaXRpb24uXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGJvdGggYSBsYXp5IGVuZCBwb3NpdGlvbiBhcyB3ZWxsIGFzIHRoZSBhY3R1YWwgZW5kIHNsaWRlciBwb3NpdGlvbi4gV2UgYXNzdW1lIHRoZSBwbGF5ZXIgdGFrZXMgdGhlXHJcbiAgICAgICAgICAgIC8vIHNpbXBsZXIgbW92ZW1lbnQuIEZvciBzbGlkZXJzIHRoYXQgYXJlIGNpcmN1bGFyLCB0aGUgbGF6eSBlbmQgcG9zaXRpb24gbWF5IGFjdHVhbGx5IGJlIGZhcnRoZXIgYXdheSB0aGFuIHRoZVxyXG4gICAgICAgICAgICAvLyBzbGlkZXJzIHRydWUgZW5kLiBUaGlzIGNvZGUgaXMgZGVzaWduZWQgdG8gcHJldmVudCBidWZmaW5nIHNpdHVhdGlvbnMgd2hlcmUgbGF6eSBlbmQgaXMgYWN0dWFsbHkgYSBsZXNzXHJcbiAgICAgICAgICAgIC8vIGVmZmljaWVudCBtb3ZlbWVudC5cclxuICAgICAgICAgICAgY29uc3QgbGF6eU1vdmVtZW50ID0gaW5kZXhfMi5WZWMyLnN1YihsYXp5RW5kUG9zaXRpb24sIGN1cnJDdXJzb3JQb3NpdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChsYXp5TW92ZW1lbnQubGVuZ3RoKCkgPCBjdXJyTW92ZW1lbnQubGVuZ3RoKCkpXHJcbiAgICAgICAgICAgICAgICBjdXJyTW92ZW1lbnQgPSBsYXp5TW92ZW1lbnQ7XHJcbiAgICAgICAgICAgIGN1cnJNb3ZlbWVudExlbmd0aCA9IHNjYWxpbmdGYWN0b3IgKiBjdXJyTW92ZW1lbnQubGVuZ3RoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGN1cnJNb3ZlbWVudE9iai50eXBlID09PSBcIlJFUEVBVFwiKSB7XHJcbiAgICAgICAgICAgIC8vIEZvciBhIHNsaWRlciByZXBlYXQsIGFzc3VtZSBhIHRpZ2h0ZXIgbW92ZW1lbnQgdGhyZXNob2xkIHRvIGJldHRlciBhc3Nlc3MgcmVwZWF0IHNsaWRlcnMuXHJcbiAgICAgICAgICAgIHJlcXVpcmVkTW92ZW1lbnQgPSBub3JtYWxpc2VkX3JhZGl1cztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGN1cnJNb3ZlbWVudExlbmd0aCA+IHJlcXVpcmVkTW92ZW1lbnQpIHtcclxuICAgICAgICAgICAgLy8gdGhpcyBmaW5kcyB0aGUgcG9zaXRpb25hbCBkZWx0YSBmcm9tIHRoZSByZXF1aXJlZCByYWRpdXMgYW5kIHRoZSBjdXJyZW50IHBvc2l0aW9uLCBhbmQgdXBkYXRlcyB0aGVcclxuICAgICAgICAgICAgLy8gY3VyckN1cnNvclBvc2l0aW9uIGFjY29yZGluZ2x5LCBhcyB3ZWxsIGFzIHJld2FyZGluZyBkaXN0YW5jZS5cclxuICAgICAgICAgICAgY3VyckN1cnNvclBvc2l0aW9uID0gaW5kZXhfMi5WZWMyLmFkZChjdXJyQ3Vyc29yUG9zaXRpb24sIGluZGV4XzIuVmVjMi5zY2FsZShjdXJyTW92ZW1lbnQsICgwLCBpbmRleF8yLmZsb2F0MzJfZGl2KShjdXJyTW92ZW1lbnRMZW5ndGggLSByZXF1aXJlZE1vdmVtZW50LCBjdXJyTW92ZW1lbnRMZW5ndGgpKSk7XHJcbiAgICAgICAgICAgIGN1cnJNb3ZlbWVudExlbmd0aCAqPSAoY3Vyck1vdmVtZW50TGVuZ3RoIC0gcmVxdWlyZWRNb3ZlbWVudCkgLyBjdXJyTW92ZW1lbnRMZW5ndGg7XHJcbiAgICAgICAgICAgIGxhenlUcmF2ZWxEaXN0YW5jZSA9ICgwLCBpbmRleF8yLmZsb2F0MzJfYWRkKShsYXp5VHJhdmVsRGlzdGFuY2UsIGN1cnJNb3ZlbWVudExlbmd0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpID09PSBudW1DaGVja1BvaW50cyAtIDEpXHJcbiAgICAgICAgICAgIGxhenlFbmRQb3NpdGlvbiA9IGN1cnJDdXJzb3JQb3NpdGlvbjtcclxuICAgIH1cclxuICAgIGxhenlUcmF2ZWxEaXN0YW5jZSA9ICgwLCBpbmRleF8yLmZsb2F0MzJfbXVsKShsYXp5VHJhdmVsRGlzdGFuY2UsIE1hdGgucG93KDEgKyBzbGlkZXIucmVwZWF0Q291bnQgLyAyLjUsIDEuMCAvIDIuNSkpOyAvLyBCb251cyBmb3JcclxuICAgIC8vIHJlcGVhdFxyXG4gICAgLy8gc2xpZGVyc1xyXG4gICAgLy8gdW50aWwgYVxyXG4gICAgLy8gYmV0dGVyXHJcbiAgICAvLyBwZXIgbmVzdGVkIG9iamVjdCBzdHJhaW4gc3lzdGVtIGNhbiBiZVxyXG4gICAgLy8gYWNoaWV2ZWQuXHJcbiAgICByZXR1cm4geyBsYXp5VHJhdmVsVGltZSwgbGF6eVRyYXZlbERpc3RhbmNlLCBsYXp5RW5kUG9zaXRpb24gfTtcclxufVxyXG5jb25zdCBkZWZhdWx0T3N1RGlmZmljdWx0eUhpdE9iamVjdCA9ICgpID0+ICh7XHJcbiAgICBkZWx0YVRpbWU6IDAsXHJcbiAgICB0cmF2ZWxUaW1lOiAwLFxyXG4gICAgdHJhdmVsRGlzdGFuY2U6IDAsXHJcbiAgICBqdW1wRGlzdGFuY2U6IDAsXHJcbiAgICBtb3ZlbWVudERpc3RhbmNlOiAwLFxyXG4gICAgbW92ZW1lbnRUaW1lOiAwLFxyXG4gICAgc3RyYWluVGltZTogMCxcclxuICAgIGVuZFRpbWU6IDAsXHJcbiAgICBzdGFydFRpbWU6IDAsXHJcbiAgICBhbmdsZTogbnVsbCxcclxufSk7XHJcbi8qKlxyXG4gKiBSZXR1cm5zIG4gT3N1RGlmZmljdWx0eUhpdE9iamVjdHMgd2hlcmUgdGhlIGZpcnN0IG9uZSBpcyBhIGR1bW15IHZhbHVlXHJcbiAqL1xyXG5mdW5jdGlvbiBwcmVwcm9jZXNzRGlmZmljdWx0eUhpdE9iamVjdChoaXRPYmplY3RzLCBjbG9ja1JhdGUpIHtcclxuICAgIGNvbnN0IGRpZmZpY3VsdHlIaXRPYmplY3RzID0gW2RlZmF1bHRPc3VEaWZmaWN1bHR5SGl0T2JqZWN0KCldO1xyXG4gICAgY29uc3QgbWluX2RlbHRhX3RpbWUgPSAyNTtcclxuICAgIGNvbnN0IGNsb2NrQWRqdXN0ZWQgPSAoeCkgPT4geCAvIGNsb2NrUmF0ZTtcclxuICAgIC8vIENhY2hpbmcgZm9yIHRoZSBzbGlkZXJzXHJcbiAgICBjb25zdCBzbGlkZXJDdXJzb3JQb3NpdGlvbiA9IHt9O1xyXG4gICAgZnVuY3Rpb24gY29tcHV0ZVNsaWRlckN1cnNvclBvc2l0aW9uSWZOZWVkZWQocykge1xyXG4gICAgICAgIGlmIChzbGlkZXJDdXJzb3JQb3NpdGlvbltzLmlkXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHNsaWRlckN1cnNvclBvc2l0aW9uW3MuaWRdID0gY29tcHV0ZVNsaWRlckN1cnNvclBvc2l0aW9uKHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2xpZGVyQ3Vyc29yUG9zaXRpb25bcy5pZF07XHJcbiAgICB9XHJcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGhpdE9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBsYXN0TGFzdCA9IGhpdE9iamVjdHNbaSAtIDJdO1xyXG4gICAgICAgIGNvbnN0IGxhc3QgPSBoaXRPYmplY3RzW2kgLSAxXTtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gaGl0T2JqZWN0c1tpXTtcclxuICAgICAgICBjb25zdCBkaWZmaWN1bHR5SGl0T2JqZWN0ID0gKGZ1bmN0aW9uIGNhbGN1bGF0ZURpZmZpY3VsdHlIaXRPYmplY3QoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGRlZmF1bHRPc3VEaWZmaWN1bHR5SGl0T2JqZWN0KCk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zdGFydFRpbWUgPSBjbG9ja0FkanVzdGVkKHN0YXJ0VGltZShjdXJyZW50KSk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5lbmRUaW1lID0gY2xvY2tBZGp1c3RlZChlbmRUaW1lKGN1cnJlbnQpKTtcclxuICAgICAgICAgICAgcmVzdWx0LmRlbHRhVGltZSA9IGNsb2NrQWRqdXN0ZWQoc3RhcnRUaW1lKGN1cnJlbnQpIC0gc3RhcnRUaW1lKGxhc3QpKTtcclxuICAgICAgICAgICAgY29uc3Qgc3RyYWluVGltZSA9IE1hdGgubWF4KHJlc3VsdC5kZWx0YVRpbWUsIG1pbl9kZWx0YV90aW1lKTtcclxuICAgICAgICAgICAgcmVzdWx0LnN0cmFpblRpbWUgPSBzdHJhaW5UaW1lO1xyXG4gICAgICAgICAgICBpZiAoKDAsIGluZGV4XzEuaXNTcGlubmVyKShjdXJyZW50KSB8fCAoMCwgaW5kZXhfMS5pc1NwaW5uZXIpKGxhc3QpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgLy8gZmxvYXRcclxuICAgICAgICAgICAgbGV0IHNjYWxpbmdGYWN0b3IgPSAoMCwgaW5kZXhfMi5mbG9hdDMyX2Rpdikobm9ybWFsaXNlZF9yYWRpdXMsIGN1cnJlbnQucmFkaXVzKTtcclxuICAgICAgICAgICAgLy8gTm93IGN1cnJlbnQgaXMgZWl0aGVyIEhpdENpcmNsZSBvciBTbGlkZXJcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnQucmFkaXVzIDwgMzApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNtYWxsQ2lyY2xlQm9udXMgPSAoMCwgaW5kZXhfMi5mbG9hdDMyX2RpdikoTWF0aC5taW4oMzAgLSBjdXJyZW50LnJhZGl1cywgNSksIDUwKTtcclxuICAgICAgICAgICAgICAgIHNjYWxpbmdGYWN0b3IgKj0gMSArIHNtYWxsQ2lyY2xlQm9udXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0RW5kQ3Vyc29yUG9zaXRpb24obykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzSGl0Q2lyY2xlKShvKSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gby5wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgbGF6eUVuZFBvc2l0aW9uIH0gPSBjb21wdXRlU2xpZGVyQ3Vyc29yUG9zaXRpb25JZk5lZWRlZChvKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsYXp5RW5kUG9zaXRpb24gIT09IG51bGwgJiYgbGF6eUVuZFBvc2l0aW9uICE9PSB2b2lkIDAgPyBsYXp5RW5kUG9zaXRpb24gOiBvLnN0YXJ0UG9zaXRpb247IC8vIFRPRE86IEhvdyBjYW4gaXQgYmUgbnVsbGFibGU/XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbGFzdEN1cnNvclBvc2l0aW9uID0gZ2V0RW5kQ3Vyc29yUG9zaXRpb24obGFzdCk7XHJcbiAgICAgICAgICAgIC8vIHNxcnQoKHgxKmMteDIqYyleMisoeTEqYy15MipjKV4yKSA9IHNxcnQoY14yICh4MS14MileMiArIGNeMiAoeTEteTIpXjIpID0gYyAqIGRpc3QoKHgxLHkxKSwoeDIseTIpKVxyXG4gICAgICAgICAgICByZXN1bHQuanVtcERpc3RhbmNlID0gaW5kZXhfMi5WZWMyLmRpc3RhbmNlKGluZGV4XzIuVmVjMi5zY2FsZShwb3NpdGlvbihjdXJyZW50KSwgc2NhbGluZ0ZhY3RvciksIGluZGV4XzIuVmVjMi5zY2FsZShsYXN0Q3Vyc29yUG9zaXRpb24sIHNjYWxpbmdGYWN0b3IpKTtcclxuICAgICAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzU2xpZGVyKShsYXN0KSkge1xyXG4gICAgICAgICAgICAgICAgLy8gTm8gbmVlZCB0byBzdG9yZSBpbnRvIHRoZSBTbGlkZXIgb2JqZWN0IVxyXG4gICAgICAgICAgICAgICAgY29uc3QgeyBsYXp5VHJhdmVsVGltZTogbGFzdFNsaWRlckxhenlUcmF2ZWxUaW1lLCBsYXp5VHJhdmVsRGlzdGFuY2U6IGxhc3RTbGlkZXJMYXp5VHJhdmVsRGlzdGFuY2UgfSA9IGNvbXB1dGVTbGlkZXJDdXJzb3JQb3NpdGlvbklmTmVlZGVkKGxhc3QpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRyYXZlbERpc3RhbmNlID0gbGFzdFNsaWRlckxhenlUcmF2ZWxEaXN0YW5jZTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50cmF2ZWxUaW1lID0gTWF0aC5tYXgobGFzdFNsaWRlckxhenlUcmF2ZWxUaW1lIC8gY2xvY2tSYXRlLCBtaW5fZGVsdGFfdGltZSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQubW92ZW1lbnRUaW1lID0gTWF0aC5tYXgoc3RyYWluVGltZSAtIHJlc3VsdC50cmF2ZWxUaW1lLCBtaW5fZGVsdGFfdGltZSk7XHJcbiAgICAgICAgICAgICAgICAvLyB0YWlsQ2lyY2xlLlN0YWNrZWRQb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdGFpbEp1bXBEaXN0YW5jZSA9ICgwLCBpbmRleF8yLmZsb2F0MzIpKGluZGV4XzIuVmVjMi5kaXN0YW5jZShsYXN0LmVuZFBvc2l0aW9uLCBwb3NpdGlvbihjdXJyZW50KSkgKiBzY2FsaW5nRmFjdG9yKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5tb3ZlbWVudERpc3RhbmNlID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVzdWx0Lmp1bXBEaXN0YW5jZSAtIChtYXhpbXVtX3NsaWRlcl9yYWRpdXMgLSBhc3N1bWVkX3NsaWRlcl9yYWRpdXMpLCB0YWlsSnVtcERpc3RhbmNlIC0gbWF4aW11bV9zbGlkZXJfcmFkaXVzKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQubW92ZW1lbnRUaW1lID0gc3RyYWluVGltZTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5tb3ZlbWVudERpc3RhbmNlID0gcmVzdWx0Lmp1bXBEaXN0YW5jZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAobGFzdExhc3QgIT09IHVuZGVmaW5lZCAmJiAhKDAsIGluZGV4XzEuaXNTcGlubmVyKShsYXN0TGFzdCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RMYXN0Q3Vyc29yUG9zaXRpb24gPSBnZXRFbmRDdXJzb3JQb3NpdGlvbihsYXN0TGFzdCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2MSA9IGluZGV4XzIuVmVjMi5zdWIobGFzdExhc3RDdXJzb3JQb3NpdGlvbiwgcG9zaXRpb24obGFzdCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdjIgPSBpbmRleF8yLlZlYzIuc3ViKHBvc2l0aW9uKGN1cnJlbnQpLCBsYXN0Q3Vyc29yUG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZG90ID0gKDAsIGluZGV4XzIuZmxvYXQzMikoaW5kZXhfMi5WZWMyLmRvdCh2MSwgdjIpKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldCA9ICgwLCBpbmRleF8yLmZsb2F0MzJfYWRkKSgoMCwgaW5kZXhfMi5mbG9hdDMyX211bCkodjEueCwgdjIueSksIC0oMCwgaW5kZXhfMi5mbG9hdDMyX211bCkodjEueSwgdjIueCkpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmFuZ2xlID0gTWF0aC5hYnMoTWF0aC5hdGFuMihkZXQsIGRvdCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfSkoKTtcclxuICAgICAgICBkaWZmaWN1bHR5SGl0T2JqZWN0cy5wdXNoKGRpZmZpY3VsdHlIaXRPYmplY3QpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGRpZmZpY3VsdHlIaXRPYmplY3RzO1xyXG59XHJcbmZ1bmN0aW9uIGRldGVybWluZU1heENvbWJvKGhpdE9iamVjdHMpIHtcclxuICAgIGxldCBtYXhDb21ibyA9IDA7XHJcbiAgICBsZXQgaGl0Q2lyY2xlQ291bnQgPSAwLCBzbGlkZXJDb3VudCA9IDAsIHNwaW5uZXJDb3VudCA9IDA7XHJcbiAgICBmb3IgKGNvbnN0IG8gb2YgaGl0T2JqZWN0cykge1xyXG4gICAgICAgIG1heENvbWJvKys7XHJcbiAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzSGl0Q2lyY2xlKShvKSlcclxuICAgICAgICAgICAgaGl0Q2lyY2xlQ291bnQrKztcclxuICAgICAgICBpZiAoKDAsIGluZGV4XzEuaXNTcGlubmVyKShvKSlcclxuICAgICAgICAgICAgc3Bpbm5lckNvdW50Kys7XHJcbiAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzU2xpZGVyKShvKSkge1xyXG4gICAgICAgICAgICBzbGlkZXJDb3VudCsrO1xyXG4gICAgICAgICAgICBtYXhDb21ibyArPSBvLmNoZWNrUG9pbnRzLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4geyBtYXhDb21ibywgaGl0Q2lyY2xlQ291bnQsIHNsaWRlckNvdW50LCBzcGlubmVyQ291bnQgfTtcclxufVxyXG5jb25zdCBESUZGSUNVTFRZX01VTFRJUExJRVIgPSAwLjA2NzU7XHJcbmNvbnN0IHNwZWVkQWRqdXN0ZWRBUiA9IChBUiwgY2xvY2tSYXRlKSA9PiAoMCwgaW5kZXhfMi5hcHByb2FjaER1cmF0aW9uVG9BcHByb2FjaFJhdGUpKCgwLCBpbmRleF8yLmFwcHJvYWNoUmF0ZVRvQXBwcm9hY2hEdXJhdGlvbikoQVIpIC8gY2xvY2tSYXRlKTtcclxuY29uc3Qgc3BlZWRBZGp1c3RlZE9EID0gKE9ELCBjbG9ja1JhdGUpID0+ICgwLCBpbmRleF8yLmhpdFdpbmRvd0dyZWF0VG9PRCkoKDAsIGluZGV4XzIub3ZlcmFsbERpZmZpY3VsdHlUb0hpdFdpbmRvd0dyZWF0KShPRCkgLyBjbG9ja1JhdGUpO1xyXG4vLyBDYWxjdWxhdGVzIHRoZSBkaWZmZXJlbnQgc3RhciByYXRpbmdzIGFmdGVyIGV2ZXJ5IGhpdCBvYmplY3QgaVxyXG5mdW5jdGlvbiBjYWxjdWxhdGVEaWZmaWN1bHR5QXR0cmlidXRlcyh7IGFwcGxpZWRNb2RzOiBtb2RzLCBkaWZmaWN1bHR5LCBoaXRPYmplY3RzLCBjb250cm9sUG9pbnRJbmZvIH0sIG9ubHlGaW5hbFZhbHVlKSB7XHJcbiAgICBjb25zdCBjbG9ja1JhdGUgPSAoMCwgaW5kZXhfMS5kZXRlcm1pbmVEZWZhdWx0UGxheWJhY2tTcGVlZCkobW9kcyk7XHJcbiAgICBjb25zdCBkaWZmcyA9IHByZXByb2Nlc3NEaWZmaWN1bHR5SGl0T2JqZWN0KGhpdE9iamVjdHMsIGNsb2NrUmF0ZSk7XHJcbiAgICBjb25zdCBoaXRXaW5kb3dHcmVhdCA9ICgwLCBpbmRleF8yLmhpdFdpbmRvd3NGb3JPRCkoZGlmZmljdWx0eS5vdmVyYWxsRGlmZmljdWx0eSwgdHJ1ZSlbMF0gLyBjbG9ja1JhdGU7XHJcbiAgICBjb25zdCBhaW1WYWx1ZXMgPSAoMCwgYWltXzEuY2FsY3VsYXRlQWltKShoaXRPYmplY3RzLCBkaWZmcywgdHJ1ZSwgb25seUZpbmFsVmFsdWUpO1xyXG4gICAgY29uc3QgYWltVmFsdWVzTm9TbGlkZXJzID0gKDAsIGFpbV8xLmNhbGN1bGF0ZUFpbSkoaGl0T2JqZWN0cywgZGlmZnMsIGZhbHNlLCBvbmx5RmluYWxWYWx1ZSk7XHJcbiAgICBjb25zdCBzcGVlZFZhbHVlcyA9ICgwLCBzcGVlZF8xLmNhbGN1bGF0ZVNwZWVkKShoaXRPYmplY3RzLCBkaWZmcywgaGl0V2luZG93R3JlYXQsIG9ubHlGaW5hbFZhbHVlKTtcclxuICAgIGNvbnN0IGZsYXNobGlnaHRWYWx1ZXMgPSAoMCwgZmxhc2hsaWdodF8xLmNhbGN1bGF0ZUZsYXNobGlnaHQpKGhpdE9iamVjdHMsIGRpZmZzLCBvbmx5RmluYWxWYWx1ZSwgbW9kcy5pbmNsdWRlcyhcIkhJRERFTlwiKSk7XHJcbiAgICBjb25zdCBzcGVlZE5vdGVzID0gKDAsIHNwZWVkXzEuY2FsY3VsYXRlUmVsZXZhbnROb3RlcykoaGl0T2JqZWN0cywgZGlmZnMsIGhpdFdpbmRvd0dyZWF0LCBvbmx5RmluYWxWYWx1ZSk7XHJcbiAgICAvLyBTdGF0aWMgdmFsdWVzXHJcbiAgICBjb25zdCB7IGhpdENpcmNsZUNvdW50LCBzbGlkZXJDb3VudCwgc3Bpbm5lckNvdW50LCBtYXhDb21ibyB9ID0gZGV0ZXJtaW5lTWF4Q29tYm8oaGl0T2JqZWN0cyk7XHJcbiAgICBjb25zdCBvdmVyYWxsRGlmZmljdWx0eSA9IHNwZWVkQWRqdXN0ZWRPRChkaWZmaWN1bHR5Lm92ZXJhbGxEaWZmaWN1bHR5LCBjbG9ja1JhdGUpO1xyXG4gICAgY29uc3QgYXBwcm9hY2hSYXRlID0gc3BlZWRBZGp1c3RlZEFSKGRpZmZpY3VsdHkuYXBwcm9hY2hSYXRlLCBjbG9ja1JhdGUpO1xyXG4gICAgY29uc3QgYmVhdExlbmd0aCA9ICgwLCBpbmRleF8xLm1vc3RDb21tb25CZWF0TGVuZ3RoKSh7XHJcbiAgICAgICAgaGl0T2JqZWN0cyxcclxuICAgICAgICB0aW1pbmdQb2ludHM6IGNvbnRyb2xQb2ludEluZm8udGltaW5nUG9pbnRzLmxpc3QsXHJcbiAgICB9KTtcclxuICAgIGNvbnN0IG1vc3RDb21tb25CUE0gPSAoYmVhdExlbmd0aCA9PT0gdW5kZWZpbmVkID8gMCA6ICgwLCBpbmRleF8yLmJlYXRMZW5ndGhUb0JQTSkoYmVhdExlbmd0aCkpICogY2xvY2tSYXRlO1xyXG4gICAgY29uc3QgYXR0cmlidXRlcyA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhaW1WYWx1ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBsZXQgYWltUmF0aW5nID0gTWF0aC5zcXJ0KGFpbVZhbHVlc1tpXSkgKiBESUZGSUNVTFRZX01VTFRJUExJRVI7XHJcbiAgICAgICAgY29uc3QgYWltUmF0aW5nTm9TbGlkZXJzID0gTWF0aC5zcXJ0KGFpbVZhbHVlc05vU2xpZGVyc1tpXSkgKiBESUZGSUNVTFRZX01VTFRJUExJRVI7XHJcbiAgICAgICAgbGV0IHNwZWVkUmF0aW5nID0gTWF0aC5zcXJ0KHNwZWVkVmFsdWVzW2ldKSAqIERJRkZJQ1VMVFlfTVVMVElQTElFUjtcclxuICAgICAgICBsZXQgZmxhc2hsaWdodFJhdGluZyA9IE1hdGguc3FydChmbGFzaGxpZ2h0VmFsdWVzW2ldKSAqIERJRkZJQ1VMVFlfTVVMVElQTElFUjtcclxuICAgICAgICBjb25zdCBzbGlkZXJGYWN0b3IgPSBhaW1SYXRpbmcgPiAwID8gYWltUmF0aW5nTm9TbGlkZXJzIC8gYWltUmF0aW5nIDogMTtcclxuICAgICAgICBpZiAobW9kcy5pbmNsdWRlcyhcIlJFTEFYXCIpKSB7XHJcbiAgICAgICAgICAgIGFpbVJhdGluZyAqPSAwLjk7XHJcbiAgICAgICAgICAgIHNwZWVkUmF0aW5nID0gMDtcclxuICAgICAgICAgICAgZmxhc2hsaWdodFJhdGluZyAqPSAwLjc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGJhc2VBaW1QZXJmb3JtYW5jZSA9IE1hdGgucG93KDUgKiBNYXRoLm1heCgxLCBhaW1SYXRpbmcgLyAwLjA2NzUpIC0gNCwgMykgLyAxMDAwMDA7XHJcbiAgICAgICAgY29uc3QgYmFzZVNwZWVkUGVyZm9ybWFuY2UgPSBNYXRoLnBvdyg1ICogTWF0aC5tYXgoMSwgc3BlZWRSYXRpbmcgLyAwLjA2NzUpIC0gNCwgMykgLyAxMDAwMDA7XHJcbiAgICAgICAgbGV0IGJhc2VGbGFzaGxpZ2h0UGVyZm9ybWFuY2UgPSAwLjA7XHJcbiAgICAgICAgaWYgKG1vZHMuaW5jbHVkZXMoXCJGTEFTSF9MSUdIVFwiKSlcclxuICAgICAgICAgICAgYmFzZUZsYXNobGlnaHRQZXJmb3JtYW5jZSA9IE1hdGgucG93KGZsYXNobGlnaHRSYXRpbmcsIDIuMCkgKiAyNS4wO1xyXG4gICAgICAgIGNvbnN0IGJhc2VQZXJmb3JtYW5jZSA9IE1hdGgucG93KE1hdGgucG93KGJhc2VBaW1QZXJmb3JtYW5jZSwgMS4xKSArXHJcbiAgICAgICAgICAgIE1hdGgucG93KGJhc2VTcGVlZFBlcmZvcm1hbmNlLCAxLjEpICtcclxuICAgICAgICAgICAgTWF0aC5wb3coYmFzZUZsYXNobGlnaHRQZXJmb3JtYW5jZSwgMS4xKSwgMS4wIC8gMS4xKTtcclxuICAgICAgICBjb25zdCBzdGFyUmF0aW5nID0gYmFzZVBlcmZvcm1hbmNlID4gMC4wMDAwMVxyXG4gICAgICAgICAgICA/IE1hdGguY2JydCgxLjE0KSAqIDAuMDI3ICogKE1hdGguY2JydCgoMTAwMDAwIC8gTWF0aC5wb3coMiwgMSAvIDEuMSkpICogYmFzZVBlcmZvcm1hbmNlKSArIDQpXHJcbiAgICAgICAgICAgIDogMDtcclxuICAgICAgICBhdHRyaWJ1dGVzLnB1c2goe1xyXG4gICAgICAgICAgICBhaW1EaWZmaWN1bHR5OiBhaW1SYXRpbmcsXHJcbiAgICAgICAgICAgIHNwZWVkRGlmZmljdWx0eTogc3BlZWRSYXRpbmcsXHJcbiAgICAgICAgICAgIGZsYXNobGlnaHREaWZmaWN1bHR5OiBmbGFzaGxpZ2h0UmF0aW5nLFxyXG4gICAgICAgICAgICBzbGlkZXJGYWN0b3IsXHJcbiAgICAgICAgICAgIHNwZWVkTm90ZXMsXHJcbiAgICAgICAgICAgIHN0YXJSYXRpbmcsXHJcbiAgICAgICAgICAgIC8vIFRoZXNlIGFyZSBhY3R1YWxseSByZWR1bmRhbnQgYnV0IGlkY1xyXG4gICAgICAgICAgICBoaXRDaXJjbGVDb3VudCxcclxuICAgICAgICAgICAgc2xpZGVyQ291bnQsXHJcbiAgICAgICAgICAgIHNwaW5uZXJDb3VudCxcclxuICAgICAgICAgICAgbWF4Q29tYm8sXHJcbiAgICAgICAgICAgIG92ZXJhbGxEaWZmaWN1bHR5LFxyXG4gICAgICAgICAgICBhcHByb2FjaFJhdGUsXHJcbiAgICAgICAgICAgIG1vc3RDb21tb25CUE0sXHJcbiAgICAgICAgICAgIGRyYWluUmF0ZTogZGlmZmljdWx0eS5kcmFpblJhdGUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXR0cmlidXRlcztcclxufVxyXG5leHBvcnRzLmNhbGN1bGF0ZURpZmZpY3VsdHlBdHRyaWJ1dGVzID0gY2FsY3VsYXRlRGlmZmljdWx0eUF0dHJpYnV0ZXM7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuY2FsY3VsYXRlUGVyZm9ybWFuY2VBdHRyaWJ1dGVzID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uL2NvcmUvaW5kZXhcIik7XHJcbmNvbnN0IGluZGV4XzIgPSByZXF1aXJlKFwiLi4vbWF0aC9pbmRleFwiKTtcclxuZnVuY3Rpb24gY2FsY3VsYXRlUGVyZm9ybWFuY2VBdHRyaWJ1dGVzKGJlYXRtYXBQYXJhbXMsIHNjb3JlUGFyYW1zKSB7XHJcbiAgICB2YXIgX2E7XHJcbiAgICBjb25zdCB7IGhpdENpcmNsZUNvdW50LCBzbGlkZXJDb3VudCwgc3Bpbm5lckNvdW50LCBhaW1EaWZmaWN1bHR5LCBzcGVlZERpZmZpY3VsdHksIGZsYXNobGlnaHREaWZmaWN1bHR5LCBhcHByb2FjaFJhdGUsIGRyYWluUmF0ZSwgb3ZlcmFsbERpZmZpY3VsdHksIHNsaWRlckZhY3RvciwgbWF4Q29tYm86IGJlYXRtYXBNYXhDb21ibywgc3BlZWROb3RlcyB9ID0gYmVhdG1hcFBhcmFtcztcclxuICAgIGNvbnN0IHsgbW9kcywgY291bnRNZWgsIGNvdW50R3JlYXQsIGNvdW50TWlzcywgY291bnRPaywgbWF4Q29tYm86IHNjb3JlTWF4Q29tYm8gfSA9IHNjb3JlUGFyYW1zO1xyXG4gICAgY29uc3QgYWNjdXJhY3kgPSAoX2EgPSAoMCwgaW5kZXhfMS5vc3VTdGFibGVBY2N1cmFjeSkoW2NvdW50R3JlYXQsIGNvdW50T2ssIGNvdW50TWVoLCBjb3VudE1pc3NdKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMDtcclxuICAgIGNvbnN0IHRvdGFsSGl0cyA9IGNvdW50R3JlYXQgKyBjb3VudE9rICsgY291bnRNZWggKyBjb3VudE1pc3M7XHJcbiAgICBsZXQgZWZmZWN0aXZlTWlzc0NvdW50ID0gKGZ1bmN0aW9uIGNhbGN1bGF0ZUVmZmVjdGl2ZU1pc3NDb3VudCgpIHtcclxuICAgICAgICAvLyBHdWVzcyB0aGUgbnVtYmVyIG9mIG1pc3NlcyArIHNsaWRlciBicmVha3MgZnJvbSBjb21ib1xyXG4gICAgICAgIGxldCBjb21ib0Jhc2VkTWlzc0NvdW50ID0gMC4wO1xyXG4gICAgICAgIGlmIChzbGlkZXJDb3VudCA+IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZnVsbENvbWJvVGhyZXNob2xkID0gYmVhdG1hcE1heENvbWJvIC0gMC4xICogc2xpZGVyQ291bnQ7XHJcbiAgICAgICAgICAgIGlmIChzY29yZU1heENvbWJvIDwgZnVsbENvbWJvVGhyZXNob2xkKVxyXG4gICAgICAgICAgICAgICAgY29tYm9CYXNlZE1pc3NDb3VudCA9IGZ1bGxDb21ib1RocmVzaG9sZCAvIE1hdGgubWF4KDEuMCwgc2NvcmVNYXhDb21ibyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENsYW1wIG1pc3Njb3VudCBzaW5jZSBpdCdzIGRlcml2ZWQgZnJvbSBjb21ibyBhbmQgY2FuIGJlIGhpZ2hlciB0aGFuIHRvdGFsIGhpdHMgYW5kIHRoYXQgYnJlYWtzIHNvbWUgY2FsY3VsYXRpb25zXHJcbiAgICAgICAgY29tYm9CYXNlZE1pc3NDb3VudCA9IE1hdGgubWluKGNvbWJvQmFzZWRNaXNzQ291bnQsIHRvdGFsSGl0cyk7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KGNvdW50TWlzcywgY29tYm9CYXNlZE1pc3NDb3VudCk7XHJcbiAgICB9KSgpO1xyXG4gICAgbGV0IG11bHRpcGxpZXIgPSAxLjE0O1xyXG4gICAgaWYgKG1vZHMuaW5jbHVkZXMoXCJOT19GQUlMXCIpKVxyXG4gICAgICAgIG11bHRpcGxpZXIgKj0gTWF0aC5tYXgoMC45LCAxIC0gMC4wMiAqIGVmZmVjdGl2ZU1pc3NDb3VudCk7XHJcbiAgICBpZiAobW9kcy5pbmNsdWRlcyhcIlNQVU5fT1VUXCIpKVxyXG4gICAgICAgIG11bHRpcGxpZXIgKj0gMS4wIC0gTWF0aC5wb3coc3Bpbm5lckNvdW50IC8gdG90YWxIaXRzLCAwLjg1KTtcclxuICAgIGlmIChtb2RzLmluY2x1ZGVzKFwiUkVMQVhcIikpIHtcclxuICAgICAgICBjb25zdCBva011bHRpcGxpZXIgPSBNYXRoLm1heCgwLjAsIG92ZXJhbGxEaWZmaWN1bHR5ID4gMC4wID8gMSAtIE1hdGgucG93KG92ZXJhbGxEaWZmaWN1bHR5IC8gMTMuMzMsIDEuOCkgOiAxLjApO1xyXG4gICAgICAgIGNvbnN0IG1laE11bHRpcGxpZXIgPSBNYXRoLm1heCgwLjAsIG92ZXJhbGxEaWZmaWN1bHR5ID4gMC4wID8gMSAtIE1hdGgucG93KG92ZXJhbGxEaWZmaWN1bHR5IC8gMTMuMzMsIDUpIDogMS4wKTtcclxuICAgICAgICBlZmZlY3RpdmVNaXNzQ291bnQgPSBNYXRoLm1pbihlZmZlY3RpdmVNaXNzQ291bnQgKyBjb3VudE9rICogb2tNdWx0aXBsaWVyICsgY291bnRNZWggKiBtZWhNdWx0aXBsaWVyLCB0b3RhbEhpdHMpO1xyXG4gICAgICAgIG11bHRpcGxpZXIgKj0gMC42O1xyXG4gICAgfVxyXG4gICAgY29uc3QgY29tYm9TY2FsaW5nRmFjdG9yID0gYmVhdG1hcE1heENvbWJvIDw9IDAgPyAxLjAgOiBNYXRoLm1pbihNYXRoLnBvdyhzY29yZU1heENvbWJvLCAwLjgpIC8gTWF0aC5wb3coYmVhdG1hcE1heENvbWJvLCAwLjgpLCAxLjApO1xyXG4gICAgY29uc3QgYWltVmFsdWUgPSAoZnVuY3Rpb24gY29tcHV0ZUFpbVZhbHVlKCkge1xyXG4gICAgICAgIGxldCByYXdBaW0gPSBhaW1EaWZmaWN1bHR5O1xyXG4gICAgICAgIGlmIChtb2RzLmluY2x1ZGVzKFwiVE9VQ0hfREVWSUNFXCIpKVxyXG4gICAgICAgICAgICByYXdBaW0gPSBNYXRoLnBvdyhyYXdBaW0sIDAuOCk7XHJcbiAgICAgICAgbGV0IGFpbVZhbHVlID0gTWF0aC5wb3coNS4wICogTWF0aC5tYXgoMS4wLCByYXdBaW0gLyAwLjA2NzUpIC0gNC4wLCAzLjApIC8gMTAwMDAwLjA7XHJcbiAgICAgICAgY29uc3QgbGVuZ3RoQm9udXMgPSAwLjk1ICsgMC40ICogTWF0aC5taW4oMS4wLCB0b3RhbEhpdHMgLyAyMDAwLjApICsgKHRvdGFsSGl0cyA+IDIwMDAgPyBNYXRoLmxvZzEwKHRvdGFsSGl0cyAvIDIwMDAuMCkgKiAwLjUgOiAwLjApO1xyXG4gICAgICAgIGFpbVZhbHVlICo9IGxlbmd0aEJvbnVzO1xyXG4gICAgICAgIGlmIChlZmZlY3RpdmVNaXNzQ291bnQgPiAwKVxyXG4gICAgICAgICAgICBhaW1WYWx1ZSAqPSAwLjk3ICogTWF0aC5wb3coMSAtIE1hdGgucG93KGVmZmVjdGl2ZU1pc3NDb3VudCAvIHRvdGFsSGl0cywgMC43NzUpLCBlZmZlY3RpdmVNaXNzQ291bnQpO1xyXG4gICAgICAgIGFpbVZhbHVlICo9IGNvbWJvU2NhbGluZ0ZhY3RvcjtcclxuICAgICAgICBsZXQgYXBwcm9hY2hSYXRlRmFjdG9yID0gMC4wO1xyXG4gICAgICAgIGlmIChhcHByb2FjaFJhdGUgPiAxMC4zMylcclxuICAgICAgICAgICAgYXBwcm9hY2hSYXRlRmFjdG9yID0gMC4zICogKGFwcHJvYWNoUmF0ZSAtIDEwLjMzKTtcclxuICAgICAgICBlbHNlIGlmIChhcHByb2FjaFJhdGUgPCA4KVxyXG4gICAgICAgICAgICBhcHByb2FjaFJhdGVGYWN0b3IgPSAwLjA1ICogKDguMCAtIGFwcHJvYWNoUmF0ZSk7XHJcbiAgICAgICAgaWYgKG1vZHMuaW5jbHVkZXMoXCJSRUxBWFwiKSlcclxuICAgICAgICAgICAgYXBwcm9hY2hSYXRlRmFjdG9yID0gMC4wO1xyXG4gICAgICAgIGFpbVZhbHVlICo9IDEuMCArIGFwcHJvYWNoUmF0ZUZhY3RvciAqIGxlbmd0aEJvbnVzOyAvLyBCdWZmIGZvciBsb25nIG1hcHMgd2l0aCBoaWdoIEFSXHJcbiAgICAgICAgaWYgKG1vZHMuaW5jbHVkZXMoXCJCTElORFNcIikpIHtcclxuICAgICAgICAgICAgYWltVmFsdWUgKj1cclxuICAgICAgICAgICAgICAgIDEuMyArXHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWxIaXRzICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgKDAuMDAxNiAvICgxICsgMiAqIGVmZmVjdGl2ZU1pc3NDb3VudCkpICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coYWNjdXJhY3ksIDE2KSAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgxIC0gMC4wMDMgKiBkcmFpblJhdGUgKiBkcmFpblJhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChtb2RzLmluY2x1ZGVzKFwiSElEREVOXCIpKSB7XHJcbiAgICAgICAgICAgIC8vIFJld2FyZGluZyBsb3cgQVIgd2hlbiB0aGVyZSBpcyBIRCAtPiB0aGlzIG5lcmZzIGhpZ2ggQVIgYW5kIGJ1ZmZzIGxvdyBBUlxyXG4gICAgICAgICAgICBhaW1WYWx1ZSAqPSAxLjAgKyAwLjA0ICogKDEyLjAgLSBhcHByb2FjaFJhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBXZSBhc3N1bWUgMTUlIG9mIHNsaWRlcnMgaW4gYSBtYXAgYXJlIGRpZmZpY3VsdCBzaW5jZSB0aGVyZSdzIG5vIHdheSB0byB0ZWxsIGZyb20gdGhlIHBlcmZvcm1hbmNlIGNhbGN1bGF0b3IuXHJcbiAgICAgICAgY29uc3QgZXN0aW1hdGVEaWZmaWN1bHRTbGlkZXJzID0gc2xpZGVyQ291bnQgKiAwLjE1O1xyXG4gICAgICAgIGlmIChzbGlkZXJDb3VudCA+IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZXN0aW1hdGVTbGlkZXJFbmRzRHJvcHBlZCA9ICgwLCBpbmRleF8yLmNsYW1wKShNYXRoLm1pbihjb3VudE9rICsgY291bnRNZWggKyBjb3VudE1pc3MsIGJlYXRtYXBNYXhDb21ibyAtIHNjb3JlTWF4Q29tYm8pLCAwLCBlc3RpbWF0ZURpZmZpY3VsdFNsaWRlcnMpO1xyXG4gICAgICAgICAgICBjb25zdCBzbGlkZXJOZXJmRmFjdG9yID0gKDEgLSBzbGlkZXJGYWN0b3IpICogTWF0aC5wb3coMSAtIGVzdGltYXRlU2xpZGVyRW5kc0Ryb3BwZWQgLyBlc3RpbWF0ZURpZmZpY3VsdFNsaWRlcnMsIDMpICsgc2xpZGVyRmFjdG9yO1xyXG4gICAgICAgICAgICBhaW1WYWx1ZSAqPSBzbGlkZXJOZXJmRmFjdG9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhaW1WYWx1ZSAqPSBhY2N1cmFjeTtcclxuICAgICAgICBhaW1WYWx1ZSAqPSAwLjk4ICsgTWF0aC5wb3cob3ZlcmFsbERpZmZpY3VsdHksIDIpIC8gMjUwMDtcclxuICAgICAgICByZXR1cm4gYWltVmFsdWU7XHJcbiAgICB9KSgpO1xyXG4gICAgY29uc3Qgc3BlZWRWYWx1ZSA9IChmdW5jdGlvbiBjb21wdXRlU3BlZWRWYWx1ZSgpIHtcclxuICAgICAgICBjb25zdCByZWxldmFudFRvdGFsRGlmZiA9IHRvdGFsSGl0cyAtIHNwZWVkTm90ZXM7XHJcbiAgICAgICAgY29uc3QgcmVsZXZhbnRDb3VudEdyZWF0ID0gTWF0aC5tYXgoMCwgY291bnRHcmVhdCAtIHJlbGV2YW50VG90YWxEaWZmKTtcclxuICAgICAgICBjb25zdCByZWxldmFudENvdW50T2sgPSBNYXRoLm1heCgwLCBjb3VudE9rIC0gTWF0aC5tYXgoMCwgcmVsZXZhbnRUb3RhbERpZmYgLSBjb3VudEdyZWF0KSk7XHJcbiAgICAgICAgY29uc3QgcmVsZXZhbnRDb3VudE1laCA9IE1hdGgubWF4KDAsIGNvdW50TWVoIC0gTWF0aC5tYXgoMCwgcmVsZXZhbnRUb3RhbERpZmYgLSBjb3VudEdyZWF0IC0gY291bnRPaykpO1xyXG4gICAgICAgIGNvbnN0IHJlbGV2YW50QWNjdXJhY3kgPSBzcGVlZE5vdGVzID09IDAgPyAwIDogKHJlbGV2YW50Q291bnRHcmVhdCAqIDYuMCArIHJlbGV2YW50Q291bnRPayAqIDIuMCArIHJlbGV2YW50Q291bnRNZWgpIC8gKHNwZWVkTm90ZXMgKiA2LjApO1xyXG4gICAgICAgIGxldCBzcGVlZFZhbHVlID0gTWF0aC5wb3coNS4wICogTWF0aC5tYXgoMS4wLCBzcGVlZERpZmZpY3VsdHkgLyAwLjA2NzUpIC0gNC4wLCAzLjApIC8gMTAwMDAwLjA7XHJcbiAgICAgICAgY29uc3QgbGVuZ3RoQm9udXMgPSAwLjk1ICsgMC40ICogTWF0aC5taW4oMS4wLCB0b3RhbEhpdHMgLyAyMDAwLjApICsgKHRvdGFsSGl0cyA+IDIwMDAgPyBNYXRoLmxvZzEwKHRvdGFsSGl0cyAvIDIwMDAuMCkgKiAwLjUgOiAwLjApO1xyXG4gICAgICAgIHNwZWVkVmFsdWUgKj0gbGVuZ3RoQm9udXM7XHJcbiAgICAgICAgLy8gUGVuYWxpemUgbWlzc2VzIGJ5IGFzc2Vzc2luZyAjIG9mIG1pc3NlcyByZWxhdGl2ZSB0byB0aGUgdG90YWwgIyBvZiBvYmplY3RzLiBEZWZhdWx0IGEgMyUgcmVkdWN0aW9uIGZvciBhbnkgIyBvZlxyXG4gICAgICAgIC8vIG1pc3Nlcy5cclxuICAgICAgICBpZiAoZWZmZWN0aXZlTWlzc0NvdW50ID4gMClcclxuICAgICAgICAgICAgc3BlZWRWYWx1ZSAqPVxyXG4gICAgICAgICAgICAgICAgMC45NyAqIE1hdGgucG93KDEgLSBNYXRoLnBvdyhlZmZlY3RpdmVNaXNzQ291bnQgLyB0b3RhbEhpdHMsIDAuNzc1KSwgTWF0aC5wb3coZWZmZWN0aXZlTWlzc0NvdW50LCAwLjg3NSkpO1xyXG4gICAgICAgIHNwZWVkVmFsdWUgKj0gY29tYm9TY2FsaW5nRmFjdG9yO1xyXG4gICAgICAgIGxldCBhcHByb2FjaFJhdGVGYWN0b3IgPSAwLjA7XHJcbiAgICAgICAgaWYgKGFwcHJvYWNoUmF0ZSA+IDEwLjMzKVxyXG4gICAgICAgICAgICBhcHByb2FjaFJhdGVGYWN0b3IgPSAwLjMgKiAoYXBwcm9hY2hSYXRlIC0gMTAuMzMpO1xyXG4gICAgICAgIHNwZWVkVmFsdWUgKj0gMS4wICsgYXBwcm9hY2hSYXRlRmFjdG9yICogbGVuZ3RoQm9udXM7IC8vIEJ1ZmYgZm9yIGxvbmdlciBtYXBzIHdpdGggaGlnaCBBUi5cclxuICAgICAgICBpZiAobW9kcy5pbmNsdWRlcyhcIkJMSU5EU1wiKSkge1xyXG4gICAgICAgICAgICAvLyBJbmNyZWFzaW5nIHRoZSBzcGVlZCB2YWx1ZSBieSBvYmplY3QgY291bnQgZm9yIEJsaW5kcyBpc24ndCBpZGVhbCwgc28gdGhlIG1pbmltdW0gYnVmZiBpcyBnaXZlbi5cclxuICAgICAgICAgICAgc3BlZWRWYWx1ZSAqPSAxLjEyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChtb2RzLmluY2x1ZGVzKFwiSElEREVOXCIpKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gZ2l2ZSBtb3JlIHJld2FyZCBmb3IgbG93ZXIgQVIgd2hlbiBpdCBjb21lcyB0byBhaW0gYW5kIEhELiBUaGlzIG5lcmZzIGhpZ2ggQVIgYW5kIGJ1ZmZzIGxvd2VyIEFSLlxyXG4gICAgICAgICAgICBzcGVlZFZhbHVlICo9IDEuMCArIDAuMDQgKiAoMTIuMCAtIGFwcHJvYWNoUmF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFNjYWxlIHRoZSBzcGVlZCB2YWx1ZSB3aXRoIGFjY3VyYWN5IGFuZCBPRC5cclxuICAgICAgICBzcGVlZFZhbHVlICo9XHJcbiAgICAgICAgICAgICgwLjk1ICsgTWF0aC5wb3cob3ZlcmFsbERpZmZpY3VsdHksIDIpIC8gNzUwKSAqIE1hdGgucG93KChhY2N1cmFjeSArIHJlbGV2YW50QWNjdXJhY3kpIC8gMi4wLCAoMTQuNSAtIE1hdGgubWF4KG92ZXJhbGxEaWZmaWN1bHR5LCA4KSkgLyAyKTtcclxuICAgICAgICAvLyBTY2FsZSB0aGUgc3BlZWQgdmFsdWUgd2l0aCAjIG9mIDUwcyB0byBwdW5pc2ggZG91YmxlLXRhcHBpbmcuXHJcbiAgICAgICAgc3BlZWRWYWx1ZSAqPSBNYXRoLnBvdygwLjk5LCBjb3VudE1laCA8IHRvdGFsSGl0cyAvIDUwMC4wID8gMCA6IGNvdW50TWVoIC0gdG90YWxIaXRzIC8gNTAwLjApO1xyXG4gICAgICAgIHJldHVybiBzcGVlZFZhbHVlO1xyXG4gICAgfSkoKTtcclxuICAgIGNvbnN0IGFjY3VyYWN5VmFsdWUgPSAoZnVuY3Rpb24gY29tcHV0ZUFjY3VyYWN5VmFsdWUoKSB7XHJcbiAgICAgICAgaWYgKG1vZHMuaW5jbHVkZXMoXCJSRUxBWFwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIDAuMDtcclxuICAgICAgICAvLyBUaGlzIHBlcmNlbnRhZ2Ugb25seSBjb25zaWRlcnMgSGl0Q2lyY2xlcyBvZiBhbnkgdmFsdWUgLSBpbiB0aGlzIHBhcnQgb2YgdGhlIGNhbGN1bGF0aW9uIHdlIGZvY3VzIG9uIGhpdHRpbmcgdGhlXHJcbiAgICAgICAgLy8gdGltaW5nIGhpdCB3aW5kb3cuXHJcbiAgICAgICAgbGV0IGJldHRlckFjY3VyYWN5UGVyY2VudGFnZTtcclxuICAgICAgICBjb25zdCBhbW91bnRIaXRPYmplY3RzV2l0aEFjY3VyYWN5ID0gaGl0Q2lyY2xlQ291bnQ7XHJcbiAgICAgICAgaWYgKGFtb3VudEhpdE9iamVjdHNXaXRoQWNjdXJhY3kgPiAwKVxyXG4gICAgICAgICAgICBiZXR0ZXJBY2N1cmFjeVBlcmNlbnRhZ2UgPVxyXG4gICAgICAgICAgICAgICAgKChjb3VudEdyZWF0IC0gKHRvdGFsSGl0cyAtIGFtb3VudEhpdE9iamVjdHNXaXRoQWNjdXJhY3kpKSAqIDYgKyBjb3VudE9rICogMiArIGNvdW50TWVoKSAvXHJcbiAgICAgICAgICAgICAgICAgICAgKGFtb3VudEhpdE9iamVjdHNXaXRoQWNjdXJhY3kgKiA2LjApO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgYmV0dGVyQWNjdXJhY3lQZXJjZW50YWdlID0gMDtcclxuICAgICAgICAvLyBJdCBpcyBwb3NzaWJsZSB0byByZWFjaCBhIG5lZ2F0aXZlIGFjY3VyYWN5IHdpdGggdGhpcyBmb3JtdWxhLiBDYXAgaXQgYXQgemVybyAtIHplcm8gcG9pbnRzLlxyXG4gICAgICAgIGlmIChiZXR0ZXJBY2N1cmFjeVBlcmNlbnRhZ2UgPCAwKVxyXG4gICAgICAgICAgICBiZXR0ZXJBY2N1cmFjeVBlcmNlbnRhZ2UgPSAwO1xyXG4gICAgICAgIC8vIExvdHMgb2YgYXJiaXRyYXJ5IHZhbHVlcyBmcm9tIHRlc3RpbmcuXHJcbiAgICAgICAgLy8gQ29uc2lkZXJpbmcgdG8gdXNlIGRlcml2YXRpb24gZnJvbSBwZXJmZWN0IGFjY3VyYWN5IGluIGEgcHJvYmFiaWxpc3RpYyBtYW5uZXIgLSBhc3N1bWUgbm9ybWFsIGRpc3RyaWJ1dGlvbi5cclxuICAgICAgICBsZXQgYWNjdXJhY3lWYWx1ZSA9IE1hdGgucG93KDEuNTIxNjMsIG92ZXJhbGxEaWZmaWN1bHR5KSAqIE1hdGgucG93KGJldHRlckFjY3VyYWN5UGVyY2VudGFnZSwgMjQpICogMi44MztcclxuICAgICAgICAvLyBCb251cyBmb3IgbWFueSBoaXRjaXJjbGVzIC0gaXQncyBoYXJkZXIgdG8ga2VlcCBnb29kIGFjY3VyYWN5IHVwIGZvciBsb25nZXIuXHJcbiAgICAgICAgYWNjdXJhY3lWYWx1ZSAqPSBNYXRoLm1pbigxLjE1LCBNYXRoLnBvdyhhbW91bnRIaXRPYmplY3RzV2l0aEFjY3VyYWN5IC8gMTAwMC4wLCAwLjMpKTtcclxuICAgICAgICAvLyBJbmNyZWFzaW5nIHRoZSBhY2N1cmFjeSB2YWx1ZSBieSBvYmplY3QgY291bnQgZm9yIEJsaW5kcyBpc24ndCBpZGVhbCwgc28gdGhlIG1pbmltdW0gYnVmZiBpcyBnaXZlbi5cclxuICAgICAgICBpZiAobW9kcy5pbmNsdWRlcyhcIkJMSU5EU1wiKSlcclxuICAgICAgICAgICAgYWNjdXJhY3lWYWx1ZSAqPSAxLjE0O1xyXG4gICAgICAgIGVsc2UgaWYgKG1vZHMuaW5jbHVkZXMoXCJISURERU5cIikpXHJcbiAgICAgICAgICAgIGFjY3VyYWN5VmFsdWUgKj0gMS4wODtcclxuICAgICAgICBpZiAobW9kcy5pbmNsdWRlcyhcIkZMQVNIX0xJR0hUXCIpKVxyXG4gICAgICAgICAgICBhY2N1cmFjeVZhbHVlICo9IDEuMDI7XHJcbiAgICAgICAgcmV0dXJuIGFjY3VyYWN5VmFsdWU7XHJcbiAgICB9KSgpO1xyXG4gICAgY29uc3QgZmxhc2hsaWdodFZhbHVlID0gKGZ1bmN0aW9uIGNvbXB1dGVGbGFzaExpZ2h0VmFsdWUoKSB7XHJcbiAgICAgICAgaWYgKCFtb2RzLmluY2x1ZGVzKFwiRkxBU0hfTElHSFRcIikpXHJcbiAgICAgICAgICAgIHJldHVybiAwLjA7XHJcbiAgICAgICAgbGV0IHJhd0ZsYXNobGlnaHQgPSBmbGFzaGxpZ2h0RGlmZmljdWx0eTtcclxuICAgICAgICBpZiAobW9kcy5pbmNsdWRlcyhcIlRPVUNIX0RFVklDRVwiKSlcclxuICAgICAgICAgICAgcmF3Rmxhc2hsaWdodCA9IE1hdGgucG93KHJhd0ZsYXNobGlnaHQsIDAuOCk7XHJcbiAgICAgICAgbGV0IGZsYXNobGlnaHRWYWx1ZSA9IE1hdGgucG93KHJhd0ZsYXNobGlnaHQsIDIuMCkgKiAyNS4wO1xyXG4gICAgICAgIC8vIGlmIChtb2RzLmluY2x1ZGVzKFwiSElEREVOXCIpKSBmbGFzaGxpZ2h0VmFsdWUgKj0gMS4zO1xyXG4gICAgICAgIC8vIFBlbmFsaXplIG1pc3NlcyBieSBhc3Nlc3NpbmcgIyBvZiBtaXNzZXMgcmVsYXRpdmUgdG8gdGhlIHRvdGFsICMgb2Ygb2JqZWN0cy4gRGVmYXVsdCBhIDMlIHJlZHVjdGlvbiBmb3IgYW55ICMgb2ZcclxuICAgICAgICAvLyBtaXNzZXMuXHJcbiAgICAgICAgaWYgKGVmZmVjdGl2ZU1pc3NDb3VudCA+IDApXHJcbiAgICAgICAgICAgIGZsYXNobGlnaHRWYWx1ZSAqPVxyXG4gICAgICAgICAgICAgICAgMC45NyAqIE1hdGgucG93KDEgLSBNYXRoLnBvdyhlZmZlY3RpdmVNaXNzQ291bnQgLyB0b3RhbEhpdHMsIDAuNzc1KSwgTWF0aC5wb3coZWZmZWN0aXZlTWlzc0NvdW50LCAwLjg3NSkpO1xyXG4gICAgICAgIGZsYXNobGlnaHRWYWx1ZSAqPSBjb21ib1NjYWxpbmdGYWN0b3I7XHJcbiAgICAgICAgLy8gQWNjb3VudCBmb3Igc2hvcnRlciBtYXBzIGhhdmluZyBhIGhpZ2hlciByYXRpbyBvZiAwIGNvbWJvLzEwMCBjb21ibyBmbGFzaGxpZ2h0IHJhZGl1cy5cclxuICAgICAgICBmbGFzaGxpZ2h0VmFsdWUgKj1cclxuICAgICAgICAgICAgMC43ICtcclxuICAgICAgICAgICAgICAgIDAuMSAqIE1hdGgubWluKDEuMCwgdG90YWxIaXRzIC8gMjAwLjApICtcclxuICAgICAgICAgICAgICAgICh0b3RhbEhpdHMgPiAyMDAgPyAwLjIgKiBNYXRoLm1pbigxLjAsICh0b3RhbEhpdHMgLSAyMDApIC8gMjAwLjApIDogMC4wKTtcclxuICAgICAgICAvLyBTY2FsZSB0aGUgZmxhc2hsaWdodCB2YWx1ZSB3aXRoIGFjY3VyYWN5IF9zbGlnaHRseV8uXHJcbiAgICAgICAgZmxhc2hsaWdodFZhbHVlICo9IDAuNSArIGFjY3VyYWN5IC8gMi4wO1xyXG4gICAgICAgIC8vIEl0IGlzIGltcG9ydGFudCB0byBhbHNvIGNvbnNpZGVyIGFjY3VyYWN5IGRpZmZpY3VsdHkgd2hlbiBkb2luZyB0aGF0LlxyXG4gICAgICAgIGZsYXNobGlnaHRWYWx1ZSAqPSAwLjk4ICsgTWF0aC5wb3cob3ZlcmFsbERpZmZpY3VsdHksIDIpIC8gMjUwMDtcclxuICAgICAgICByZXR1cm4gZmxhc2hsaWdodFZhbHVlO1xyXG4gICAgfSkoKTtcclxuICAgIGNvbnN0IHRvdGFsVmFsdWUgPSBNYXRoLnBvdyhNYXRoLnBvdyhhaW1WYWx1ZSwgMS4xKSArXHJcbiAgICAgICAgTWF0aC5wb3coc3BlZWRWYWx1ZSwgMS4xKSArXHJcbiAgICAgICAgTWF0aC5wb3coYWNjdXJhY3lWYWx1ZSwgMS4xKSArXHJcbiAgICAgICAgTWF0aC5wb3coZmxhc2hsaWdodFZhbHVlLCAxLjEpLCAxLjAgLyAxLjEpICogbXVsdGlwbGllcjtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYWltOiBhaW1WYWx1ZSxcclxuICAgICAgICBzcGVlZDogc3BlZWRWYWx1ZSxcclxuICAgICAgICBhY2N1cmFjeTogYWNjdXJhY3lWYWx1ZSxcclxuICAgICAgICBmbGFzaGxpZ2h0OiBmbGFzaGxpZ2h0VmFsdWUsXHJcbiAgICAgICAgZWZmZWN0aXZlTWlzc0NvdW50LFxyXG4gICAgICAgIHRvdGFsOiB0b3RhbFZhbHVlLFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmNhbGN1bGF0ZVBlcmZvcm1hbmNlQXR0cmlidXRlcyA9IGNhbGN1bGF0ZVBlcmZvcm1hbmNlQXR0cmlidXRlcztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5jYWxjdWxhdGVBaW0gPSB2b2lkIDA7XHJcbmNvbnN0IGluZGV4XzEgPSByZXF1aXJlKFwiLi4vLi4vY29yZS9pbmRleFwiKTtcclxuY29uc3QgaW5kZXhfMiA9IHJlcXVpcmUoXCIuLi8uLi9tYXRoL2luZGV4XCIpO1xyXG5jb25zdCBzdHJhaW5fMSA9IHJlcXVpcmUoXCIuL3N0cmFpblwiKTtcclxuY29uc3Qgd2lkZV9hbmdsZV9tdWx0aXBsaWVyID0gMS41O1xyXG5jb25zdCBhY3V0ZV9hbmdsZV9tdWx0aXBsaWVyID0gMS45NTtcclxuY29uc3Qgc2xpZGVyX211bHRpcGxpZXIgPSAxLjM1O1xyXG5jb25zdCB2ZWxvY2l0eV9jaGFuZ2VfbXVsdGlwbGllciA9IDAuNzU7XHJcbmNvbnN0IHNraWxsTXVsdGlwbGllciA9IDIzLjU1O1xyXG5jb25zdCBzdHJhaW5EZWNheUJhc2UgPSAwLjE1O1xyXG5jb25zdCBzdHJhaW5EZWNheSA9IChtcykgPT4gTWF0aC5wb3coc3RyYWluRGVjYXlCYXNlLCBtcyAvIDEwMDApO1xyXG5jb25zdCBjYWxjV2lkZUFuZ2xlQm9udXMgPSAoYW5nbGUpID0+IE1hdGgucG93KE1hdGguc2luKCgzLjAgLyA0KSAqIChNYXRoLm1pbigoNS4wIC8gNikgKiBNYXRoLlBJLCBNYXRoLm1heChNYXRoLlBJIC8gNiwgYW5nbGUpKSAtIE1hdGguUEkgLyA2KSksIDIpO1xyXG5jb25zdCBjYWxjQWN1dGVBbmdsZUJvbnVzID0gKGFuZ2xlKSA9PiAxIC0gY2FsY1dpZGVBbmdsZUJvbnVzKGFuZ2xlKTtcclxuLyoqXHJcbiAqIEByZXR1cm5zIGBzdHJhaW5zW2ldYCA9IHN0cmFpbiB2YWx1ZSBhZnRlciB0aGUgYGlgdGggaGl0T2JqZWN0XHJcbiAqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVBaW1TdHJhaW5zKGhpdE9iamVjdHMsIGRpZmZzLCB3aXRoU2xpZGVycykge1xyXG4gICAgaWYgKGhpdE9iamVjdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIGNvbnN0IHN0cmFpbnMgPSBbMF07XHJcbiAgICBsZXQgY3VycmVudFN0cmFpbiA9IDA7XHJcbiAgICAvLyBJbmRleCAwIGlzIGEgZHVtbXkgZGlmZmljdWx0eUhpdE9iamVjdFxyXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBkaWZmcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGxhc3RMYXN0ID0gaGl0T2JqZWN0c1tpIC0gMl07XHJcbiAgICAgICAgY29uc3QgbGFzdCA9IGhpdE9iamVjdHNbaSAtIDFdO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBoaXRPYmplY3RzW2ldO1xyXG4gICAgICAgIGNvbnN0IGRpZmZMYXN0TGFzdCA9IGRpZmZzW2kgLSAyXTtcclxuICAgICAgICBjb25zdCBkaWZmTGFzdCA9IGRpZmZzW2kgLSAxXTtcclxuICAgICAgICBjb25zdCBkaWZmQ3VycmVudCA9IGRpZmZzW2ldO1xyXG4gICAgICAgIGNvbnN0IHN0cmFpblZhbHVlT2YgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0IGxlYXN0IHRocmVlIG5vbi1kdW1teSBlbGVtZW50cyBmb3IgdGhpcyBjYWxjdWxhdGlvblxyXG4gICAgICAgICAgICBpZiAoaSA8PSAyIHx8ICgwLCBpbmRleF8xLmlzU3Bpbm5lcikoY3VycmVudCkgfHwgKDAsIGluZGV4XzEuaXNTcGlubmVyKShsYXN0KSlcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICBsZXQgY3VyclZlbG9jaXR5ID0gZGlmZkN1cnJlbnQuanVtcERpc3RhbmNlIC8gZGlmZkN1cnJlbnQuc3RyYWluVGltZTtcclxuICAgICAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzU2xpZGVyKShsYXN0KSAmJiB3aXRoU2xpZGVycykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbW92ZW1lbnRWZWxvY2l0eSA9IGRpZmZDdXJyZW50Lm1vdmVtZW50RGlzdGFuY2UgLyBkaWZmQ3VycmVudC5tb3ZlbWVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cmF2ZWxWZWxvY2l0eSA9IGRpZmZDdXJyZW50LnRyYXZlbERpc3RhbmNlIC8gZGlmZkN1cnJlbnQudHJhdmVsVGltZTtcclxuICAgICAgICAgICAgICAgIGN1cnJWZWxvY2l0eSA9IE1hdGgubWF4KGN1cnJWZWxvY2l0eSwgbW92ZW1lbnRWZWxvY2l0eSArIHRyYXZlbFZlbG9jaXR5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgcHJldlZlbG9jaXR5ID0gZGlmZkxhc3QuanVtcERpc3RhbmNlIC8gZGlmZkxhc3Quc3RyYWluVGltZTtcclxuICAgICAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzU2xpZGVyKShsYXN0TGFzdCkgJiYgd2l0aFNsaWRlcnMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVtZW50VmVsb2NpdHkgPSBkaWZmTGFzdC5tb3ZlbWVudERpc3RhbmNlIC8gZGlmZkxhc3QubW92ZW1lbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHJhdmVsVmVsb2NpdHkgPSBkaWZmTGFzdC50cmF2ZWxEaXN0YW5jZSAvIGRpZmZMYXN0LnRyYXZlbFRpbWU7XHJcbiAgICAgICAgICAgICAgICBwcmV2VmVsb2NpdHkgPSBNYXRoLm1heChwcmV2VmVsb2NpdHksIG1vdmVtZW50VmVsb2NpdHkgKyB0cmF2ZWxWZWxvY2l0eSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IHdpZGVBbmdsZUJvbnVzID0gMDtcclxuICAgICAgICAgICAgbGV0IGFjdXRlQW5nbGVCb251cyA9IDA7XHJcbiAgICAgICAgICAgIGxldCBzbGlkZXJCb251cyA9IDA7XHJcbiAgICAgICAgICAgIGxldCB2ZWxvY2l0eUNoYW5nZUJvbnVzID0gMDtcclxuICAgICAgICAgICAgbGV0IGFpbVN0cmFpbiA9IGN1cnJWZWxvY2l0eTsgLy8gU3RhcnQgc3RyYWluIHdpdGggcmVndWxhciB2ZWxvY2l0eS5cclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAvLyBJZiByaHl0aG1zIGFyZSB0aGUgc2FtZS5cclxuICAgICAgICAgICAgTWF0aC5tYXgoZGlmZkN1cnJlbnQuc3RyYWluVGltZSwgZGlmZkxhc3Quc3RyYWluVGltZSkgPFxyXG4gICAgICAgICAgICAgICAgMS4yNSAqIE1hdGgubWluKGRpZmZDdXJyZW50LnN0cmFpblRpbWUsIGRpZmZMYXN0LnN0cmFpblRpbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGlmZkN1cnJlbnQuYW5nbGUgIT09IG51bGwgJiYgZGlmZkxhc3QuYW5nbGUgIT09IG51bGwgJiYgZGlmZkxhc3RMYXN0LmFuZ2xlICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyckFuZ2xlID0gZGlmZkN1cnJlbnQuYW5nbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFzdEFuZ2xlID0gZGlmZkxhc3QuYW5nbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFzdExhc3RBbmdsZSA9IGRpZmZMYXN0TGFzdC5hbmdsZTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXdhcmRpbmcgYW5nbGVzLCB0YWtlIHRoZSBzbWFsbGVyIHZlbG9jaXR5IGFzIGJhc2UuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYW5nbGVCb251cyA9IE1hdGgubWluKGN1cnJWZWxvY2l0eSwgcHJldlZlbG9jaXR5KTtcclxuICAgICAgICAgICAgICAgICAgICB3aWRlQW5nbGVCb251cyA9IGNhbGNXaWRlQW5nbGVCb251cyhjdXJyQW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdXRlQW5nbGVCb251cyA9IGNhbGNBY3V0ZUFuZ2xlQm9udXMoY3VyckFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlmZkN1cnJlbnQuc3RyYWluVGltZSA+IDEwMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25seSBidWZmIGRlbHRhVGltZSBleGNlZWRpbmcgMzAwIGJwbSAxLzIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdXRlQW5nbGVCb251cyA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdXRlQW5nbGVCb251cyAqPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsY0FjdXRlQW5nbGVCb251cyhsYXN0QW5nbGUpICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihhbmdsZUJvbnVzLCAxMjUgLyBkaWZmQ3VycmVudC5zdHJhaW5UaW1lKSAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coTWF0aC5zaW4oKE1hdGguUEkgLyAyKSAqIE1hdGgubWluKDEsICgxMDAgLSBkaWZmQ3VycmVudC5zdHJhaW5UaW1lKSAvIDI1KSksIDIpICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhNYXRoLnNpbigoKE1hdGguUEkgLyAyKSAqICgoMCwgaW5kZXhfMi5jbGFtcCkoZGlmZkN1cnJlbnQuanVtcERpc3RhbmNlLCA1MCwgMTAwKSAtIDUwKSkgLyA1MCksIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBQZW5hbGl6ZSB3aWRlIGFuZ2xlcyBpZiB0aGV5J3JlIHJlcGVhdGVkLCByZWR1Y2luZyB0aGUgcGVuYWx0eSBhcyB0aGUgbGFzdEFuZ2xlIGdldHMgbW9yZSBhY3V0ZS5cclxuICAgICAgICAgICAgICAgICAgICB3aWRlQW5nbGVCb251cyAqPSBhbmdsZUJvbnVzICogKDEgLSBNYXRoLm1pbih3aWRlQW5nbGVCb251cywgTWF0aC5wb3coY2FsY1dpZGVBbmdsZUJvbnVzKGxhc3RBbmdsZSksIDMpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGVuYWxpemUgYWN1dGUgYW5nbGVzIGlmIHRoZXkncmUgcmVwZWF0ZWQsIHJlZHVjaW5nIHRoZSBwZW5hbHR5IGFzIHRoZSBsYXN0TGFzdEFuZ2xlIGdldHMgbW9yZSBvYnR1c2UuXHJcbiAgICAgICAgICAgICAgICAgICAgYWN1dGVBbmdsZUJvbnVzICo9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDAuNSArIDAuNSAqICgxIC0gTWF0aC5taW4oYWN1dGVBbmdsZUJvbnVzLCBNYXRoLnBvdyhjYWxjQWN1dGVBbmdsZUJvbnVzKGxhc3RMYXN0QW5nbGUpLCAzKSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFRPRE86IGZsb2F0RXF1YWw/XHJcbiAgICAgICAgICAgIGlmIChNYXRoLm1heChwcmV2VmVsb2NpdHksIGN1cnJWZWxvY2l0eSkgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gdXNlIHRoZSBhdmVyYWdlIHZlbG9jaXR5IG92ZXIgdGhlIHdob2xlIG9iamVjdCB3aGVuIGF3YXJkaW5nIGRpZmZlcmVuY2VzLCBub3QgdGhlIGluZGl2aWR1YWwganVtcFxyXG4gICAgICAgICAgICAgICAgLy8gYW5kIHNsaWRlciBwYXRoIHZlbG9jaXRpZXMuXHJcbiAgICAgICAgICAgICAgICBwcmV2VmVsb2NpdHkgPSAoZGlmZkxhc3QuanVtcERpc3RhbmNlICsgZGlmZkxhc3QudHJhdmVsRGlzdGFuY2UpIC8gZGlmZkxhc3Quc3RyYWluVGltZTtcclxuICAgICAgICAgICAgICAgIGN1cnJWZWxvY2l0eSA9IChkaWZmQ3VycmVudC5qdW1wRGlzdGFuY2UgKyBkaWZmQ3VycmVudC50cmF2ZWxEaXN0YW5jZSkgLyBkaWZmQ3VycmVudC5zdHJhaW5UaW1lO1xyXG4gICAgICAgICAgICAgICAgLy8gU2NhbGUgd2l0aCByYXRpbyBvZiBkaWZmZXJlbmNlIGNvbXBhcmVkIHRvIDAuNSAqIG1heCBkaXN0LlxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlzdFJhdGlvID0gTWF0aC5wb3coTWF0aC5zaW4oKChNYXRoLlBJIC8gMikgKiBNYXRoLmFicyhwcmV2VmVsb2NpdHkgLSBjdXJyVmVsb2NpdHkpKSAvIE1hdGgubWF4KHByZXZWZWxvY2l0eSwgY3VyclZlbG9jaXR5KSksIDIpO1xyXG4gICAgICAgICAgICAgICAgLy8gUmV3YXJkIGZvciAlIGRpc3RhbmNlIHVwIHRvIDEyNSAvIHN0cmFpblRpbWUgZm9yIG92ZXJsYXBzIHdoZXJlIHZlbG9jaXR5IGlzIHN0aWxsIGNoYW5naW5nLlxyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3ZlcmxhcFZlbG9jaXR5QnVmZiA9IE1hdGgubWluKDEyNSAvIE1hdGgubWluKGRpZmZDdXJyZW50LnN0cmFpblRpbWUsIGRpZmZMYXN0LnN0cmFpblRpbWUpLCBNYXRoLmFicyhwcmV2VmVsb2NpdHkgLSBjdXJyVmVsb2NpdHkpKTtcclxuICAgICAgICAgICAgICAgIC8vIFJld2FyZCBmb3IgJSBkaXN0YW5jZSBzbG93ZWQgZG93biBjb21wYXJlZCB0byBwcmV2aW91cywgcGF5aW5nIGF0dGVudGlvbiB0byBub3QgYXdhcmQgb3ZlcmxhcFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9uT3ZlcmxhcFZlbG9jaXR5QnVmZiA9IE1hdGguYWJzKHByZXZWZWxvY2l0eSAtIGN1cnJWZWxvY2l0eSkgKlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRvIG5vdCBhd2FyZCBvdmVybGFwXHJcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coTWF0aC5zaW4oKE1hdGguUEkgLyAyKSAqIE1hdGgubWluKDEsIE1hdGgubWluKGRpZmZDdXJyZW50Lmp1bXBEaXN0YW5jZSwgZGlmZkxhc3QuanVtcERpc3RhbmNlKSAvIDEwMCkpLCAyKTtcclxuICAgICAgICAgICAgICAgIC8vIENob29zZSB0aGUgbGFyZ2VzdCBib251cywgbXVsdGlwbGllZCBieSByYXRpby5cclxuICAgICAgICAgICAgICAgIC8vIHZlbG9jaXR5Q2hhbmdlQm9udXMgPSBNYXRoLm1heChvdmVybGFwVmVsb2NpdHlCdWZmLCBub25PdmVybGFwVmVsb2NpdHlCdWZmKSAqIGRpc3RSYXRpbztcclxuICAgICAgICAgICAgICAgIHZlbG9jaXR5Q2hhbmdlQm9udXMgPSBvdmVybGFwVmVsb2NpdHlCdWZmICogZGlzdFJhdGlvO1xyXG4gICAgICAgICAgICAgICAgLy8gUGVuYWxpemUgZm9yIHJoeXRobSBjaGFuZ2VzLlxyXG4gICAgICAgICAgICAgICAgdmVsb2NpdHlDaGFuZ2VCb251cyAqPSBNYXRoLnBvdyhNYXRoLm1pbihkaWZmQ3VycmVudC5zdHJhaW5UaW1lLCBkaWZmTGFzdC5zdHJhaW5UaW1lKSAvIE1hdGgubWF4KGRpZmZDdXJyZW50LnN0cmFpblRpbWUsIGRpZmZMYXN0LnN0cmFpblRpbWUpLCAyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZGlmZkN1cnJlbnQudHJhdmVsVGltZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmV3YXJkIHNsaWRlcnMgYmFzZWQgb24gdmVsb2NpdHkuXHJcbiAgICAgICAgICAgICAgICBzbGlkZXJCb251cyA9IGRpZmZDdXJyZW50LnRyYXZlbERpc3RhbmNlIC8gZGlmZkN1cnJlbnQudHJhdmVsVGltZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBBZGQgaW4gYWN1dGUgYW5nbGUgYm9udXMgb3Igd2lkZSBhbmdsZSBib251cyArIHZlbG9jaXR5IGNoYW5nZSBib251cywgd2hpY2hldmVyIGlzIGxhcmdlci5cclxuICAgICAgICAgICAgYWltU3RyYWluICs9IE1hdGgubWF4KGFjdXRlQW5nbGVCb251cyAqIGFjdXRlX2FuZ2xlX211bHRpcGxpZXIsIHdpZGVBbmdsZUJvbnVzICogd2lkZV9hbmdsZV9tdWx0aXBsaWVyICsgdmVsb2NpdHlDaGFuZ2VCb251cyAqIHZlbG9jaXR5X2NoYW5nZV9tdWx0aXBsaWVyKTtcclxuICAgICAgICAgICAgLy8gQWRkIGluIGFkZGl0aW9uYWwgc2xpZGVyIHZlbG9jaXR5IGJvbnVzLlxyXG4gICAgICAgICAgICBpZiAod2l0aFNsaWRlcnMpXHJcbiAgICAgICAgICAgICAgICBhaW1TdHJhaW4gKz0gc2xpZGVyQm9udXMgKiBzbGlkZXJfbXVsdGlwbGllcjtcclxuICAgICAgICAgICAgcmV0dXJuIGFpbVN0cmFpbjtcclxuICAgICAgICB9KSgpO1xyXG4gICAgICAgIGN1cnJlbnRTdHJhaW4gKj0gc3RyYWluRGVjYXkoZGlmZkN1cnJlbnQuZGVsdGFUaW1lKTtcclxuICAgICAgICBjdXJyZW50U3RyYWluICs9IHN0cmFpblZhbHVlT2YgKiBza2lsbE11bHRpcGxpZXI7XHJcbiAgICAgICAgc3RyYWlucy5wdXNoKGN1cnJlbnRTdHJhaW4pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0cmFpbnM7XHJcbn1cclxuZnVuY3Rpb24gY2FsY3VsYXRlQWltKGhpdE9iamVjdHMsIGRpZmZzLCB3aXRoU2xpZGVycywgb25seUZpbmFsVmFsdWUpIHtcclxuICAgIGNvbnN0IHN0cmFpbnMgPSBjYWxjdWxhdGVBaW1TdHJhaW5zKGhpdE9iamVjdHMsIGRpZmZzLCB3aXRoU2xpZGVycyk7XHJcbiAgICByZXR1cm4gKDAsIHN0cmFpbl8xLmNhbGN1bGF0ZURpZmZpY3VsdHlWYWx1ZXMpKGRpZmZzLCBzdHJhaW5zLCB7XHJcbiAgICAgICAgZGVjYXlXZWlnaHQ6IDAuOSxcclxuICAgICAgICBkaWZmaWN1bHR5TXVsdGlwbGllcjogMS4wNixcclxuICAgICAgICBzZWN0aW9uRHVyYXRpb246IDQwMCxcclxuICAgICAgICByZWR1Y2VkU2VjdGlvbkNvdW50OiAxMCxcclxuICAgICAgICBzdHJhaW5EZWNheSxcclxuICAgIH0sIG9ubHlGaW5hbFZhbHVlKTtcclxufVxyXG5leHBvcnRzLmNhbGN1bGF0ZUFpbSA9IGNhbGN1bGF0ZUFpbTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5jYWxjdWxhdGVGbGFzaGxpZ2h0ID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uL2NvcmUvaW5kZXhcIik7XHJcbmNvbnN0IGluZGV4XzIgPSByZXF1aXJlKFwiLi4vLi4vbWF0aC9pbmRleFwiKTtcclxuY29uc3Qgc3RyYWluXzEgPSByZXF1aXJlKFwiLi9zdHJhaW5cIik7XHJcbmNvbnN0IHNraWxsTXVsdGlwbGllciA9IDAuMDU7XHJcbmNvbnN0IHN0cmFpbkRlY2F5QmFzZSA9IDAuMTU7XHJcbmNvbnN0IGhpc3RvcnlMZW5ndGggPSAxMDsgLy8gTG9vayBiYWNrIGZvciAxMCBub3RlcyBpcyBhZGRlZCBmb3IgdGhlIHNha2Ugb2YgZmxhc2hsaWdodCBjYWxjdWxhdGlvbnMuXHJcbmNvbnN0IHN0cmFpbkRlY2F5ID0gKG1zKSA9PiBNYXRoLnBvdyhzdHJhaW5EZWNheUJhc2UsIG1zIC8gMTAwMCk7XHJcbmNvbnN0IHBvc2l0aW9uID0gKG8pID0+ICgoMCwgaW5kZXhfMS5pc0hpdENpcmNsZSkobykgPyBvLnBvc2l0aW9uIDogby5oZWFkLnBvc2l0aW9uKTtcclxuLy8gSW4gRmxhc2hsaWdodCBpdCdzIG5vdCB1c2luZyBTdGFja2VkRW5kUG9zaXRpb24gc28gd2UgaGF2ZSB0byBhZGp1c3RcclxuY29uc3QgdW5zdGFja2VkRW5kUG9zaXRpb24gPSAobykgPT4gKCgwLCBpbmRleF8xLmlzSGl0Q2lyY2xlKShvKSA/IG8udW5zdGFja2VkUG9zaXRpb24gOiBvLnVuc3RhY2tlZEVuZFBvc2l0aW9uKTtcclxuLy8gY29uc3QgYmx1ZXByaW50RW5kUG9zaXRpb24gPSAobzogSGl0Q2lyY2xlIHwgU2xpZGVyKSA9PiAoaXNIaXRDaXJjbGUobykgPyBvLnBvc2l0aW9uIDogby5lbmRQb3NpdGlvbik7XHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZUZsYXNobGlnaHRTdHJhaW5zKGhpdE9iamVjdHMsIGRpZmZzLCBoaWRkZW4pIHtcclxuICAgIGlmIChoaXRPYmplY3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICBsZXQgY3VycmVudFN0cmFpbiA9IDA7XHJcbiAgICBjb25zdCBzdHJhaW5zID0gW2N1cnJlbnRTdHJhaW5dO1xyXG4gICAgY29uc3QgbWF4X29wYWNpdHlfYm9udXMgPSAwLjQ7XHJcbiAgICBjb25zdCBoaWRkZW5fYm9udXMgPSAwLjI7XHJcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGRpZmZzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9IGhpdE9iamVjdHNbaV07XHJcbiAgICAgICAgY29uc3QgZGlmZkN1cnJlbnQgPSBkaWZmc1tpXTtcclxuICAgICAgICBjb25zdCBzdHJhaW5WYWx1ZU9mID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzU3Bpbm5lcikoY3VycmVudCkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgY29uc3Qgc2NhbGluZ0ZhY3RvciA9IDUyLjAgLyBjdXJyZW50LnJhZGl1cztcclxuICAgICAgICAgICAgbGV0IHNtYWxsRGlzdE5lcmYgPSAxLjA7XHJcbiAgICAgICAgICAgIGxldCBjdW11bGF0aXZlU3RyYWluVGltZSA9IDAuMDtcclxuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IDAuMDtcclxuICAgICAgICAgICAgY29uc3QgcHJldmlvdXNDb3VudCA9IE1hdGgubWluKGkgLSAxLCBoaXN0b3J5TGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmV2aW91c0NvdW50OyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzID0gaGl0T2JqZWN0c1tpIC0gaiAtIDFdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlmZlByZXZpb3VzID0gZGlmZnNbaSAtIGogLSAxXTtcclxuICAgICAgICAgICAgICAgIGlmICgoMCwgaW5kZXhfMS5pc1NwaW5uZXIpKHByZXZpb3VzKSlcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIC8vICNMQVpFUkJVRzogTGF6ZXIgZG9lc24ndCB1c2UgU3RhY2tlZEVuZFBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICBjb25zdCBqdW1wRGlzdGFuY2UgPSBpbmRleF8yLlZlYzIuZGlzdGFuY2UocG9zaXRpb24oY3VycmVudCksIHVuc3RhY2tlZEVuZFBvc2l0aW9uKHByZXZpb3VzKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBjdW11bGF0aXZlU3RyYWluVGltZSArPSBkaWZmUHJldmlvdXMuc3RyYWluVGltZTtcclxuICAgICAgICAgICAgICAgIGN1bXVsYXRpdmVTdHJhaW5UaW1lICs9IGRpZmZzW2ldLnN0cmFpblRpbWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoaiA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICBzbWFsbERpc3ROZXJmID0gTWF0aC5taW4oMS4wLCBqdW1wRGlzdGFuY2UgLyA3NS4wKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWNrTmVyZiA9IE1hdGgubWluKDEuMCwgKGRpZmZQcmV2aW91cy5qdW1wRGlzdGFuY2UgLyBzY2FsaW5nRmFjdG9yKSAvIDI1LjApO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3BhY2l0eUJvbnVzID0gMS4wICsgbWF4X29wYWNpdHlfYm9udXMgKiAoMS4wIC0gKCEoMCwgaW5kZXhfMS5pc1NwaW5uZXIpKGN1cnJlbnQpID8gKCgwLCBpbmRleF8xLmlzSGl0Q2lyY2xlKShjdXJyZW50KSA/IGN1cnJlbnQub3BhY2l0eUF0KGN1cnJlbnQuaGl0VGltZSwgaGlkZGVuKSA6IGN1cnJlbnQuaGVhZC5vcGFjaXR5QXQoY3VycmVudC5oZWFkLmhpdFRpbWUsIGhpZGRlbikpIDogMSkpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN0YWNrTmVyZiAqIG9wYWNpdHlCb251cyAqIHNjYWxpbmdGYWN0b3IgKiBqdW1wRGlzdGFuY2UgLyBjdW11bGF0aXZlU3RyYWluVGltZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQgPSBNYXRoLnBvdyhzbWFsbERpc3ROZXJmICogcmVzdWx0LCAyLjApO1xyXG4gICAgICAgICAgICBpZiAoaGlkZGVuKVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICo9IDEuMCArIGhpZGRlbl9ib251cztcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9KSgpO1xyXG4gICAgICAgIGN1cnJlbnRTdHJhaW4gKj0gc3RyYWluRGVjYXkoZGlmZkN1cnJlbnQuZGVsdGFUaW1lKTtcclxuICAgICAgICBjdXJyZW50U3RyYWluICs9IHN0cmFpblZhbHVlT2YgKiBza2lsbE11bHRpcGxpZXI7XHJcbiAgICAgICAgc3RyYWlucy5wdXNoKGN1cnJlbnRTdHJhaW4pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0cmFpbnM7XHJcbn1cclxuZnVuY3Rpb24gY2FsY3VsYXRlRmxhc2hsaWdodChoaXRPYmplY3RzLCBkaWZmcywgb25seUZpbmFsVmFsdWUsIGhpZGRlbikge1xyXG4gICAgY29uc3Qgc3RyYWlucyA9IGNhbGN1bGF0ZUZsYXNobGlnaHRTdHJhaW5zKGhpdE9iamVjdHMsIGRpZmZzLCBoaWRkZW4pO1xyXG4gICAgcmV0dXJuICgwLCBzdHJhaW5fMS5jYWxjdWxhdGVEaWZmaWN1bHR5VmFsdWVzKShkaWZmcywgc3RyYWlucywge1xyXG4gICAgICAgIGRlY2F5V2VpZ2h0OiAwLjksXHJcbiAgICAgICAgZGlmZmljdWx0eU11bHRpcGxpZXI6IDEuMDYsXHJcbiAgICAgICAgc2VjdGlvbkR1cmF0aW9uOiA0MDAsXHJcbiAgICAgICAgcmVkdWNlZFNlY3Rpb25Db3VudDogMTAsXHJcbiAgICAgICAgc3RyYWluRGVjYXksXHJcbiAgICB9LCBvbmx5RmluYWxWYWx1ZSk7XHJcbn1cclxuZXhwb3J0cy5jYWxjdWxhdGVGbGFzaGxpZ2h0ID0gY2FsY3VsYXRlRmxhc2hsaWdodDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5jYWxjdWxhdGVSZWxldmFudE5vdGVzID0gZXhwb3J0cy5jYWxjdWxhdGVTcGVlZCA9IGV4cG9ydHMuY2FsY3VsYXRlU3BlZWRTdHJhaW5zID0gdm9pZCAwO1xyXG5jb25zdCBpbmRleF8xID0gcmVxdWlyZShcIi4uLy4uL2NvcmUvaW5kZXhcIik7XHJcbmNvbnN0IGluZGV4XzIgPSByZXF1aXJlKFwiLi4vLi4vbWF0aC9pbmRleFwiKTtcclxuY29uc3Qgc3RyYWluXzEgPSByZXF1aXJlKFwiLi9zdHJhaW5cIik7XHJcbmNvbnN0IHNpbmdsZV9zcGFjaW5nX3RocmVzaG9sZCA9IDEyNTtcclxuY29uc3Qgcmh5dGhtX211bHRpcGxpZXIgPSAwLjc1O1xyXG5jb25zdCBoaXN0b3J5X3RpbWVfbWF4ID0gNTAwMDsgLy8gNSBzZWNvbmRzIG9mIGNhbGN1bGF0aW5nUmh5dGhtQm9udXMgbWF4LlxyXG5jb25zdCBtaW5fc3BlZWRfYm9udXMgPSA3NTsgLy8gfjIwMEJQTVxyXG5jb25zdCBzcGVlZF9iYWxhbmNpbmdfZmFjdG9yID0gNDA7XHJcbmNvbnN0IHNraWxsTXVsdGlwbGllciA9IDEzNzU7XHJcbmNvbnN0IHN0cmFpbkRlY2F5QmFzZSA9IDAuMztcclxuY29uc3QgaGlzdG9yeV9sZW5ndGggPSAzMjtcclxuY29uc3Qgc3RyYWluRGVjYXkgPSAobXMpID0+IE1hdGgucG93KHN0cmFpbkRlY2F5QmFzZSwgbXMgLyAxMDAwKTtcclxuLyoqXHJcbiAqIEBwYXJhbSBoaXRPYmplY3RzXHJcbiAqIEBwYXJhbSBkaWZmc1xyXG4gKiBAcGFyYW0gZ3JlYXRXaW5kb3cgdGhlIGNsb2NrIHJhdGUgYWRqdXN0ZWQgaGl0IHdpbmRvd1xyXG4gKiBAcmV0dXJucyBgc3RyYWluc1tpXWAgPSBzcGVlZCBzdHJhaW4gdmFsdWUgYWZ0ZXIgdGhlIGBpYHRoIGhpdE9iamVjdFxyXG4gKi9cclxuZnVuY3Rpb24gY2FsY3VsYXRlU3BlZWRTdHJhaW5zKGhpdE9iamVjdHMsIGRpZmZzLCBncmVhdFdpbmRvdykge1xyXG4gICAgbGV0IGN1cnJlbnRTdHJhaW4gPSAwO1xyXG4gICAgY29uc3Qgc3RyYWlucyA9IFswXTtcclxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgaGl0T2JqZWN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBoaXRPYmplY3RzW2ldO1xyXG4gICAgICAgIGNvbnN0IGRpZmZDdXJyZW50ID0gZGlmZnNbaV07XHJcbiAgICAgICAgY29uc3QgZGlmZlByZXYgPSBkaWZmc1tpIC0gMV07XHJcbiAgICAgICAgY29uc3QgZGlmZk5leHQgPSBkaWZmc1tpICsgMV07XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coZGlmZkN1cnJlbnQsIGRpZmZOZXh0KVxyXG4gICAgICAgIC8vIEhlbHBlciBmdW5jdGlvbiBzbyB0aGF0IHdlIGRvbid0IGhhdmUgdG8gdXNlIHRoZSBSZXZlcnNlZFF1ZXVlIGBQcmV2aW91c2BcclxuICAgICAgICBjb25zdCBwcmV2aW91c0NvdW50ID0gTWF0aC5taW4oaGlzdG9yeV9sZW5ndGgsIGkgLSAxKTtcclxuICAgICAgICBjb25zdCBwcmV2aW91cyA9IChqKSA9PiBkaWZmc1tpIC0gMSAtIGpdO1xyXG4gICAgICAgIGNvbnN0IHByZXZpb3VzSGl0T2JqZWN0ID0gKGopID0+IGhpdE9iamVjdHNbaSAtIDEgLSBqXTtcclxuICAgICAgICBjb25zdCBzdHJhaW5WYWx1ZU9mID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCgwLCBpbmRleF8xLmlzU3Bpbm5lcikoY3VycmVudCkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgLy8gTm90ZTogb3N1UHJldk9iaiAhPSBudWxsIGlzIGVxdWl2YWxlbnQgdG8gaSA+IDEgc2luY2UgaXQgd2FudHMgdG8gbG9vayBhdCBvbmUgbm9uLWR1bW15IGRpZmYgb2JqZWN0XHJcbiAgICAgICAgICAgIGNvbnN0IHByZXZJc05vbkR1bW15ID0gcHJldmlvdXNDb3VudCA+IDA7XHJcbiAgICAgICAgICAgIC8vIGRlcml2ZSBzdHJhaW5UaW1lIGZvciBjYWxjdWxhdGlvblxyXG4gICAgICAgICAgICBsZXQgc3RyYWluVGltZSA9IGRpZmZDdXJyZW50LnN0cmFpblRpbWU7XHJcbiAgICAgICAgICAgIGNvbnN0IGdyZWF0V2luZG93RnVsbCA9IGdyZWF0V2luZG93ICogMjtcclxuICAgICAgICAgICAgLy8gY29uc3Qgc3BlZWRXaW5kb3dSYXRpbyA9IHN0cmFpblRpbWUgLyBncmVhdFdpbmRvd0Z1bGw7XHJcbiAgICAgICAgICAgIGxldCB0cnl6X3ZuID0gMTtcclxuICAgICAgICAgICAgaWYgKGRpZmZOZXh0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJEZWx0YVRpbWUgPSBNYXRoLm1heCgxLCBkaWZmQ3VycmVudC5kZWx0YVRpbWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dERlbHRhVGltZSA9IE1hdGgubWF4KDEsIGRpZmZOZXh0LmRlbHRhVGltZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZWx0YURpZmZlcmVuY2UgPSBNYXRoLmFicyhuZXh0RGVsdGFUaW1lIC0gY3VyckRlbHRhVGltZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGVlZFJhdGlvID0gY3VyckRlbHRhVGltZSAvIE1hdGgubWF4KGN1cnJEZWx0YVRpbWUsIGRlbHRhRGlmZmVyZW5jZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB3aW5kb3dSYXRpbyA9IE1hdGgucG93KE1hdGgubWluKDEsIGN1cnJEZWx0YVRpbWUgLyBncmVhdFdpbmRvd0Z1bGwpLCAyKTtcclxuICAgICAgICAgICAgICAgIHRyeXpfdm4gPSBNYXRoLnBvdyhzcGVlZFJhdGlvLCAxIC0gd2luZG93UmF0aW8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEFpbSB0byBuZXJmIGNoZWVzeSByaHl0aG1zIChWZXJ5IGZhc3QgY29uc2VjdXRpdmUgZG91YmxlcyB3aXRoIGxhcmdlIGRlbHRhLXRpbWVzIGJldHdlZW4pXHJcbiAgICAgICAgICAgIC8vIGlmIChwcmV2SXNOb25EdW1teSAmJiBzdHJhaW5UaW1lIDwgZ3JlYXRXaW5kb3dGdWxsICYmIGRpZmZQcmV2LnN0cmFpblRpbWUgPiBzdHJhaW5UaW1lKVxyXG4gICAgICAgICAgICAvLyAgIHN0cmFpblRpbWUgPSBsZXJwKGRpZmZQcmV2LnN0cmFpblRpbWUsIHN0cmFpblRpbWUsIHNwZWVkV2luZG93UmF0aW8pO1xyXG4gICAgICAgICAgICAvLyBDYXAgZGVsdGF0aW1lIHRvIHRoZSBPRCAzMDAgaGl0d2luZG93LlxyXG4gICAgICAgICAgICAvLyAwLjkzIGlzIGRlcml2ZWQgZnJvbSBtYWtpbmcgc3VyZSAyNjBicG0gT0Q4IHN0cmVhbXMgYXJlbid0IG5lcmZlZCBoYXJzaGx5LCB3aGlsc3QgMC45MiBsaW1pdHMgdGhlIGVmZmVjdCBvZlxyXG4gICAgICAgICAgICAvLyB0aGUgY2FwLlxyXG4gICAgICAgICAgICBzdHJhaW5UaW1lIC89ICgwLCBpbmRleF8yLmNsYW1wKShzdHJhaW5UaW1lIC8gZ3JlYXRXaW5kb3dGdWxsIC8gMC45MywgMC45MiwgMSk7XHJcbiAgICAgICAgICAgIC8vIGRlcml2ZSBzcGVlZEJvbnVzIGZvciBjYWxjdWxhdGlvblxyXG4gICAgICAgICAgICBsZXQgc3BlZWRCb251cyA9IDEuMDtcclxuICAgICAgICAgICAgaWYgKHN0cmFpblRpbWUgPCBtaW5fc3BlZWRfYm9udXMpXHJcbiAgICAgICAgICAgICAgICBzcGVlZEJvbnVzID0gMSArIDAuNzUgKiBNYXRoLnBvdygobWluX3NwZWVkX2JvbnVzIC0gc3RyYWluVGltZSkgLyBzcGVlZF9iYWxhbmNpbmdfZmFjdG9yLCAyKTtcclxuICAgICAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBNYXRoLm1pbihzaW5nbGVfc3BhY2luZ190aHJlc2hvbGQsIGRpZmZDdXJyZW50LnRyYXZlbERpc3RhbmNlICsgZGlmZkN1cnJlbnQubW92ZW1lbnREaXN0YW5jZSk7XHJcbiAgICAgICAgICAgIHJldHVybiAoc3BlZWRCb251cyArIHNwZWVkQm9udXMgKiBNYXRoLnBvdyhkaXN0YW5jZSAvIHNpbmdsZV9zcGFjaW5nX3RocmVzaG9sZCwgMy41KSkgKiB0cnl6X3ZuIC8gc3RyYWluVGltZTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRSaHl0aG0gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoKDAsIGluZGV4XzEuaXNTcGlubmVyKShjdXJyZW50KSlcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICBsZXQgcHJldmlvdXNJc2xhbmRTaXplID0gMDtcclxuICAgICAgICAgICAgbGV0IHJoeXRobUNvbXBsZXhpdHlTdW0gPSAwO1xyXG4gICAgICAgICAgICBsZXQgaXNsYW5kU2l6ZSA9IDE7XHJcbiAgICAgICAgICAgIGxldCBzdGFydFJhdGlvID0gMDsgLy8gc3RvcmUgdGhlIHJhdGlvIG9mIHRoZSBjdXJyZW50IHN0YXJ0IG9mIGFuIGlzbGFuZCB0byBidWZmIGZvciB0aWdodGVyIHJoeXRobXNcclxuICAgICAgICAgICAgbGV0IGZpcnN0RGVsdGFTd2l0Y2ggPSBmYWxzZTtcclxuICAgICAgICAgICAgbGV0IHJoeXRobVN0YXJ0ID0gMDtcclxuICAgICAgICAgICAgLy8gT3B0aW1pemF0aW9uIGZyb20gYSBcImZ1dHVyZVwiIGNvbW1pdFxyXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcHB5L29zdS9jb21taXQvYzg3ZmY4MmMxY2RlM2FmNDVjMTczZmNiMjY0ZGU5OTkzNDBiNzQzYyNkaWZmLTRlZDcwNjRlZWI2MGI2ZjBhMTlkYzE2NzI5Y2Q2ZmMzYzNiYTk3OTQ5NjJhN2JjZmM4MzBiZGRiZWE3ODEwMDBcclxuICAgICAgICAgICAgd2hpbGUgKHJoeXRobVN0YXJ0IDwgcHJldmlvdXNDb3VudCAtIDIgJiZcclxuICAgICAgICAgICAgICAgIGRpZmZDdXJyZW50LnN0YXJ0VGltZSAtIHByZXZpb3VzKHJoeXRobVN0YXJ0KS5zdGFydFRpbWUgPCBoaXN0b3J5X3RpbWVfbWF4KVxyXG4gICAgICAgICAgICAgICAgcmh5dGhtU3RhcnQrKztcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IHJoeXRobVN0YXJ0OyBqID4gMDsgai0tKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyT2JqID0gcHJldmlvdXMoaiAtIDEpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJldk9iaiA9IHByZXZpb3VzKGopO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGFzdE9iaiA9IHByZXZpb3VzKGogKyAxKTtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJySGlzdG9yaWNhbERlY2F5ID0gKGhpc3RvcnlfdGltZV9tYXggLSAoZGlmZkN1cnJlbnQuc3RhcnRUaW1lIC0gY3Vyck9iai5zdGFydFRpbWUpKSAvIGhpc3RvcnlfdGltZV9tYXg7XHJcbiAgICAgICAgICAgICAgICBjdXJySGlzdG9yaWNhbERlY2F5ID0gTWF0aC5taW4oKHByZXZpb3VzQ291bnQgLSBqKSAvIHByZXZpb3VzQ291bnQsIGN1cnJIaXN0b3JpY2FsRGVjYXkpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3VyckRlbHRhID0gY3Vyck9iai5zdHJhaW5UaW1lO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJldkRlbHRhID0gcHJldk9iai5zdHJhaW5UaW1lO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGFzdERlbHRhID0gbGFzdE9iai5zdHJhaW5UaW1lO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3VyclJhdGlvID0gMS4wICtcclxuICAgICAgICAgICAgICAgICAgICA2LjAgKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbigwLjUsIE1hdGgucG93KE1hdGguc2luKE1hdGguUEkgLyAoTWF0aC5taW4ocHJldkRlbHRhLCBjdXJyRGVsdGEpIC8gTWF0aC5tYXgocHJldkRlbHRhLCBjdXJyRGVsdGEpKSksIDIpKTsgLy8gZmFuY3kgZnVuY3Rpb24gdG8gY2FsY3VsYXRlIHJoeXRobWJvbnVzZXMuXHJcbiAgICAgICAgICAgICAgICBsZXQgd2luZG93UGVuYWx0eSA9IE1hdGgubWluKDEsIE1hdGgubWF4KDAsIE1hdGguYWJzKHByZXZEZWx0YSAtIGN1cnJEZWx0YSkgLSBncmVhdFdpbmRvdyAqIDAuNikgLyAoZ3JlYXRXaW5kb3cgKiAwLjYpKTtcclxuICAgICAgICAgICAgICAgIHdpbmRvd1BlbmFsdHkgPSBNYXRoLm1pbigxLCB3aW5kb3dQZW5hbHR5KTtcclxuICAgICAgICAgICAgICAgIGxldCBlZmZlY3RpdmVSYXRpbyA9IHdpbmRvd1BlbmFsdHkgKiBjdXJyUmF0aW87XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3REZWx0YVN3aXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHByZXZEZWx0YSA+IDEuMjUgKiBjdXJyRGVsdGEgfHwgcHJldkRlbHRhICogMS4yNSA8IGN1cnJEZWx0YSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzbGFuZFNpemUgPCA3KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNsYW5kU2l6ZSsrOyAvLyBpc2xhbmQgaXMgc3RpbGwgcHJvZ3Jlc3NpbmcsIGNvdW50IHNpemUuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKDAsIGluZGV4XzEuaXNTbGlkZXIpKHByZXZpb3VzSGl0T2JqZWN0KGogLSAxKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBicG0gY2hhbmdlIGlzIGludG8gc2xpZGVyLCB0aGlzIGlzIGVhc3kgYWNjIHdpbmRvd1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0aXZlUmF0aW8gKj0gMC4xMjU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoMCwgaW5kZXhfMS5pc1NsaWRlcikocHJldmlvdXNIaXRPYmplY3QoaikpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYnBtIGNoYW5nZSB3YXMgZnJvbSBhIHNsaWRlciwgdGhpcyBpcyBlYXNpZXIgdHlwaWNhbGx5IHRoYW4gY2lyY2xlIC0+IGNpcmNsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0aXZlUmF0aW8gKj0gMC4yNTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZpb3VzSXNsYW5kU2l6ZSA9PSBpc2xhbmRTaXplKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVwZWF0ZWQgaXNsYW5kIHNpemUgKGV4OiB0cmlwbGV0IC0+IHRyaXBsZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3RpdmVSYXRpbyAqPSAwLjI1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJldmlvdXNJc2xhbmRTaXplICUgMiA9PSBpc2xhbmRTaXplICUgMilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlcGVhdGVkIGlzbGFuZCBwb2xhcnRpeSAoMiAtPiA0LCAzIC0+IDUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3RpdmVSYXRpbyAqPSAwLjU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0RGVsdGEgPiBwcmV2RGVsdGEgKyAxMCAmJiBwcmV2RGVsdGEgPiBjdXJyRGVsdGEgKyAxMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByZXZpb3VzIGluY3JlYXNlIGhhcHBlbmVkIGEgbm90ZSBhZ28sIDEvMS0+MS8yLTEvNCwgZG9udCB3YW50IHRvIGJ1ZmYgdGhpcy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVmZmVjdGl2ZVJhdGlvICo9IDAuMTI1O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByaHl0aG1Db21wbGV4aXR5U3VtICs9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKChNYXRoLnNxcnQoZWZmZWN0aXZlUmF0aW8gKiBzdGFydFJhdGlvKSAqIGN1cnJIaXN0b3JpY2FsRGVjYXkgKiBNYXRoLnNxcnQoNCArIGlzbGFuZFNpemUpKSAvIDIpICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoNCArIHByZXZpb3VzSXNsYW5kU2l6ZSkpIC9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFJhdGlvID0gZWZmZWN0aXZlUmF0aW87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzSXNsYW5kU2l6ZSA9IGlzbGFuZFNpemU7IC8vIGxvZyB0aGUgbGFzdCBpc2xhbmQgc2l6ZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZEZWx0YSAqIDEuMjUgPCBjdXJyRGVsdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSBzbG93aW5nIGRvd24sIHN0b3AgY291bnRpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0RGVsdGFTd2l0Y2ggPSBmYWxzZTsgLy8gaWYgd2UncmUgc3BlZWRpbmcgdXAsIHRoaXMgc3RheXMgdHJ1ZSBhbmQgIHdlIGtlZXAgY291bnRpbmcgaXNsYW5kIHNpemUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzbGFuZFNpemUgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHByZXZEZWx0YSA+IDEuMjUgKiBjdXJyRGVsdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB3ZSB3YW50IHRvIGJlIHNwZWVkaW5nIHVwLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEJlZ2luIGNvdW50aW5nIGlzbGFuZCB1bnRpbCB3ZSBjaGFuZ2Ugc3BlZWQgYWdhaW4uXHJcbiAgICAgICAgICAgICAgICAgICAgZmlyc3REZWx0YVN3aXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRSYXRpbyA9IGVmZmVjdGl2ZVJhdGlvO1xyXG4gICAgICAgICAgICAgICAgICAgIGlzbGFuZFNpemUgPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoNCArIHJoeXRobUNvbXBsZXhpdHlTdW0gKiByaHl0aG1fbXVsdGlwbGllcikgLyAyOyAvL3Byb2R1Y2VzIG11bHRpcGxpZXIgdGhhdCBjYW4gYmUgYXBwbGllZCB0b1xyXG4gICAgICAgICAgICAvLyBzdHJhaW4uIHJhbmdlIFsxLCBpbmZpbml0eSkgKG5vdCByZWFsbHlcclxuICAgICAgICAgICAgLy8gdGhvdWdoKVxyXG4gICAgICAgIH0pKCk7XHJcbiAgICAgICAgY3VycmVudFN0cmFpbiAqPSBzdHJhaW5EZWNheShkaWZmQ3VycmVudC5zdHJhaW5UaW1lKTtcclxuICAgICAgICBjdXJyZW50U3RyYWluICs9IHN0cmFpblZhbHVlT2YgKiBza2lsbE11bHRpcGxpZXI7XHJcbiAgICAgICAgc3RyYWlucy5wdXNoKGN1cnJlbnRTdHJhaW4gKiBjdXJyZW50Umh5dGhtKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzdHJhaW5zO1xyXG59XHJcbmV4cG9ydHMuY2FsY3VsYXRlU3BlZWRTdHJhaW5zID0gY2FsY3VsYXRlU3BlZWRTdHJhaW5zO1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVTcGVlZChoaXRPYmplY3RzLCBkaWZmcywgaGl0V2luZG93R3JlYXQsIG9ubHlGaW5hbFZhbHVlKSB7XHJcbiAgICBjb25zdCBzdHJhaW5zID0gY2FsY3VsYXRlU3BlZWRTdHJhaW5zKGhpdE9iamVjdHMsIGRpZmZzLCBoaXRXaW5kb3dHcmVhdCk7XHJcbiAgICByZXR1cm4gKDAsIHN0cmFpbl8xLmNhbGN1bGF0ZURpZmZpY3VsdHlWYWx1ZXMpKGRpZmZzLCBzdHJhaW5zLCB7XHJcbiAgICAgICAgZGVjYXlXZWlnaHQ6IDAuOSxcclxuICAgICAgICBkaWZmaWN1bHR5TXVsdGlwbGllcjogMS4wNCxcclxuICAgICAgICBzZWN0aW9uRHVyYXRpb246IDQwMCxcclxuICAgICAgICByZWR1Y2VkU2VjdGlvbkNvdW50OiA1LFxyXG4gICAgICAgIHN0cmFpbkRlY2F5LFxyXG4gICAgfSwgb25seUZpbmFsVmFsdWUpO1xyXG59XHJcbmV4cG9ydHMuY2FsY3VsYXRlU3BlZWQgPSBjYWxjdWxhdGVTcGVlZDtcclxuZnVuY3Rpb24gY2FsY3VsYXRlUmVsZXZhbnROb3RlcyhoaXRPYmplY3RzLCBkaWZmcywgaGl0V2luZG93R3JlYXQsIG9ubHlGaW5hbFZhbHVlKSB7XHJcbiAgICBjb25zdCBzdHJhaW5zID0gY2FsY3VsYXRlU3BlZWRTdHJhaW5zKGhpdE9iamVjdHMsIGRpZmZzLCBoaXRXaW5kb3dHcmVhdCk7XHJcbiAgICBpZiAoc3RyYWlucy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICBjb25zdCBtYXhTdHJhaW4gPSBNYXRoLm1heCguLi5zdHJhaW5zKTtcclxuICAgIGlmIChtYXhTdHJhaW4gPT09IDApXHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICBsZXQgdG90YWwgPSAwO1xyXG4gICAgc3RyYWlucy5mb3JFYWNoKG5leHQgPT4ge1xyXG4gICAgICAgIHRvdGFsICs9IDEuMCAvICgxLjAgKyBNYXRoLmV4cCgtKG5leHQgLyBtYXhTdHJhaW4gKiAxMiAtIDYpKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0b3RhbDtcclxufVxyXG5leHBvcnRzLmNhbGN1bGF0ZVJlbGV2YW50Tm90ZXMgPSBjYWxjdWxhdGVSZWxldmFudE5vdGVzO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmNhbGN1bGF0ZURpZmZpY3VsdHlWYWx1ZXMgPSB2b2lkIDA7XHJcbmNvbnN0IGluZGV4XzEgPSByZXF1aXJlKFwiLi4vLi4vbWF0aC9pbmRleFwiKTtcclxuY29uc3QgaW5kZXhfMiA9IHJlcXVpcmUoXCIuLi8uLi9jb3JlL2luZGV4XCIpO1xyXG5jb25zdCBzdGFydFRpbWUgPSAobykgPT4gKCgwLCBpbmRleF8yLmlzSGl0Q2lyY2xlKShvKSA/IG8uaGl0VGltZSA6IG8uc3RhcnRUaW1lKTtcclxuLy8gTm90IG92ZXJyaWRkZW4gLi4uIHlldD9cclxuY29uc3QgUkVEVUNFRF9TVFJBSU5fQkFTRUxJTkUgPSAwLjc1O1xyXG4vKipcclxuICogU3VtbWFyeSBvZiBob3cgdGhlIHN0cmFpbiBza2lsbCB3b3JrczpcclxuICogLSBTdHJhaW4gaXMgYSB2YWx1ZSB0aGF0IGRlY2F5cyBleHBvbmVudGlhbGx5IG92ZXIgdGltZSBpZiB0aGVyZSBpcyBubyBoaXQgb2JqZWN0IHByZXNlbnRcclxuICogLSBMZXQgc3RyYWluIGF0IHRpbWUgdCBiZSBTKHQpXHJcbiAqXHJcbiAqIC0gRmlyc3QgdGhlIHdob2xlIGJlYXRtYXAgaXMgcGFydGl0aW9uZWQgaW50byBtdWx0aXBsZSBzZWN0aW9ucyBlYWNoIG9mIGR1cmF0aW9uIEQgKEQ9NDAwbXMgaW4gb3N1IXN0ZCkgZS5nLiBbMCxcclxuICogNDAwXSwgWzQwMCwgODAwXSwgLi4uXHJcbiAqIC0gTm93IHdlIG9ubHkgY29uc2lkZXIgdGhlIGhpZ2hlc3Qgc3RyYWluIG9mIGVhY2ggc2VjdGlvbiBha2EgXCJzZWN0aW9uIHBlYWtcIiBpLmUuIFAoaSkgPSBtYXgoUyh0KSkgd2hlcmUgaSpEIDw9IHQgPD1cclxuICogaSooRCsxKVxyXG4gKiBOb3RlOiBUaGlzIGNhbiBiZSBlYXNpbHkgY2FsY3VsYXRlZCBzaW5jZSB3ZSBrbm93IHRoYXQgdGhlIHBlYWsgY2FuIG9ubHkgaGFwcGVuIGFmdGVyIGVhY2ggaGl0IG9iamVjdCBvciBhdCB0aGVcclxuICogYmVnaW5uaW5nIG9mIGEgc2VjdGlvblxyXG4gKlxyXG4gKiAtIEZpbmFsbHkgdGhlIGRpZmZpY3VsdHkgdmFsdWUgb2YgYSBzdHJhaW4gc2tpbGwgY29uc2lkZXJzIHRoZSBsYXJnZXN0IEsgc3RyYWluIHBlYWtzIChLPTEwIGluIG9zdSFzdGQpIGFuZFxyXG4gKiBuZXJmcyB0aGVtIHNvIHRoYXQgdGhlIGV4dHJlbWx5IHVuaXF1ZSBkaWZmaWN1bHR5IHNwaWtlcyBnZXQgbmVyZmVkLlxyXG4gKlxyXG4gKiAtIFRoZW4gaXQgdXNlcyB0aGUgd2VpZ2h0ZWQgc3VtIHRvIGNhbGN1bGF0ZSB0aGUgZGlmZmljdWx0eVZhbHVlLlxyXG4gKlxyXG4gKiBQZXJmb3JtYW5jZSBub3RlczpcclxuICogMS4gTyhuICsgRCArIEQgKiBsb2cgRCkgaWYgb25seSBjYWxjdWxhdGluZyB0aGUgbGFzdCB2YWx1ZVxyXG4gKiAyLiBJZiB3ZSB3YW50IHRvIGNhbGN1bGF0ZSBmb3IgZXZlcnkgdmFsdWU6XHJcbiAqICAgVGhpcyBpcyBPKG4gKiBEICogbG9nIEQpIGJ1dCBjYW4gYmUgb3B0aW1pemVkIHRvIE8obikgYnkgaGF2aW5nIGEgcHJlY2lzaW9uIGJyZWFrcG9pbnRcclxuICogICAtPiBGb3IgZXhhbXBsZSwgaWYgd2Ugbm93IHdhbnQgdG8gcHVzaCBhIHBlYWsgdGhhdCdkIGJlIHRoZSAxNTB0aCBoaWdoZXN0IHZhbHVlLCB0aGVuIGJlc3QgaXQgY291bGQgZ2V0IGluXHJcbiAqICAgIGlzIHRvIGJlY29tZSB0aGUgMTQwdGggaGlnaGVzdCB2YWx1ZSAtPiBpdHMgdmFsdWUgbXVsdGlwbGllZCB3aXRoIHRoZSB3ZWlnaHQgMC45XjE0MCBzaG91bGQgYmVcclxuICogICAgZ3JlYXRlciB0aGFuIHNvbWUgcHJlY2lzaW9uIChsZXQncyBzYXkgMTBeLTYpLCBvdGhlcndpc2Ugd2UganVzdCBkb24ndCBwdXNoIGl0IHRvIHRoZSBwZWFrcy4gSW4gdGhlb3J5LCB3ZSBzaG91bGRcclxuICogICAganVzdCBiZSBtYWludGFpbmluZyBhYm91dCB+MTAwLTE1MCBwZWFrIHZhbHVlcyBkZXBlbmRpbmcgb24gdGhlIHJlcXVpcmVkIHByZWNpc2lvbiB3aGljaCBpcyBPKDEpIGNvbXBhcmVkIHRvIE8oRCkuXHJcbiAqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVEaWZmaWN1bHR5VmFsdWVzKGRpZmZzLCAvLyAtPiBvbmx5IHN0YXJ0VGltZSBpcyB1c2VkIGhlcmVcclxuc3RyYWlucywgeyBzZWN0aW9uRHVyYXRpb24sIHJlZHVjZWRTZWN0aW9uQ291bnQsIGRpZmZpY3VsdHlNdWx0aXBsaWVyLCBzdHJhaW5EZWNheSwgZGVjYXlXZWlnaHQgfSwgb25seUZpbmFsVmFsdWUpIHtcclxuICAgIGlmIChkaWZmcy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgLy8gb3N1IWxhemVyIG5vdGU6IHNlY3Rpb25CZWdpbiA9IHNlY3Rpb25EdXJhdGlvbiBpZiB0IGlzIGRpdmlkYWJsZSBieSBzZWN0aW9uRHVyYXRpb24gKGJ1Zz8pXHJcbiAgICBjb25zdCBjYWxjU2VjdGlvbkJlZ2luID0gKHNlY3Rpb25EdXJhdGlvbiwgdCkgPT4gTWF0aC5mbG9vcih0IC8gc2VjdGlvbkR1cmF0aW9uKSAqIHNlY3Rpb25EdXJhdGlvbjtcclxuICAgIGNvbnN0IHBlYWtzID0gW107XHJcbiAgICBjb25zdCBkaWZmaWN1bHR5VmFsdWVzID0gW107XHJcbiAgICBsZXQgY3VycmVudFNlY3Rpb25CZWdpbiA9IGNhbGNTZWN0aW9uQmVnaW4oc2VjdGlvbkR1cmF0aW9uLCBkaWZmc1swXS5zdGFydFRpbWUpO1xyXG4gICAgbGV0IGN1cnJlbnRTZWN0aW9uUGVhayA9IDA7XHJcbiAgICBpZiAoIW9ubHlGaW5hbFZhbHVlKSB7XHJcbiAgICAgICAgLy8gRm9yIHRoZSBmaXJzdCBoaXRvYmplY3QgaXQgaXMgYWx3YXlzIDBcclxuICAgICAgICBkaWZmaWN1bHR5VmFsdWVzLnB1c2goMCk7XHJcbiAgICB9XHJcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGRpZmZzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgcHJldlN0YXJ0VGltZSA9IGRpZmZzW2kgLSAxXS5zdGFydFRpbWU7XHJcbiAgICAgICAgY29uc3QgY3VyclN0YXJ0VGltZSA9IGRpZmZzW2ldLnN0YXJ0VGltZTtcclxuICAgICAgICAvLyBMZXQncyBzZWUgaWYgd2UgY2FuIGNsb3NlIG9mZiB0aGUgb3RoZXIgc2VjdGlvbnNcclxuICAgICAgICB3aGlsZSAoY3VycmVudFNlY3Rpb25CZWdpbiArIHNlY3Rpb25EdXJhdGlvbiA8IGN1cnJTdGFydFRpbWUpIHtcclxuICAgICAgICAgICAgcGVha3MucHVzaChjdXJyZW50U2VjdGlvblBlYWspO1xyXG4gICAgICAgICAgICBjdXJyZW50U2VjdGlvbkJlZ2luICs9IHNlY3Rpb25EdXJhdGlvbjtcclxuICAgICAgICAgICAgY3VycmVudFNlY3Rpb25QZWFrID0gc3RyYWluc1tpIC0gMV0gKiBzdHJhaW5EZWNheShjdXJyZW50U2VjdGlvbkJlZ2luIC0gcHJldlN0YXJ0VGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5vdyBjaGVjayBpZiB0aGUgY3VycmVudFNlY3Rpb25QZWFrIGNhbiBiZSBpbXByb3ZlZCB3aXRoIHRoZSBjdXJyZW50IGhpdCBvYmplY3QgaVxyXG4gICAgICAgIGN1cnJlbnRTZWN0aW9uUGVhayA9IE1hdGgubWF4KGN1cnJlbnRTZWN0aW9uUGVhaywgc3RyYWluc1tpXSk7XHJcbiAgICAgICAgaWYgKG9ubHlGaW5hbFZhbHVlICYmIGkgKyAxIDwgZGlmZnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBXZSBkbyBub3QgcHVzaCB0aGUgY3VycmVudFNlY3Rpb25QZWFrIHRvIHRoZSBwZWFrcyB5ZXQgYmVjYXVzZSBjdXJyZW50U2VjdGlvblBlYWsgaXMgc3RpbGwgaW4gYSBqZWxseSBzdGF0ZSBhbmRcclxuICAgICAgICAvLyBjYW4gYmUgaW1wcm92ZWQgYnkgdGhlIGZ1dHVyZSBoaXQgb2JqZWN0cyBpbiB0aGUgc2FtZSBzZWN0aW9uLlxyXG4gICAgICAgIGNvbnN0IHBlYWtzV2l0aEN1cnJlbnQgPSBbLi4ucGVha3MsIGN1cnJlbnRTZWN0aW9uUGVha107XHJcbiAgICAgICAgY29uc3QgZGVzY2VuZGluZyA9IChhLCBiKSA9PiBiIC0gYTtcclxuICAgICAgICBwZWFrc1dpdGhDdXJyZW50LnNvcnQoZGVzY2VuZGluZyk7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBub3cgcGFydCBvZiBEaWZmaWN1bHR5VmFsdWUoKVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4ocGVha3NXaXRoQ3VycmVudC5sZW5ndGgsIHJlZHVjZWRTZWN0aW9uQ291bnQpOyBpKyspIHtcclxuICAgICAgICAgICAgLy8gU2NhbGUgbWlnaHQgYmUgcHJlY2FsY3VsYXRlZCBzaW5jZSBpdCB1c2VzIHNvbWUgZXhwZW5zaXZlIG9wZXJhdGlvbiAobG9nMTApXHJcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gTWF0aC5sb2cxMCgoMCwgaW5kZXhfMS5sZXJwKSgxLCAxMCwgKDAsIGluZGV4XzEuY2xhbXApKGkgLyByZWR1Y2VkU2VjdGlvbkNvdW50LCAwLCAxKSkpO1xyXG4gICAgICAgICAgICBwZWFrc1dpdGhDdXJyZW50W2ldICo9ICgwLCBpbmRleF8xLmxlcnApKFJFRFVDRURfU1RSQUlOX0JBU0VMSU5FLCAxLjAsIHNjYWxlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IHdlaWdodCA9IDE7XHJcbiAgICAgICAgLy8gRGVjcmVhc2luZ2x5XHJcbiAgICAgICAgcGVha3NXaXRoQ3VycmVudC5zb3J0KGRlc2NlbmRpbmcpO1xyXG4gICAgICAgIGxldCBkaWZmaWN1bHR5VmFsdWUgPSAwO1xyXG4gICAgICAgIGZvciAoY29uc3QgcGVhayBvZiBwZWFrc1dpdGhDdXJyZW50KSB7XHJcbiAgICAgICAgICAgIGRpZmZpY3VsdHlWYWx1ZSArPSBwZWFrICogd2VpZ2h0O1xyXG4gICAgICAgICAgICB3ZWlnaHQgKj0gZGVjYXlXZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRpZmZpY3VsdHlWYWx1ZXMucHVzaChkaWZmaWN1bHR5VmFsdWUgKiBkaWZmaWN1bHR5TXVsdGlwbGllcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGlmZmljdWx0eVZhbHVlcztcclxufVxyXG5leHBvcnRzLmNhbGN1bGF0ZURpZmZpY3VsdHlWYWx1ZXMgPSBjYWxjdWxhdGVEaWZmaWN1bHR5VmFsdWVzO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLlZlYzIgPSB2b2lkIDA7XHJcbmNvbnN0IGZsb2F0MzJfMSA9IHJlcXVpcmUoXCIuL2Zsb2F0MzJcIik7XHJcbi8vIFRPRE86IFVzaW5nIDMyLWJpdCBmbG9hdCBhcyByZXR1cm4gcmVzdWx0IGV2ZXJ5d2hlcmU/XHJcbi8vIEZvciBleGFtcGxlIFZlY3RvcjIuTGVuZ3RoIGlzIHJldHVybmVkIGFzIGZsb2F0XHJcbmNsYXNzIFZlYzIge1xyXG4gICAgY29uc3RydWN0b3IoeCwgeSkge1xyXG4gICAgICAgIHRoaXMueCA9ICgwLCBmbG9hdDMyXzEuZmxvYXQzMikoeCk7XHJcbiAgICAgICAgdGhpcy55ID0gKDAsIGZsb2F0MzJfMS5mbG9hdDMyKSh5KTtcclxuICAgIH1cclxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIHByZWZlcnJlZCBzaW5jZSBpdCBhdm9pZHMgdXNpbmcgc3FydFxyXG4gICAgLy8gVE9ETzogaG93ZXZlciB0aGlzIG1pZ2h0IGJlIFRPTyBwcmVjaXNlIHRoYXQgd2Ugd2lsbCBoYXZlIG1hdGNoaW5nIGlzc3VlIHdpdGggb3N1IWxhemVyXHJcbiAgICBzdGF0aWMgd2l0aGluRGlzdGFuY2UoYSwgYiwgZCkge1xyXG4gICAgICAgIHJldHVybiAoYS54IC0gYi54KSAqKiAyICsgKGEueSAtIGIueSkgKiogMiA8PSBkICoqIDI7XHJcbiAgICB9XHJcbiAgICAvLyByZXR1cm5zIGZsb2F0XHJcbiAgICBzdGF0aWMgZGlzdGFuY2UoYSwgYikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZyb3VuZChNYXRoLnNxcnQoVmVjMi5kaXN0YW5jZVNxdWFyZWQoYSwgYikpKTtcclxuICAgIH1cclxuICAgIHN0YXRpYyBkaXN0YW5jZVNxdWFyZWQoYSwgYikge1xyXG4gICAgICAgIGNvbnN0IGR4ID0gYS54IC0gYi54LCBkeSA9IGEueSAtIGIueTtcclxuICAgICAgICByZXR1cm4gZHggKiogMiArIGR5ICoqIDI7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgZXF1YWwoYSwgYikge1xyXG4gICAgICAgIC8vIEkgY29tbWVudGVkIG91dCBteSBvcmlnaW5hbCBzb2x1dGlvbiBhbmQgcmVwbGFjZWQgaXQgd2l0aCBvc3UhZnJhbWV3b3JrIHZhcmlhbnQgKHdoaWNoIGlzIHZlcnkgc3RyaWN0KVxyXG4gICAgICAgIC8vIHJldHVybiBmbG9hdEVxdWFsKGEueCwgYi54KSAmJiBmbG9hdEVxdWFsKGEueSwgYi55KTtcclxuICAgICAgICByZXR1cm4gYS54ID09PSBiLnggJiYgYS55ID09PSBiLnk7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgYWRkKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlYzIoKDAsIGZsb2F0MzJfMS5mbG9hdDMyKShhLngpICsgKDAsIGZsb2F0MzJfMS5mbG9hdDMyKShiLngpLCAoMCwgZmxvYXQzMl8xLmZsb2F0MzIpKGEueSkgKyAoMCwgZmxvYXQzMl8xLmZsb2F0MzIpKGIueSkpO1xyXG4gICAgfVxyXG4gICAgc3RhdGljIGRvdChhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZnJvdW5kKGEueCAqIGIueCArIGEueSAqIGIueSk7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgc3ViKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlYzIoKDAsIGZsb2F0MzJfMS5mbG9hdDMyKShhLngpIC0gKDAsIGZsb2F0MzJfMS5mbG9hdDMyKShiLngpLCAoMCwgZmxvYXQzMl8xLmZsb2F0MzIpKGEueSkgLSAoMCwgZmxvYXQzMl8xLmZsb2F0MzIpKGIueSkpO1xyXG4gICAgfVxyXG4gICAgLy8gYzogZmxvYXRcclxuICAgIHN0YXRpYyBzY2FsZShhLCBjKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWMyKCgwLCBmbG9hdDMyXzEuZmxvYXQzMl9tdWwpKGEueCwgYyksICgwLCBmbG9hdDMyXzEuZmxvYXQzMl9tdWwpKGEueSwgYykpO1xyXG4gICAgfVxyXG4gICAgLy8gYzogZmxvYXRcclxuICAgIHN0YXRpYyBkaXZpZGUoYSwgYykge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjMigoMCwgZmxvYXQzMl8xLmZsb2F0MzJfZGl2KShhLngsIGMpLCAoMCwgZmxvYXQzMl8xLmZsb2F0MzJfZGl2KShhLnksIGMpKTtcclxuICAgIH1cclxuICAgIC8vIE9yZGVyIGlzIGltcG9ydGFudFxyXG4gICAgc3RhdGljIGludGVycG9sYXRlKGEsIGIsIHApIHtcclxuICAgICAgICByZXR1cm4gVmVjMi5hZGQoYSwgVmVjMi5zdWIoYiwgYSkuc2NhbGUocCkpO1xyXG4gICAgfVxyXG4gICAgYWRkKGIpIHtcclxuICAgICAgICByZXR1cm4gVmVjMi5hZGQodGhpcywgYik7XHJcbiAgICB9XHJcbiAgICBzdWIoYikge1xyXG4gICAgICAgIHJldHVybiBWZWMyLnN1Yih0aGlzLCBiKTtcclxuICAgIH1cclxuICAgIGRpdmlkZShjKSB7XHJcbiAgICAgICAgcmV0dXJuIFZlYzIuZGl2aWRlKHRoaXMsIGMpO1xyXG4gICAgfVxyXG4gICAgc2NhbGUoYykge1xyXG4gICAgICAgIHJldHVybiBWZWMyLnNjYWxlKHRoaXMsIGMpO1xyXG4gICAgfVxyXG4gICAgbGVuZ3RoU3F1YXJlZCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xyXG4gICAgfVxyXG4gICAgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiAoMCwgZmxvYXQzMl8xLmZsb2F0MzIpKE1hdGguc3FydCh0aGlzLnggKiogMiArIHRoaXMueSAqKiAyKSk7XHJcbiAgICB9XHJcbiAgICBlcXVhbHMoYikge1xyXG4gICAgICAgIHJldHVybiBWZWMyLmVxdWFsKHRoaXMsIGIpO1xyXG4gICAgfVxyXG4gICAgbm9ybWFsaXplZCgpIHtcclxuICAgICAgICBjb25zdCBudW0gPSB0aGlzLmxlbmd0aCgpO1xyXG4gICAgICAgIHRoaXMueCA9ICgwLCBmbG9hdDMyXzEuZmxvYXQzMl9kaXYpKHRoaXMueCwgbnVtKTtcclxuICAgICAgICB0aGlzLnkgPSAoMCwgZmxvYXQzMl8xLmZsb2F0MzJfZGl2KSh0aGlzLnksIG51bSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5WZWMyID0gVmVjMjtcclxuVmVjMi5aZXJvID0gbmV3IFZlYzIoMCwgMCk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMucmdiVG9JbnQgPSB2b2lkIDA7XHJcbmZ1bmN0aW9uIHJnYlRvSW50KHJnYikge1xyXG4gICAgaWYgKHJnYi5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgYXQgbGVhc3QgdGhyZWUgdmFsdWVzIHByb3ZpZGVkXCIpO1xyXG4gICAgfVxyXG4gICAgbGV0IHZhbCA9IDA7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG4gICAgICAgIHZhbCA9IHZhbCAqIDI1NiArIHJnYltpXTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWw7XHJcbn1cclxuZXhwb3J0cy5yZ2JUb0ludCA9IHJnYlRvSW50O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLm92ZXJhbGxEaWZmaWN1bHR5VG9IaXRXaW5kb3dHcmVhdCA9IGV4cG9ydHMuaGl0V2luZG93c0Zvck9EID0gZXhwb3J0cy5oaXRXaW5kb3dHcmVhdFRvT0QgPSBleHBvcnRzLmRpZmZpY3VsdHlSYW5nZUZvck9kID0gZXhwb3J0cy5nZXRGYWRlSW5EdXJhdGlvbiA9IGV4cG9ydHMuYXBwcm9hY2hEdXJhdGlvblRvQXBwcm9hY2hSYXRlID0gZXhwb3J0cy5hcHByb2FjaFJhdGVUb0FwcHJvYWNoRHVyYXRpb24gPSBleHBvcnRzLmRpZmZpY3VsdHlSYW5nZSA9IGV4cG9ydHMuY2lyY2xlU2l6ZVRvU2NhbGUgPSB2b2lkIDA7XHJcbi8qKlxyXG4gKiBDb252ZXJ0cyB0aGUgY2lyY2xlIHNpemUgdG8gYSBub3JtYWxpemVkIHNjYWxpbmcgdmFsdWUuXHJcbiAqIEBwYXJhbSBDUyB0aGUgY2lyY2xlIHNpemUgdmFsdWVcclxuICovXHJcbmNvbnN0IGZsb2F0MzJfMSA9IHJlcXVpcmUoXCIuL2Zsb2F0MzJcIik7XHJcbmZ1bmN0aW9uIGNpcmNsZVNpemVUb1NjYWxlKENTKSB7XHJcbiAgICByZXR1cm4gKDAsIGZsb2F0MzJfMS5mbG9hdDMyKSgoMS4wIC0gKDAuNyAqIChDUyAtIDUpKSAvIDUpIC8gMik7XHJcbn1cclxuZXhwb3J0cy5jaXJjbGVTaXplVG9TY2FsZSA9IGNpcmNsZVNpemVUb1NjYWxlO1xyXG4vLyBKdXN0IGEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgaXMgY29tbW9ubHkgdXNlZCBmb3IgT0QsIEFSIGNhbGN1bGF0aW9uXHJcbmZ1bmN0aW9uIGRpZmZpY3VsdHlSYW5nZShkaWZmaWN1bHR5LCBtaW4sIG1pZCwgbWF4KSB7XHJcbiAgICBpZiAoZGlmZmljdWx0eSA+IDUuMClcclxuICAgICAgICByZXR1cm4gbWlkICsgKChtYXggLSBtaWQpICogKGRpZmZpY3VsdHkgLSA1LjApKSAvIDUuMDtcclxuICAgIHJldHVybiBkaWZmaWN1bHR5IDwgNS4wID8gbWlkIC0gKChtaWQgLSBtaW4pICogKDUuMCAtIGRpZmZpY3VsdHkpKSAvIDUuMCA6IG1pZDtcclxufVxyXG5leHBvcnRzLmRpZmZpY3VsdHlSYW5nZSA9IGRpZmZpY3VsdHlSYW5nZTtcclxuLy8gTWluaW11bSBwcmVlbXB0IHRpbWUgYXQgQVI9MTBcclxuY29uc3QgUFJFRU1QVF9NSU4gPSA0NTA7XHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBhcHByb2FjaCBkdXJhdGlvbiBkZXBlbmRpbmcgb24gdGhlIGFic3RyYWN0IEFSIHZhbHVlLlxyXG4gKiBAcGFyYW0gQVIgdGhlIGFwcHJvYWNoIHJhdGUgdmFsdWVcclxuICovXHJcbmZ1bmN0aW9uIGFwcHJvYWNoUmF0ZVRvQXBwcm9hY2hEdXJhdGlvbihBUikge1xyXG4gICAgcmV0dXJuIGRpZmZpY3VsdHlSYW5nZShBUiwgMTgwMCwgMTIwMCwgUFJFRU1QVF9NSU4pO1xyXG59XHJcbmV4cG9ydHMuYXBwcm9hY2hSYXRlVG9BcHByb2FjaER1cmF0aW9uID0gYXBwcm9hY2hSYXRlVG9BcHByb2FjaER1cmF0aW9uO1xyXG5mdW5jdGlvbiBhcHByb2FjaER1cmF0aW9uVG9BcHByb2FjaFJhdGUoYXBwcm9hY2hEdXJhdGlvbkluTXMpIHtcclxuICAgIHJldHVybiBhcHByb2FjaER1cmF0aW9uSW5NcyA+IDEyMDAgPyAoMTgwMCAtIGFwcHJvYWNoRHVyYXRpb25Jbk1zKSAvIDEyMCA6ICgxMjAwIC0gYXBwcm9hY2hEdXJhdGlvbkluTXMpIC8gMTUwICsgNTtcclxufVxyXG5leHBvcnRzLmFwcHJvYWNoRHVyYXRpb25Ub0FwcHJvYWNoUmF0ZSA9IGFwcHJvYWNoRHVyYXRpb25Ub0FwcHJvYWNoUmF0ZTtcclxuZnVuY3Rpb24gZ2V0RmFkZUluRHVyYXRpb24oQVIpIHtcclxuICAgIGNvbnN0IFRpbWVQcmVlbXB0ID0gYXBwcm9hY2hSYXRlVG9BcHByb2FjaER1cmF0aW9uKEFSKTtcclxuICAgIHJldHVybiA0MDAgKiBNYXRoLm1pbigxLCBUaW1lUHJlZW1wdCAvIFBSRUVNUFRfTUlOKTtcclxufVxyXG5leHBvcnRzLmdldEZhZGVJbkR1cmF0aW9uID0gZ2V0RmFkZUluRHVyYXRpb247XHJcbmZ1bmN0aW9uIGRpZmZpY3VsdHlSYW5nZUZvck9kKGRpZmZpY3VsdHksIHJhbmdlKSB7XHJcbiAgICByZXR1cm4gZGlmZmljdWx0eVJhbmdlKGRpZmZpY3VsdHksIHJhbmdlLm9kMCwgcmFuZ2Uub2Q1LCByYW5nZS5vZDEwKTtcclxufVxyXG5leHBvcnRzLmRpZmZpY3VsdHlSYW5nZUZvck9kID0gZGlmZmljdWx0eVJhbmdlRm9yT2Q7XHJcbmZ1bmN0aW9uIGhpdFdpbmRvd0dyZWF0VG9PRChoaXRXaW5kb3dHcmVhdCkge1xyXG4gICAgcmV0dXJuICg4MCAtIGhpdFdpbmRvd0dyZWF0KSAvIDY7XHJcbn1cclxuZXhwb3J0cy5oaXRXaW5kb3dHcmVhdFRvT0QgPSBoaXRXaW5kb3dHcmVhdFRvT0Q7XHJcbmNvbnN0IE9TVV9TVERfSElUX1dJTkRPV19SQU5HRVMgPSBbXHJcbiAgICBbODAsIDUwLCAyMF0sXHJcbiAgICBbMTQwLCAxMDAsIDYwXSxcclxuICAgIFsyMDAsIDE1MCwgMTAwXSxcclxuICAgIFs0MDAsIDQwMCwgNDAwXSwgLy8gTWlzc1xyXG5dO1xyXG4vKipcclxuICogUmV0dXJucyB0aGUgaGl0IHdpbmRvd3MgaW4gdGhlIGZvbGxvd2luZyBvcmRlcjpcclxuICogW0hpdDMwMCwgSGl0MTAwLCBIaXQ1MCwgSGl0TWlzc11cclxuICogQHBhcmFtIG92ZXJhbGxEaWZmaWN1bHR5XHJcbiAqIEBwYXJhbSBsYXplclN0eWxlXHJcbiAqL1xyXG5mdW5jdGlvbiBoaXRXaW5kb3dzRm9yT0Qob3ZlcmFsbERpZmZpY3VsdHksIGxhemVyU3R5bGUpIHtcclxuICAgIGZ1bmN0aW9uIGxhemVySGl0V2luZG93c0Zvck9EKG9kKSB7XHJcbiAgICAgICAgcmV0dXJuIE9TVV9TVERfSElUX1dJTkRPV19SQU5HRVMubWFwKChbb2QwLCBvZDUsIG9kMTBdKSA9PiBkaWZmaWN1bHR5UmFuZ2Uob2QsIG9kMCwgb2Q1LCBvZDEwKSk7XHJcbiAgICB9XHJcbiAgICAvLyBTaG9ydCBleHBsYW5hdGlvbjogY3VycmVudGx5IGluIGxhemVyIHRoZSBoaXQgd2luZG93cyBhcmUgYWN0dWFsbHkgKzFtcyBiaWdnZXIgZHVlIHRvIHRoZW0gdXNpbmcgdGhlIExURSA8PVxyXG4gICAgLy8gb3BlcmF0b3IgaW5zdGVhZCBvZiBMVCA8ICA8PSBpbnN0ZWFkIG9mIDwgY2hlY2suXHJcbiAgICBpZiAobGF6ZXJTdHlsZSkge1xyXG4gICAgICAgIHJldHVybiBsYXplckhpdFdpbmRvd3NGb3JPRChvdmVyYWxsRGlmZmljdWx0eSk7XHJcbiAgICB9XHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcHB5L29zdS9pc3N1ZXMvMTEzMTFcclxuICAgIHJldHVybiBsYXplckhpdFdpbmRvd3NGb3JPRChvdmVyYWxsRGlmZmljdWx0eSkubWFwKCh3KSA9PiB3IC0gMSk7XHJcbn1cclxuZXhwb3J0cy5oaXRXaW5kb3dzRm9yT0QgPSBoaXRXaW5kb3dzRm9yT0Q7XHJcbi8vIExhemVyIHN0eWxlXHJcbmZ1bmN0aW9uIG92ZXJhbGxEaWZmaWN1bHR5VG9IaXRXaW5kb3dHcmVhdChvZCkge1xyXG4gICAgY29uc3QgW29kMCwgb2Q1LCBvZDEwXSA9IE9TVV9TVERfSElUX1dJTkRPV19SQU5HRVNbMF07XHJcbiAgICByZXR1cm4gZGlmZmljdWx0eVJhbmdlKG9kLCBvZDAsIG9kNSwgb2QxMCk7XHJcbn1cclxuZXhwb3J0cy5vdmVyYWxsRGlmZmljdWx0eVRvSGl0V2luZG93R3JlYXQgPSBvdmVyYWxsRGlmZmljdWx0eVRvSGl0V2luZG93R3JlYXQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMubGVycCA9IGV4cG9ydHMuYXBwbHlJbnRlcnBvbGF0aW9uID0gZXhwb3J0cy5hcHBseUVhc2luZyA9IGV4cG9ydHMuRWFzaW5nID0gdm9pZCAwO1xyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcHB5L29zdS1mcmFtZXdvcmsvYmxvYi9tYXN0ZXIvb3N1LkZyYW1ld29yay9HcmFwaGljcy9UcmFuc2Zvcm1zL0RlZmF1bHRFYXNpbmdGdW5jdGlvbi5jc1xyXG52YXIgRWFzaW5nO1xyXG4oZnVuY3Rpb24gKEVhc2luZykge1xyXG4gICAgRWFzaW5nW0Vhc2luZ1tcIkxJTkVBUlwiXSA9IDBdID0gXCJMSU5FQVJcIjtcclxuICAgIEVhc2luZ1tFYXNpbmdbXCJPVVRcIl0gPSAxXSA9IFwiT1VUXCI7XHJcbiAgICBFYXNpbmdbRWFzaW5nW1wiT1VUX1FVSU5UXCJdID0gMl0gPSBcIk9VVF9RVUlOVFwiO1xyXG4gICAgRWFzaW5nW0Vhc2luZ1tcIk9VVF9FTEFTVElDXCJdID0gM10gPSBcIk9VVF9FTEFTVElDXCI7XHJcbiAgICBFYXNpbmdbRWFzaW5nW1wiSU5fQ1VCSUNcIl0gPSA0XSA9IFwiSU5fQ1VCSUNcIjtcclxufSkoRWFzaW5nID0gZXhwb3J0cy5FYXNpbmcgfHwgKGV4cG9ydHMuRWFzaW5nID0ge30pKTtcclxuY29uc3QgZWxhc3RpY19jb25zdCA9ICgyICogTWF0aC5QSSkgLyAwLjM7XHJcbmNvbnN0IGVsYXN0aWNfY29uc3QyID0gMC4zIC8gNDtcclxuY29uc3QgYmFja19jb25zdCA9IDEuNzAxNTg7XHJcbmNvbnN0IGJhY2tfY29uc3QyID0gYmFja19jb25zdCAqIDEuNTI1O1xyXG5jb25zdCBib3VuY2VfY29uc3QgPSAxIC8gMi43NTtcclxuLy8gY29uc3RhbnRzIHVzZWQgdG8gZml4IGV4cG8gYW5kIGVsYXN0aWMgY3VydmVzIHRvIHN0YXJ0L2VuZCBhdCAwLzFcclxuY29uc3QgZXhwb19vZmZzZXQgPSBNYXRoLnBvdygyLCAtMTApO1xyXG5jb25zdCBlbGFzdGljX29mZnNldF9mdWxsID0gTWF0aC5wb3coMiwgLTExKTtcclxuY29uc3QgZWxhc3RpY19vZmZzZXRfaGFsZiA9IE1hdGgucG93KDIsIC0xMCkgKiBNYXRoLnNpbigoMC41IC0gZWxhc3RpY19jb25zdDIpICogZWxhc3RpY19jb25zdCk7XHJcbmNvbnN0IGVsYXN0aWNfb2Zmc2V0X3F1YXJ0ZXIgPSBNYXRoLnBvdygyLCAtMTApICogTWF0aC5zaW4oKDAuMjUgLSBlbGFzdGljX2NvbnN0MikgKiBlbGFzdGljX2NvbnN0KTtcclxuY29uc3QgaW5fb3V0X2VsYXN0aWNfb2Zmc2V0ID0gTWF0aC5wb3coMiwgLTEwKSAqIE1hdGguc2luKCgoMSAtIGVsYXN0aWNfY29uc3QyICogMS41KSAqIGVsYXN0aWNfY29uc3QpIC8gMS41KTtcclxuZnVuY3Rpb24gYXBwbHlFYXNpbmcodCwgZWFzaW5nKSB7XHJcbiAgICBzd2l0Y2ggKGVhc2luZykge1xyXG4gICAgICAgIGNhc2UgRWFzaW5nLkxJTkVBUjpcclxuICAgICAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICAgICAgY2FzZSBFYXNpbmcuT1VUOlxyXG4gICAgICAgICAgICByZXR1cm4gdCAqICgyIC0gdCk7XHJcbiAgICAgICAgY2FzZSBFYXNpbmcuT1VUX1FVSU5UOlxyXG4gICAgICAgICAgICByZXR1cm4gLS10ICogdCAqIHQgKiB0ICogdCArIDE7XHJcbiAgICAgICAgY2FzZSBFYXNpbmcuT1VUX0VMQVNUSUM6XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnBvdygyLCAtMTAgKiB0KSAqIE1hdGguc2luKCh0IC0gZWxhc3RpY19jb25zdDIpICogZWxhc3RpY19jb25zdCkgKyAxIC0gZWxhc3RpY19vZmZzZXRfZnVsbCAqIHQ7XHJcbiAgICAgICAgY2FzZSBFYXNpbmcuSU5fQ1VCSUM6XHJcbiAgICAgICAgICAgIHJldHVybiB0ICogdCAqIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5leHBvcnRzLmFwcGx5RWFzaW5nID0gYXBwbHlFYXNpbmc7XHJcbmZ1bmN0aW9uIGFwcGx5SW50ZXJwb2xhdGlvbih0aW1lLCBzdGFydFRpbWUsIGVuZFRpbWUsIHZhbEEsIHZhbEIsIGVhc2luZyA9IEVhc2luZy5MSU5FQVIpIHtcclxuICAgIC8vIE9yIGZsb2F0RXF1YWwgLi4uXHJcbiAgICBpZiAoc3RhcnRUaW1lID49IGVuZFRpbWUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwic3RhcnRUaW1lIHNob3VsZCBiZSBsZXNzIHRoYW4gZW5kVGltZVwiKTtcclxuICAgICAgICByZXR1cm4gdmFsQTsgLy8gb3IgdGhyb3cgRXJyb3I/XHJcbiAgICB9XHJcbiAgICBjb25zdCBwID0gYXBwbHlFYXNpbmcoKHRpbWUgLSBzdGFydFRpbWUpIC8gKGVuZFRpbWUgLSBzdGFydFRpbWUpLCBlYXNpbmcpO1xyXG4gICAgcmV0dXJuICh2YWxCIC0gdmFsQSkgKiBwICsgdmFsQTtcclxufVxyXG5leHBvcnRzLmFwcGx5SW50ZXJwb2xhdGlvbiA9IGFwcGx5SW50ZXJwb2xhdGlvbjtcclxuLyoqXHJcbiAqIExpbmVhciBpbnRlcnBvbGF0aW9uXHJcbiAqIEBwYXJhbSBzdGFydCBzdGFydCB2YWx1ZVxyXG4gKiBAcGFyYW0gZmluYWwgZmluYWwgdmFsdWVcclxuICogQHBhcmFtIGFtb3VudCBudW1iZXIgYmV0d2VlbiAwIGFuZCAxXHJcbiAqL1xyXG5mdW5jdGlvbiBsZXJwKHN0YXJ0LCBmaW5hbCwgYW1vdW50KSB7XHJcbiAgICByZXR1cm4gc3RhcnQgKyAoZmluYWwgLSBzdGFydCkgKiBhbW91bnQ7XHJcbn1cclxuZXhwb3J0cy5sZXJwID0gbGVycDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5mbG9hdDMyX3NxcnQgPSBleHBvcnRzLmZsb2F0MzJfZGl2ID0gZXhwb3J0cy5mbG9hdDMyX211bCA9IGV4cG9ydHMuZmxvYXQzMl9hZGQgPSBleHBvcnRzLmZsb2F0MzIgPSB2b2lkIDA7XHJcbmZ1bmN0aW9uIGZsb2F0MzIoYSkge1xyXG4gICAgcmV0dXJuIE1hdGguZnJvdW5kKGEpO1xyXG59XHJcbmV4cG9ydHMuZmxvYXQzMiA9IGZsb2F0MzI7XHJcbmZ1bmN0aW9uIGZsb2F0MzJfYWRkKGEsIGIpIHtcclxuICAgIHJldHVybiBmbG9hdDMyKGZsb2F0MzIoYSkgKyBmbG9hdDMyKGIpKTtcclxufVxyXG5leHBvcnRzLmZsb2F0MzJfYWRkID0gZmxvYXQzMl9hZGQ7XHJcbmZ1bmN0aW9uIGZsb2F0MzJfbXVsKGEsIGIpIHtcclxuICAgIHJldHVybiBmbG9hdDMyKGZsb2F0MzIoYSkgKiBmbG9hdDMyKGIpKTtcclxufVxyXG5leHBvcnRzLmZsb2F0MzJfbXVsID0gZmxvYXQzMl9tdWw7XHJcbmZ1bmN0aW9uIGZsb2F0MzJfZGl2KGEsIGIpIHtcclxuICAgIHJldHVybiBmbG9hdDMyKGZsb2F0MzIoYSkgLyBmbG9hdDMyKGIpKTtcclxufVxyXG5leHBvcnRzLmZsb2F0MzJfZGl2ID0gZmxvYXQzMl9kaXY7XHJcbmZ1bmN0aW9uIGZsb2F0MzJfc3FydChhKSB7XHJcbiAgICByZXR1cm4gZmxvYXQzMihNYXRoLnNxcnQoZmxvYXQzMihhKSkpO1xyXG59XHJcbmV4cG9ydHMuZmxvYXQzMl9zcXJ0ID0gZmxvYXQzMl9zcXJ0O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgIGRlc2MgPSB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH07XHJcbiAgICB9XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSkpO1xyXG52YXIgX19leHBvcnRTdGFyID0gKHRoaXMgJiYgdGhpcy5fX2V4cG9ydFN0YXIpIHx8IGZ1bmN0aW9uKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0cywgcCkpIF9fY3JlYXRlQmluZGluZyhleHBvcnRzLCBtLCBwKTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vY29sb3JzXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2RpZmZpY3VsdHlcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZWFzaW5nXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3RpbWVcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vdXRpbHNcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vc2xpZGVyc1wiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9WZWMyXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2Zsb2F0MzJcIiksIGV4cG9ydHMpO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnNsaWRlclJlcGVhdEFuZ2xlID0gdm9pZCAwO1xyXG5jb25zdCBWZWMyXzEgPSByZXF1aXJlKFwiLi9WZWMyXCIpO1xyXG4vLyBUT0RPOiBNYXliZSBtb3ZlIHRoaXMgdG8gb3N1L01hdGhcclxuLy8gTWF5YmUgdGhpcyBpcyBzbG93IGJlY2F1c2Ugb2YgYXRhbjIoKSBjYWxjdWxhdGlvblxyXG5mdW5jdGlvbiBzbGlkZXJSZXBlYXRBbmdsZShjdXJ2ZSwgaXNSZXBlYXRBdEVuZCkge1xyXG4gICAgaWYgKGN1cnZlLmxlbmd0aCA8IDIpIHtcclxuICAgICAgICByZXR1cm4gMC4wO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc2VhcmNoU3RhcnQgPSBpc1JlcGVhdEF0RW5kID8gY3VydmUubGVuZ3RoIC0gMSA6IDA7XHJcbiAgICBjb25zdCBzZWFyY2hEaXIgPSBpc1JlcGVhdEF0RW5kID8gLTEgOiArMTtcclxuICAgIC8vIEkgdGhpbmsgdGhlIHNwZWNpYWwgY2FzZSBoYXBwZW5pbmcgaW4gRHJhd2FibGVSZXBlYXRTbGlkZXIgb25seSBvY2N1cnMgYXQgc25ha2luZyAod2hpY2ggd2UgZG9uJ3QgaGF2ZSByaWdodFxyXG4gICAgLy8gbm93KS5cclxuICAgIC8vIFNvIFRPRE86IGltcGxlbWVudCBzZWFyY2hpbmcgZm9yIHR3byB1bmlxdWUgcG9pbnRzIHdoZW4gd2UgZG8gc25ha2luZ1xyXG4gICAgY29uc3QgcDEgPSBjdXJ2ZVtzZWFyY2hTdGFydF07XHJcbiAgICBjb25zdCBwMiA9IGN1cnZlW3NlYXJjaFN0YXJ0ICsgc2VhcmNoRGlyXTtcclxuICAgIGNvbnN0IGRpcmVjdGlvbiA9IFZlYzJfMS5WZWMyLnN1YihwMiwgcDEpO1xyXG4gICAgcmV0dXJuIE1hdGguYXRhbjIoZGlyZWN0aW9uLnksIGRpcmVjdGlvbi54KTtcclxufVxyXG5leHBvcnRzLnNsaWRlclJlcGVhdEFuZ2xlID0gc2xpZGVyUmVwZWF0QW5nbGU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuYmVhdExlbmd0aFRvQlBNID0gZXhwb3J0cy5mb3JtYXRHYW1lVGltZSA9IGV4cG9ydHMucGFyc2VNcyA9IGV4cG9ydHMuYWRkWmVybyA9IHZvaWQgMDtcclxuZnVuY3Rpb24gYWRkWmVybyh2YWx1ZSwgZGlnaXRzID0gMikge1xyXG4gICAgY29uc3QgaXNOZWdhdGl2ZSA9IE51bWJlcih2YWx1ZSkgPCAwO1xyXG4gICAgbGV0IGJ1ZmZlciA9IHZhbHVlLnRvU3RyaW5nKCk7XHJcbiAgICBsZXQgc2l6ZSA9IDA7XHJcbiAgICAvLyBTdHJpcCBtaW51cyBzaWduIGlmIG51bWJlciBpcyBuZWdhdGl2ZVxyXG4gICAgaWYgKGlzTmVnYXRpdmUpIHtcclxuICAgICAgICBidWZmZXIgPSBidWZmZXIuc2xpY2UoMSk7XHJcbiAgICB9XHJcbiAgICBzaXplID0gZGlnaXRzIC0gYnVmZmVyLmxlbmd0aCArIDE7XHJcbiAgICBidWZmZXIgPSBuZXcgQXJyYXkoc2l6ZSkuam9pbihcIjBcIikuY29uY2F0KGJ1ZmZlcik7XHJcbiAgICAvLyBBZGRzIGJhY2sgbWludXMgc2lnbiBpZiBuZWVkZWRcclxuICAgIHJldHVybiAoaXNOZWdhdGl2ZSA/IFwiLVwiIDogXCJcIikgKyBidWZmZXI7XHJcbn1cclxuZXhwb3J0cy5hZGRaZXJvID0gYWRkWmVybztcclxuLy8gY291cnRlc3kgdG8gcGFyc2UtbXNcclxuZnVuY3Rpb24gcGFyc2VNcyhtaWxsaXNlY29uZHMpIHtcclxuICAgIGNvbnN0IHJvdW5kVG93YXJkc1plcm8gPSBtaWxsaXNlY29uZHMgPiAwID8gTWF0aC5mbG9vciA6IE1hdGguY2VpbDtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZGF5czogcm91bmRUb3dhcmRzWmVybyhtaWxsaXNlY29uZHMgLyA4NjQwMDAwMCksXHJcbiAgICAgICAgaG91cnM6IHJvdW5kVG93YXJkc1plcm8obWlsbGlzZWNvbmRzIC8gMzYwMDAwMCkgJSAyNCxcclxuICAgICAgICBtaW51dGVzOiByb3VuZFRvd2FyZHNaZXJvKG1pbGxpc2Vjb25kcyAvIDYwMDAwKSAlIDYwLFxyXG4gICAgICAgIHNlY29uZHM6IHJvdW5kVG93YXJkc1plcm8obWlsbGlzZWNvbmRzIC8gMTAwMCkgJSA2MCxcclxuICAgICAgICBtaWxsaXNlY29uZHM6IHJvdW5kVG93YXJkc1plcm8obWlsbGlzZWNvbmRzKSAlIDEwMDAsXHJcbiAgICAgICAgbWljcm9zZWNvbmRzOiByb3VuZFRvd2FyZHNaZXJvKG1pbGxpc2Vjb25kcyAqIDEwMDApICUgMTAwMCxcclxuICAgICAgICBuYW5vc2Vjb25kczogcm91bmRUb3dhcmRzWmVybyhtaWxsaXNlY29uZHMgKiAxZTYpICUgMTAwMCxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5wYXJzZU1zID0gcGFyc2VNcztcclxuZnVuY3Rpb24gZm9ybWF0R2FtZVRpbWUodGltZUluTXMsIHdpdGhNcykge1xyXG4gICAgLy8gbmV3IERhdGUodGltZUluTXMpIGFjdHVhbGx5IGNvbnNpZGVycyB0aW1lem9uZVxyXG4gICAgY29uc3QgeyBob3Vycywgc2Vjb25kcywgbWludXRlcywgbWlsbGlzZWNvbmRzIH0gPSBwYXJzZU1zKHRpbWVJbk1zKTtcclxuICAgIGxldCBzID0gaG91cnMgPiAwID8gYCR7aG91cnN9OmAgOiBcIlwiO1xyXG4gICAgcyA9IHMgKyAoaG91cnMgPiAwID8gYWRkWmVybyhtaW51dGVzKSA6IG1pbnV0ZXMpICsgXCI6XCI7XHJcbiAgICBzID0gcyArIGFkZFplcm8oc2Vjb25kcyk7XHJcbiAgICByZXR1cm4gd2l0aE1zID8gcyArIFwiLlwiICsgYWRkWmVybyhtaWxsaXNlY29uZHMsIDMpIDogcztcclxufVxyXG5leHBvcnRzLmZvcm1hdEdhbWVUaW1lID0gZm9ybWF0R2FtZVRpbWU7XHJcbmZ1bmN0aW9uIGJlYXRMZW5ndGhUb0JQTShiZWF0TGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gNjAgKiAxMDAwIC8gYmVhdExlbmd0aDtcclxufVxyXG5leHBvcnRzLmJlYXRMZW5ndGhUb0JQTSA9IGJlYXRMZW5ndGhUb0JQTTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5jbGFtcCA9IGV4cG9ydHMuZG91YmxlRXF1YWwgPSBleHBvcnRzLmZsb2F0RXF1YWwgPSBleHBvcnRzLmFwcHJveGltYXRlbHlFcXVhbCA9IHZvaWQgMDtcclxuZnVuY3Rpb24gYXBwcm94aW1hdGVseUVxdWFsKHgsIHksIGRlbHRhKSB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnMoeCAtIHkpIDwgZGVsdGE7XHJcbn1cclxuZXhwb3J0cy5hcHByb3hpbWF0ZWx5RXF1YWwgPSBhcHByb3hpbWF0ZWx5RXF1YWw7XHJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wcHkvb3N1LWZyYW1ld29yay9ibG9iLzEwNWExN2JjOTljYWQyNTFmYTczMGI1NGM2MTVkMmIwZDlhNDA5ZDMvb3N1LkZyYW1ld29yay9VdGlscy9QcmVjaXNpb24uY3NcclxuY29uc3QgRkxPQVRfRVBTID0gMWUtMztcclxuZnVuY3Rpb24gZmxvYXRFcXVhbCh2YWx1ZTEsIHZhbHVlMikge1xyXG4gICAgcmV0dXJuIGFwcHJveGltYXRlbHlFcXVhbCh2YWx1ZTEsIHZhbHVlMiwgRkxPQVRfRVBTKTtcclxufVxyXG5leHBvcnRzLmZsb2F0RXF1YWwgPSBmbG9hdEVxdWFsO1xyXG5jb25zdCBET1VCTEVfRVBTID0gMWUtNztcclxuLy8gVXNlZCBpbiBjZXJ0YWluIGNhc2VzIHdoZW4geCBhbmQgeSBhcmUgYGRvdWJsZWBzXHJcbmZ1bmN0aW9uIGRvdWJsZUVxdWFsKHgsIHkpIHtcclxuICAgIHJldHVybiBhcHByb3hpbWF0ZWx5RXF1YWwoeCwgeSwgRE9VQkxFX0VQUyk7XHJcbn1cclxuZXhwb3J0cy5kb3VibGVFcXVhbCA9IGRvdWJsZUVxdWFsO1xyXG5mdW5jdGlvbiBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpIHtcclxuICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKHZhbHVlLCBtYXgpKTtcclxufVxyXG5leHBvcnRzLmNsYW1wID0gY2xhbXA7XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC50c1wiKTtcbiIsIiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==