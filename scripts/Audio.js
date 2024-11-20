import { Skinning } from "./Skinning.js";
import { Game } from "./Game.js";
import { BeatmapFile } from "./BeatmapFile.js";
import { urlParams } from "./GlobalVariables.js";
import { PlayContainer } from "./PlayButtons.js";
import { ObjectsController } from "./HitObjects/ObjectsController.js";
import { Background } from "./Background.js";
import { Storyboard } from "./Storyboard/Storyboard.js";
import { PitchShifter } from "soundtouchjs";

export class PAudio {
	buf;
	src;
	shifter;
	currentTime = 1;
	startTime = 0;
	absStartTime = 0;
	isPlaying = false;

	isLoaded = false;

	static SOFT_OFFSET = 0;

	async createBufferNode(buf) {
		// console.log(buf);
		this.buf = await Game.AUDIO_CTX.decodeAudioData(buf);

		if (this.shifter) this.shifter.off();
		this.shifter = new PitchShifter(Game.AUDIO_CTX, this.buf, 2048);

		if (
			urlParams.get("b") &&
			urlParams.get("t") &&
			urlParams.get("b") === BeatmapFile.CURRENT_MAPID
		) {
			this.seekTo(parseInt(urlParams.get("t")));
		}

		this.gainNode = Game.AUDIO_CTX.createGain();
		this.isLoaded = true;
	}

	constructor() {
		PAudio.SOFT_OFFSET = JSON.parse(
			localStorage.getItem("settings"),
		).mapping.offset;
	}

	seekTo(time) {
		// console.log(time);
		if (time !== 0 && !time) return;

		if (this.buf === undefined || time > this.buf.duration * 1000) return;

		const originalIsPlaying = this.isPlaying;
		if (this.isPlaying) this.pause();
		this.currentTime = time;
		if (this.shifter) {
			this.shifter.percentagePlayed = time / (this.buf.duration * 1000);
		}
		Game.WORKER.postMessage({
			type: "seek",
			time,
		});
		Storyboard.WORKER.postMessage({
			type: "seek",
			time,
		});
		Background.seekTo(time);
		// console.log(this.currentTime);
		if (originalIsPlaying) this.play();
	}

	play(time) {
		if (!this.isPlaying && this.gainNode) {
			// this.src = Game.AUDIO_CTX.createBufferSource();

			this.gainNode.gain.value = Game.MUSIC_VOL * Game.MASTER_VOL;

			// this.src.buffer = this.buf;
			// this.src.playbackRate.value = Game.PLAYBACK_RATE;
			// this.src.onended = () => {
			// 	const tempCurrentTime = this.getCurrentTime();

			// 	if (tempCurrentTime >= this.buf.duration * 1000) {
			// 		// console.log("Yes!", tempCurrentTime);
			// 		console.log("Ended");
			// 		this.pause();
			// 		// playingFlag = false;
			// 		this.seekTo(0);
			// 		PlayContainer.playButton.sprite.texture =
			// 			PlayContainer.playButton.texture;
			// 	}
			// };

			// if (Game.PLAYBACK_RATE !== 1 && (Game.MODS.DT || Game.MODS.HT)) {
			// 	this.src.connect(this.phazeNode);
			// 	this.phazeNode.connect(this.gainNode);
			// } else {
			// 	this.src.connect(this.gainNode);
			// }

			this.shifter.percentagePlayed =
				this.currentTime / (this.buf.duration * 1000);
			this.shifter.tempo = Game.PLAYBACK_RATE;

			this.shifter.connect(this.gainNode);
			this.gainNode.connect(Game.AUDIO_CTX.destination);

			// this.src.start(
			// 	Game.AUDIO_CTX.currentTime -
			// 		(PAudio.SOFT_OFFSET < 0 ? PAudio.SOFT_OFFSET / 1000 : 0),
			// 	this.currentTime / 1000 +
			// 		(PAudio.SOFT_OFFSET >= 0 ? PAudio.SOFT_OFFSET / 1000 : 0),
			// );

			Game.AUDIO_CTX.resume().then(() => {
				this.startTime = Game.AUDIO_CTX.currentTime * 1000;
				this.absStartTime = performance.now();

                Game.WORKER.postMessage({
                    type: "start",
                });
                Storyboard.WORKER.postMessage({
                    type: "start",
                });
                
				this.isPlaying = true;
			});

			Background.playVideo(this.currentTime);

			// document.querySelector("#playButton").style.backgroundImage = "url(/static/pause.png)";
		}
	}

	pause() {
		if (this.isPlaying) {
			Game.WORKER.postMessage({
				type: "stop",
			});
			Storyboard.WORKER.postMessage({
				type: "stop",
			});
			// this.src.stop();
			// this.src.disconnect();
			// this.phazeNode.disconnect();
			this.shifter.disconnect();
			this.gainNode.disconnect();
			// this.currentTime += (Game.AUDIO_CTX.currentTime * 1000 - this.startTime) * Game.PLAYBACK_RATE;
			this.currentTime +=
				(performance.now() - this.absStartTime) * Game.PLAYBACK_RATE;
			Background.pauseVideo(this.currentTime);
			this.isPlaying = false;
			// document.querySelector("#playButton").style.backgroundImage = "";
		}
	}

	getCurrentTime() {
		if (!this.isPlaying) return this.currentTime;
		const offset =
			performance.now() -
			this.absStartTime -
			(Game.AUDIO_CTX.currentTime * 1000 - this.startTime);

		if (offset > 20) {
			this.pause();
			this.play();

			console.log(`Shifted ${offset}`);
		}

		return (
			this.currentTime +
			(performance.now() - this.absStartTime) * Game.PLAYBACK_RATE
		);

		// console.log((performance.now() - this.absStartTime), (Game.AUDIO_CTX.currentTime * 1000 - this.startTime))
		// return this.currentTime + (Game.AUDIO_CTX.currentTime * 1000 - this.startTime) * Game.PLAYBACK_RATE;
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
		if (Game.IS_SEEKING || !Game.SHOULD_PLAY_HITSOUND) return;

		this.srcs = [];

		this.audioObj.forEach((hs) => {
			const src = Game.AUDIO_CTX.createBufferSource();
			const gainNode = Game.AUDIO_CTX.createGain();
			this.gainNode = gainNode;

			gainNode.gain.value = this.vol;

			if (HitSample.SAMPLES.MAP[hs] && !Game.DISABLE_BMHS) {
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
				// this.isPlaying = false;
				src.disconnect();
				gainNode.disconnect();
			};

			this.isPlaying = true;
			if (isLoop) src.loop = true;

			this.srcs.push(src);
		});
	}

	playLoop(higherThanStart, lowerThanEnd, timeLeft) {
		if (this.gainNode) {
			this.gainNode.gain.value = ObjectsController.CURRENT_SV.sampleVol / 100;
		}

		if (
			higherThanStart &&
			lowerThanEnd &&
			!this.isPlaying &&
			Game.BEATMAP_FILE.audioNode.isPlaying
		) {
			clearTimeout(this.currentTimeout);
			this.play(true);

			this.currentTimeout = setTimeout(() => {
				this.srcs.forEach((src) => {
					src.stop();
					src.disconnect();
				});
				this.isPlaying = false;
			}, timeLeft ?? 0);
		}

		if (
			this.isPlaying &&
			(!higherThanStart ||
				!lowerThanEnd ||
				!Game.BEATMAP_FILE.audioNode.isPlaying)
		) {
			this.srcs.forEach((src) => {
				src.stop();
				src.disconnect();
			});
			this.isPlaying = false;
		}
	}
}
