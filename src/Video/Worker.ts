import { AVSeekFlag, WebDemuxer } from "web-demuxer";
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

	constructor(origin: string) {
		this.demuxer = new WebDemuxer({
			// ⚠️ you need to put the dist/wasm-files file in the npm package into a static directory like public
			// making sure that the js and wasm in wasm-files are in the same directory
			wasmLoaderPath: `${origin}/ffmpeg/ffmpeg.js`,
		});

		this.decoder = new VideoDecoder({
			output: (frame) => {
				this.output(frame);
				frame.close();
			},
			error: (e) => {
				console.error(e);
			},
		});
	}

	async demux(blob: Blob) {
		const file = new File([blob], "video.avi");
		await this.demuxer.load(file);

		const videoDecoderConfig = await this.demuxer.getVideoDecoderConfig();
		const videoMediaInfo = await this.demuxer.getMediaInfo();

		console.log(videoDecoderConfig, videoMediaInfo);
		this.config = videoDecoderConfig;
		this.decoder.configure(videoDecoderConfig);

		const frameRateStr = videoMediaInfo.streams[0].avg_frame_rate;
		this.frameRate = +frameRateStr.split("/")[0] / +frameRateStr.split("/")[1];

		const reader = this.demuxer
			.readVideoPacket(undefined, undefined, AVSeekFlag.AVSEEK_FLAG_BYTE)
			.getReader();

		console.time("Reading Video Chunks");
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			this.encodedChunks.push(this.demuxer.genEncodedVideoChunk(value));
		}
		console.timeEnd("Reading Video Chunks");
		await reader.cancel();

		console.log(this.encodedChunks);
	}

	output(frame: VideoFrame) {
		// console.log(`Frame Output: ${frame.timestamp}`);
		self.postMessage({
			type: MessageType.Frame,
			data: frame,
		});
	}

	async readFrame(index: number, shouldForward = true) {
		const i = index;

		if (this.status === "STOP") {
			return;
		}

		if (i >= this.encodedChunks.length) {
			this.status = "STOP";
			this.decoder.flush();
			return;
		}

		this.currentIndex = i;

		const chunk = this.encodedChunks[i];

		// console.log(`Sending out for decode: ${chunk.type} ${chunk.timestamp}\nDecoder state: ${this.decoder.state}`);
		this.decoder.decode(chunk);

		await new Promise((resolve) => {
			setTimeout(() => {
				resolve("");
			}, 1000 / this.frameRate);
		});

		if (!shouldForward) return;

		try {
			await this.readFrame(i + 1);
		} catch (error) {
			console.error(error);
		}
	}

	findKeyChunk(index: number) {
		const currentChunk = this.encodedChunks[index];

		if (currentChunk.type === "key") return index;

		let i = index;
		for (; i > 0 && this.encodedChunks[i].type !== "key"; i--) {}

		return i;
	}

	async seekToChunk(index: number) {
		const currentChunk = this.encodedChunks[index];

		if (currentChunk.type === "key") return index;

		let i = index;
		for (; i > 0 && this.encodedChunks[i].type !== "key"; i--) {}

		for (let j = i; j < index; j++) {
			const chunk = this.encodedChunks[j];
			this.decoder.decode(chunk);
		}
	}

	seek(timestamp: number) {
		try {
			const index = this.binarySearch(timestamp * 1000);
			this.seekToChunk(index);
		} catch (e) {
			console.error(e);
		}
	}

	async play(timestamp: number) {
		this.status = "PLAY";
		const chunkIndex = this.binarySearch(timestamp * 1000);
		try {
			this.currentIndex = chunkIndex;
			// console.log(chunkIndex);
			await this.readFrame(chunkIndex);
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function debounce(fn: (...args: any) => void, timeout = 100) {
	let timer: NodeJS.Timeout;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	return (...args: any) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => fn(...args), timeout);
	};
}

self.addEventListener(
	"message",
	(event: {
		data: WorkerPayload;
	}) => {
		switch (event.data.type) {
			case MessageType.Init: {
				engine = new VideoEngine(event.data.data);
				break;
			}
			case MessageType.Load: {
				if (!engine) return;

				engine.demux(event.data.data);
				break;
			}
			case MessageType.Seek: {
				if (!engine) return;
				engine.play(event.data.data);
				break;
			}
			case MessageType.Play: {
				if (!engine) return;
				// console.log("play");
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
	},
);
