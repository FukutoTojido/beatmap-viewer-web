import type SampleManager from "../BeatmapSet/SampleManager";
import { type Context, ScopedClass } from "../Context";

export default class HitSample extends ScopedClass{
    localGainNode?: GainNode;
    audioContext?: AudioContext;

    hook(context: Context) {
        super.hook(context);

        this.audioContext = this.context.consume<AudioContext>("audioContext");
        this.localGainNode = this.audioContext?.createGain();

        return this;
    }

    play() {
        if (!this.audioContext || !this.localGainNode) return;
        
        const sampleManager = this.context.consume<SampleManager>("sampleManager");
        if (!sampleManager) return;
        
        const buffer = sampleManager.get("normal", "normal", 0);
        if (!buffer) return;

        const src = this.audioContext.createBufferSource();
        src.buffer = buffer;

        this.localGainNode.gain.value = 0.1;

        src.connect(this.localGainNode);
        this.localGainNode.connect(this.audioContext.destination);

        src.onended = () => {
            src.disconnect();
            this.localGainNode?.disconnect();
        }

        src.start();
    }
}