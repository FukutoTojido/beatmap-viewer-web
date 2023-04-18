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

class PAudio {
    buf;
    src;
    currentTime = 0;
    startTime = 0;
    isPlaying = false;

    async createBufferNode(buf) {
        this.buf = await audioCtx.decodeAudioData(buf);
        setProgressMax();

        if (urlParams.get("b") && urlParams.get("t") && urlParams.get("b") === currentMapId) {
            this.seekTo(parseInt(urlParams.get("t")));
            setSliderTime();
        }
    }

    constructor(buf) {
        this.createBufferNode(buf);
    }

    seekTo(time) {
        if (time !== 0 && !time) return;

        if (this.buf === undefined || time > this.buf.duration * 1000) return;

        const originalIsPlaying = this.isPlaying;
        if (this.isPlaying) this.pause();
        this.currentTime = time;
        // console.log(this.currentTime);
        if (originalIsPlaying) this.play();
    }

    play(time) {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.src = audioCtx.createBufferSource();

            const gainNode = audioCtx.createGain();
            gainNode.gain.value = musicVol * masterVol;
            gainNode.connect(audioCtx.destination);

            this.src.buffer = this.buf;
            this.src.playbackRate.value = playbackRate;
            this.src.onended = () => {
                const tempCurrentTime = this.getCurrentTime();

                if (tempCurrentTime >= this.buf.duration * 1000) {
                    console.log("Ended");
                    this.pause();
                    playingFlag = false;
                    this.seekTo(0);
                }
            };
            this.src.connect(gainNode);

            this.startTime = audioCtx.currentTime * 1000;
            this.src.start(audioCtx.currentTime, time !== undefined ? time / 1000 : this.currentTime / 1000);

            document.querySelector("#playButton").style.backgroundImage = "url(./static/pause.png)";
        }
    }

    pause() {
        if (this.isPlaying) {
            this.src.stop();
            this.src.disconnect();
            this.currentTime += (audioCtx.currentTime * 1000 - this.startTime) * playbackRate;
            this.isPlaying = false;
            document.querySelector("#playButton").style.backgroundImage = "";
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.currentTime;
        return this.currentTime + (audioCtx.currentTime * 1000 - this.startTime) * playbackRate;
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
        // console.log(this.audioObj, "Played");
        this.audioObj.forEach((hs) => {
            const src = audioCtx.createBufferSource();
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = hsVol * masterVol;
            gainNode.connect(audioCtx.destination);

            src.buffer = hitsoundsBuffer[Object.keys(hitsoundsBuffer).includes(hs) ? hs : `${hs.replaceAll(/\d/g, "")}0`];
            src.connect(gainNode);

            // const audioOffset = -document.querySelector("audio").currentTime + time;
            // console.log(audioCtx.currentTime);

            src.start();
        });
    }
}
