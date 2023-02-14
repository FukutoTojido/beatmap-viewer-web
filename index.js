document.querySelector(".loading").style.display = "none";

const canvas = document.querySelector("#canvas");
canvas.width = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
canvas.height = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

const scaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
let tempScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
const textureScaleFactor = Math.min(canvas.height / 768, canvas.width / 1024) ** 2;

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const sampleHitCircle = document.querySelector("#sampleHitCircle");
const sampleHitCircleOverlay = document.querySelector("#sampleHitCircleOverlay");
const sampleApproachCircle = document.querySelector("#sampleApproachCircle");
const sampleReverseArrow = document.querySelector("#sampleReverseArrow");
const sampleSliderB = document.querySelector("#sampleSliderB");

const defaultArr = [];
for (let i = 0; i < 10; i++) {
    toDataUrl(`./static/default-${i}@2x.png`, (base64) => {
        defaultArr[i] = base64;
    });
}

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

toDataUrl("./static/reversearrow@2x.png", (base64) => {
    document.querySelector("#reverseArrowSVG").style.backgroundImage = `url("${base64}")`;
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
    settingsPanel.style.left = settingsPanel.style.left === "" ? "0px" : "";
    settingsPanel.style.opacity = settingsPanel.style.opacity === "" ? "1" : "";
}

document.body.addEventListener("click", (e) => {
    const settingsPanelIsClick = document.querySelector("#settingsPanel").contains(e.target);

    // console.log(document.querySelector("#settingsPanel").contains(e.target), document.querySelector("#settingsButton").contains(e.target));

    if (!document.querySelector("#settingsButton").contains(e.target)) {
        if (!settingsPanelIsClick) {
            settingsPanel.style.left = "";
            settingsPanel.style.opacity = "";
        }
    }
});

function handleCheckBox(checkbox) {
    mods[checkbox.name] = !mods[checkbox.name];
    sliderAppearance[checkbox.name] = !sliderAppearance[checkbox.name];

    const DTMultiplier = !mods.DT ? 1 : 1.5;
    const HTMultiplier = !mods.HT ? 1 : 0.75;

    canvas.style.transform = !mods.HR ? "" : "scale(1, -1)";
    if (document.querySelector("audio")) document.querySelector("audio").playbackRate = 1 * DTMultiplier * HTMultiplier;

    beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
}

function setSliderTime() {
    if (!document.querySelector("audio")) return;
    if (!sliderOnChange) document.querySelector("#progress").value = document.querySelector("audio").currentTime * 10;

    if (beatmapFile !== undefined) beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
}

function setAudioTime() {
    const slider = document.querySelector("#progress");
    if (!document.querySelector("audio")) {
        slider.value = 0;
        return;
    }

    document.querySelector("audio").currentTime = slider.value / 10;

    if (beatmapFile !== undefined) beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
}

function setProgressMax() {
    document.querySelector("#progress").max = document.querySelector("audio").duration * 10;
}

function playToggle() {
    if (isPlaying) {
        if (document.querySelector("audio").currentTime >= document.querySelector("audio").duration) {
            document.querySelector("audio").currentTime = 0;
        }

        if (document.querySelector("audio").currentTime * 1000 === 1) {
            console.log(document.querySelector("audio").currentTime);
            document.querySelector("audio").ontimeupdate = setSliderTime;
        }

        document.querySelector("#playButton").style.backgroundImage =
            document.querySelector("#playButton").style.backgroundImage === "" ? "url(./static/pause.png)" : "";
        if (document.querySelector("audio").paused) {
            document.querySelector("audio").play();
            beatmapFile.beatmapRenderData.render();
        } else {
            playingFlag = false;
            document.querySelector("audio").pause();
            beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
        }
    } else {
        beatmapFile.beatmapRenderData.render();
    }
}

document.querySelector("#mapInput").onkeydown = (e) => {
    if (e.key === "Enter") {
        submitMap();
        document.querySelector("#mapInput").blur();
    }
};

function checkEnter(e) {
    console.log(e);
}

function submitMap() {
    if (document.querySelector("audio")) {
        document.querySelector("audio").pause();
        document.body.removeChild(document.querySelector("audio"));
    }

    const inputValue = document.querySelector("#mapInput").value;
    if (!inputValue.match(/([0-9])+/g) || inputValue.match(/([0-9])+/g).shift() !== inputValue) return;

    beatmapFile = undefined;
    beatmapFile = new BeatmapFile(inputValue);

    document.querySelector("#mapInput").value = "";
    document.querySelector("#progress").value = 0;
    if (document.querySelector("audio")) document.querySelector("audio").currentTime = 0.001;
}

function setBackgroundDim(slider) {
    // console.log(slider.value);
    document.querySelector("#overlay").style.opacity = slider.value;
}

function setAudioVolume(slider) {
    if (!document.querySelector("audio")) {
        slider.value = 0.1;
        return;
    }
    document.querySelector("audio").volume = slider.value;
}

let beatmapFile;

document.querySelector("#submit").addEventListener("click", submitMap);

// beatmapFile = new BeatmapFile(mapId);
