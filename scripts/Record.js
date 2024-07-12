import { Game } from "./Game";
import { ArrayBufferTarget, Muxer as WebMMuxer, FileSystemWritableFileStreamTarget } from "webm-muxer";

export class Recorder {
    static IS_RECORDING = false;
    static CURRENT_RECORDER = null;
    static RESOLVE = null;

    static async record() {
        if (!Game.BEATMAP_FILE) return;

        // const fileHandle = await window.showSaveFilePicker({
        //     suggestedName: `video.webm`,
        //     types: [
        //         {
        //             description: "Video File",
        //             accept: { "video/webm": [".webm"] },
        //         },
        //     ],
        // });

        // const fileWritableStream = await fileHandle.createWritable();

        const encoded = () => {
            return new Promise((resolve) => Recorder.RESOLVE = resolve);
        }

        const muxer = new WebMMuxer({
            target: new ArrayBufferTarget(),
            video: {
                codec: "V_VP9",
                width: Game.APP.renderer.width,
                height: Game.APP.renderer.height,
                frameRate: 60,
            },
        });

        let i = 0;
        let temp_i = -1;
        const queue = [];

        let videoEncoder = new VideoEncoder({
            output: (chunk, meta) => {
                const res = muxer.addVideoChunk(chunk, meta, queue.shift() * (1000 / 60) * 1000);
                // Recorder.RESOLVE?.();
                return res;
            },
            error: (e) => console.error(e),
        });

        videoEncoder.configure({
            codec: "vp09.00.10.08",
            width: Game.APP.renderer.width,
            height: Game.APP.renderer.height,
            bitrate: 5000000,
            bitrateMode: "constant",
        });

        async function encodeFrame(data) {
            const keyFrame = i % 60 === 0;
            videoEncoder.encode(data, { keyFrame });
        }

        async function finishEncoding() {
            await videoEncoder.flush();
            muxer.finalize();
            reader.releaseLock();

            console.log(muxer.target);
            Recorder.RESOLVE = null;

            const buffer = muxer.target.buffer;
            const blob = new Blob([buffer], { type: "video/webm"});
            console.log(URL.createObjectURL(blob));
            // await fileWritableStream.close();
        }

        // if (this.IS_RECORDING) {
        //     this.CURRENT_RECORDER.stop();
        //     this.IS_RECORDING = false;
        //     return;
        // }

        // this.IS_RECORDING = true;

        const canvas = Game.APP.canvas;
        const videoStream = canvas.captureStream(0);
        const videoTrack = videoStream.getVideoTracks()[0];

        const mediaProcessor = new MediaStreamTrackProcessor(videoTrack);
        const reader = mediaProcessor.readable.getReader();

        const render = async () => {
            try {
                Game.BEATMAP_FILE.audioNode.seekTo(i * (1000 / 60));
                videoTrack.requestFrame();

                // console.log(`capturing frame ${i}`);

                const result = await reader.read();
                const frame = result.value;

                await encodeFrame(frame);
                // await encoded();

                frame.close();
                queue.push(i);
                i++;
            } catch (error) {
                throw error;
            }
        };

        while (i < 600) {
            try {
                await render();
            } catch (error) {
                console.error(error);
                break;
            }
        }

        finishEncoding();

        // const audioStream = Game.AUDIO_CTX.createMediaStreamDestination().stream;
        // const audioTrack = audioStream.getAudioTracks()[0];

        // if (!videoTrack || !audioTrack) return;

        // // videoStream.addTrack(audioTrack);

        // const mediaRecorder = new MediaRecorder(videoStream, {
        //     mimeType: "video/webm",
        //     videoBitsPerSecond: 60_000_000
        // });
        // this.CURRENT_RECORDER = mediaRecorder;
        // const chunks = [];

        // mediaRecorder.ondataavailable = (event) => {
        //     chunks.push(event.data);
        //     console.log("A");
        // };

        // mediaRecorder.onstop = (event) => {
        //     const blob = new Blob(chunks, { type: "video/webm;" });
        //     console.log(chunks);
        //     chunks.length = 0;

        //     const videoURL = URL.createObjectURL(blob);
        //     console.log(videoURL);

        //     const a = document.createElement("a");
        //     a.href = videoURL;
        //     a.download = true;
        //     a.click();
        // };

        // console.log("Record started!");

        // mediaRecorder.start();
    }
}

// document.querySelector("#record").onclick = () => {
//     Recorder.record();
// };
