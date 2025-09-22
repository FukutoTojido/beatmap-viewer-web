import { AVSeekFlag, WebDemuxer } from "web-demuxer";
import { debounce } from "@/utils";
import { MessageType, type WorkerPayload } from "./types";

let engine: VideoEngine | undefined;

class VideoEngine {
	demuxer: WebDemuxer;
	decoder: VideoDecoder;

	frameRate = 30;

	encodedChunks: EncodedVideoChunk[] = [];

	status: "PLAY" | "STOP" = "STOP";
	config!: VideoDecoderConfig;

	currentIndex = 0;

	seek: (timestamp: number) => void;
	pauseResolver?: (value: unknown) => void;

	timer?: NodeJS.Timeout;
	currentFrame?: VideoFrame;

	offset = 0;
	playbackRate = 1;

	constructor(origin: string) {
		this.seek = debounce((timestamp: number) => this._seek(timestamp), 200);

		this.demuxer = new WebDemuxer({
			// ⚠️ you need to put the dist/wasm-files file in the npm package into a static directory like public
			// making sure that the js and wasm in wasm-files are in the same directory
			wasmFilePath: `${origin}/web-demuxer.wasm`,
		});

		this.decoder = new VideoDecoder({
			output: (frame) => {
				this.output(frame);
			},
			error: (e) => {
				console.error(e);
			},
		});
	}

	async demux(blob: Blob, offset: number) {
		this.offset = offset;

		const file = new File([blob], "video.avi");
		await this.demuxer.load(file);

		const videoDecoderConfig = await this.demuxer.getDecoderConfig("video");
		const videoMediaInfo = await this.demuxer.getMediaInfo();

		console.log(videoDecoderConfig, videoMediaInfo);
		this.config = videoDecoderConfig;
		this.decoder.configure(videoDecoderConfig);

		const frameRateStr = videoMediaInfo.streams[0].r_frame_rate;
		this.frameRate = +frameRateStr.split("/")[0] / +frameRateStr.split("/")[1];

		const reader = this.demuxer
			.readMediaPacket("video", 0, undefined, AVSeekFlag.AVSEEK_FLAG_BACKWARD)
			.getReader();

		console.time("Reading Video Chunks");
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			this.encodedChunks.push(this.demuxer.genEncodedChunk("video", value));
		}
		console.timeEnd("Reading Video Chunks");
		await reader.cancel();
	}

	output(frame: VideoFrame) {
		if (this.timer) {
			clearTimeout(this.timer);
			this.currentFrame?.close();
			this.currentFrame = undefined;
		}

		this.timer = setTimeout(() => {
			self.postMessage({
				type: MessageType.Frame,
				data: frame,
			});
		}, 16);
		this.currentFrame = frame;
	}

	frameTimer?: number;

	async readFrame() {
		const now = performance.now();
		// if (this.last === 0) this.last = 1000 / this.frameRate - 1;
		const frameTime = 1000 / this.frameRate;

		if (
			this.startTime + (now - this.absStartTime) * this.playbackRate - this.offset >
			this.currentIndex * frameTime
		) {
			const i = this.currentIndex;

			if (this.status === "STOP") {
				return;
			}

			if (i >= this.encodedChunks.length) {
				this.status = "STOP";
				this.decoder.flush();
				this.currentIndex = 0;
				return;
			}

			this.currentIndex = i;

			const chunk = this.encodedChunks[i];
			this.decoder.decode(chunk);

			this.currentIndex += 1;
		}

		try {
			this.frameTimer = requestAnimationFrame(() => {
				this.readFrame();
			});
		} catch (error) {
			console.error(error);
		}
	}

	async seekToChunk(index: number) {
		await this.decoder.flush();

		const i = this.findKeyChunk(index);

		for (let j = i; j < index; j++) {
			const chunk = this.encodedChunks[j];
			this.decoder.decode(chunk);
		}
		this.decoder.decode(this.encodedChunks[index]);
	}

	findKeyChunk(index: number) {
		const currentChunk = this.encodedChunks[index];
		if (currentChunk.type === "key") return index;

		let i = index;
		for (; i > 0 && this.encodedChunks[i].type !== "key"; i--) {}

		return i;
	}

	absStartTime = 0;
	startTime = 0;
	async _seek(timestamp: number) {
		try {
			if (this.status === "PLAY") {
				if (this.frameTimer) cancelAnimationFrame(this.frameTimer);
				this.pauseResolver = undefined;
			}

			const index = this.binarySearch(timestamp * 1000);
			this.currentIndex = index;

			await this.seekToChunk(index);

			if (this.status === "PLAY") {
				this.play(timestamp);
			}
		} catch (e) {
			console.error(e);
		}
	}

	async play(timestamp: number) {
		this.status = "PLAY";

		this.absStartTime = performance.now();
		this.startTime = timestamp;
		try {
			this.readFrame();
		} catch (e) {
			console.error(e);
		}
	}

	binarySearch(value: number) {
		let start = 0;
		let end = this.encodedChunks.length - 1;

		while (start < end) {
			const mid = start + Math.floor((end - start) / 2);

			if (this.encodedChunks[mid].timestamp === value) return mid;
			if (value < this.encodedChunks[mid].timestamp) {
				end = mid - 1;
				continue;
			}
			if (value > this.encodedChunks[mid].timestamp) {
				start = mid + 1;
			}
		}

		const pre = this.encodedChunks[start].timestamp;
		const post = this.encodedChunks[end].timestamp;

		return Math.abs(value - pre) < Math.abs(value - post) ? start : end;
	}
}

self.addEventListener("message", (event: { data: WorkerPayload }) => {
	switch (event.data.type) {
		case MessageType.Init: {
			engine = new VideoEngine(event.data.data);
			break;
		}
		case MessageType.Load: {
			if (!engine) return;

			engine.demux(event.data.data, event.data.offset);
			break;
		}
		case MessageType.Seek: {
			if (!engine) return;
			engine.seek(event.data.data);
			break;
		}
		case MessageType.Play: {
			if (!engine) return;
			// console.log("play");
			engine.playbackRate = event.data.playbackRate ?? 1;
			engine.play(event.data.data);

			break;
		}
		case MessageType.Stop: {
			if (!engine) return;
			// console.log("stop");
			// console.log(engine.currentIndex);
			engine.status = "STOP";
			break;
		}
	}
});

// // const frame = 1000 / 30;
// let last = 0;
// const SAMPLE_COUNT = 1000;
// let i = SAMPLE_COUNT;
// let sum = 0;
// let avg = 1000 / 30;

// const execute = () => {
// 	const now = performance.now();
// 	// console.log("Fire frame. Diff: ", Math.round(now - last));
// 	sum += now - last;
// 	last = now;

// 	if (i-- > 0) requestAnimationFrame(() => execute());
// 	if (i < 0) {
// 		avg = sum / SAMPLE_COUNT;
// 		console.log(avg);
// 	}
// };

// last = performance.now();
// requestAnimationFrame(() => execute());
