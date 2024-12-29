import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { BackgroundLoader } from "./BackgroundLoader.js";

export class Transcoder {
    static ffmpeg = new FFmpeg();

    static {
        // this.ffmpeg.on("log", ({ message }) => {
        //     console.log(message);
        // });

        this.ffmpeg.on("progress", ({ progress, time }) => {
            document.querySelector("#loadingText").textContent = `Transcoding video to mp4 using FFmpeg: ${(progress * 100).toFixed(2)}%`;
        });
    }
    static loader = new BackgroundLoader(async () => {
        if (navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
            return;
        }

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

        // fixme: disabled this message for now as it doesn't make that much sense now that it loads in the background,
        //  perhaps it should only show when ensureLoaded is called?
        // document.querySelector("#loadingText").textContent = `Loading FFmpeg\nMight take a while on first load.`;
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
    })


    static loadInBackground() {
        this.loader.loadInBackground()
    }

    static async ensureLoaded() {
        return this.loader.load()
    }

    static async transcode({ blob, ext }) {
        await this.ensureLoaded();

        if (navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) {
            return URL.createObjectURL(blob);
        }

        await this.ffmpeg.writeFile(`input.${ext}`, await fetchFile(blob));
        await this.ffmpeg.exec(["-i", `input.${ext}`, "-c", "copy", `output.mp4`]);
        const data = await this.ffmpeg.readFile("output.mp4");

        return URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    }
}
