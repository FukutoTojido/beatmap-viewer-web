const settingsTemplate = {
    mapping: {
        beatsnap: 4,
        offset: 0,
    },
    background: {
        dim: 0.8,
        blur: 0,
    },
    volume: {
        master: 1,
        music: 0.2,
        hs: 0.2,
    },
    sliderAppearance: {
        snaking: true,
        untint: false,
        legacy: false,
        hitAnim: true,
    },
};

if (!localStorage.getItem("settings")) {
    localStorage.setItem("settings", JSON.stringify(settingsTemplate));
} else {
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    Object.keys(settingsTemplate).forEach((k) => {
        if (currentLocalStorage[k] === undefined) currentLocalStorage[k] = settingsTemplate[k];

        Object.keys(settingsTemplate[k]).forEach((k2) => {
            if (currentLocalStorage[k][k2] === undefined) currentLocalStorage[k][k2] = settingsTemplate[k][k2];
        });
    });

    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let currentMapId;

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

async function loadSampleSound(sample, idx, buf) {
    if (buf === undefined) {
        const res = (
            await axios.get(`./static/sample/${sample}${idx === 0 ? "" : idx}.wav`, {
                responseType: "arraybuffer",
            })
        ).data;

        const buffer = await audioCtx.decodeAudioData(res);
        // console.log(`${sample} decoded`);
        hitsoundsBuffer[`${sample}${idx}`] = buffer;
    } else {
        const buffer = await audioCtx.decodeAudioData(buf);
        hitsoundsBuffer[`${sample}${idx}`] = buffer;
    }
}

// console.log(defaultHitsoundsList);
// const HARD_OFFSET = 0;
let SOFT_OFFSET = JSON.parse(localStorage.getItem("settings")).mapping.offset;

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
let selectedHitObject = [];

let isPlaying = true;
let debugPosition = 52029;
const mapId = 3939123;

let playbackRate = 1;
let masterVol = JSON.parse(localStorage.getItem("settings")).volume.master;
let musicVol = JSON.parse(localStorage.getItem("settings")).volume.music;
let hsVol = JSON.parse(localStorage.getItem("settings")).volume.hs;
let beatsnap = JSON.parse(localStorage.getItem("settings")).mapping.beatsnap;
let beatsteps = [];

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

let sliderAppearance = JSON.parse(localStorage.getItem("settings")).sliderAppearance;

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

let isDragging = false;
let startX = 0;
let startY = 0;

let currentX = -1;
let currentY = -1;

let draggingStartTime = 0;
let draggingEndTime = 0;