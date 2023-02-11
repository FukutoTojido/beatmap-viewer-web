class Audio {
    audioObj;

    constructor(src) {
        const audio = document.createElement("audio");
        audio.src = src;
        audio.volume = 0.1;
        audio.mute = "true";
        audio.playbackRate = playbackRate;
        audio.currentTime = 0.001;
        audio.onended = () => {
            audio.currentTime = 0.001;
            document.querySelector("#playButton").style.backgroundImage = "";

            playingFlag = false;
        };

        audio.onpause = () => {
            document.querySelector("#playButton").style.backgroundImage = "";
            if (beatmapFile.beatmapRenderData === undefined) return;
            if (beatmapFile !== undefined || beatmapFile.beatmapRenderData !== undefined)
                beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
        };

        this.audioObj = audio;
        document.body.appendChild(this.audioObj);
    }

    play() {
        this.audioObj.play();
    }
}
