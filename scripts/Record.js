document.querySelector("#record")?.addEventListener("click", () => {
    if (!Game.BEATMAP_FILE) return;

    const canvas = Game.APP.canvas;
    const videoStream = canvas.captureStream(0);

    if (!videoStream.getVideoTracks()[0]) return;

    const mediaRecorder = new MediaRecorder(videoStream);
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
    };

    mediaRecorder.onstop = (event) => {
        const blob = new Blob(chunks, { type: "video/webm; codecs=vp9", videoBitsPerSecond: 4000000 });
        console.log(chunks);
        chunks.length = 0;

        const videoURL = URL.createObjectURL(blob);
        console.log(videoURL);

        const a = document.createElement("a");
        a.href = videoURL;
        a.download = true;
        a.click();
    };

    console.log("Record started! Please wait");

    const callDraw = (time) => {
        if (time > Game.BEATMAP_FILE.audioNode.buf.duration * 1000) {
            mediaRecorder.stop();
            return;
        }

        Game.BEATMAP_FILE.beatmapRenderData.objectsController.draw(Math.round(time), true);
        videoStream.getVideoTracks()[0].requestFrame();

        window.requestAnimationFrame(() => {
            return callDraw(time + 100 / 6);
        });
    };

    mediaRecorder.start();
    window.requestAnimationFrame(() => {
        return callDraw(0);
    });
});
