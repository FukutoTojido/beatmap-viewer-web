const originalTime = new Date().getTime();
const axios = window.axios;

function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        };
        reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
}

let audioCtx;
let hitsoundsBuffer = {};
let defaultHitsoundsList = {};

async function loadSampleSound(sample) {
    const res = (
        await axios.get(`./static/sample/${sample}.wav`, {
            responseType: "arraybuffer",
        })
    ).data;

    const buffer = await audioCtx.decodeAudioData(res);
    // console.log(`${sample} decoded`);
    hitsoundsBuffer[sample] = buffer;
}

// console.log(defaultHitsoundsList);
const HARD_OFFSET = 0;
let SOFT_OFFSET = 0;

let circleSize = 4;
let hitCircleSize = 2 * (54.4 - 4.48 * circleSize);
let tempHR = false;

let sliderBorderThickness = (hitCircleSize * 2) / 58;
const sliderAccuracy = 0.005;
const sliderSnaking = true;
const sliderBorderColor = "#ffffff";

let approachRate;
let preempt;
let fadeIn;

let isPlaying = true;
let debugPosition = 52029;
const mapId = 3939123;

let playbackRate = 1;
let musicVol = 0.1;
let hsVol = 0.2;

let stackLeniency;
let stackOffset;
let stackThreshold;

let playingFlag = false;
let sliderOnChange = false;

const curve = new UnitBezier(0, 0.57, 0, 1.46);

let mods = {
    HR: false,
    EZ: false,
    DT: false,
    HT: false,
};

let sliderAppearance = {
    snaking: true,
    untint: false,
    legacy: false,
};

let animation = {
    ms1digit: new CountUp("millisecond1digit", 0, 0, 0, 0.2, {
        separator: "",
    }),
    ms2digit: new CountUp("millisecond2digit", 0, 0, 0, 0.2, {
        separator: "",
    }),
    ms3digit: new CountUp("millisecond3digit", 0, 0, 0, 0.2, {
        separator: "",
    }),
    s1digit: new CountUp("second1digit", 0, 0, 0, 0.2, {
        separator: "",
    }),
    s2digit: new CountUp("second2digit", 0, 0, 0, 0.2, {
        separator: "",
    }),
    m1digit: new CountUp("minute1digit", 0, 0, 0, 0.2, {
        separator: "",
    }),
    m2digit: new CountUp("minute2digit", 0, 0, 0, 0.2, {
        separator: "",
    }),
};
