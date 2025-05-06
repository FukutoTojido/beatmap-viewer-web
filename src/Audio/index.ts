import type { BitmapText } from "pixi.js";
import { inject } from "../Context";

type AudioEvent = "time";
type EventCallback = (time: number) => void

export default class Audio {
	private localGainNode: GainNode;
	private audioBuffer?: AudioBuffer;
	private src?: AudioBufferSourceNode;

	private startTime = 0;
	private previousTimestamp = 0;
	private _currentTime = 0;

    private callbacks = new Map<AudioEvent, Set<EventCallback>>();

	state: "PLAYING" | "STOPPED" = "STOPPED";

	constructor(private audioContext: AudioContext) {
		this.localGainNode = audioContext.createGain();
        setInterval(() => {
            if (!this.audioBuffer) return;
            if (this.state === "STOPPED") return;

            this.emit("time");
        }, 0);
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

		this._currentTime = val > this.audioBuffer.duration * 1000 ? 0 : val;
		if (this.state === "STOPPED") return;

		this.pause();
		this.play();
	}

	async createBufferNode(buffer: ArrayBuffer) {
		this.audioBuffer = await this.audioContext.decodeAudioData(buffer);
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

	private play() {
		if (!this.audioBuffer) throw new Error("You haven't initiated audio yet!");
		this.state = "PLAYING";

		this.src = this.audioContext.createBufferSource();
		this.src.buffer = this.audioBuffer;

		this.localGainNode.gain.value = 0.3;

		this.src.connect(this.localGainNode);
		this.src.onended = () => {
			if (!this.audioBuffer)
				throw new Error("You haven't initiated audio yet!");
			if (this.currentTime < this.audioBuffer?.duration * 1000) return;

			console.log("Audio Ended!");
			this.pause();
			this.currentTime = 0;
		};
		this.localGainNode.connect(this.audioContext.destination);

		this.startTime = this.audioContext.currentTime * 1000;
		this.previousTimestamp = performance.now();
		this.src.start(this.audioContext.currentTime, this._currentTime / 1000);
	}

	private pause() {
		if (!this.audioBuffer) throw new Error("You haven't initiated audio yet!");
		this.state = "STOPPED";

		this.src?.stop();
		this.src?.disconnect();
		this.localGainNode.disconnect();

		this._currentTime += performance.now() - this.previousTimestamp;
	}

    on(eventType: AudioEvent, callback: EventCallback) {
        if (!this.callbacks.get(eventType)) this.callbacks.set(eventType, new Set<EventCallback>());
        this.callbacks.get(eventType)?.add(callback);
    }

    private emit(eventType: AudioEvent) {
        if (!this.callbacks.get(eventType)) return;

        const timestamp = inject<BitmapText>("ui/main/viewer/timestamp");
        if (timestamp) timestamp.text = `${Math.round(this.currentTime)} ms`;
        // biome-ignore lint/style/noNonNullAssertion: Guarded
        for (const callback of this.callbacks.get(eventType)!) callback(this.currentTime);
    }
}
