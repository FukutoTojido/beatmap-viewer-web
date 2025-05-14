import { inject } from "@/Context";
import { MessageType, type WorkerPayload } from "./types";
import VideoWorker from "./Worker.ts?worker";
import type Background from "@/UI/main/viewer/Background";

export default class Video {
	worker = new VideoWorker();

	constructor() {
		this.worker.postMessage({
			type: MessageType.Init,
			data: import.meta.env.DEV ? window.location.origin : "https://cdn.jsdelivr.net/npm/web-demuxer@latest/dist/wasm-files/ffmpeg.min.js",
		});

		this.worker.addEventListener(
			"message",
			(event: {
				data: WorkerPayload;
			}) => {
				switch (event.data.type) {
					case MessageType.Frame: {
						inject<Background>("ui/main/viewer/background")?.updateFrame(
							event.data.data,
						);
						break;
					}
				}
			},
		);
	}

	async load(blob: Blob) {
		this.worker.postMessage({
			type: MessageType.Load,
			data: blob,
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
