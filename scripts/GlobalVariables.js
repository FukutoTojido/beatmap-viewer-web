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

const scaleFactor = 1080 / 480;
const textureScaleFactor = (1080 / 768) ** 2;

const hitCircleSize = 2 * (54.4 - 4.48 * 4);
const sliderBorderThickness = 8;
const sliderAccuracy = 0.005;
const sliderSnaking = true;
const sliderBorderColor = "#ffffff";

const approachRate = 9.3;
let preempt;
let fadeIn;

let isPlaying = true;
const debugPosition = 179066;
const mapId = 1155619;
const playbackRate = 1;

switch (true) {
    case approachRate < 5:
        preempt = 1200 + (600 * (5 - approachRate)) / 5;
        fadeIn = 800 + (400 * (5 - approachRate)) / 5;
        break;
    case approachRate === 5:
        preempt = 0;
        fadeIn = 500;
        break;
    case approachRate > 5:
        preempt = 1200 - (750 * (approachRate - 5)) / 5;
        fadeIn = 800 - (500 * (approachRate - 5)) / 5;
}