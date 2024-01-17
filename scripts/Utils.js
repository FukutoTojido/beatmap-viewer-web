import { Game } from "./Game.js";
import { Texture } from "./Texture.js";
import { Timeline } from "./Timeline/Timeline.js";
import { loadDiff } from "./InputBar.js";
import { Timestamp } from "./Timestamp.js";
import { ProgressBar } from "./Progress.js";
import { Skinning } from "./Skinning.js";
import { HitSample } from "./Audio.js";
import { Database } from "./Database.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import axios from "axios";

export async function removeSkin() {
    await Database.removeFromObjStore(this.parentElement.dataset.customIndex);

    if (Skinning.SKIN_IDX == this.parentElement.dataset.customIndex) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.skinning.type = "2";
        currentLocalStorage.skinning.val = -1;
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }

    delete Skinning.SKIN_LIST[this.parentElement.dataset.customIndex];
    Skinning.changeSkin();
    delete Texture.CUSTOM[this.parentElement.dataset.customIndex];
    delete HitSample.SAMPLES.CUSTOM[this.parentElement.dataset.customIndex];

    document.querySelector("#skinDropdown").close();
    document.querySelector("#skinDropdown").style.display = "";

    await refreshSkinDB();
}

export function selectSkin() {
    const skinType = Skinning.SKIN_ENUM[this.parentElement.dataset.skinId.toUpperCase()];
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.skinning.type = skinType;
    currentLocalStorage.skinning.val = this.parentElement.dataset.customIndex;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    Game.SKINNING.type = skinType;

    if (this.parentElement.dataset.skinId === "custom") {
        Skinning.SKIN_IDX = this.parentElement.dataset.customIndex;
    }

    Skinning.changeSkin();

    document.querySelector("#skinDropdown").close();
    document.querySelector("#skinDropdown").style.display = "";
}

export async function refreshSkinDB() {
    const res = await Database.readObjStore("skins");
    const allKeys = await Database.getAllKeys();

    [...document.querySelectorAll('[data-skin-id="custom"]')].forEach((ele) => ele.remove());

    const skinDropdown = document.querySelector("#skinDropdown");

    for (const [idx, skin] of res.entries()) {
        const skinId = allKeys[idx];
        const { ini, base64s, samples } = skin;

        const div = document.createElement("div");
        div.classList.add("skinSelection");
        div.dataset.skinId = "custom";
        div.dataset.customIndex = skinId;

        const button = document.createElement("button");
        button.classList.add("skinName");
        button.textContent = ini.NAME;
        button.onclick = selectSkin;

        const delButton = document.createElement("button");
        delButton.classList.add("deleteButton");
        delButton.innerHTML = `<img width="18" height="18" src="https://img.icons8.com/material-rounded/24/ffffff/delete-forever.png" alt="delete-forever"/>`;
        delButton.onclick = removeSkin;

        div.appendChild(button);
        div.appendChild(delButton);
        skinDropdown.appendChild(div);

        ["HIT_CIRCLE", "HIT_CIRCLE_OVERLAY", "SLIDER_B", "REVERSE_ARROW", "DEFAULTS", "SLIDER_FOLLOW_CIRCLE", "APPROACH_CIRCLE"].forEach(
            (element) => {
                if (!base64s[element]) return;

                if (element === "DEFAULTS") {
                    Texture.updateNumberTextures(base64s[element], skinId);
                    return;
                }

                const { base64, isHD } = base64s[element];
                Texture.updateTextureFor(element, base64, isHD, skinId);
            }
        );

        await Skinning.loadHitsounds(samples, skinId);
    }

    Skinning.SKIN_LIST = res.reduce((obj, curr, idx) => {
        obj[allKeys[idx]] = curr;
        return obj;
    }, {});
}

export async function loadLocalStorage() {
    document.querySelector("#loadingText").textContent = `Initializing: Default Samples`;
    await loadDefaultSamples();
    document.querySelector("#loadingText").textContent = `Initializing: Default Skins`;
    await Database.initDatabase();
    await refreshSkinDB();
    // const res = await Database.readObjStore("skins");
    // const res = await Database.getAllKeys();
    // const skin1 = await Database.readObjStoreAtKey(1);

    // console.log(res);

    if (localStorage.getItem("settings")) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));

        [...document.querySelectorAll('[name="mirror"]')].forEach((ele) => {
            ele.checked = ele.value === currentLocalStorage.mirror.val;
        });

        Skinning.SKIN_IDX = currentLocalStorage.skinning.val;
        Skinning.changeSkin();

        document.querySelector("#custom-mirror").value = currentLocalStorage.mirror.custom;

        document.querySelector("#dim").value = currentLocalStorage.background.dim;
        document.querySelector("#bgDimVal").innerHTML = `${parseInt(currentLocalStorage.background.dim * 100)}%`;
        document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${currentLocalStorage.background.dim})`;

        document.querySelector("#blur").value = currentLocalStorage.background.blur;
        document.querySelector("#bgBlurVal").innerHTML = `${parseInt((currentLocalStorage.background.blur / 20) * 100)}px`;
        document.querySelector("#overlay").style.backdropFilter = `blur(${currentLocalStorage.background.blur}px)`;

        document.querySelector("#master").value = currentLocalStorage.volume.master;
        document.querySelector("#masterVal").innerHTML = `${parseInt(currentLocalStorage.volume.master * 100)}%`;
        // masterVol = currentLocalStorage.volume.master;

        document.querySelector("#music").value = currentLocalStorage.volume.music;
        document.querySelector("#musicVal").innerHTML = `${parseInt(currentLocalStorage.volume.music * 100)}%`;
        // musicVol = currentLocalStorage.volume.music;

        document.querySelector("#effect").value = currentLocalStorage.volume.hs;
        document.querySelector("#effectVal").innerHTML = `${parseInt((currentLocalStorage.volume.hs / 0.4) * 100)}%`;

        document.querySelector("#softoffset").value = currentLocalStorage.mapping.offset;
        document.querySelector("#softoffsetVal").innerHTML = `${parseInt(currentLocalStorage.mapping.offset)}ms`;
        // hsVol = currentLocalStorage.volume.hs;

        Object.keys(currentLocalStorage.sliderAppearance).forEach((k) => {
            if (["snaking", "hitAnim", "ignoreSkin"].includes(k)) {
                document.querySelector(`#${k}`).checked = currentLocalStorage.sliderAppearance[k];
            }
        });

        document.querySelector("#beat").value = currentLocalStorage.mapping.beatsnap;
        document.querySelector("#beatVal").innerHTML = `1/${currentLocalStorage.mapping.beatsnap}`;

        Timeline.SHOW_GREENLINE = currentLocalStorage.mapping.showGreenLine;
        Timeline.ZOOM_DISTANCE = currentLocalStorage.timeline.zoomRate;

        if (Timeline.SHOW_GREENLINE) document.querySelector(".timeline").style.height = "";
        else document.querySelector(".timelineContainer").style.height = "60px";
    }
}

export function Clamp(val, from, to) {
    return Math.max(Math.min(val, to), from);
}

// https://github.com/ppy/osu-web/blob/master/resources/js/utils/beatmap-helper.ts#L20
const difficultyColourSpectrum = d3
    .scaleLinear()
    .domain([0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9])
    .clamp(true)
    .range(["#4290FB", "#4FC0FF", "#4FFFD5", "#7CFF4F", "#F6F05C", "#FF8068", "#FF4E6F", "#C645B8", "#6563DE", "#18158E", "#000000"])
    .interpolate(d3.interpolateRgb.gamma(2.2));

// https://github.com/ppy/osu-web/blob/master/resources/js/utils/beatmap-helper.ts#L81
export const getDiffColor = (rating) => {
    if (rating < 0.1) return "#AAAAAA";
    if (rating >= 9) return "#000000";
    return difficultyColourSpectrum(rating);
};

export const createDifficultyElement = (obj) => {
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

    diffName.textContent = obj.name;
    starRating.textContent = `Star Rating: ${obj.starRating.toFixed(2)}★`;

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

export const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const loadColorPalette = (bg) => {
    const vibrant = new Vibrant(bg);
    const swatches = vibrant.swatches();

    // const colors = colorThief.getPalette(bg, 2);
    const rootCSS = document.querySelector(":root");

    const primary = swatches.DarkMuted?.getRgb() ?? swatches.DarkVibrant?.getRgb();
    if (primary) {
        const primaryHex = d3.color(`rgb(${parseInt(primary[0])}, ${parseInt(primary[1])}, ${parseInt(primary[2])})`);
        // console.log(primary, primaryHex);
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

        Timestamp.renderer.background.color = parseInt(rootCSS.style.getPropertyValue("--primary-5").slice(1), 16);
    }

    const accent = swatches.LightVibrant?.getRgb() ?? swatches.LightMuted?.getRgb() ?? swatches.Vibrant?.getRgb() ?? swatches.Muted?.getRgb() ?? [255, 255, 255];
    if (accent) {
        const accentHex = d3.color(`rgb(${parseInt(accent[0])}, ${parseInt(accent[1])}, ${parseInt(accent[2])})`);
        rootCSS.style.setProperty("--accent-1", accentHex.formatHex());
    }

    ProgressBar.restyle();
};

export async function loadDefaultSamples() {
    for (const skin of ["ARGON", "LEGACY"])
        for (const sampleset of ["normal", "soft", "drum"]) {
            for (const hs of ["hitnormal", "hitwhistle", "hitfinish", "hitclap", "slidertick", "sliderwhistle", "sliderslide"]) {
                // console.log(`./static/${skin.toLowerCase()}/${sampleset}-${hs}.wav`);
                const res = (
                    await axios.get(`/static/${skin.toLowerCase()}/${sampleset}-${hs}.wav`, {
                        responseType: "arraybuffer",
                    })
                ).data;

                const buffer = await Game.AUDIO_CTX.decodeAudioData(res);
                HitSample.SAMPLES[skin][`${sampleset}-${hs}`] = buffer;
                HitSample.DEFAULT_SAMPLES[skin][`${sampleset}-${hs}`] = buffer;
            }
        }
}

export async function loadSampleSound(sample, idx, buf) {
    try {
        if (!buf) {
            HitSample.SAMPLES.MAP[`${sample}${idx}`] = null;
            return;
        }

        const buffer = await Game.AUDIO_CTX.decodeAudioData(buf);
        HitSample.SAMPLES.MAP[`${sample}${idx}`] = buffer;
    } catch {
        console.log("Unable to decode " + `${sample}${idx}`);
    }
}

export function toDataUrl(url, callback) {
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

export function changeZoomRate(zoomStep, the) {
    Timeline.ZOOM_DISTANCE = Clamp(Timeline.ZOOM_DISTANCE + zoomStep * 20, 20, 800);

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.timeline.zoomRate = Timeline.ZOOM_DISTANCE;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    the.blur();
}
document.querySelector(".zoom .plus").onclick = () => {
    changeZoomRate(1, document.querySelector(".zoom .plus"));
};

document.querySelector(".zoom .minus").onclick = () => {
    changeZoomRate(-1, document.querySelector(".zoom .minus"));
};

export function debounce(func, timeout = 100) {
    let timer;
    return function (event) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(func, timeout, event);
    };
}

export const binarySearchRange = (list, startValue, endValue, key) => {
    let start = 0;
    let end = list.length - 1;

    if (list[start][key] > endValue || list[end][key] < startValue) return -1;

    while (end >= start) {
        const mid = start + Math.floor((end - start) / 2);

        if (list[mid][key] < startValue) {
            start = mid + 1;
            continue;
        }

        if (list[mid][key] > endValue) {
            end = mid - 1;
            continue;
        }

        return mid;
    }

    return -1;
};

export const binarySearch = (list, value, compareFunc) => {
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
};

export const binarySearchNearest = (list, value, compareFunc) => {
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
};

export const Fixed = (val, decimalPlace) => Math.round(val * 10 ** decimalPlace) / 10 ** decimalPlace;
export const Dist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
export const Add = (p1, p2) => {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
};

export const FlipHR = (coord) => {
    return { x: coord.x, y: 384 - coord.y };
};

export const LinearEstimation = (start, end, t) => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;

    return {
        x: start.x + deltaX * t,
        y: start.y + deltaY * t,
    };
};

export const ApplyModsToTime = (time, mods) => {
    if (mods.includes("DoubleTime")) return time / 1.5;

    if (mods.includes("HalfTime")) return time / 0.75;

    return time;
};

export const TranslateToZero = (point) => {
    const pointCop = { ...point };
    pointCop.x -= 256;
    pointCop.y -= 192;

    return pointCop;
};

export const easeOutQuint = (t) => {
    return 1 - Math.pow(1 - t, 5);
};

export const easeInSine = (x) => {
    return 1 - Math.cos((x * Math.PI) / 2);
};

export const easeOutSine = (x) => {
    return Math.sin((x * Math.PI) / 2);
};

export const easeOutBack = (x) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const easeOutElastic = (x) => {
    const c4 = (2 * Math.PI) / 3;

    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
};
