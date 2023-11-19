class PAudio {
    buf;
    src;
    phazeNode;
    currentTime = 0;
    startTime = 0;
    absStartTime = 0;
    isPlaying = false;

    static SOFT_OFFSET = 0;

    async createBufferNode(buf) {
        // console.log(buf);
        this.buf = await audioCtx.decodeAudioData(buf);
        setProgressMax();

        if (urlParams.get("b") && urlParams.get("t") && urlParams.get("b") === currentMapId) {
            this.seekTo(parseInt(urlParams.get("t")));
            setSliderTime();
        }

        await audioCtx.audioWorklet.addModule("../lib/phase-vocoder.min.js");
        this.phazeNode = new AudioWorkletNode(audioCtx, "phase-vocoder-processor");

        this.gainNode = audioCtx.createGain();
    }

    constructor(buf) {
        PAudio.SOFT_OFFSET = JSON.parse(localStorage.getItem("settings")).mapping.offset;
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

            this.gainNode.gain.value = musicVol * masterVol;

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

            let pitchFactorParam = this.phazeNode.parameters.get("pitchFactor");
            pitchFactorParam.value = 1 / playbackRate;

            this.src.connect(this.phazeNode);
            this.phazeNode.connect(this.gainNode);
            this.gainNode.connect(audioCtx.destination);

            this.startTime = audioCtx.currentTime * 1000;
            this.absStartTime = performance.now();
            this.src.start(
                audioCtx.currentTime - (PAudio.SOFT_OFFSET < 0 ? PAudio.SOFT_OFFSET / 1000 : 0),
                this.currentTime / 1000 + 60 / 1000 + (PAudio.SOFT_OFFSET >= 0 ? PAudio.SOFT_OFFSET / 1000 : 0)
            );

            document.querySelector("#playButton").style.backgroundImage = "url(./static/pause.png)";
        }
    }

    pause() {
        if (this.isPlaying) {
            this.src.stop();
            this.src.disconnect();
            this.phazeNode.disconnect();
            this.gainNode.disconnect();
            // this.currentTime += (audioCtx.currentTime * 1000 - this.startTime) * playbackRate;
            this.currentTime += (performance.now() - this.absStartTime) * playbackRate;
            this.isPlaying = false;
            document.querySelector("#playButton").style.backgroundImage = "";
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.currentTime;
        // return this.currentTime + (audioCtx.currentTime * 1000 - this.startTime) * playbackRate;
        return this.currentTime + (performance.now() - this.absStartTime) * playbackRate;
    }
}

class HitSample {
    audioObj;
    sliderHead = false;
    sliderTail = false;
    vol = 1;

    static masterGainNode;
    static SAMPLES = {
        ARGON: {},
        LEGACY: {},
        CUSTOM: {},
        MAP: {},
    };

    constructor(hitsounds, vol) {
        this.audioObj = hitsounds;
        this.vol = vol ?? 1;
        // console.log(this.audioObj);
    }
    play() {
        // console.log(this.audioObj, "Played");
        this.audioObj.forEach((hs) => {
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = this.vol;

            const src = audioCtx.createBufferSource();

            if (HitSample.SAMPLES.MAP[hs]) {
                src.buffer = HitSample.SAMPLES.MAP[hs];
            } else {
                const skinType = skinning.type === "0" ? "ARGON" : "LEGACY";
                src.buffer = HitSample.SAMPLES[skinType][hs.replaceAll(/\d/g, "")];
            }

            src.connect(gainNode);

            gainNode.connect(HitSample.masterGainNode);

            src.start();
        });
    }
}
