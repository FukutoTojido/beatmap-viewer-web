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

let sliderBorderThickness = hitCircleSize * 2 / 58;
const sliderAccuracy = 0.005;
const sliderSnaking = true;
const sliderBorderColor = "#ffffff";

let approachRate;
let preempt;
let fadeIn;

let isPlaying = true;
const debugPosition = 74501;
const mapId = 1628723;
const playbackRate = 1;

let stackLeniency;
let stackOffset;
let stackThreshold;

let playingFlag = false;
