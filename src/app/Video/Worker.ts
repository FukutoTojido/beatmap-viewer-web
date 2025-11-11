import { AVSeekFlag, WebDemuxer } from "web-demuxer";
import { debounce } from "@/utils";
import { MessageType, type WorkerPayload } from "./types";

let engine: VideoEngine | undefined;

const ISOAVC_MAP: Record<string, string> = {
	avc1: "H.264",
	avc2: "H.264",
	svc1: "Scalable Video Coding",
	mvc1: "Multiview Video Coding",
	mvc2: "Multiview Video Coding",
};

const PROFILE: Record<string, string> = {
	//https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC#Profiles
	"0": "No", //  0             - *** when profile=RCDO and level=0 - "RCDO"  - RCDO bitstream MUST obey to all the constraints of the Baseline profile
	"42": "Baseline", // 66 in-decimal
	"4d": "Main", // 77 in-decimal
	"58": "Extended", // 88 in-decimal
	"64": "High", //100 in-decimal
	"6e": "High 10", //110 in-decimal
	"7a": "High 4:2:2", //122 in-decimal
	f4: "High 4:4:4", //244 in-decimal
	"2c": "CAVLC 4:4:4", // 44 in-decimal
	//profiles for SVC - Scalable Video Coding extension to H.264
	"53": "Scalable Baseline", // 83 in-decimal
	"56": "Scalable High", // 86 in-decimal
	//profiles for MVC - Multiview Video Coding extension to H.264
	"80": "Stereo High", // 128 in-decimal
	"76": "Multiview High", // 118 in-decimal
	"8a": "Multiview Depth High", // 138 in-decimal
};

function avcoti_to_str(s: string) {
	const REGEX = /([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i;

	if (false === REGEX.test(s)) return null;

	const matches = s.match(REGEX);
	matches?.shift(); //kills first one (regex matchs entire string)

	if (!matches) return null;

	let profile_idc = matches[0];
	profile_idc = PROFILE[profile_idc];
	profile_idc = profile_idc ? profile_idc : "Unknown"; //explicit fix.

	let level_idc = matches[2];
	level_idc = `${Number.parseInt(level_idc, 16)}`; //will give something like 30  (integer thirty)
	level_idc = level_idc.split("").join("."); //will give something like "3.0"

	return {
		profile_idc,
		level_idc,
	};
}

function h264avc_to_string(s: string) {
	const REGEX = /(avc1|avc2|svc1|mvc1|mvc2)\.([0-9a-f]{6})/i;

	if (false === REGEX.test(s)) return null;

	const matches = s.match(REGEX);
	matches?.shift(); //first one is the entire-string.

	if (!matches) return null;

	let avc_codec = ISOAVC_MAP[matches[0]];
	avc_codec = "string" === typeof avc_codec ? avc_codec : "Unknown"; //explicit fix

	return {
		avc_codec,
		...avcoti_to_str(s),
	};
}

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

	async reInitDecoder() {
		console.log("Decoder Borked!");
		console.log("Attempt to restart VideoDecoder...");

		this.decoder = new VideoDecoder({
			output: (frame) => {
				this.output(frame);
			},
			error: (e) => {
				console.error(e);
			},
		});
		this.decoder.configure(this.config);
		await this.seekToChunk(this.currentIndex);
	}

	async readFrame() {
		try {
			const now = performance.now();
			const frameTime = 1000 / this.frameRate;

			if (
				this.startTime +
					(now - this.absStartTime) * this.playbackRate -
					this.offset >
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

			this.frameTimer = requestAnimationFrame(() => {
				this.readFrame();
			});
		} catch {
			await this.reInitDecoder();

			this.frameTimer = requestAnimationFrame(() => {
				this.readFrame();
			});
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
		const index = this.binarySearch(timestamp * 1000);
		this.currentIndex = index;

		if (this.status === "PLAY") {
			if (this.frameTimer) cancelAnimationFrame(this.frameTimer);
			this.pauseResolver = undefined;
		}

		try {
			await this.seekToChunk(index);
		} catch {
			await this.reInitDecoder();
			await this.seekToChunk(index);
		}

		if (this.status === "PLAY") {
			this.play(timestamp);
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
