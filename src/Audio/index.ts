import type { BitmapText } from "pixi.js";
// @ts-ignore
import { getFileAudioBuffer } from "@soundcut/decode-audio-data-fast";
import { inject, ScopedClass } from "../Context";
import type Beatmap from "../BeatmapSet/Beatmap";

type AudioEvent = "time";
type EventCallback = (time: number) => void;

export default class Audio extends ScopedClass {
	private localGainNode: GainNode;
	private audioBuffer?: AudioBuffer;
	private src?: AudioBufferSourceNode;

	private startTime = 0;
	private previousTimestamp = 0;
	private _currentTime = 0;

	state: "PLAYING" | "STOPPED" = "STOPPED";

	constructor(private audioContext: AudioContext) {
		super();
		this.localGainNode = audioContext.createGain();
	}

	get currentTime() {
		if (this.state === "STOPPED") return this._currentTime;

		const offset =
			performance.now() -
			this.previousTimestamp -
			(this.audioContext.currentTime * 1000 - this.startTime);

		if (offset > 20) {
			this.pause();
			this.play();
			console.warn(`Audio desynced: ${offset.toFixed(2)}ms`);
		}

		return this._currentTime + (performance.now() - this.previousTimestamp);
	}

	set currentTime(val: number) {
		if (!this.audioBuffer) throw new Error("You haven't initiated audio yet!");

		this._currentTime = val > this.audioBuffer.duration * 1000 || val < 0 ? 0 : val;
		if (this.state === "STOPPED") return;

		this.pause();
		this.play();
	}

	async createBufferNode(blob: Blob) {
		this.audioBuffer = await getFileAudioBuffer(blob, this.audioContext, {
			native: true,
		});
	}

	toggle() {
		if (this.state === "PLAYING") {
			this.pause();
			return;
		}

		if (this.state === "STOPPED") {
			this.play();
			return;
		}
	}

	play() {
		if (this.state === "PLAYING")
			throw new Error("You cannot start an already started audio!");
		if (!this.audioBuffer) throw new Error("You haven't initiated audio yet!");
		this.state = "PLAYING";

		this.src = this.audioContext.createBufferSource();
		this.src.buffer = this.audioBuffer;

		this.localGainNode.gain.value = 0.4;

		this.src.connect(this.localGainNode);
		this.src.onended = () => {
			if (!this.audioBuffer)
				throw new Error("You haven't initiated audio yet!");
			if (this.currentTime < this.audioBuffer?.duration * 1000) return;

			console.log("Audio Ended!");

			const beatmap = this.context.consume<Beatmap>("beatmapObject");
			beatmap?.toggle();
			beatmap?.seek(0);
		};
		this.localGainNode.connect(this.audioContext.destination);

		this.startTime = this.audioContext.currentTime * 1000;
		this.previousTimestamp = performance.now();
		this.src.start(this.audioContext.currentTime, this._currentTime / 1000);
	}

	pause() {
		if (this.state === "STOPPED")
			throw new Error("You cannot stop an already stopped audio!");
		if (!this.audioBuffer) throw new Error("You haven't initiated audio yet!");
		this.state = "STOPPED";

		this.src?.stop();
		this.src?.disconnect();
		this.localGainNode.disconnect();

		this._currentTime += performance.now() - this.previousTimestamp;
	}
}
