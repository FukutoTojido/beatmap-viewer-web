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
    navigator.clipboard.writeText(`${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-how"}?b=${mapId}&t=${currentTimestamp}`);
}
