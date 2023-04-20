let currentFrameRate = 0;
const checkFrameRate = (lastTime, currentTime) => {
    if (lastTime !== 0) {
        currentFrameRate = 1000 / (currentTime - lastTime);
    }
    window.requestAnimationFrame((nextTime) => {
        return checkFrameRate(currentTime, nextTime);
    });
};
window.requestAnimationFrame((currentTime) => {
    return checkFrameRate(0, currentTime);
});

// Alias
PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;

const Application = PIXI.Application,
    Sprite = PIXI.Sprite,
    Assets = PIXI.Assets,
    Graphics = PIXI.Graphics,
    Container = PIXI.Container;

const sliderAccuracy = 1 / 400;
const scaleFactor = Math.max(window.innerWidth / 640, window.innerHeight / 480);
const cs = 54.4 - 4.48 * 4;

// Init
let type = "WebGL";

if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas";
}

const app = new Application({
    width: parseInt(getComputedStyle(document.querySelector("#playerContainer")).width),
    height: parseInt(getComputedStyle(document.querySelector("#playerContainer")).height),
    antialias: true,
    autoDensity: true,
    backgroundAlpha: 0,
});

let elapsed = 0.0;
const container = new Container();
app.stage.addChild(container);

let w = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
let h = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

if (w / 512 > h / 384) w = (h / 384) * 512;
else h = (w / 512) * 384;

w *= 0.8;
h *= 0.8;

const offsetX = (parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) - w) / 2;
const offsetY = (parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) - h) / 2;

container.x = offsetX;
container.y = offsetY;

document.querySelector("#playerContainer").appendChild(app.view);

const addToContainer = (list) => {
    list.forEach((o) => {
        container.addChild(o.obj);
    });
};

const removeFromContainer = (list) => {
    list.forEach((o) => {
        container.removeChild(o.obj);
    });
};

if (localStorage.getItem("settings")) {
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));

    document.querySelector("#dim").value = currentLocalStorage.background.dim;
    document.querySelector("#bgDimVal").innerHTML = `${parseInt(currentLocalStorage.background.dim * 100)}%`;
    document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${currentLocalStorage.background.dim})`;

    document.querySelector("#blur").value = currentLocalStorage.background.blur;
    document.querySelector("#bgBlurVal").innerHTML = `${parseInt((currentLocalStorage.background.blur / 20) * 100)}px`;
    document.querySelector("#overlay").style.backdropFilter = `blur(${currentLocalStorage.background.blur}px)`;

    document.querySelector("#master").value = currentLocalStorage.volume.master;
    document.querySelector("#masterVal").innerHTML = `${parseInt(currentLocalStorage.volume.master * 100)}%`;
    // masterVol = currentLocalStorage.volume.master;

    document.querySelector("#music").value = currentLocalStorage.volume.music;
    document.querySelector("#musicVal").innerHTML = `${parseInt((currentLocalStorage.volume.music / 0.4) * 100)}%`;
    // musicVol = currentLocalStorage.volume.music;

    document.querySelector("#effect").value = currentLocalStorage.volume.hs;
    document.querySelector("#effectVal").innerHTML = `${parseInt((currentLocalStorage.volume.hs / 0.4) * 100)}%`;

    document.querySelector("#softoffset").value = currentLocalStorage.mapping.offset;
    document.querySelector("#softoffsetVal").innerHTML = `${parseInt(currentLocalStorage.mapping.offset)}ms`;
    // hsVol = currentLocalStorage.volume.hs;

    Object.keys(currentLocalStorage.sliderAppearance).forEach((k) => {
        if (["snaking", "untint", "legacy", "hitAnim"].includes(k)) {
            document.querySelector(`#${k}`).checked = currentLocalStorage.sliderAppearance[k];
        }
    });

    document.querySelector("#beat").value = currentLocalStorage.mapping.beatsnap;
    document.querySelector("#beatVal").innerHTML = `1/${currentLocalStorage.mapping.beatsnap}`;
}

document.querySelector(".loading").style.display = "none";

const canvas = document.querySelector("#canvas");

let oldPlayerContainerHeight = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
let oldPlayerContainerWidth = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);

// canvas.width =
//     (1080 * parseInt(getComputedStyle(document.querySelector("#playerContainer")).width)) /
//     parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
// canvas.height = 1080;

window.onresize = () => {
    if (!playingFlag) {
        // canvas.width =
        //     (1080 * parseInt(getComputedStyle(document.querySelector("#playerContainer")).width)) /
        //     parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
        // canvas.height = 1080;

        if (beatmapFile !== undefined && beatmapFile.beatmapRenderData !== undefined) {
            beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
        }
    }
};

// const scaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
// let tempScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
// const textureScaleFactor = Math.min(canvas.height / 768, canvas.width / 1024) ** 2;

// const ctx = canvas.getContext("2d");
// ctx.imageSmoothingEnabled = true;

const sampleHitCircle = document.querySelector("#sampleHitCircle");
const sampleHitCircleOverlay = document.querySelector("#sampleHitCircleOverlay");
const sampleApproachCircle = document.querySelector("#sampleApproachCircle");
const sampleReverseArrow = document.querySelector("#sampleReverseArrow");
const sampleSliderB = document.querySelector("#sampleSliderB");

const defaultArr = [];
for (let i = 0; i < 10; i++) {
    toDataUrl(`./static/default-${i}@2x.png`, (base64) => {
        document.querySelector("#default").style.backgroundImage = `url(${base64})`;
        const base64_default = window.btoa(new XMLSerializer().serializeToString(document.querySelector("#sampleDefault")));
        const defaultNumberImgData = `data:image/svg+xml;base64,${base64_default}`;
        const defaultNumberImg = new Image();
        defaultNumberImg.src = defaultNumberImgData;

        defaultArr[i] = defaultNumberImg;
    });
}

let hitCircleArr = [];
let approachCircleArr = [];
["#eb4034", "#ebc034", "#34eb65", "#347deb"].forEach((colour, idx) => {
    document.querySelector("#hitCircleColor").style.backgroundColor = colour;
    const base64_hitCircle = window.btoa(new XMLSerializer().serializeToString(sampleHitCircle));
    const hitCircleImgData = `data:image/svg+xml;base64,${base64_hitCircle}`;
    const hitCircleImg = new Image();
    hitCircleImg.src = hitCircleImgData;

    document.querySelector("#approachCircleColor").style.backgroundColor = colour;
    const base64_approachCircle = window.btoa(new XMLSerializer().serializeToString(sampleApproachCircle));
    const approachCircleImgData = `data:image/svg+xml;base64,${base64_approachCircle}`;
    const approachCircleImg = new Image();
    approachCircleImg.src = approachCircleImgData;

    hitCircleArr[idx] = hitCircleImg;
    approachCircleArr[idx] = approachCircleImg;
});

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

let sliderBElement;
toDataUrl("./static/sliderb0@2x.png", (base64) => {
    document.querySelector("#sliderBSVG").style.backgroundImage = `url("${base64}")`;

    const base64_sliderB = window.btoa(new XMLSerializer().serializeToString(document.querySelector("#sampleSliderB")));
    const sliderBImgData = `data:image/svg+xml;base64,${base64_sliderB}`;
    const sliderBImg = new Image();
    sliderBImg.src = sliderBImgData;

    sliderBElement = sliderBImg;
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
    const block = document.querySelector("#block");

    settingsPanel.style.left = settingsPanel.style.left === "" ? "0px" : "";
    settingsPanel.style.opacity = settingsPanel.style.opacity === "" ? "1" : "";

    block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";
}

document.body.addEventListener("click", (e) => {
    const settingsPanelIsClick = document.querySelector("#settingsPanel").contains(e.target);

    // console.log(document.querySelector("#settingsPanel").contains(e.target), document.querySelector("#settingsButton").contains(e.target));

    if (!document.querySelector("#settingsButton").contains(e.target)) {
        if (!settingsPanelIsClick) {
            settingsPanel.style.left = "";
            settingsPanel.style.opacity = "";
            block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";
        }
    }
});

function handleCheckBox(checkbox) {
    mods[checkbox.name] = !mods[checkbox.name];
    sliderAppearance[checkbox.name] = !sliderAppearance[checkbox.name];

    const DTMultiplier = !mods.DT ? 1 : 1.5;
    const HTMultiplier = !mods.HT ? 1 : 0.75;

    if (["snaking", "untint", "legacy", "hitAnim"].includes(checkbox.name)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.sliderAppearance[checkbox.name] = sliderAppearance[checkbox.name];
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }

    // canvas.style.transform = !mods.HR ? "" : "scale(1, -1)";
    if (beatmapFile !== undefined) {
        const originalIsPlaying = beatmapFile.audioNode.isPlaying;
        if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
        playbackRate = 1 * DTMultiplier * HTMultiplier;
        if (originalIsPlaying) beatmapFile.audioNode.play();
        if (!originalIsPlaying) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }
}

function setSliderTime() {
    // if (!document.querySelector("audio")) return;
    if (beatmapFile === undefined) return;
    if (!sliderOnChange) document.querySelector("#progress").value = beatmapFile.audioNode.getCurrentTime();

    // if (beatmapFile !== undefined && !playingFlag) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
}

function setAudioTime(callFromDraw) {
    // if (playingFlag) playToggle();

    const slider = document.querySelector("#progress");
    // if (!document.querySelector("audio")) {
    //     slider.value = 0;
    //     return;
    // }

    if (beatmapFile === undefined) {
        slider.value = 0;
        return;
    }

    // console.log(slider.value);
    beatmapFile.audioNode.seekTo(parseFloat(slider.value));

    if (beatmapFile !== undefined && !playingFlag) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
}

function setProgressMax() {
    // document.querySelector("#progress").max = document.querySelector("audio").duration * 10;
    document.querySelector("#progress").max = beatmapFile.audioNode.buf.duration * 1000;
}

function playToggle() {
    if (isPlaying) {
        // if (document.querySelector("audio").currentTime >= document.querySelector("audio").duration) {
        //     document.querySelector("audio").currentTime = 0;
        // }

        // if (document.querySelector("audio").currentTime * 1000 === 1) {
        //     console.log(document.querySelector("audio").currentTime);
        //     document.querySelector("audio").ontimeupdate = setSliderTime;
        // }

        document.querySelector("#playButton").style.backgroundImage =
            document.querySelector("#playButton").style.backgroundImage === "" ? "url(./static/pause.png)" : "";

        // if (document.querySelector("audio").paused) {
        //     playingFlag = true;
        //     document.querySelector("audio").play();
        //     beatmapFile.beatmapRenderData.render();
        // } else {
        //     playingFlag = false;
        //     document.querySelector("audio").pause();
        //     beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
        // }

        if (!beatmapFile.audioNode.isPlaying) {
            playingFlag = true;
            beatmapFile.audioNode.play();
            beatmapFile.beatmapRenderData.render();
        } else {
            playingFlag = false;
            beatmapFile.audioNode.pause();
            beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
        }
    } else {
        beatmapFile.audioNode.play();
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
    const inputValue = document.querySelector("#mapInput").value.trim();
    if (!/^https:\/\/osu\.ppy\.sh\/(beatmapsets\/[0-9]+\#osu\/[0-9]+|b\/[0-9]+)|[0-9]+$/.test(inputValue)) {
        document.querySelector("#mapInput").value = "";
        alert("This is not a valid URL or Beatmap ID");
        return;
    }

    if (document.querySelector("audio")) {
        document.querySelector("audio").pause();
        document.body.removeChild(document.querySelector("audio"));
    }

    const bID = inputValue.split("/").at(-1);

    if (beatmapFile !== undefined) {
        playingFlag = false;
        beatmapFile.audioNode.pause();
        beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }

    beatmapFile = undefined;
    beatmapFile = new BeatmapFile(bID);

    document.querySelector("#mapInput").value = "";
    document.querySelector("#progress").value = 0;
    // if (document.querySelector("audio")) document.querySelector("audio").currentTime = 0.001;
}

function setBackgroundDim(slider) {
    // console.log(slider.value);
    document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${slider.value})`;
    document.querySelector("#bgDimVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.background.dim = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

function setBackgroundBlur(slider) {
    // console.log(slider.value);
    document.querySelector("#overlay").style.backdropFilter = `blur(${slider.value}px)`;
    document.querySelector("#bgBlurVal").innerHTML = `${parseInt((slider.value / 20) * 100)}px`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.background.blur = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

function setMasterVolume(slider) {
    masterVol = slider.value;
    document.querySelector("#masterVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.master = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setAudioVolume(slider) {
    musicVol = slider.value;
    document.querySelector("#musicVal").innerHTML = `${parseInt((slider.value / 0.4) * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.music = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setEffectVolume(slider) {
    hsVol = slider.value;
    document.querySelector("#effectVal").innerHTML = `${parseInt((slider.value / 0.4) * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.hs = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setOffset(slider) {
    SOFT_OFFSET = slider.value;
    document.querySelector("#softoffsetVal").innerHTML = `${parseInt(slider.value)}ms`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mapping.offset = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setBeatsnapDivisor(slider) {
    beatsnap = slider.value;
    document.querySelector("#beatVal").innerHTML = `1/${slider.value}`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mapping.beatsnap = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

function updateTime(timestamp) {
    // console.log(timestamp);
    const currentMiliseconds = Math.floor(timestamp);
    const msDigits = [currentMiliseconds % 10, Math.floor((currentMiliseconds % 100) / 10), Math.floor((currentMiliseconds % 1000) / 100)];

    msDigits.forEach((val, idx) => {
        document.querySelector(`#millisecond${idx + 1}digit`).innerText = Math.max(0, val);
        // animation[`ms${idx + 1}digit`].update(document.querySelector(`#millisecond${idx + 1}digit`).innerText);
    });

    const currentSeconds = Math.floor((timestamp / 1000) % 60);
    const sDigits = [currentSeconds % 10, Math.floor((currentSeconds % 100) / 10)];

    sDigits.forEach((val, idx) => {
        document.querySelector(`#second${idx + 1}digit`).innerText = Math.max(0, val);
        // animation[`s${idx + 1}digit`].update(document.querySelector(`#second${idx + 1}digit`).innerText);
    });

    const currentMinute = Math.floor(timestamp / 1000 / 60);
    const mDigits = [currentMinute % 10, Math.floor((currentMinute % 100) / 10)];

    mDigits.forEach((val, idx) => {
        document.querySelector(`#minute${idx + 1}digit`).innerText = Math.max(0, val);
        // animation[`m${idx + 1}digit`].update(document.querySelector(`#minute${idx + 1}digit`).innerText);
    });

    // console.log(mDigits.reverse(), sDigits.reverse(), msDigits.reverse());
}

let currentFrameReq;

function pushFrame(current, to, delta) {
    // console.log(Math.floor(current), Math.floor(to));
    beatmapFile.beatmapRenderData.objectsList.draw(current, true);

    if (current <= to) current += ((delta / currentFrameRate) * 1000) / 100;
    else current -= ((delta / currentFrameRate) * 1000) / 100;

    if (Math.floor(current) !== Math.floor(to)) {
        currentFrameReq = window.requestAnimationFrame((currentTime) => {
            return pushFrame(current, to, delta);
        });
    }
}

function goNext(precise) {
    if (beatmapFile !== undefined) {
        let step = 10;
        let currentBeatstep;

        if (beatsteps.length) {
            currentBeatstep =
                beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime()) !== undefined
                    ? beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime())
                    : beatsteps[0];

            step = currentBeatstep.beatstep / (precise ? 48 : beatsnap);
        }

        const localOffset = currentBeatstep.time - Math.floor(currentBeatstep.time / step) * step;
        const goTo = Math.min(
            Math.max(localOffset + (Math.floor(beatmapFile.audioNode.getCurrentTime() / step) + 1) * step, 0),
            beatmapFile.audioNode.buf.duration * 1000
        );

        const current = beatmapFile.audioNode.getCurrentTime();
        // console.log(current, goTo);

        if (!playingFlag) {
            if (currentFrameReq) window.cancelAnimationFrame(currentFrameReq);

            currentFrameReq = window.requestAnimationFrame((currentTime) => {
                return pushFrame(current, goTo, Math.abs(current - goTo));
            });
        }

        beatmapFile.audioNode.seekTo(goTo);
        // console.log(beatmapFile.audioNode.currentTime);
        document.querySelector("#progress").value = beatmapFile.audioNode.currentTime;
        // setAudioTime();
    }
}

function goBack(precise) {
    if (beatmapFile !== undefined) {
        let step = 10;
        let currentBeatstep;

        if (beatsteps.length) {
            currentBeatstep =
                beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime()) !== undefined
                    ? beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime())
                    : beatsteps[0];

            step = currentBeatstep.beatstep / (precise ? 48 : beatsnap);
        }

        const localOffset = currentBeatstep.time - Math.floor(currentBeatstep.time / step) * step;
        const goTo = Math.min(
            Math.max(localOffset + (Math.floor(beatmapFile.audioNode.getCurrentTime() / step) - 1) * step, 0),
            beatmapFile.audioNode.buf.duration * 1000
        );

        const current = beatmapFile.audioNode.getCurrentTime();
        // console.log(currentBeatstep, localOffset, goTo);
        if (!playingFlag) {
            if (currentFrameReq) window.cancelAnimationFrame(currentFrameReq);

            currentFrameReq = window.requestAnimationFrame((currentTime) => {
                return pushFrame(current, goTo, Math.abs(current - goTo));
            });
        }

        beatmapFile.audioNode.seekTo(goTo);
        // console.log(beatmapFile.audioNode.currentTime);
        document.querySelector("#progress").value = beatmapFile.audioNode.currentTime;
        // setAudioTime();
    }
}

function copyUrlToClipboard() {
    const origin = window.location.origin;
    const currentTimestamp = beatmapFile !== undefined ? parseInt(beatmapFile.audioNode.getCurrentTime()) : 0;
    const mapId = currentMapId || "";
    navigator.clipboard.writeText(`${origin}/beatmap-viewer-how?b=${mapId}&t=${currentTimestamp}`);
}

screen.orientation.onchange = () => {
    console.log("Orientation Changed");
    // canvas.width =
    //     (1080 * parseInt(getComputedStyle(document.querySelector("#playerContainer")).width)) /
    //     parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

    console.log(
        parseInt(getComputedStyle(document.querySelector("#playerContainer")).width),
        parseInt(getComputedStyle(document.querySelector("#playerContainer")).height),
        canvas.width,
        canvas.height
    );
    if (beatmapFile !== undefined) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
};

let beatmapFile;
document.querySelector("#submit").addEventListener("click", submitMap);

const handleCanvasClick = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));
    const y = !mods.HR
        ? (event.clientY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height))
        : 1080 - (event.clientY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));

    const currentScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);
    const HRMultiplier = !mods.HR ? 1 : 4 / 3;
    const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
    let currentHitCircleSize = 2 * (54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier);

    let currentAR = !mods.EZ ? approachRate : approachRate / 2;
    currentAR = !mods.HR ? currentAR : Math.min((currentAR * 4) / 3, 10);
    const currentPreempt = currentAR < 5 ? 1200 + (600 * (5 - currentAR)) / 5 : currentAR > 5 ? 1200 - (750 * (currentAR - 5)) / 5 : 1200;

    const currentTime = beatmapFile.audioNode.getCurrentTime();

    const selectedObjList = beatmapFile.beatmapRenderData.objectsList.objectsList.filter((o) => {
        const lowerBound = o.time - currentPreempt;
        const upperBound = sliderAppearance.hitAnim ? o.endTime + 240 : Math.max(o.time + 800, o.endTime + 240);
        const drawOffset =
            o.obj instanceof HitCircle
                ? (currentHitCircleSize * currentScaleFactor * 276) / 256 / 2
                : (((currentHitCircleSize * currentScaleFactor * 276) / 256 / 2) * 236) / 272;

        const coordLowerBound = {
            x: x - drawOffset,
            y: y - drawOffset,
        };

        const coordUpperBound = {
            x: x + drawOffset,
            y: y + drawOffset,
        };

        const inverse = mods.HR ? -1 : 1;

        if (o.obj instanceof HitCircle) {
            const positionX =
                (o.obj.originalX + stackOffset * o.obj.stackHeight) * currentScaleFactor + (canvas.width - 512 * currentScaleFactor) / 2;
            const positionY =
                (o.obj.originalY + inverse * stackOffset * o.obj.stackHeight) * currentScaleFactor + (canvas.height - 384 * currentScaleFactor) / 2;

            // console.log(
            //     o.time,
            //     lowerBound <= currentTime,
            //     upperBound >= currentTime,
            //     { x: positionX, y: positionY },
            //     coordLowerBound,
            //     coordUpperBound
            // );

            return (
                lowerBound <= currentTime &&
                upperBound >= currentTime &&
                positionX >= coordLowerBound.x &&
                positionX <= coordUpperBound.x &&
                positionY >= coordLowerBound.y &&
                positionY <= coordUpperBound.y
            );
        }

        if (o.obj instanceof Slider) {
            if (lowerBound <= currentTime && upperBound >= currentTime) {
                const renderableAngleList = o.obj.angleList.slice(0, o.obj.endPosition);

                const res = renderableAngleList.some((point) => {
                    return (
                        point.x >= coordLowerBound.x && point.x <= coordUpperBound.x && point.y >= coordLowerBound.y && point.y <= coordUpperBound.y
                    );
                });

                // console.log(o.time, res);
                return res;
            }
        }

        return false;
    });

    const selectedObj = selectedObjList.length
        ? selectedObjList.reduce((prev, curr) => {
              const prevOffset = Math.abs(prev.time - currentTime);
              const currOffset = Math.abs(curr.time - currentTime);

              return prevOffset > currOffset ? curr : prev;
          })
        : undefined;
    // console.log("x: " + x + " y: " + y, selectedObj);

    if (selectedObj) {
        selectedHitObject = [selectedObj.time];
    } else {
        selectedHitObject = [];
    }

    beatmapFile.beatmapRenderData.objectsList.draw(currentTime, true);
};

const handleCanvasDrag = () => {
    const rect = canvas.getBoundingClientRect();
    const x = (currentX - rect.left) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));
    const y = !mods.HR
        ? (currentY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height))
        : 1080 - (currentY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));

    const start_X = (startX - rect.left) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));
    const start_Y = !mods.HR
        ? (startY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height))
        : 1080 - (startY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));

    const currentScaleFactor = Math.min(canvas.height / 480, canvas.width / 640);

    let currentAR = !mods.EZ ? approachRate : approachRate / 2;
    currentAR = !mods.HR ? currentAR : Math.min((currentAR * 4) / 3, 10);
    const currentPreempt = currentAR < 5 ? 1200 + (600 * (5 - currentAR)) / 5 : currentAR > 5 ? 1200 - (750 * (currentAR - 5)) / 5 : 1200;

    const selectedObjList = beatmapFile.beatmapRenderData.objectsList.objectsList.filter((o) => {
        const lowerBound = o.time - currentPreempt;
        const upperBound = sliderAppearance.hitAnim ? o.endTime + 240 : Math.max(o.time + 800, o.endTime + 240);
        // console.log(Math.min(draggingStartTime, draggingEndTime), Math.max(draggingStartTime, draggingEndTime), o.time, lowerBound, upperBound);

        const coordLowerBound = {
            x: Math.min(x, start_X),
            y: Math.min(y, start_Y),
        };

        const coordUpperBound = {
            x: Math.max(x, start_X),
            y: Math.max(y, start_Y),
        };

        const inverse = mods.HR ? -1 : 1;
        const timeWindowOverlapCheck =
            (lowerBound <= Math.min(draggingStartTime, draggingEndTime) && upperBound >= Math.max(draggingStartTime, draggingEndTime)) ||
            (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime)) ||
            (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && lowerBound <= Math.max(draggingStartTime, draggingEndTime)) ||
            (upperBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime));

        if (o.obj instanceof HitCircle) {
            const positionX =
                (o.obj.originalX + stackOffset * o.obj.stackHeight) * currentScaleFactor + (canvas.width - 512 * currentScaleFactor) / 2;
            const positionY =
                (o.obj.originalY + inverse * stackOffset * o.obj.stackHeight) * currentScaleFactor + (canvas.height - 384 * currentScaleFactor) / 2;

            // console.log(
            //     o.time,
            //     lowerBound <= currentTime,
            //     upperBound >= currentTime,
            //     { x: positionX, y: positionY },
            //     coordLowerBound,
            //     coordUpperBound
            // );

            return (
                timeWindowOverlapCheck &&
                positionX >= coordLowerBound.x &&
                positionX <= coordUpperBound.x &&
                positionY >= coordLowerBound.y &&
                positionY <= coordUpperBound.y
            );
        }

        if (o.obj instanceof Slider) {
            if (timeWindowOverlapCheck) {
                const renderableAngleList = o.obj.angleList.slice(0, o.obj.endPosition);

                const res = renderableAngleList.some((point) => {
                    return (
                        point.x >= coordLowerBound.x && point.x <= coordUpperBound.x && point.y >= coordLowerBound.y && point.y <= coordUpperBound.y
                    );
                });

                // console.log(o.time, res);
                return res;
            }
        }

        return false;
    });

    // console.log("x: " + x + " y: " + y, selectedObj);

    if (selectedObjList.length) {
        selectedHitObject = selectedObjList.map((o) => o.time);
    } else {
        selectedHitObject = [];
    }
};

const drawStatic = () => {
    const currentTime = beatmapFile.audioNode.getCurrentTime();
    beatmapFile.beatmapRenderData.objectsList.draw(currentTime, true);

    if (currentX !== -1 && currentY !== -1) {
        const rect = canvas.getBoundingClientRect();

        const x = (currentX - rect.left) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));
        const y = !mods.HR
            ? (currentY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height))
            : 1080 - (currentY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));

        const start_X = (startX - rect.left) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));
        const start_Y = !mods.HR
            ? (startY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height))
            : 1080 - (startY - rect.top) * (canvas.height / parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.fillStyle = `rgba(255 255 255 / .1)`;
        ctx.rect(Math.min(x, start_X), Math.min(y, start_Y), Math.abs(x - start_X), Math.abs(y - start_Y));
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    if (isDragging) {
        window.requestAnimationFrame((currentTime) => {
            return drawStatic();
        });
    }
};

if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
    beatmapFile = new BeatmapFile(urlParams.get("b"));
    document.querySelector("#mapInput").value = urlParams.get("b");
}
// beatmapFile = new BeatmapFile(mapId);
