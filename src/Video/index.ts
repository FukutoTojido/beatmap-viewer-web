import { AVSeekFlag, WebDemuxer } from "web-demuxer";

export default class Video {
	demuxer: WebDemuxer;

	constructor() {
		this.demuxer = new WebDemuxer({
			// ⚠️ you need to put the dist/wasm-files file in the npm package into a static directory like public
			// making sure that the js and wasm in wasm-files are in the same directory
			wasmLoaderPath: `${window.location.origin}/ffmpeg/ffmpeg.js`,
		});
	}

	async load(blob: Blob) {
		const file = new File([blob], "video.avi");
		await this.demuxer.load(file);

		const videoDecoderConfig = await this.demuxer.getVideoDecoderConfig();
		const videoMediaInfo = await this.demuxer.getMediaInfo();
		const videoChunk = await this.demuxer.seekEncodedVideoChunk(0);

		console.log(videoDecoderConfig, videoMediaInfo, videoChunk);
	}
}
