import { Game } from "./Game";

export class Recorder {
    static IS_RECORDING = false;
    static CURRENT_RECORDER = null;

    static record() {
        if (!Game.BEATMAP_FILE) return;
        if (this.IS_RECORDING) {
            this.CURRENT_RECORDER.stop();
            this.IS_RECORDING = false;
            return;
        }

        this.IS_RECORDING = true;

        const canvas = Game.APP.canvas;
        const videoStream = canvas.captureStream(165);
        const audioStream = Game.AUDIO_CTX.createMediaStreamDestination().stream;
        
        const videoTrack = videoStream.getVideoTracks()[0];
        const audioTrack = audioStream.getAudioTracks()[0];

        if (!videoTrack || !audioTrack) return;

        // videoStream.addTrack(audioTrack);

        const mediaRecorder = new MediaRecorder(videoStream, {
            mimeType: "video/webm",
            videoBitsPerSecond: 60_000_000
        });
        this.CURRENT_RECORDER = mediaRecorder;
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
            console.log("A");
        };

        mediaRecorder.onstop = (event) => {
            const blob = new Blob(chunks, { type: "video/webm;" });
            console.log(chunks);
            chunks.length = 0;

            const videoURL = URL.createObjectURL(blob);
            console.log(videoURL);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = true;
            a.click();
        };

        console.log("Record started!");

        mediaRecorder.start();
    }
}

// document.querySelector("#record")?.onclick = () => {
//     Recorder.record();
// };
