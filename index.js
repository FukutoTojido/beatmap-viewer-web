const canvas = document.querySelector("#canvas");
canvas.width = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
canvas.height = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

const scaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
let tempScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
const textureScaleFactor = Math.min(canvas.height / 768, canvas.width / 1024) ** 2;

const ctx = canvas.getContext("2d");

const sampleHitCircle = document.querySelector("#sampleHitCircle");
const sampleHitCircleOverlay = document.querySelector("#sampleHitCircleOverlay");
const sampleApproachCircle = document.querySelector("#sampleApproachCircle");
const sampleSliderB = document.querySelector("#sampleSliderB");

toDataUrl("./static/hitcircle@2x.png", (base64) => {
    document.querySelector("#hitCircleSVG").style.backgroundImage = `url("${base64}")`;
    document.querySelector("#hitCircleColor").style.webkitMaskImage = `url("${base64}")`;
});

toDataUrl("./static/hitcircleoverlay@2x.png", (base64) => {
    document.querySelector("#hitCircleOverlay").style.backgroundImage = `url("${base64}")`;
});

toDataUrl("./static/approachcircle@2x.png", (base64) => {
    document.querySelector("#approachCircleSVG").style.backgroundImage = `url("${base64}")`;
    document.querySelector("#approachCircleColor").style.webkitMaskImage = `url("${base64}")`;
});

// document.querySelector("#cursorContainer").style.width = `${512 * scaleFactor}px`;
// document.querySelector("#cursorContainer").style.height = `${384 * scaleFactor}px`;

// const sldrLists = ["192:160|128:96|224:96", "304:144|336:96|320:16", "304:240|336:288|320:368", "208:240|176:288|192:368"];
// sldrLists.forEach((sl) => {
//     const sldr = new Slider(sl, "B", 115, 230, 60000 / 170, 0);
//     // sldr.draw(1);
//     sldr.draw(1, 0.5, 0.2, 1, "red");
// });

function openMenu() {
    // console.log(ele);
    const settingsPanel = document.querySelector("#settingsPanel");
    settingsPanel.style.width = settingsPanel.style.width === "" ? "600px" : "";
    settingsPanel.style.opacity = settingsPanel.style.opacity === "" ? "1" : "";
}

const beatmapFile = new BeatmapFile(mapId);
