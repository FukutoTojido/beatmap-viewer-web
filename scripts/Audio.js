class Audio {
    audioObj;

    constructor(src) {
        const audio = document.createElement("audio");
        audio.src = src;
        audio.volume = 0.1;
        audio.mute = "true";
        audio.playbackRate = playbackRate;
        audio.currentTime = 0.001;

        audio.onended = () => {
            audio.currentTime = 0.001;
            document.querySelector("#playButton").style.backgroundImage = "";

            playingFlag = false;
        };

        audio.onpause = () => {
            document.querySelector("#playButton").style.backgroundImage = "";
            if (beatmapFile.beatmapRenderData === undefined) return;
            if (beatmapFile !== undefined || beatmapFile.beatmapRenderData !== undefined || document.querySelector("audio") === undefined)
                beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
        };

        audio.preload = "metadata";
        audio.onloadedmetadata = setProgressMax;
        audio.ontimeupdate = setSliderTime;

        this.audioObj = audio;
        document.body.appendChild(this.audioObj);
    }

    play() {
        this.audioObj.play();
    }
}

class HitSample {
    audioObj;
    sliderHead = false;
    sliderTail = false;
    constructor(hitsounds) {
        this.audioObj = hitsounds;
        // console.log(this.audioObj);
    }
    play() {
        // console.log("Played");
        this.audioObj.forEach((hs) => {
            const src = audioCtx.createBufferSource();
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.2;
            gainNode.connect(audioCtx.destination);

            src.buffer = hitsoundsBuffer[hs];
            src.connect(gainNode);

            // const audioOffset = -document.querySelector("audio").currentTime + time;
            // console.log(audioCtx.currentTime);

            src.start();
        });
    }
}
