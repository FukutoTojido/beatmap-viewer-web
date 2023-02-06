class BeatmapFile {
    osuFile;
    mapId;
    audioBlobURL;
    backgroundBlobURL;
    audio;
    beatmapRenderData;

    constructor(mapId) {
        this.mapId = mapId;
        this.constructMap();
    }

    async getOsuFile() {
        const rawOsuFile = (await axios.get(`https://tryz.vercel.app/api/b/${this.mapId}/osu`)).data;
        this.osuFile = rawOsuFile;
    }

    async getOsz() {
        const mapsetData = (await axios.get(`https://tryz.vercel.app/api/b/${this.mapId}`)).data;
        const setId = mapsetData.id;

        const mapFileBlob = (
            await axios({
                url: `https://api.chimu.moe/v1/download/${setId}`,
                responseType: "blob",
            })
        ).data;

        await this.getOsuFile();
        const audioFilename = this.osuFile
            .split("\r\n")
            .filter((line) => line.match(/AudioFilename: /g))[0]
            .replace("AudioFilename: ", "");
        const backgroundFilename = this.osuFile
            .split("\r\n")
            .filter((line) => line.match(/0,0,"*.*"/g))[0]
            .match(/[a-zA-Z0-9\s\._-]+\.[a-zA-Z0-9]+/g)[0];

        const mapFileBlobReader = new zip.BlobReader(mapFileBlob);
        const zipReader = new zip.ZipReader(mapFileBlobReader);

        const audioFile = (await zipReader.getEntries()).filter((e) => e.filename === audioFilename).shift();
        const audioBlob = await audioFile.getData(new zip.BlobWriter(`audio/${audioFilename.split(".").at(-1)}`));
        this.audioBlobURL = URL.createObjectURL(audioBlob);

        const backgroundFile = (await zipReader.getEntries()).filter((e) => e.filename === backgroundFilename).shift();
        const backgroundBlob = await backgroundFile.getData(new zip.BlobWriter(`image/${backgroundFilename.split(".").at(-1)}`));
        this.backgroundBlobURL = URL.createObjectURL(backgroundBlob);

        zipReader.close();
    }

    async constructMap() {
        await this.getOsz();
        // console.log(this.osuFile, this.audioBlobURL, this.backgroundBlobURL);

        this.audio = new Audio(this.audioBlobURL);
        this.beatmapRenderData = new Beatmap(this.osuFile, 0);
        document.body.style.backgroundImage = `url(${this.backgroundBlobURL})`;

        document.querySelector("#playButton").addEventListener("click", () => {
            if (isPlaying) {
                this.audio.currentTime = 0;
                this.audio.play();
            }
            this.beatmapRenderData.render();
        });
    }
}
