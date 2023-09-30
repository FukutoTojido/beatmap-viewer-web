loadLocalStorage();

// Init
const mainGame = new Game();

let selectedHitCircleTemplate;
let hitCircleTemplate;
let hitCircleLegacyTemplate;
let hitCircleOverlayTemplate;
let hitCircleOverlayLegacyTemplate;
let approachCircleTemplate;
let sliderBallTemplate;

document.querySelector(".loading").style.display = "none";
if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
    beatmapFile = new BeatmapFile(urlParams.get("b"));
    document.querySelector("#mapInput").value = urlParams.get("b");
}

window.onresize = () => {
    mainGame.appResize();

    if (!playingFlag) {
        if (beatmapFile !== undefined && beatmapFile.beatmapRenderData !== undefined) {
            beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
        }
    }
};

screen.orientation.onchange = () => {
    // console.log("Orientation Changed");
    mainGame.appResize();

    if (!playingFlag) {
        if (beatmapFile !== undefined && beatmapFile.beatmapRenderData !== undefined) {
            beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
        }
    }
};