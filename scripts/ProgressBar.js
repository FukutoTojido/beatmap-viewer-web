function setSliderTime() {
    if (beatmapFile === undefined) return;
    if (!sliderOnChange) document.querySelector("#progress").value = beatmapFile.audioNode.getCurrentTime();
}

function setAudioTime() {
    const slider = document.querySelector("#progress");

    if (beatmapFile === undefined) {
        slider.value = 0;
        return;
    }

    beatmapFile.audioNode.seekTo(parseFloat(slider.value));
}

function setProgressMax() {
    document.querySelector("#progress").max = beatmapFile.audioNode.buf.duration * 1000;
}

function playToggle(ele) {
    ele?.blur();
    if (!beatmapFile.audioNode.gainNode || !beatmapFile.audioNode.buf) return;

    if (!beatmapFile.audioNode.isPlaying) {
        document.querySelector("#playButton").style.backgroundImage = "";
        beatmapFile.audioNode.play();
        return;
        // beatmapFile.beatmapRenderData.render();
    }

    document.querySelector("#playButton").style.backgroundImage = "url(./static/pause.png)";
    beatmapFile.audioNode.pause();
    // beatmapFile.beatmapRenderData.objectsController.draw(beatmapFile.audioNode.getCurrentTime(), true);
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

function go(precise, isForward) {
    if (!beatmapFile || !beatmapFile.audioNode.isLoaded) return;
    let step = 1;
    let side = isForward ? 1 : -1;
    let currentBeatstep;
    const current = beatmapFile.audioNode.getCurrentTime();
    const isPlaying = beatmapFile.audioNode.isPlaying;

    if (Beatmap.beatStepsList.length) {
        currentBeatstep = Beatmap.beatStepsList.findLast((timingPoint) => timingPoint.time <= current) ?? Beatmap.beatStepsList[0];
        step = precise ? 1 : (currentBeatstep.beatstep / parseInt(beatsnap)) * (!isForward && isPlaying ? 2 : 1);
    }

    const relativePosition = current - currentBeatstep.time;
    const relativeTickPassed = Math.round(relativePosition / step);

    const goTo = Clamp(Math.floor(currentBeatstep.time + (relativeTickPassed + side) * step), 0, beatmapFile.audioNode.buf.duration * 1000);

    beatmapFile.audioNode.seekTo(goTo);
    document.querySelector("#progress").value = beatmapFile.audioNode.currentTime;
}

function copyUrlToClipboard() {
    const origin = window.location.origin;
    const currentTimestamp = beatmapFile !== undefined ? parseInt(beatmapFile.audioNode.getCurrentTime()) : 0;
    const mapId = currentMapId || "";
    navigator.clipboard.writeText(`${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-how"}?b=${mapId}&t=${currentTimestamp}`);

    showNotification("Current preview timestamp copied");
}
