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
        music: 0.2,
        hs: 0.2,
    },
    sliderAppearance: {
        snaking: true,
        untint: false,
        legacy: true,
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
    try {
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
    } catch {
        console.log("Unable to decode " + `${sample}${idx}`);
    }
}

// console.log(defaultHitsoundsList);
// const HARD_OFFSET = 0;
let SOFT_OFFSET = JSON.parse(localStorage.getItem("settings")).mapping.offset;

const sliderSnaking = true;
const sliderBorderColor = "#ffffff";

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

let stackOffset;
let stackThreshold;

let playingFlag = false;
let sliderOnChange = false;

const curve = new UnitBezier(0, 0.57, 0, 1.46);

let mods = {
    HD: false,
    HR: false,
    EZ: false,
    DT: false,
    HT: false,
};

let tempHR = false;
let tempEZ = false;

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
let didMove = false;
let startX = 0;
let startY = 0;

let currentX = -1;
let currentY = -1;

let draggingStartTime = 0;
let draggingEndTime = 0;

function Clamp(val, from, to) {
    return Math.max(Math.min(val, to), from);
}

let SliderTexture, colorsLength, SelectedTexture;

// https://github.com/ppy/osu-web/blob/master/resources/js/utils/beatmap-helper.ts#L20
const difficultyColourSpectrum = d3
    .scaleLinear()
    .domain([0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9])
    .clamp(true)
    .range(["#4290FB", "#4FC0FF", "#4FFFD5", "#7CFF4F", "#F6F05C", "#FF8068", "#FF4E6F", "#C645B8", "#6563DE", "#18158E", "#000000"])
    .interpolate(d3.interpolateRgb.gamma(2.2));

// https://github.com/ppy/osu-web/blob/master/resources/js/utils/beatmap-helper.ts#L81
const getDiffColor = (rating) => {
    if (rating < 0.1) return "#AAAAAA";
    if (rating >= 9) return "#000000";
    return difficultyColourSpectrum(rating);
};

const createDifficultyElement = (obj) => {
    const ele = document.createElement("div");
    ele.classList.add("diff");

    const icon = document.createElement("div");
    icon.classList.add("icon");

    const colorRing = document.createElement("div");
    colorRing.classList.add("colorRing");
    colorRing.style.border = `solid 4px ${getDiffColor(obj.starRating)}`;

    icon.append(colorRing);

    const infoContainer = document.createElement("div");
    infoContainer.classList.add("infoContainer");

    const diffName = document.createElement("div");
    diffName.classList.add("diffName");

    const starRating = document.createElement("div");
    starRating.classList.add("starRating");

    diffName.innerText = obj.name;
    starRating.innerText = `Star Rating: ${obj.starRating.toFixed(2)}★`;

    infoContainer.append(diffName, starRating);
    ele.append(icon, infoContainer);

    ele.dataset.filename = obj.fileName;
    ele.dataset.starrating = obj.starRating;
    ele.onclick = loadDiff;

    return {
        ...obj,
        ele,
    };
};

const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const loadColorPalette = (bg) => {
    const vibrant = new Vibrant(bg);
    const swatches = vibrant.swatches();

    // const colors = colorThief.getPalette(bg, 2);
    const rootCSS = document.querySelector(":root");

    const primary = swatches.DarkMuted?.getRgb() ?? swatches.DarkVibrant?.getRgb();
    if (primary) {
        const primaryHex = d3.color(`rgb(${primary[0]}, ${primary[1]}, ${primary[2]})`);
        const primaryPalette = [
            primaryHex.darker(2.0).formatHex(),
            primaryHex.darker(1.5).formatHex(),
            primaryHex.darker(1.0).formatHex(),
            primaryHex.darker(0.5).formatHex(),
            primaryHex.formatHex(),
        ];

        primaryPalette.forEach((val, idx) => {
            rootCSS.style.setProperty(`--primary-${idx + 1}`, val);
        });
    }

    const accent = swatches.LightVibrant?.getRgb() ?? swatches.LightMuted?.getRgb() ?? swatches.Vibrant?.getRgb();
    if (accent) {
        const accentHex = d3.color(`rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`);
        rootCSS.style.setProperty("--accent-1", accentHex.formatHex());
    }
};
