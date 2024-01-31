import { selectSkin, round, getDiffColor } from "./Utils.js";
import { closePopup } from "./Timestamp.js";
import { Beatmap } from "./Beatmap.js";
import { Timeline } from "./Timeline/Timeline.js";
import { HitSample, PAudio } from "./Audio.js";
import { Game } from "./Game.js";
import osuPerformance from "../lib/osujs.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// OPEN/CLOSE SETTINGS
export function openMenu() {
    // console.log(ele);
    const settingsPanel = document.querySelector("#settingsPanel");
    const block = document.querySelector("#block");

    settingsPanel.style.left = settingsPanel.style.left === "" ? "0px" : "";
    settingsPanel.style.opacity = settingsPanel.style.opacity === "" ? "1" : "";

    block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";

    setTimeout(() => {
        block.style.opacity = settingsPanel.style.opacity === "1" ? 0.5 : "";
    }, 0);
}
document.querySelector("#settingsButton").onclick = openMenu;

document.body.addEventListener("click", (e) => {
    const settingsPanelIsClick = document.querySelector("#settingsPanel").contains(e.target);

    if (!document.querySelector("#settingsButton").contains(e.target)) {
        if (!settingsPanelIsClick) {
            settingsPanel.style.left = "";
            settingsPanel.style.opacity = "";
            block.style.opacity = settingsPanel.style.opacity === "1" ? 0.5 : "";
            setTimeout(() => {
                block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";
            }, 200);
        }
    }
});

// MIRROR
document.body.addEventListener("change", (e) => {
    const target = e.target;
    if (!target.checked) return;

    if (["nerinyan", "custom", "sayobot", "chimu"].includes(target.value)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.mirror.val = target.value;
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }
});

export function setCustomMirror(input) {
    // console.log(input.value);
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mirror.custom = input.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}
document.querySelector("#custom-mirror").onblur = () => setCustomMirror(document.querySelector("#custom-mirror"));

// BACKGROUND
export function setBackgroundDim(slider) {
    // console.log(slider.value);
    // document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${slider.value})`;
    Game.MASTER_CONTAINER.alpha = slider.value;
    document.querySelector("#bgDimVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.background.dim = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}
document.querySelector("#dim").oninput = () => setBackgroundDim(document.querySelector("#dim"));

export function setBackgroundBlur(slider) {
    // console.log(slider.value);
    // document.querySelector(".mapBG").style.filter = `blur(${slider.value}px)`;
    document.querySelector("#bgBlurVal").innerHTML = `${parseInt((slider.value / 20) * 100)}px`;
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.background.blur = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}
document.querySelector("#blur").oninput = () => setBackgroundBlur(document.querySelector("#blur"));

// AUDIO
export function setMasterVolume(slider) {
    Game.MASTER_VOL = slider.value;
    document.querySelector("#masterVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.master = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (Game.BEATMAP_FILE === undefined) return;

    Game.BEATMAP_FILE.audioNode.gainNode.gain.value = Game.MASTER_VOL * Game.MUSIC_VOL;
    HitSample.masterGainNode.gain.value = Game.MASTER_VOL * Game.HS_VOL;
}
document.querySelector("#master").oninput = () => setMasterVolume(document.querySelector("#master"));

export function setAudioVolume(slider) {
    Game.MUSIC_VOL = slider.value;
    document.querySelector("#musicVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.music = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (Game.BEATMAP_FILE === undefined) return;

    Game.BEATMAP_FILE.audioNode.gainNode.gain.value = Game.MASTER_VOL * Game.MUSIC_VOL;
}
document.querySelector("#music").oninput = () => setAudioVolume(document.querySelector("#music"));

export function setEffectVolume(slider) {
    Game.HS_VOL = slider.value;
    document.querySelector("#effectVal").innerHTML = `${parseInt((slider.value / 0.4) * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.hs = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    HitSample.masterGainNode.gain.value = Game.MASTER_VOL * Game.HS_VOL;
    if (Game.BEATMAP_FILE === undefined) return;
}
document.querySelector("#effect").oninput = () => setEffectVolume(document.querySelector("#effect"));

// MAPPING
export function setOffset(slider) {
    PAudio.SOFT_OFFSET = slider.value;
    document.querySelector("#softoffsetVal").innerHTML = `${parseInt(slider.value)}ms`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mapping.offset = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (Game.BEATMAP_FILE === undefined) return;
}
document.querySelector("#softoffset").oninput = () => setOffset(document.querySelector("#softoffset"));

export function setBeatsnapDivisor(slider) {
    Game.MAPPING.beatsnap = slider.value;
    document.querySelector("#beatVal").innerHTML = `1/${slider.value}`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mapping.beatsnap = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}
document.querySelector("#beat").oninput = () => setBeatsnapDivisor(document.querySelector("#beat"));

// ANY KIND OF CHECK BOX
export function calculateCurrentSR(modsFlag) {
    const modsTemplate = ["HARD_ROCK", "EASY", "DOUBLE_TIME", "HALF_TIME"];

    const builderOptions = {
        addStacking: true,
        mods: modsTemplate.filter((mod, idx) => modsFlag[idx]),
    };

    const blueprintData = osuPerformance.parseBlueprint(Game.BEATMAP_FILE.osuFile);
    const beatmapData = osuPerformance.buildBeatmap(blueprintData, builderOptions);
    const difficultyAttributes = osuPerformance.calculateDifficultyAttributes(beatmapData, true)[0];

    // document.querySelector("#CS").textContent = round(beatmapData.difficulty.circleSize);
    // document.querySelector("#AR").textContent = round(difficultyAttributes.approachRate);
    // document.querySelector("#OD").textContent = round(difficultyAttributes.overallDifficulty);
    // document.querySelector("#HP").textContent = round(beatmapData.difficulty.drainRate);
    // document.querySelector("#SR").textContent = `${round(difficultyAttributes.starRating)}★`;
    // document.querySelector("#SR").style.backgroundColor = getDiffColor(difficultyAttributes.starRating);

    // if (difficultyAttributes.starRating >= 6.5) document.querySelector("#SR").style.color = "hsl(45deg, 100%, 70%)";
    // else document.querySelector("#SR").style.color = "black";

    Game.STATS.CS = round(beatmapData.difficulty.circleSize);
    Game.STATS.AR = round(beatmapData.difficulty.approachRate);
    Game.STATS.OD = round(beatmapData.difficulty.overallDifficulty);
    Game.STATS.HP = round(beatmapData.difficulty.drainRate);
    Game.STATS.SR = round(difficultyAttributes.starRating);
    Game.STATS.srContainer.color = parseInt(d3.color(getDiffColor(difficultyAttributes.starRating)).formatHex().slice(1), 16);

    if (difficultyAttributes.starRating >= 6.5) Game.STATS.SRSprite.style.fill = parseInt(d3.color("hsl(45, 100%, 70%)").formatHex().slice(1), 16);
    else Game.STATS.SRSprite.style.fill = 0x000000;

    Game.STATS.update();
}

export function handleCheckBox(checkbox) {
    Game.MODS[checkbox.name] = !Game.MODS[checkbox.name];
    Game.SLIDER_APPEARANCE[checkbox.name] = !Game.SLIDER_APPEARANCE[checkbox.name];
    Game.MAPPING[checkbox.name] = !Game.MAPPING[checkbox.name];

    const DTMultiplier = !Game.MODS.DT ? 1 : 1.5;
    const HTMultiplier = !Game.MODS.HT ? 1 : 0.75;

    if (["snaking", "sliderend", "hitAnim", "ignoreSkin"].includes(checkbox.name)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.sliderAppearance[checkbox.name] = Game.SLIDER_APPEARANCE[checkbox.name];
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
        return;
    }

    if (["showGreenLine"].includes(checkbox.name)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.mapping[checkbox.name] = Game.MAPPING[checkbox.name];
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

        Timeline.SHOW_GREENLINE = Game.MAPPING[checkbox.name];

        // if (Game.MAPPING[checkbox.name]) document.querySelector(".timelineContainer").style.height = "";
        // else document.querySelector(".timelineContainer").style.height = "60px";
        return;
    }

    if (!Game.BEATMAP_FILE) return;

    const originalIsPlaying = Game.BEATMAP_FILE.audioNode.isPlaying;
    if (Game.BEATMAP_FILE.audioNode.isPlaying) Game.BEATMAP_FILE.audioNode.pause();
    Game.PLAYBACK_RATE = 1 * DTMultiplier * HTMultiplier;
    Beatmap.updateModdedStats();

    if (originalIsPlaying) Game.BEATMAP_FILE.audioNode.play();

    calculateCurrentSR([Game.MODS.HR, Game.MODS.EZ, Game.MODS.DT, Game.MODS.HT]);
}
[...document.querySelectorAll("input[type=checkbox]")].forEach((ele) => {
    ele.onclick = () => handleCheckBox(ele);
});

export function openDialog() {
    const dialog = document.querySelector("#skinDropdown");

    if (!dialog.open) {
        dialog.show();
        dialog.style.display = "flex";
        return;
    }

    dialog.close();
    dialog.style.display = "";
}
document.querySelector(".skinSelector").onclick = openDialog;

document.body.addEventListener("click", (e) => {
    const skinDialogDimensions = document.querySelector("#skinDropdown").getBoundingClientRect();
    const popupDialogDimensions = document.querySelector(".seekTo").getBoundingClientRect();

    if (
        (e.clientX < skinDialogDimensions.left ||
            e.clientX > skinDialogDimensions.right ||
            e.clientY < skinDialogDimensions.top ||
            e.clientY > skinDialogDimensions.bottom) &&
        document.querySelector("#skinDropdown").open &&
        e.target !== document.querySelector(".skinSelector")
    ) {
        document.querySelector("#skinDropdown").close();
        document.querySelector("#skinDropdown").style.display = "";
    }

    if (
        (e.clientX < popupDialogDimensions.left ||
            e.clientX > popupDialogDimensions.right ||
            e.clientY < popupDialogDimensions.top ||
            e.clientY > popupDialogDimensions.bottom) &&
        document.querySelector(".seekTo").open &&
        e.target !== document.querySelector(".contentWrapper") &&
        e.target !== document.querySelector(".contentWrapper canvas")
    ) {
        closePopup();
    }
});

[...document.querySelectorAll(".skinName")].forEach((button) => {
    button.onclick = selectSkin;
});
