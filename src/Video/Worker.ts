import {
	AVMediaType,
	AVSeekFlag,
	WebDemuxer,
	type WebAVPacket,
} from "web-demuxer";
import { MessageType, type WorkerPayload } from "./types";

let demuxer: WebDemuxer;
let frameTime = 1000 / 30;
let status: "PLAY" | "STOP" = "STOP";
let duration = 0;
const encodedChunks: EncodedVideoChunk[] = [];
let lastChunkTimestamp = 0;

const decoder = new VideoDecoder({
	output: (frame) => {
		if (status === "PLAY") {
			self.postMessage({
				type: MessageType.Frame,
				data: frame,
			});
		}

		if (status !== "PLAY" && frame.timestamp === lastChunkTimestamp) {
			self.postMessage({
				type: MessageType.Frame,
				data: frame,
			});
		}
		frame.close();
	},
	error: (e) => {
		console.error(e);
	},
});

async function demux(blob: Blob) {
	if (!demuxer) throw new Error("Demuxer hasn't been initialized");

	const file = new File([blob], "video.avi");
	await demuxer.load(file);

	const videoDecoderConfig = await demuxer.getVideoDecoderConfig();
	const videoMediaInfo = await demuxer.getMediaInfo();

	console.log(videoDecoderConfig, videoMediaInfo);

	decoder.configure(videoDecoderConfig);

	const frameRate = videoMediaInfo.streams[0].avg_frame_rate;
	frameTime = 1000 / (+frameRate.split("/")[0] / +frameRate.split("/")[1]);

	duration = Math.floor(videoMediaInfo.duration);

	const reader = demuxer
		.readVideoPacket(undefined, undefined, AVSeekFlag.AVSEEK_FLAG_ANY)
		.getReader();

	console.time("Reading Video Chunks");
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		encodedChunks.push(demuxer.genEncodedVideoChunk(value));
	}
	console.timeEnd("Reading Video Chunks");
}

async function readFrame(index: number) {
	if (status === "STOP") {
		// decoder.flush();
		return;
	}

	if (index >= encodedChunks.length) {
		status = "STOP";
		decoder.flush();
		return;
	}

	const chunk = encodedChunks[index];
	decoder.decode(chunk);

	await new Promise((resolve) => {
		setTimeout(() => {
			resolve("");
		}, frameTime);
	});

	try {
		await readFrame(index + 1);
	} catch (e) {
		console.error(e);
	}
}

async function seek(timestamp: number) {
	if (!demuxer) throw new Error("Demuxer hasn't been initialized");

	// console.log(`Seeking at: ${timestamp}`);
	try {
		const index = binarySearch(timestamp * 1000);
		seekToChunk(index);
	} catch (e) {
		console.error(e);
	}
}

function binarySearch(value: number) {
	let start = 0;
	let end = encodedChunks.length - 1;

	while (start < end) {
		const mid = start + Math.floor((end - start) / 2);

		if (encodedChunks[mid].timestamp === value) return mid;
		if (value < encodedChunks[mid].timestamp) {
			end = mid - 1;
			continue;
		}
		if (value > encodedChunks[mid].timestamp) {
			start = mid + 1;
		}
	}

	const pre = encodedChunks[start].timestamp;
	const post = encodedChunks[end].timestamp;

	return Math.abs(value - pre) < Math.abs(value - post) ? start : end;
}

function seekToChunk(index: number) {
	const currentChunk = encodedChunks[index];

	if (currentChunk.type === "key") return index;

	let i = index;
	for (; i > 0 && encodedChunks[i].type !== "key"; i--) {}

	lastChunkTimestamp = encodedChunks[Math.max(0, index - 2)].timestamp;

	for (let j = i; j < index; j++) {
		const chunk = encodedChunks[j];
		decoder.decode(chunk);
	}

	// decoder.decode(encodedChunks[i]);
}

async function play(startTime: number) {
	status = "PLAY";
	const chunkIndex = binarySearch(startTime * 1000);
	try {
		// seekToChunk(chunkIndex);
		// console.log(chunkIndex);
		readFrame(chunkIndex);
	} catch (e) {
		console.error(e);
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

const s = debounce(seek, 200);

self.addEventListener(
	"message",
	(event: {
		data: WorkerPayload;
	}) => {
		switch (event.data.type) {
			case MessageType.Init: {
				demuxer = new WebDemuxer({
					// ⚠️ you need to put the dist/wasm-files file in the npm package into a static directory like public
					// making sure that the js and wasm in wasm-files are in the same directory
					wasmLoaderPath: `${event.data.data}/ffmpeg/ffmpeg.js`,
				});
				break;
			}
			case MessageType.Load: {
				demux(event.data.data);
				break;
			}
			case MessageType.Seek: {
				s(event.data.data);
				break;
			}
			case MessageType.Play: {
				play(event.data.data);
				break;
			}
			case MessageType.Stop: {
				status = "STOP";
				break;
			}
		}
	},
);
