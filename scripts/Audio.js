import { Skinning } from "./Skinning.js";
import { Game } from "./Game.js";
import { BeatmapFile } from "./BeatmapFile.js";
import { urlParams } from "./GlobalVariables.js";

export class PAudio {
    buf;
    src;
    phazeNode;
    currentTime = 0.001;
    startTime = 0;
    absStartTime = 0;
    isPlaying = false;

    isLoaded = false;

    static SOFT_OFFSET = 0;

    async createBufferNode(buf) {
        // console.log(buf);
        this.buf = await Game.AUDIO_CTX.decodeAudioData(buf);

        if (urlParams.get("b") && urlParams.get("t") && urlParams.get("b") === BeatmapFile.CURRENT_MAPID) {
            this.seekTo(parseInt(urlParams.get("t")));
        }

        await Game.AUDIO_CTX.audioWorklet.addModule("../lib/phase-vocoder.min.js");
        this.phazeNode = new AudioWorkletNode(Game.AUDIO_CTX, "phase-vocoder-processor");

        this.gainNode = Game.AUDIO_CTX.createGain();

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

            this.src = Game.AUDIO_CTX.createBufferSource();

            this.gainNode.gain.value = Game.MUSIC_VOL * Game.MASTER_VOL * (Game.PLAYBACK_RATE !== 1 ? 3 : 1);

            this.src.buffer = this.buf;
            this.src.playbackRate.value = Game.PLAYBACK_RATE;
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
            pitchFactorParam.value = 1 / Game.PLAYBACK_RATE;

            if (Game.PLAYBACK_RATE !== 1) {
                this.src.connect(this.phazeNode);
                this.phazeNode.connect(this.gainNode);
            } else {
                this.src.connect(this.gainNode);
            }

            this.gainNode.connect(Game.AUDIO_CTX.destination);

            this.startTime = Game.AUDIO_CTX.currentTime * 1000;
            this.absStartTime = performance.now();
            this.src.start(
                Game.AUDIO_CTX.currentTime - (PAudio.SOFT_OFFSET < 0 ? PAudio.SOFT_OFFSET / 1000 : 0),
                this.currentTime / 1000 + 0.015 + (PAudio.SOFT_OFFSET >= 0 ? PAudio.SOFT_OFFSET / 1000 : 0)
            );

            document.querySelector("#playButton").style.backgroundImage = "url(/static/pause.png)";
        }
    }

    pause() {
        if (this.isPlaying) {
            this.src.stop();
            this.src.disconnect();
            this.phazeNode.disconnect();
            this.gainNode.disconnect();
            this.currentTime += (performance.now() - this.absStartTime) * Game.PLAYBACK_RATE;
            this.isPlaying = false;
            document.querySelector("#playButton").style.backgroundImage = "";
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.currentTime;
        return this.currentTime + (performance.now() - this.absStartTime) * Game.PLAYBACK_RATE;
    }

    get duration() {
        return this.buf?.duration * 1000 ?? 0;
    }
}

export class HitSample {
    audioObj;
    sliderHead = false;
    sliderTail = false;
    vol = 1;

    isPlaying = false;

    srcs = [];
    gainNode;
    currentTimeout;

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
        // console.log(this.audioObj);
    }

    play(isLoop) {
        this.srcs = [];

        this.audioObj.forEach((hs) => {
            const src = Game.AUDIO_CTX.createBufferSource();
            const gainNode = Game.AUDIO_CTX.createGain();

            gainNode.gain.value = this.vol;

            if (HitSample.SAMPLES.MAP[hs]) {
                src.buffer = HitSample.SAMPLES.MAP[hs];
            } else {
                const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
                const samples =
                    skinType !== "CUSTOM" || !HitSample.SAMPLES.CUSTOM[Skinning.SKIN_IDX]
                        ? HitSample.SAMPLES[skinType]
                        : HitSample.SAMPLES.CUSTOM[Skinning.SKIN_IDX];

                src.buffer = samples[hs.replaceAll(/\d/g, "")];
            }

            src.connect(gainNode);
            gainNode.connect(HitSample.masterGainNode);

            src.start();
            src.onended = () => {
                this.isPlaying = false;
                src.disconnect();
                gainNode.disconnect();
            };

            this.isPlaying = true;

            this.srcs.push(src);
        });
    }

    playLoop(higherThanStart, lowerThanEnd, timeLeft) {
        if (higherThanStart && lowerThanEnd && !this.isPlaying && Game.BEATMAP_FILE.audioNode.isPlaying) {
            this.play(true);
        }

        if (this.isPlaying && (!higherThanStart || !lowerThanEnd || !Game.BEATMAP_FILE.audioNode.isPlaying)) {
            this.srcs.forEach((src) => src.stop());
            this.isPlaying = false;
        }
    }
}
