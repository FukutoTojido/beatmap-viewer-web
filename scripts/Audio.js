class PAudio {
    buf;
    src;
    phazeNode;
    currentTime = 0;
    startTime = 0;
    absStartTime = 0;
    isPlaying = false;

    isLoaded = false;

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

        this.isLoaded = true;
    }

    constructor() {
        PAudio.SOFT_OFFSET = JSON.parse(localStorage.getItem("settings")).mapping.offset;
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
        if (!this.isPlaying && this.gainNode) {
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
                    // playingFlag = false;
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

    get duration() {
        return this.buf?.duration * 1000 ?? 0;
    }
}

class HitSample {
    audioObj;
    sliderHead = false;
    sliderTail = false;
    vol = 1;

    isPlaying = false;

    srcs = [];
    gainNode;

    static masterGainNode;
    static SAMPLES = {
        ARGON: {},
        LEGACY: {},
        CUSTOM: {},
        MAP: {},
    };

    static DEFAULT_SAMPLES = {
        ARGON: {},
        LEGACY: {},
    };

    constructor(hitsounds, vol) {
        this.audioObj = hitsounds;
        this.vol = vol ?? 1;
        this.gainNode = audioCtx.createGain();
        this.gainNode.gain.value = this.vol;
        // console.log(this.audioObj);
    }

    play(isLoop) {
        // console.log(this.audioObj, "Played");
        // this.gainNode.gain.value = ObjectsController.CURRENT_SV.sampleVol / 100;
        this.srcs = [];
        this.audioObj.forEach((hs) => {
            const src = audioCtx.createBufferSource();
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = this.vol;

            if (HitSample.SAMPLES.MAP[hs]) {
                src.buffer = HitSample.SAMPLES.MAP[hs];
            } else {
                const skinType = Skinning.SKIN_ENUM[skinning.type];
                const samples =
                    skinType !== "CUSTOM" || !HitSample.SAMPLES.CUSTOM[Skinning.SKIN_IDX]
                        ? HitSample.SAMPLES[skinType]
                        : HitSample.SAMPLES.CUSTOM[Skinning.SKIN_IDX];

                src.buffer = samples[hs.replaceAll(/\d/g, "")];
            }

            src.connect(isLoop ? this.gainNode : gainNode);

            // this.gainNode.gain.value = this.vol;
            this.gainNode.connect(HitSample.masterGainNode);
            gainNode.connect(HitSample.masterGainNode)

            src.start();
            this.isPlaying = true;

            src.onended = () => {
                this.isPlaying = false;
                this.gainNode.disconnect();
            };

            this.srcs.push(src);
        });
    }

    playLoop(higherThanStart, lowerThanEnd) {
        if (higherThanStart && lowerThanEnd && !this.isPlaying && beatmapFile.audioNode.isPlaying) {
            this.play(true);
        }

        if (!higherThanStart || !lowerThanEnd || !beatmapFile.audioNode.isPlaying) {
            this.srcs.forEach((src) => src.stop());
            this.isPlaying = false;
        }
    }
}
