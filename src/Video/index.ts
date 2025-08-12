import { inject } from "@/Context";
import { MessageType, type WorkerPayload } from "./types";
import VideoWorker from "./Worker.ts?worker";
import type Background from "@/UI/main/viewer/Background";
import type BackgroundConfig from "@/Config/BackgroundConfig";
import type BeatmapSet from "@/BeatmapSet";
import type Audio from "@/Audio";

export default class Video {
	worker = new VideoWorker();

	constructor() {
		this.worker.postMessage({
			type: MessageType.Init,
			data: import.meta.env.DEV
				? window.location.origin
				: `${window.location.origin}/dev`,
		});

		this.worker.addEventListener(
			"message",
			(event: {
				data: WorkerPayload;
			}) => {
				switch (event.data.type) {
					case MessageType.Frame: {
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
		});
	}

	stop(timestamp: number) {
		this.worker.postMessage({
			type: MessageType.Stop,
			data: timestamp,
		});
	}
}
