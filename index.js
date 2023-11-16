loadLocalStorage();

// Init
const mainGame = new Game();

const selectedHitCircleTemplate = HitObjectSprite.createSprite("SELECTED_HIT_CIRCLE");
const hitCircleTemplate = HitObjectSprite.createSprite("HIT_CIRCLE");
const hitCircleLegacyTemplate = HitObjectSprite.createSprite("HIT_CIRCLE_LEGACY");
const hitCircleOverlayTemplate = HitObjectSprite.createSprite("HIT_CIRCLE_OVERLAY");
const hitCircleOverlayLegacyTemplate = HitObjectSprite.createSprite("HIT_CIRCLE_OVERLAY_LEGACY");
const approachCircleTemplate = HitObjectSprite.createSprite("APPROACH_CIRCLE");
const sliderBallTemplate = HitObjectSprite.createSprite("SLIDER_BALL");
const sliderBallTexture = PIXI.Texture.from("static/arrow.png");
const sliderBallGradientTexture = HitObjectSprite.createSprite("SLIDER_BALL_BG");
const reverseArrowTextures = {
    arrow: PIXI.Texture.from("static/reversearrow@2x.png"),
    ring: PIXI.Texture.from("static/repeat-edge-piece.png"),
};

document.querySelector(".loading").style.display = "none";
if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
    beatmapFile = new BeatmapFile(urlParams.get("b"));
    document.querySelector("#mapInput").value = urlParams.get("b");
}

window.onresize = debounce(() => {
    setTimeout(() => {
        Game.appResize();

        if (!playingFlag) {
            if (beatmapFile !== undefined && beatmapFile.beatmapRenderData !== undefined) {
                beatmapFile.beatmapRenderData.objectsController.draw(beatmapFile.audioNode.getCurrentTime(), true);
            }
        }
    }, 200);
});

screen.orientation.onchange = debounce(() => {
    // console.log("Orientation Changed");
    setTimeout(() => {
        Game.appResize();

        if (!playingFlag) {
            if (beatmapFile !== undefined && beatmapFile.beatmapRenderData !== undefined) {
                beatmapFile.beatmapRenderData.objectsController.draw(beatmapFile.audioNode.getCurrentTime(), true);
            }
        }
    }, 200);
});
