import { Skinning } from "./Skinning.js";
import { Game } from "./Game.js";
import { BeatmapFile } from "./BeatmapFile.js";
import { urlParams } from "./GlobalVariables.js";
import { PlayContainer } from "./PlayButtons.js";
import { ObjectsController } from "./HitObjects/ObjectsController.js";
import { Background } from "./Background.js";
import { Storyboard } from "./Storyboard/Storyboard.js";

export class PAudio {
	raw_buf;
	buf;
	dt_buf;
	ht_buf;
	src;
	currentTime = 1;
	startTime = 0;
	absStartTime = 0;
	isPlaying = false;

	isLoaded = false;

	static SOFT_OFFSET = 0;

	doStretch(inputData, stretchFactor, numChannels) {
		var numInputFrames = inputData.length / numChannels;
		var bufsize = 4096 * numChannels;

		// Create a Kali instance and initialize it
		var kali = new window.Kali(numChannels);
		kali.setup(Game.AUDIO_CTX.sampleRate, stretchFactor, true);

		// Create an array for the stretched output
		var completed = new Float32Array(
			Math.floor((numInputFrames / stretchFactor) * numChannels + 1),
		);

		var inputOffset = 0;
		var completedOffset = 0;
		var loopCount = 0;
		var flushed = false;

		while (completedOffset < completed.length) {
			// if (loopCount % 100 == 0) {
			// 	console.log("Stretching", completedOffset / completed.length);
			// }

			// Read stretched samples into our output array
			completedOffset += kali.output(
				completed.subarray(
					completedOffset,
					Math.min(completedOffset + bufsize, completed.length),
				),
			);

			if (inputOffset < inputData.length) {
				// If we have more data to write, write it
				var dataToInput = inputData.subarray(
					inputOffset,
					Math.min(inputOffset + bufsize, inputData.length),
				);
				inputOffset += dataToInput.length;

				// Feed Kali samples
				kali.input(dataToInput);
				kali.process();
			} else if (!flushed) {
				// Flush if we haven't already
				kali.flush();
				flushed = true;
			}

			loopCount++;
		}

		return completed;
	}

	async createBufferNode(buf) {
		// console.log(buf);
		this.raw_buf = buf;
		const data = await Game.AUDIO_CTX.decodeAudioData(buf);

		const dt_output = this.doStretch(data.getChannelData(0), 1.5, 1);
		const dt_buf = Game.AUDIO_CTX.createBuffer(
			1,
			dt_output.length,
			Game.AUDIO_CTX.sampleRate,
		);
        dt_buf.getChannelData(0).set(dt_output);

		const ht_output = this.doStretch(data.getChannelData(0), 0.75, 1);
        const ht_buf = Game.AUDIO_CTX.createBuffer(
            1,
            ht_output.length,
            Game.AUDIO_CTX.sampleRate
        )
        ht_buf.getChannelData(0).set(ht_output);

		this.raw_buf = data;
		this.buf = data;
		this.dt_buf = dt_buf;
		this.ht_buf = ht_buf;

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

		if (this.buf === undefined || time > this.raw_buf.duration * 1000) return;

		const originalIsPlaying = this.isPlaying;
		if (this.isPlaying) this.pause();
		this.currentTime = time;
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
			this.src = Game.AUDIO_CTX.createBufferSource();

			this.gainNode.gain.value = Game.MUSIC_VOL * Game.MASTER_VOL * 1;

			const buf = Game.MODS.DT
				? this.dt_buf
				: Game.MODS.HT
					? this.ht_buf
					: this.buf;

			if (Game.MODS.NC || Game.MODS.DC) {
				this.src.playbackRate.value = Game.PLAYBACK_RATE;
			}
			this.src.buffer = buf;
			this.src.onended = () => {
				const tempCurrentTime = this.getCurrentTime();

				if (tempCurrentTime >= this.raw_buf.duration * 1000) {
					// console.log("Yes!", tempCurrentTime);
					console.log("Ended");
					this.pause();
					// playingFlag = false;
					this.seekTo(0);
					PlayContainer.playButton.sprite.texture =
						PlayContainer.playButton.texture;
				}
			};

			this.src.connect(this.gainNode);
			this.gainNode.connect(Game.AUDIO_CTX.destination);

			this.startTime = Game.AUDIO_CTX.currentTime * 1000;
			this.absStartTime = performance.now();
			this.src.start(
				Game.AUDIO_CTX.currentTime -
					(PAudio.SOFT_OFFSET < 0 ? PAudio.SOFT_OFFSET / 1000 : 0),
				this.currentTime /
					1000 /
					(Game.MODS.DT || Game.MODS.HT ? Game.PLAYBACK_RATE : 1) +
					(PAudio.SOFT_OFFSET >= 0 ? PAudio.SOFT_OFFSET / 1000 : 0),
			);

			Game.WORKER.postMessage({
				type: "start",
			});
			Storyboard.WORKER.postMessage({
				type: "start",
			});
			Background.playVideo(this.currentTime);
			this.isPlaying = true;

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
			this.src.stop();
			this.src.disconnect();
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
		return this.raw_buf?.duration * 1000 ?? 0;
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
