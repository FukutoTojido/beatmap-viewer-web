import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

export class Transcoder {
    static ffmpeg = new FFmpeg();

    static async load() {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

        // this.ffmpeg.on("log", ({ message }) => {
        //     console.log(message);
        // });

        this.ffmpeg.on("progress", ({ progress, time }) => {
            document.querySelector("#loadingText").textContent = `Transcoding video to mp4 using FFmpeg: ${(progress * 100).toFixed(2)}%`;
        });

        document.querySelector("#loadingText").textContent = `Loading FFmpeg\nMight take a while on first load.`;
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
    }

    static async transcode({ blob, ext }) {
        await this.ffmpeg.writeFile(`input.${ext}`, await fetchFile(blob));
        await this.ffmpeg.exec(["-i", `input.${ext}`, "-c", "copy", `output.mp4`]);
        const data = await this.ffmpeg.readFile("output.mp4");

        return URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    }
}
