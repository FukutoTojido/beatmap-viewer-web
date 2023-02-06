const canvas = document.querySelector("#canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const sampleHitCircle = document.querySelector("#sampleHitCircle");
const sampleHitCircleOverlay = document.querySelector("#sampleHitCircleOverlay");
const sampleApproachCircle = document.querySelector("#sampleApproachCircle");
const sampleSliderB = document.querySelector("#sampleSliderB");

toDataUrl("./static/hitcircle@2x.png", (base64) => {
    document.querySelector("#hitCircleSVG").style.backgroundImage = `url("${base64}")`;
    document.querySelector("#hitCircleColor").style.webkitMaskImage = `url("${base64}")`;
});

toDataUrl("./static/hitcircleOverlay@2x.png", (base64) => {
    document.querySelector("#hitCircleOverlay").style.backgroundImage = `url("${base64}")`;
});

toDataUrl("./static/approachcircle@2x.png", (base64) => {
    document.querySelector("#approachCircleSVG").style.backgroundImage = `url("${base64}")`;
    document.querySelector("#approachCircleColor").style.webkitMaskImage = `url("${base64}")`;
});

document.querySelector("#cursorContainer").style.width = `${512 * scaleFactor}px`;
document.querySelector("#cursorContainer").style.height = `${384 * scaleFactor}px`;

const beatmapFile = new BeatmapFile(mapId);
