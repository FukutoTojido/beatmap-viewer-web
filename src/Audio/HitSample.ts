import type {
	HitSound,
	SamplePoint,
	SampleSet,
	HitSample as Sample,
} from "osu-classes";
import Beatmap from "../BeatmapSet/Beatmap";
import type SampleManager from "../BeatmapSet/SampleManager";
import { type Context, inject, ScopedClass } from "../Context";
import type Audio from ".";
import type BeatmapSet from "@/BeatmapSet";

export default class HitSample extends ScopedClass {
	localGainNode?: GainNode;
	srcs: AudioBufferSourceNode[] = [];

	private isPlaying = false;
	private timeout?: ReturnType<typeof setTimeout>;

	constructor(private hitSamples: Sample[]) {
		super();
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
				samplePoint.customIndex,
			);
			if (!buffer) continue;

			const src = audioContext.createBufferSource();
			src.buffer = buffer;

			const localGainNode = audioContext?.createGain();
			localGainNode.gain.value =
				(0.3 * samplePoint.volume) / clientLength / 100;
			this.localGainNode = localGainNode;

			src.connect(localGainNode);
			localGainNode.connect(audioContext.destination);

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
