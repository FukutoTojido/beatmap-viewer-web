import type {
	HitSound,
	SamplePoint,
	SampleSet,
	HitSample as Sample,
} from "osu-classes";
import Beatmap from "../BeatmapSet/Beatmap";
import type SampleManager from "../BeatmapSet/SampleManager";
import { type Context, ScopedClass } from "../Context";

export default class HitSample extends ScopedClass {
	constructor(private hitSamples: Sample[]) {
		super();
	}

	play(samplePoint: SamplePoint) {
		const audioContext = this.context.consume<AudioContext>("audioContext");
		if (!audioContext) return;

		const sampleManager = this.context.consume<SampleManager>("sampleManager");
		if (!sampleManager) return;

		for (const hitSample of this.hitSamples) {
			let { sampleSet, hitSound } = hitSample;
			if (sampleSet === "None") sampleSet = samplePoint.sampleSet;
			if (sampleSet === "None") sampleSet = "Normal";
			if (!hitSound.includes("slider")) hitSound = `hit${hitSound}`

			const buffer = sampleManager.get(
				sampleSet.toLowerCase(),
				hitSound.toLowerCase(),
				samplePoint.customIndex,
			);
			if (!buffer) continue;

			const src = audioContext.createBufferSource();
			src.buffer = buffer;

			const localGainNode = audioContext?.createGain();
			localGainNode.gain.value = 0.3;

			src.connect(localGainNode);
			localGainNode.connect(audioContext.destination);

			src.onended = () => {
				src.disconnect();
				localGainNode.disconnect();
			};

			src.start();
		}
	}
}
