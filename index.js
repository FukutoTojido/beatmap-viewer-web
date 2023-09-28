PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;

const Application = PIXI.Application,
    Sprite = PIXI.Sprite,
    Assets = PIXI.Assets,
    Graphics = PIXI.Graphics,
    Container = PIXI.Container;

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

const fpsSprite = new PIXI.Text(`0fps\nInfinite ms`, {
    fontFamily: "Torus",
    fontSize: 15,
    fontWeight: 500,
    fill: 0xffffff,
    align: "right",
});

fpsSprite.anchor.set(1, 1);

app.stage.addChild(fpsSprite);

let currentFrameRate = 0;
const checkFrameRate = (lastTime, currentTime) => {
    if (lastTime !== 0) {
        currentFrameRate = 1000 / (currentTime - lastTime);
    }

    // fpsSprite.text = `${currentFrameRate}fps`;

    window.requestAnimationFrame((nextTime) => {
        return checkFrameRate(currentTime, nextTime);
    });
};
window.requestAnimationFrame((currentTime) => {
    return checkFrameRate(0, currentTime);
});

// Alias

const sliderAccuracy = 1 / 1000;
const scaleFactor = Math.max(window.innerWidth / 640, window.innerHeight / 480);
// const cs = 54.4 - 4.48 * 4;

let elapsed = 0.0;
let container = new Container();

let w = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) * window.devicePixelRatio;
let h = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * window.devicePixelRatio;
app.renderer.resize(w, h);

if (w / 512 > h / 384) {
    w = w_z = (h / 384) * 512;
} else {
    h = h_z = (w / 512) * 384;
}

document.querySelector("#playerContainer").appendChild(app.view);

// if (w < 480) {
//     // console.log("Alo", w, h);
//     app.renderer.resize(
//         parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) * 2,
//         parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * 2
//     );
//     w *= 2;
//     h *= 2;

//     document.querySelector("canvas").style.transform = `scale(0.5)`;
// } else {
//     document.querySelector("canvas").style.transform = ``;
// }

document.querySelector("canvas").style.transform = `scale(${1 / window.devicePixelRatio})`;

w *= 0.8;
h *= 0.8;

let offsetX = (document.querySelector("canvas").width - w) / 2;
let offsetY = (document.querySelector("canvas").height - h) / 2;

container.x = offsetX;
container.y = offsetY;

let gr = new Graphics()
    .lineStyle({
        width: 1,
        color: 0xffffff,
        alpha: 0.1,
        alignment: 0.5,
    })
    .drawRect(0, 0, w, h);

for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 12; j++) {
        // console.log(i, j);
        gr.drawRect(i * (w / 16), j * (h / 12), w / 16, h / 12);
    }
}

let tx = app.renderer.generateTexture(gr);

let bg = new Sprite(tx);
bg.width = w;
bg.height = h;
bg.x = offsetX;
bg.y = offsetY;
bg.alpha = 1;

let dragWindow = new Graphics().lineStyle({
    width: 2,
    color: 0xffffff,
    alpha: 1,
    alignment: 0,
});

dragWindow.alpha = 0;
dragWindow.x = offsetX;
dragWindow.y = offsetY;

fpsSprite.x = document.querySelector("canvas").width - 10;
fpsSprite.y = document.querySelector("canvas").height - 10;

app.stage.addChild(bg);
app.stage.addChild(dragWindow);
app.stage.addChild(container);

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

let selectedHitCircleTemplate;
let hitCircleTemplate;
let hitCircleLegacyTemplate;
let hitCircleOverlayTemplate;
let hitCircleOverlayLegacyTemplate;
let approachCircleTemplate;
let sliderBallTemplate;

if (localStorage.getItem("settings")) {
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));

    [...document.querySelectorAll('[name="mirror"]')].forEach((ele) => {
        ele.checked = ele.value === currentLocalStorage.mirror.val;
    });

    document.querySelector("#custom-mirror").value = currentLocalStorage.mirror.custom;

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
        if (["snaking", "legacy", "hitAnim"].includes(k)) {
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
    w = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) * window.devicePixelRatio;
    h = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * window.devicePixelRatio;
    app.renderer.resize(w, h);

    if (w / 512 > h / 384) {
        w = (h / 384) * 512;
    } else {
        h = (w / 512) * 384;
    }

    bg.width = w;
    bg.height = h;

    // if (w < 480) {
    //     // console.log("Alo", w, h);
    //     app.renderer.resize(
    //         parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) * 2,
    //         parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * 2
    //     );

    //     bg.width = w * 2;
    //     bg.height = h * 2;

    //     w *= 2;
    //     h *= 2;

    //     document.querySelector("canvas").style.transform = `scale(0.5)`;
    // } else {
    //     document.querySelector("canvas").style.transform = ``;
    // }

    document.querySelector("canvas").style.transform = `scale(${1 / window.devicePixelRatio})`;

    w *= 0.8;
    h *= 0.8;

    const gr_2 = new Graphics()
        .lineStyle({
            width: 1,
            color: 0xffffff,
            alpha: 0.1,
            alignment: 0.5,
        })
        .drawRect(0, 0, w, h);

    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 12; j++) {
            // console.log(i, j);
            gr.drawRect(i * (w / 16), j * (h / 12), w / 16, h / 12);
        }
    }

    offsetX = (document.querySelector("canvas").width - w) / 2;
    offsetY = (document.querySelector("canvas").height - h) / 2;

    container.x = offsetX;
    container.y = offsetY;

    const tx_2 = app.renderer.generateTexture(gr_2);

    bg.texture = tx_2;
    bg.width = w;
    bg.height = h;
    bg.x = offsetX;
    bg.y = offsetY;
    bg.alpha = 1;

    app.stage.removeChild(bg);
    app.stage.addChild(bg);

    dragWindow.x = offsetX;
    dragWindow.y = offsetY;

    fpsSprite.x = document.querySelector("canvas").width - 10;
    fpsSprite.y = document.querySelector("canvas").height - 10;

    if (!playingFlag) {
        if (beatmapFile !== undefined && beatmapFile.beatmapRenderData !== undefined) {
            beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
        }
    }
};

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

document.body.addEventListener("change", (e) => {
    const target = e.target;
    if (!target.checked) return;

    if (["nerinyan", "custom", "sayobot", "chimu"].includes(target.value)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.mirror.val = target.value;
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }
});

function setCustomMirror(input) {
    // console.log(input.value);
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mirror.custom = input.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

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

    if (beatmapFile !== undefined) {
        const originalIsPlaying = beatmapFile.audioNode.isPlaying;
        if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
        playbackRate = 1 * DTMultiplier * HTMultiplier;
        if (originalIsPlaying) beatmapFile.audioNode.play();
        if (!originalIsPlaying) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }
}

function setSliderTime() {
    if (beatmapFile === undefined) return;
    if (!sliderOnChange) document.querySelector("#progress").value = beatmapFile.audioNode.getCurrentTime();
}

function setAudioTime(callFromDraw) {
    const slider = document.querySelector("#progress");

    if (beatmapFile === undefined) {
        slider.value = 0;
        return;
    }

    beatmapFile.audioNode.seekTo(parseFloat(slider.value));

    if (beatmapFile !== undefined && !playingFlag) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
}

function setProgressMax() {
    document.querySelector("#progress").max = beatmapFile.audioNode.buf.duration * 1000;
}

function playToggle() {
    if (isPlaying) {
        document.querySelector("#playButton").style.backgroundImage =
            document.querySelector("#playButton").style.backgroundImage === "" ? "url(./static/pause.png)" : "";

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
        submitMap(false);
        document.querySelector("#mapInput").blur();
    }
};

function checkEnter(e) {
    console.log(e);
}

document.querySelector("#playerContainer").addEventListener("dragover", function (e) {
    e.preventDefault();
});

let dropBlob = null;
let diffFileName = "";
document.querySelector("#playerContainer").addEventListener("drop", function (e) {
    e.preventDefault();
    if (!e.dataTransfer.files.length) return;

    const file = e.dataTransfer.files[0];
    if (file.name.split(".").at(-1) !== "osz") return;

    document.querySelector("#close").disabled = true;
    readZip(file);
});

document.querySelector("#map-dropper").onchange = () => {
    const file = document.querySelector("#map-dropper").files[0];
    if (file.name.split(".").at(-1) !== "osz") return;

    document.querySelector("#close").disabled = true;
    readZip(file);
};

document.querySelector("#choose-diff").onclick = () => {
    document.querySelector(".difficultySelector").style.display = "block";
};

document.querySelector("#close").onclick = () => {
    document.querySelector(".difficultySelector").style.display = "none";
};

function loadDiff() {
    diffFileName = this.dataset.filename;
    document.querySelector(".difficultySelector").style.display = "none";

    submitMap(true);
}

async function readZip(file) {
    dropBlob = null;
    diffFileName = "";

    const mapFileBlob = file;
    const mapFileBlobReader = new zip.BlobReader(mapFileBlob);
    const zipReader = new zip.ZipReader(mapFileBlobReader);
    const allEntries = await zipReader.getEntries();

    const diffList = document.querySelector(".difficultyList");
    diffList.innerHTML = "";
    document.querySelector(".difficultySelector").style.display = "block";

    const diffs = [];

    for (const content of allEntries) {
        if (content.filename.split(".").at(-1) !== "osu") continue;
        const blob = await content.getData(new zip.BlobWriter("text/plain"));
        const rawFile = await blob.text();

        const mode = rawFile
            .split("\r\n")
            .filter((line) => /Mode:\s[0-9]+/g.test(line))
            .shift()
            ?.replace("Mode: ", "");
        if (parseInt(mode) !== 0) continue;

        const builderOptions = {
            addStacking: true,
            mods: [],
        };
        const blueprintData = osuPerformance.parseBlueprint(rawFile);
        const beatmapData = osuPerformance.buildBeatmap(blueprintData, builderOptions);
        const difficultyAttributes = osuPerformance.calculateDifficultyAttributes(beatmapData, true)[0];

        const diffName = rawFile
            .split("\r\n")
            .filter((line) => /Version:.+/g.test(line))
            .shift()
            ?.replace("Version:", "");

        const ele = createDifficultyElement({
            name: diffName,
            fileName: content.filename,
            starRating: difficultyAttributes.starRating,
        });

        diffs.push(ele);
    }

    diffs.sort((a, b) => {
        return -a.starRating + b.starRating;
    });

    for (const obj of diffs) diffList.appendChild(obj.ele);

    dropBlob = file;
    zipReader.close();
}

function submitMap(isDragAndDrop) {
    const inputValue = document.querySelector("#mapInput").value.trim();
    if (!isDragAndDrop && !/^https:\/\/osu\.ppy\.sh\/(beatmapsets\/[0-9]+\#osu\/[0-9]+|b\/[0-9]+)|[0-9]+$/.test(inputValue)) {
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
        beatmapFile.audioNode?.pause();
        beatmapFile.beatmapRenderData?.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }

    const origin = window.location.origin;

    if (!isDragAndDrop) window.history.pushState({}, "JoSu!", `${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-how"}/?b=${bID}`);

    beatmapFile = undefined;
    beatmapFile = new BeatmapFile(bID ?? -1, isDragAndDrop);

    document.querySelector("#mapInput").value = !isDragAndDrop ? bID : "";
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
        const current = beatmapFile.audioNode.getCurrentTime();

        if (beatsteps.length) {
            currentBeatstep =
                beatsteps.findLast((timingPoint) => timingPoint.time <= current) !== undefined
                    ? beatsteps.findLast((timingPoint) => timingPoint.time <= current)
                    : beatsteps[0];

            step = currentBeatstep.beatstep / (precise ? 48 : parseInt(beatsnap));
        }

        const localOffset = currentBeatstep.time > 0 ? (currentBeatstep.time % step) - step : currentBeatstep.time;
        const goTo = Clamp(localOffset + (Math.ceil(current / step) + 1) * step, 0, beatmapFile.audioNode.buf.duration * 1000);

        beatmapFile.audioNode.seekTo(goTo);
        document.querySelector("#progress").value = beatmapFile.audioNode.currentTime;
        beatmapFile.beatmapRenderData.objectsList.draw(goTo, true);
    }
}

function goBack(precise) {
    if (beatmapFile !== undefined) {
        let step = 10;
        let currentBeatstep;
        const current = beatmapFile.audioNode.getCurrentTime();

        if (beatsteps.length) {
            currentBeatstep =
                beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime()) !== undefined
                    ? beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime())
                    : beatsteps[0];

            step = currentBeatstep.beatstep / (precise ? 48 : parseInt(beatsnap));
        }

        const localOffset = currentBeatstep.time > 0 ? (currentBeatstep.time % step) - step : currentBeatstep.time;
        const goTo = Clamp(localOffset + (Math.ceil(current / step) - 1) * step, 0, beatmapFile.audioNode.buf.duration * 1000);

        beatmapFile.audioNode.seekTo(goTo);
        document.querySelector("#progress").value = beatmapFile.audioNode.currentTime;
        beatmapFile.beatmapRenderData.objectsList.draw(goTo, true);
    }
}

function copyUrlToClipboard() {
    const origin = window.location.origin;
    const currentTimestamp = beatmapFile !== undefined ? parseInt(beatmapFile.audioNode.getCurrentTime()) : 0;
    const mapId = currentMapId || "";
    navigator.clipboard.writeText(`${origin}${origin.includes("localhost") ? "" : "/beatmap-viewer-how"}?b=${mapId}&t=${currentTimestamp}`);
}

screen.orientation.onchange = () => {
    console.log("Orientation Changed");
    if (beatmapFile !== undefined) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
};

let beatmapFile;
document.querySelector("#submit").addEventListener("click", () => submitMap(false));

const handleCanvasDrag = (e, calledFromDraw) => {
    // console.log(e);

    const x = currentX;
    const y = currentY;

    const currentTime = beatmapFile.audioNode.getCurrentTime();

    const start_X = startX;
    const start_Y = startY;

    let currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);
    const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);

    const selectedObjList = beatmapFile.beatmapRenderData.objectsList.objectsList
        .filter((o) => {
            const lowerBound = o.time - currentPreempt;
            const upperBound = sliderAppearance.hitAnim ? o.endTime + 240 : Math.max(o.time + 800, o.endTime + 240);

            return (
                (lowerBound <= Math.min(draggingStartTime, draggingEndTime) && upperBound >= Math.max(draggingStartTime, draggingEndTime)) ||
                (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime)) ||
                (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && lowerBound <= Math.max(draggingStartTime, draggingEndTime)) ||
                (upperBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime))
            );
        })
        .filter((o) => {
            // console.log(Math.min(draggingStartTime, draggingEndTime), Math.max(draggingStartTime, draggingEndTime), o.time, lowerBound, upperBound);

            const coordLowerBound = {
                x: Math.min(x, start_X),
                y: Math.min(y, start_Y),
            };

            const coordUpperBound = {
                x: Math.max(x, start_X),
                y: Math.max(y, start_Y),
            };

            if (o.obj instanceof HitCircle) {
                const positionX = o.obj.originalX + stackOffset * o.obj.stackHeight;
                const positionY = (!mods.HR ? o.obj.originalY : 384 - o.obj.originalY) + stackOffset * o.obj.stackHeight;

                // console.log(
                //     o.time,
                //     lowerBound <= currentTime,
                //     upperBound >= currentTime,
                //     { x: positionX, y: positionY },
                //     coordLowerBound,
                //     coordUpperBound
                // );

                return (
                    positionX >= coordLowerBound.x &&
                    positionX <= coordUpperBound.x &&
                    positionY >= coordLowerBound.y &&
                    positionY <= coordUpperBound.y
                );
            }

            if (o.obj instanceof Slider) {
                const renderableAngleList = o.obj.angleList;

                const res = renderableAngleList.some((point) => {
                    const positionX = point.x + stackOffset * o.obj.stackHeight;
                    const positionY = (!mods.HR ? point.y : 384 - point.y) + stackOffset * o.obj.stackHeight;

                    return (
                        positionX + stackOffset * o.obj.stackHeight >= coordLowerBound.x &&
                        positionX + stackOffset * o.obj.stackHeight <= coordUpperBound.x &&
                        positionY + stackOffset * o.obj.stackHeight >= coordLowerBound.y &&
                        positionY + stackOffset * o.obj.stackHeight <= coordUpperBound.y
                    );
                });

                // console.log(o.time, res);
                return res;
            }

            return false;
        });

    // console.log("x: " + x + " y: " + y, selectedObj);

    if (selectedObjList.length) {
        selectedHitObject = selectedObjList.map((o) => o.time);
    } else if (e && !e.ctrlKey) {
        selectedHitObject = [];
    }

    if (!calledFromDraw) beatmapFile.beatmapRenderData.objectsList.draw(currentTime, true);

    // console.log(selectedHitObject);
};

if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
    beatmapFile = new BeatmapFile(urlParams.get("b"));
    document.querySelector("#mapInput").value = urlParams.get("b");
}
// beatmapFile = new BeatmapFile(mapId);

bg.interactive = true;
bg.on("click", (e) => {
    if (beatmapFile) {
        const currentTime = beatmapFile.audioNode.getCurrentTime();

        // console.log(isDragging);

        let { x, y } = container.toLocal(e.global);
        x /= w / 512;
        y /= w / 512;

        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        let currentHitCircleSize = 54.4 - 4.48 * Beatmap.stats.circleSize * HRMultiplier * EZMultiplier;

        let currentAR = Clamp(Beatmap.stats.approachRate * (mods.HR ? 1.4 : 1) * (mods.EZ ? 0.5 : 1), 0, 10);

        const currentPreempt = Beatmap.difficultyRange(currentAR, 1800, 1200, 450);
        const drawOffset = currentHitCircleSize;

        const selectedObjList = beatmapFile.beatmapRenderData.objectsList.objectsList
            .filter((o) => {
                const lowerBound = o.time - currentPreempt;
                const upperBound = sliderAppearance.hitAnim ? o.endTime + 240 : Math.max(o.time + 800, o.endTime + 240);

                return (lowerBound <= currentTime && upperBound >= currentTime) || selectedHitObject.includes(o.time);
            })
            .filter((o) => {
                if (o.obj instanceof HitCircle) {
                    const positionX = o.obj.originalX + stackOffset * o.obj.stackHeight;
                    const positionY = (!mods.HR ? o.obj.originalY : 384 - o.obj.originalY) + stackOffset * o.obj.stackHeight;

                    return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
                }

                if (o.obj instanceof Slider) {
                    const renderableAngleList = o.obj.angleList;

                    const res = renderableAngleList.some((point) => {
                        const positionX = point.x + stackOffset * o.obj.stackHeight;
                        const positionY = (!mods.HR ? point.y : 384 - point.y) + stackOffset * o.obj.stackHeight;

                        return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
                    });

                    // console.log(o.time, res);
                    return res;
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
            if (!e.ctrlKey) selectedHitObject = [selectedObj.time];
            else {
                selectedHitObject = selectedHitObject.concat([selectedObj.time]).filter((t, idx, a) => a.indexOf(t) === idx);
            }
        } else if (!didMove) {
            selectedHitObject = [];
        }

        // console.log(selectedHitObject);
        beatmapFile.beatmapRenderData.objectsList.draw(currentTime, true);
        didMove = false;
        // console.log("Mouse CLICK", didMove);
    }
});

bg.on("mousedown", (e) => {
    if (beatmapFile) {
        let { x, y } = container.toLocal(e.global);
        x /= w / 512;
        y /= w / 512;

        isDragging = true;
        draggingStartTime = beatmapFile.audioNode.getCurrentTime();
        startX = x;
        startY = y;

        dragWindow.clear();
        dragWindow.lineStyle({
            width: 2,
            color: 0xffffff,
            alpha: 1,
            alignment: 0,
        });

        dragWindow.drawRect(x, y, 0, 0);

        dragWindow.alpha = 1;

        // console.log("Mouse DOWN");
    }
});

bg.on("mouseup", (e) => {
    if (currentX !== -1 && currentY !== -1) {
        // console.log(selectedHitObject);
        // console.log(startX, startY, currentX, currentY);
    }
    // currentX = -1;
    // currentY = -1;
    isDragging = false;
    dragWindow.alpha = 0;
    // console.log("Mouse UP");
});

bg.on("mousemove", (e) => {
    if (beatmapFile)
        if (isDragging) {
            didMove = true;
            let { x, y } = container.toLocal(e.global);
            x /= w / 512;
            y /= w / 512;

            draggingEndTime = beatmapFile.audioNode.getCurrentTime();
            currentX = x;
            currentY = y;
            // console.log("Moving");
            handleCanvasDrag(e);

            dragWindow.clear();
            dragWindow.lineStyle({
                width: 2,
                color: 0xffffff,
                alpha: 1,
                alignment: 0,
            });

            dragWindow.drawRect(
                (Math.min(startX, x) * w) / 512,
                (Math.min(startY, y) * w) / 512,
                (Math.abs(x - startX) * w) / 512,
                (Math.abs(y - startY) * w) / 512
            );
            // console.log(startX, startY, currentX, currentY);
        }
});
