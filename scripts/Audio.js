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
            beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
        };

        this.audioObj = audio;
        document.body.appendChild(this.audioObj);
    }

    play() {
        this.audioObj.play();
    }
}
