import type Audio from "@/Audio";
import type BeatmapSet from "@/BeatmapSet";
import type BackgroundConfig from "@/Config/BackgroundConfig";
import { inject } from "@/Context";
import type Background from "@/UI/main/viewer/Background";
import { MessageType, type WorkerPayload } from "./types";
import VideoWorker from "./Worker.ts?worker";

export default class Video {
	worker = new VideoWorker();

	constructor() {
		this.worker.postMessage({
			type: MessageType.Init,
			data: window.location.origin,
		});

		this.worker.addEventListener(
			"message",
			(event: { data: WorkerPayload }) => {
				switch (event.data.type) {
					case MessageType.Frame: {
						if (!inject<BackgroundConfig>("config/background")?.video) {
							(event.data.data as VideoFrame).close();
							break;
						}
						inject<Background>("ui/main/viewer/background")?.updateFrame(
							event.data.data as VideoFrame,
						);
						break;
					}
				}
			},
		);

		inject<BackgroundConfig>("config/background")?.onChange("video", (val) => {
			const audio =
				inject<BeatmapSet>("beatmapset")?.context.consume<Audio>("audio");
			if (!audio) return;

			if (!val) this.stop(audio.currentTime);
			if (val && audio.state === "PLAYING") this.play(audio.currentTime);
		});
	}

	async load(blob: Blob, offset: number) {
		this.worker.postMessage({
			type: MessageType.Load,
			data: blob,
			offset,
		});
	}

	seek(timestamp: number) {
		this.worker.postMessage({
			type: MessageType.Seek,
			data: timestamp,
		});
	}

	play(timestamp: number) {
		this.worker.postMessage({
			type: MessageType.Play,
			data: timestamp,
			playbackRate: inject<BeatmapSet>("beatmapset")?.playbackRate ?? 1,
		});
	}

	stop(timestamp: number) {
		this.worker.postMessage({
			type: MessageType.Stop,
			data: timestamp,
		});
	}

	destroy() {
		this.worker.terminate();
	}
}
