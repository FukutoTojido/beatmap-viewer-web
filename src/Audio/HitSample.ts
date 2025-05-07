import type SampleManager from "../BeatmapSet/SampleManager";
import { type Context, ScopedClass } from "../Context";

export default class HitSample extends ScopedClass {
	play() {
		const audioContext = this.context.consume<AudioContext>("audioContext");
		if (!audioContext) return;

		const sampleManager = this.context.consume<SampleManager>("sampleManager");
		if (!sampleManager) return;

		const buffer = sampleManager.get("normal", "normal", 0);
		if (!buffer) return;

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
