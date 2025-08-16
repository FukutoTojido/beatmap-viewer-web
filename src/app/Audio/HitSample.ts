import type { HitSample as Sample, SamplePoint } from "osu-classes";
import type BeatmapSet from "@/BeatmapSet";
import type AudioConfig from "@/Config/AudioConfig";
import type SampleManager from "../BeatmapSet/SampleManager";
import { inject, ScopedClass } from "../Context";
import type Audio from ".";

export default class HitSample extends ScopedClass {
	localGainNode?: GainNode;
	srcs: AudioBufferSourceNode[] = [];

	private isPlaying = false;
	private timeout?: ReturnType<typeof setTimeout>;

	constructor(hitSamples: Sample[]) {
		super();
		this.hitSamples = hitSamples;
	}

	private _hitSamples: Sample[] = [];
	get hitSamples() {
		return this._hitSamples
	}
	set hitSamples(val: Sample[]) {
		this._hitSamples = val;
	}

	play(samplePoint: SamplePoint, isLoop = false) {
		const audio = this.context.consume<Audio>("audio");
		const beatmapset = inject<BeatmapSet>("beatmapset");
		const clientLength = 1 + (beatmapset?.slaves.size ?? 0);

		if (!audio || audio.state === "STOPPED") return;

		const audioContext = this.context.consume<AudioContext>("audioContext");
		if (!audioContext) return;

		const sampleManager = this.context.consume<SampleManager>("sampleManager");
		if (!sampleManager) return;

		this.srcs = [];
		for (const hitSample of this.hitSamples) {
			let { sampleSet, hitSound } = hitSample;
			if (sampleSet === "None") sampleSet = samplePoint.sampleSet;
			if (sampleSet === "None") sampleSet = "Normal";
			if (!hitSound.includes("slider")) hitSound = `hit${hitSound}`;

			const buffer = sampleManager.get(
				sampleSet.toLowerCase(),
				hitSound.toLowerCase(),
				inject<AudioConfig>("config/audio")?.hitsound
					? 0
					: samplePoint.customIndex,
			);
			if (!buffer) continue;

			const src = audioContext.createBufferSource();
			src.buffer = buffer;

			const localGainNode = audioContext?.createGain();
			localGainNode.gain.value =
				(samplePoint.volume *
					(inject<AudioConfig>("config/audio")?.effectVolume ?? 1)) /
				clientLength /
				100;
			this.localGainNode = localGainNode;

			src.connect(localGainNode);
			// biome-ignore lint/style/noNonNullAssertion: Ensured
			localGainNode.connect(this.context.consume<GainNode>("masterGainNode")!);

			src.onended = () => {
				src.disconnect();
				localGainNode.disconnect();
			};

			src.start();
			src.loop = isLoop;
			this.srcs.push(src);
		}

		this.isPlaying = true;
	}

	playLoop(samplePoint: SamplePoint, inRange: boolean, remainingTime: number) {
		const audio = this.context.consume<Audio>("audio");
		if (!audio) return;

		const beatmapset = inject<BeatmapSet>("beatmapset");
		const clientLength = 1 + (beatmapset?.slaves.size ?? 0);

		if (this.localGainNode)
			this.localGainNode.gain.value =
				(0.3 * samplePoint.volume) / clientLength / 100;

		const clearCurrent = () => {
			for (const src of this.srcs) {
				src.stop();
				src.disconnect();
			}

			this.isPlaying = false;
		};

		if (inRange && !this.isPlaying && audio.state === "PLAYING") {
			clearTimeout(this.timeout);
			this.play(samplePoint, true);
			this.timeout = setTimeout(() => clearCurrent(), remainingTime ?? 0);
		}

		if (this.isPlaying && (!inRange || audio.state === "STOPPED")) {
			clearTimeout(this.timeout);
			clearCurrent();
		}
	}
}
