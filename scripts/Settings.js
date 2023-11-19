// OPEN/CLOSE SETTINGS
function openMenu() {
    // console.log(ele);
    const settingsPanel = document.querySelector("#settingsPanel");
    const block = document.querySelector("#block");

    settingsPanel.style.left = settingsPanel.style.left === "" ? "0px" : "";
    settingsPanel.style.opacity = settingsPanel.style.opacity === "" ? "1" : "";

    block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";

    setTimeout(() => {
        block.style.opacity = settingsPanel.style.opacity === "1" ? 0.5 : "";
    }, 0);
}

document.body.addEventListener("click", (e) => {
    const settingsPanelIsClick = document.querySelector("#settingsPanel").contains(e.target);

    if (!document.querySelector("#settingsButton").contains(e.target)) {
        if (!settingsPanelIsClick) {
            settingsPanel.style.left = "";
            settingsPanel.style.opacity = "";
            block.style.opacity = settingsPanel.style.opacity === "1" ? 0.5 : "";
            setTimeout(() => {
                block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";
            }, 200);
        }
    }
});

// MIRROR
document.body.addEventListener("change", (e) => {
    const target = e.target;
    if (!target.checked) return;

    if (["nerinyan", "custom", "sayobot", "chimu"].includes(target.value)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.mirror.val = target.value;
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }

    if (["0", "1", "2", "3"].includes(target.value)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.skinning.type = target.value;
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

        skinning.type = target.value;

        const originalIsPlaying = beatmapFile.audioNode.isPlaying;
        // if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
        // if (originalIsPlaying) beatmapFile.audioNode.play();
        // if (!originalIsPlaying) beatmapFile.beatmapRenderData.objectsController.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }
});

function setCustomMirror(input) {
    // console.log(input.value);
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mirror.custom = input.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

// BACKGROUND
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

// AUDIO
function setMasterVolume(slider) {
    masterVol = slider.value;
    document.querySelector("#masterVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.master = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    // const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    // if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    // if (originalIsPlaying) beatmapFile.audioNode.play();

    beatmapFile.audioNode.gainNode.gain.value = masterVol * musicVol;
    HitSample.masterGainNode.gain.value = masterVol * hsVol;
}

function setAudioVolume(slider) {
    musicVol = slider.value;
    document.querySelector("#musicVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.music = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    // const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    // if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    // if (originalIsPlaying) beatmapFile.audioNode.play();

    beatmapFile.audioNode.gainNode.gain.value = masterVol * musicVol;
}

function setEffectVolume(slider) {
    hsVol = slider.value;
    document.querySelector("#effectVal").innerHTML = `${parseInt((slider.value / 0.4) * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.hs = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    // const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    // if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    // if (originalIsPlaying) beatmapFile.audioNode.play();

    HitSample.masterGainNode.gain.value = masterVol * hsVol;
}

// MAPPING
function setOffset(slider) {
    PAudio.SOFT_OFFSET = slider.value;
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

// ANY KIND OF CHECK BOX
function calculateCurrentSR(modsFlag) {
    const modsTemplate = ["HARD_ROCK", "EASY", "DOUBLE_TIME", "HALF_TIME"];

    const builderOptions = {
        addStacking: true,
        mods: modsTemplate.filter((mod, idx) => modsFlag[idx]),
    };

    const blueprintData = osuPerformance.parseBlueprint(beatmapFile.osuFile);
    const beatmapData = osuPerformance.buildBeatmap(blueprintData, builderOptions);
    const difficultyAttributes = osuPerformance.calculateDifficultyAttributes(beatmapData, true)[0];

    document.querySelector("#CS").innerText = round(beatmapData.difficulty.circleSize);
    document.querySelector("#AR").innerText = round(difficultyAttributes.approachRate);
    document.querySelector("#OD").innerText = round(difficultyAttributes.overallDifficulty);
    document.querySelector("#HP").innerText = round(beatmapData.difficulty.drainRate);
    document.querySelector("#SR").innerText = `${round(difficultyAttributes.starRating)}★`;
    document.querySelector("#SR").style.backgroundColor = getDiffColor(difficultyAttributes.starRating);

    if (difficultyAttributes.starRating >= 6.5) document.querySelector("#SR").style.color = "hsl(45deg, 100%, 70%)";
    else document.querySelector("#SR").style.color = "black";
}

function handleCheckBox(checkbox) {
    mods[checkbox.name] = !mods[checkbox.name];
    sliderAppearance[checkbox.name] = !sliderAppearance[checkbox.name];

    const DTMultiplier = !mods.DT ? 1 : 1.5;
    const HTMultiplier = !mods.HT ? 1 : 0.75;

    if (["snaking", "hitAnim"].includes(checkbox.name)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.sliderAppearance[checkbox.name] = sliderAppearance[checkbox.name];
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }

    if (!beatmapFile) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    playbackRate = 1 * DTMultiplier * HTMultiplier;
    Beatmap.updateModdedStats();

    if (originalIsPlaying) beatmapFile.audioNode.play();
    // if (!originalIsPlaying) beatmapFile.beatmapRenderData.objectsController.draw(beatmapFile.audioNode.getCurrentTime(), true);

    calculateCurrentSR([mods.HR, mods.EZ, mods.DT, mods.HT]);
}
