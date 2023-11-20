const settingsTemplate = {
    mirror: {
        val: "nerinyan",
        custom: "",
    },
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
        music: 0.5,
        hs: 0.2,
    },
    skinning: {
        type: "0"
    },
    sliderAppearance: {
        snaking: true,
        hitAnim: true,
        ignoreSkin: false
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

const axios = window.axios;

let audioCtx = new AudioContext();

let selectedHitObject = [];

let playbackRate = 1;
let masterVol = JSON.parse(localStorage.getItem("settings")).volume.master;
let musicVol = JSON.parse(localStorage.getItem("settings")).volume.music;
let hsVol = JSON.parse(localStorage.getItem("settings")).volume.hs;
let beatsnap = JSON.parse(localStorage.getItem("settings")).mapping.beatsnap;
let beatsteps = [];

let stackThreshold;

let sliderOnChange = false;

const curve = new UnitBezier(0, 0.57, 0, 1.46);

let mods = {
    HD: false,
    HR: false,
    EZ: false,
    DT: false,
    HT: false,
};

let sliderAppearance = JSON.parse(localStorage.getItem("settings")).sliderAppearance;
let skinning = JSON.parse(localStorage.getItem("settings")).skinning;

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
let didMove = false;
let startX = 0;
let startY = 0;

let currentX = -1;
let currentY = -1;

let draggingStartTime = 0;
let draggingEndTime = 0;

let dropBlob = null;
let diffFileName = "";
let beatmapFile;

let SliderTexture, colorsLength, SelectedTexture;
