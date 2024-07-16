import { Beatmap } from "./Beatmap.js";
import { Clamp } from "./Utils.js";
import { Notification } from "./Notification.js";
import { Game } from "./Game.js";
import TWEEN, { Tween } from "@tweenjs/tween.js";
import { FullscreenButton, PlayContainer } from "./PlayButtons.js";
import { Timeline } from "./Timeline/Timeline.js";

export function fullscreenToggle() {
    let result = 0;
    let old = 0;

    if (!Game.IS_FULLSCREEN) {
        FullscreenButton.obj.sprite.texture = FullscreenButton.obj.altTexture;
        document.body.style.padding = 0;
        document.querySelector("#inputContainer").style.maxHeight = 0;
        document.querySelector("#inputContainer").style.padding = 0;
        document.querySelector("#inputContainer").style.margin = 0;

        result = 60 ;
        old = 0;
    } else {
        FullscreenButton.obj.sprite.texture = FullscreenButton.obj.texture;
        document.body.style.padding = "";
        document.querySelector("#inputContainer").style.maxHeight = "400px";
        document.querySelector("#inputContainer").style.padding = "";
        document.querySelector("#inputContainer").style.margin = "";

        result = 0;
        old = 60 ;
    }

    new TWEEN.Tween({
        height: old,
    })
        .to(
            {
                height: result,
            },
            200
        )
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({ height }) => {
            Timeline.HEIGHT_REDUCTION = height;
        })
        .start();

    Game.IS_FULLSCREEN = !Game.IS_FULLSCREEN;
    Game.EMIT_STACK.push(true);

    const url = new URL(window.location.href);
    url.searchParams.set("fullscreen", Game.IS_FULLSCREEN.toString());
    history.replaceState({ fullscreen: Game.IS_FULLSCREEN }, document.title, `${url.pathname}${url.search}${window.location.hash}`);
}

export function playToggle(ele) {
    ele?.blur();
    if (!Game.BEATMAP_FILE?.audioNode?.gainNode || !Game.BEATMAP_FILE?.audioNode?.buf) return;

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

let timeTween;
let expectedDestination = null;

export function setAudioTime(value) {
    if (!Game.BEATMAP_FILE?.audioNode) return;

    if (timeTween) timeTween.stop();
    expectedDestination = value * Game.BEATMAP_FILE.audioNode.buf.duration * 1000;

    timeTween = new Tween({ time: Game.BEATMAP_FILE.audioNode.getCurrentTime() })
        .easing(TWEEN.Easing.Sinusoidal.Out)
        .to({ time: expectedDestination }, 100)
        .onUpdate((obj) => {
            Game.SHOULD_PLAY_HITSOUND = false;
            Game.BEATMAP_FILE.audioNode.seekTo(obj.time);
        })
        .onComplete(() => {
            expectedDestination = null;
            Game.SHOULD_PLAY_HITSOUND = true;
        })
        .start();

    // Game.BEATMAP_FILE.audioNode.seekTo(value * Game.BEATMAP_FILE.audioNode.buf.duration * 1000)
}

export function go(precise, isForward) {
    if (!Game.BEATMAP_FILE || !Game.BEATMAP_FILE.audioNode.isLoaded) return;
    if (timeTween) timeTween.stop();
    // expectedDestination = null;

    let step = 1;
    let side = isForward ? 1 : -1;
    let currentBeatstep;
    const current = expectedDestination ?? Game.BEATMAP_FILE.audioNode.getCurrentTime();
    const isPlaying = Game.BEATMAP_FILE.audioNode.isPlaying;

    if (Beatmap.beatStepsList.length) {
        currentBeatstep = Beatmap.beatStepsList.findLast((timingPoint) => timingPoint.time <= current) ?? Beatmap.beatStepsList[0];
        step = precise ? 1 : (currentBeatstep.beatstep / parseInt(Game.MAPPING.beatsnap)) * (!isForward && isPlaying ? 2 : 1);
    }

    const relativePosition = current - currentBeatstep.time;
    const relativeTickPassed = Math.round(relativePosition / step);

    const goTo = Clamp(Math.floor(currentBeatstep.time + (relativeTickPassed + side) * step), 0, Game.BEATMAP_FILE.audioNode.buf.duration * 1000);
    expectedDestination = goTo;

    if (Game.BEATMAP_FILE.audioNode.isPlaying) {
        Game.BEATMAP_FILE.audioNode.seekTo(goTo);
        expectedDestination = null;

        return;
    }

    timeTween = new Tween({ time: Game.BEATMAP_FILE.audioNode.getCurrentTime() })
        .easing(TWEEN.Easing.Sinusoidal.Out)
        .to({ time: goTo }, 100)
        .onUpdate((obj) => {
            Game.SHOULD_PLAY_HITSOUND = false;
            Game.BEATMAP_FILE.audioNode.seekTo(obj.time);
        })
        .onComplete(() => {
            expectedDestination = null;
            Game.SHOULD_PLAY_HITSOUND = true;
        })
        .start();

    // Game.BEATMAP_FILE.audioNode.seekTo(goTo);
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
