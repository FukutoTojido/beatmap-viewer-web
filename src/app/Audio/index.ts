import * as Tone from "tone";
import type BeatmapSet from "@/BeatmapSet";
import type AudioConfig from "@/Config/AudioConfig";
import { inject, ScopedClass } from "../Context";
import SpectrogramProcessor from "./SpectrogramProcessor";

export default class Audio extends ScopedClass {
	private localGainNode: GainNode;
	private previousTimestamp = 0;
	private _currentTime = 0;
	private startTime = 0;

	player?: Tone.Player | Tone.GrainPlayer;
	normalPlayer?: Tone.Player;
	grainPlayer?: Tone.GrainPlayer;

	state: "PLAYING" | "STOPPED" = "STOPPED";

	init = false;

	spectrogramProcessor: SpectrogramProcessor;

	constructor(private audioContext: Tone.Context) {
		super();
		this.localGainNode = audioContext.createGain();
		this.localGainNode.gain.value =
			inject<AudioConfig>("config/audio")?.musicVolume ?? 0.8;
		inject<AudioConfig>("config/audio")?.onChange("musicVolume", (val) => {
			this.localGainNode.gain.value = val;
		});

		Tone.setContext(audioContext);
		this.lookahead = 0.1;

		this.spectrogramProcessor = new SpectrogramProcessor();
	}

	get playbackRate() {
		return this.context.consume<BeatmapSet>("beatmapset")?.playbackRate ?? 1;
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

		if (
			this._currentTime +
				(performance.now() - this.previousTimestamp) * this.playbackRate >
			this.duration
		) {
			if (this.state === "PLAYING") {
				this.context.consume<BeatmapSet>("beatmapset")?.toggle();
				this.context.consume<BeatmapSet>("beatmapset")?.seek(0);
			}
			return this.duration;
		}

		return (
			this._currentTime +
			(performance.now() - this.previousTimestamp) * this.playbackRate
		);
	}

	set currentTime(val: number) {
		if (!this.player) throw new Error("You haven't initiated audio yet!");
		const previousState = this.state;

		if (previousState === "PLAYING") {
			this.pause();
		}

		this._currentTime =
			val > this.player.buffer.duration * 1000 || val < 0 ? 0 : val;

		Tone.getTransport().seconds =
			this._currentTime / 1000 / this.playbackRate + this.lookahead;

		if (previousState === "PLAYING") {
			this.play();
		}
	}

	async createBufferNode(blob: Blob) {
		const url = URL.createObjectURL(blob);

		this.spectrogramProcessor.initSpectrogram(url);
		this.grainPlayer = new Tone.GrainPlayer(url);
		this.normalPlayer = new Tone.Player(url);

		this.player = this.normalPlayer;
		this.player.sync().start(0);

		await Tone.loaded();

		Tone.getTransport().seconds = this.lookahead;

		this.init = true;
	}

	private _lookahead = 0.1;
	get lookahead() {
		return this._lookahead;
	}

	set lookahead(val: number) {
		this._lookahead = val;
		Tone.getContext().lookAhead = val;
	}

	toggle() {
		if (this.state === "PLAYING") {
			this.pause();
			return;
		}

		const playbackRate =
			this.context.consume<BeatmapSet>("beatmapset")?.playbackRate ?? 1;

		this.player = playbackRate !== 1 ? this.grainPlayer : this.normalPlayer;

		if (this.grainPlayer) {
			const baseWindow =
				60000 /
				(this.context.consume<BeatmapSet>("beatmapset")?.master?.data.bpm ??
					120) /
				2 /
				1000;

			this.grainPlayer.playbackRate = playbackRate;
			this.grainPlayer.grainSize = baseWindow;
			this.grainPlayer.overlap = baseWindow / 16;
		}

		if (this.state === "STOPPED") {
			this.play();
			return;
		}
	}

	play() {
		if (this.state === "PLAYING")
			throw new Error("You cannot start an already started audio!");
		if (!this.player) throw new Error("You haven't initiated audio yet!");
		this.state = "PLAYING";

		Tone.getTransport().seconds =
			this._currentTime / 1000 / this.playbackRate + this.lookahead;

		this.startTime = this.audioContext.currentTime * 1000;

		this.player?.unsync();
		this.player?.sync().start(0);
		Tone.getTransport().start(undefined);
		Tone.connect(this.player, this.localGainNode);
		this.localGainNode.connect(
			// biome-ignore lint/style/noNonNullAssertion: Ensured
			this.context.consume<GainNode>("masterGainNode")!,
		);

		this.previousTimestamp = performance.now();
	}

	pause() {
		if (this.state === "STOPPED")
			throw new Error("You cannot stop an already stopped audio!");
		if (!this.player) throw new Error("You haven't initiated audio yet!");
		this.state = "STOPPED";

		Tone.getTransport().pause();
		this._currentTime +=
			(performance.now() - this.previousTimestamp) * this.playbackRate;

		Tone.disconnect(this.player, this.localGainNode);
		this.localGainNode.disconnect();
	}

	get duration() {
		return (this.player?.buffer.duration ?? 0) * 1000;
	}
}
