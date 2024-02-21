import { Beatmap } from "./Beatmap.js";
import { Clamp } from "./Utils.js";
import { Notification } from "./Notification.js";
import { Game } from "./Game.js";
import TWEEN, { Tween } from "@tweenjs/tween.js";
import { PlayContainer } from "./PlayButtons.js";

export function setAudioTime(value) {
    if (!Game.BEATMAP_FILE?.audioNode) return;
    Game.BEATMAP_FILE.audioNode.seekTo(value * Game.BEATMAP_FILE.audioNode.duration);
}

export function playToggle(ele) {
    ele?.blur();
    // if (!Game.BEATMAP_FILE?.audioNode?.gainNode || !Game.BEATMAP_FILE?.audioNode?.buf) return;

    if (!Game.BEATMAP_FILE.audioNode.isPlaying) {
        // document.querySelector("#playButton").style.backgroundImage = "";
        PlayContainer.playButton.sprite.texture = PlayContainer.playButton.altTexture;
        Game.BEATMAP_FILE.audioNode.play();
        return;
    }

    // document.querySelector("#playButton").style.backgroundImage = "url(/static/pause.png)";
    PlayContainer.playButton.sprite.texture = PlayContainer.playButton.texture;
    Game.BEATMAP_FILE.audioNode.pause();
}

export function parseTime(timestamp) {
    const miliseconds = Math.floor(timestamp % 1000);
    const seconds = Math.floor((timestamp / 1000) % 60);
    const minutes = Math.floor(timestamp / 1000 / 60);

    const milisecondDigits = miliseconds.toString().padStart(3, "0").split("");
    const secondDigits = seconds.toString().padStart(2, "0").split("");
    const minuteDigits = minutes.toString().padStart(2, "0").split("");

    return {
        minutes: minuteDigits,
        seconds: secondDigits,
        miliseconds: milisecondDigits,
    };
}

export function go(precise, isForward) {
    if (!Game.BEATMAP_FILE) return;
    let step = 1;
    let side = isForward ? 1 : -1;
    let currentBeatstep;
    const current = Game.BEATMAP_FILE.audioNode.getCurrentTime();
    const isPlaying = Game.BEATMAP_FILE.audioNode.isPlaying;

    if (Beatmap.beatStepsList.length) {
        currentBeatstep = Beatmap.beatStepsList.findLast((timingPoint) => timingPoint.time <= current) ?? Beatmap.beatStepsList[0];
        step = precise ? 1 : (currentBeatstep.beatstep / parseInt(Game.MAPPING.beatsnap)) * (!isForward && isPlaying ? 2 : 1);
    }

    const relativePosition = current - currentBeatstep.time;
    const relativeTickPassed = Math.round(relativePosition / step);

    const goTo = Clamp(Math.floor(currentBeatstep.time + (relativeTickPassed + side) * step), 0, Game.BEATMAP_FILE.audioNode.duration * 1000);

    // const tween = new Tween({ time: current }).easing(TWEEN.Easing.Sinusoidal.Out).to({ time: goTo }, 100).onUpdate((obj) => {
    //     Game.BEATMAP_FILE.audioNode.seekTo(obj.time);
    // }).start();

    Game.BEATMAP_FILE.audioNode.seekTo(goTo);
}
// document.querySelector("#prevButton").onclick = () => go(null, false);
// document.querySelector("#playButton").onclick = () => playToggle(document.querySelector("#playButton"));
// document.querySelector("#nextButton").onclick = () => go(null, true);

export function copyUrlToClipboard() {
    const origin = window.location.origin;
    const currentTimestamp = Game.BEATMAP_FILE !== undefined ? parseInt(Game.BEATMAP_FILE.audioNode.getCurrentTime()) : 0;
    const mapId = Beatmap.CURRENT_MAPID || "";
    navigator.clipboard.writeText(`${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-how"}?b=${mapId}&t=${currentTimestamp}`);

    new Notification({
        message: "Current preview timestamp copied",
    }).notify();
}
document.querySelector("#previewURL").onclick = copyUrlToClipboard;

// document.querySelector("#timeContainer").onclick = showPopup;

export function updateTimestamp(value) {
    if (!Game.BEATMAP_FILE?.audioNode || (!/^[0-9]+:[0-9]+:[0-9]+.*/g.test(value) && !/^[0-9]+$/g.test(value))) {
        document.querySelector("#jumpToTime").value = "";
        return;
    }

    let time = value;
    if (/^[0-9]+:[0-9]+:[0-9]+.*/g.test(value)) {
        const extracted = value.match(/[0-9]+:[0-9]+:[0-9]+/g)[0];

        const minute = parseInt(extracted.split(":")[0]);
        const second = parseInt(extracted.split(":")[1]);
        const mili = parseInt(extracted.split(":")[2]);

        time = minute * 60000 + second * 1000 + mili;
    }

    Game.BEATMAP_FILE.audioNode.seekTo(time);
}

document.querySelector("#jumpToTime").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        updateTimestamp(document.querySelector("#jumpToTime").value);
        closePopup();
    }
});
