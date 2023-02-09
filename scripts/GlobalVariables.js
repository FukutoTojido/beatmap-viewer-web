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

let circleSize = 4;
let hitCircleSize = 2 * (54.4 - 4.48 * circleSize);

let sliderBorderThickness = (hitCircleSize * 2) / 58;
const sliderAccuracy = 0.0025;
const sliderSnaking = true;
const sliderBorderColor = "#ffffff";

let approachRate;
let preempt;
let fadeIn;

let isPlaying = true;
let debugPosition = 52029;
const mapId = 3939123;
const playbackRate = 1;

let stackLeniency;
let stackOffset;
let stackThreshold;

let playingFlag = false;

let mods = {
    HR: false,
    EZ: false,
    DT: false,
    HT: false,
};
