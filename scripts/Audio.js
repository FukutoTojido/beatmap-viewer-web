class Audio {
    audioObj;

    constructor(src) {
        const audio = document.createElement("audio");
        audio.src = src;
        audio.volume = 0.1;
        audio.mute = "true";
        audio.playbackRate = playbackRate;

        this.audioObj = audio;
        document.body.appendChild(this.audioObj);
    }

    play() {
        this.audioObj.play();
    }
}
