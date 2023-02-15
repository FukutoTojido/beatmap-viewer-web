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
        document.querySelector("#artistTitle").innerHTML = `${mapsetData.artist} - ${mapsetData.title}`;
        document.querySelector("#versionCreator").innerHTML = `Difficulty: <span>${
            mapsetData.beatmaps.find((map) => map.id == this.mapId).version
        }</span> - Mapset by <span>${mapsetData.creator}</span>`;
        const setId = mapsetData.id;

        const requestClient = axios.create({
            // baseURL: `https://txy1.sayobot.cn/beatmaps/download/full/`,
            // baseURL: `https://chimu.moe/d/`,
            baseURL: `https://subapi.nerinyan.moe/d/`,
            params: { nv: 1, nh: 1, nsb: 1 },
        });
        const mapFileBlob = (
            await requestClient.get(`${setId}?server=auto`, {
                responseType: "blob",
                onDownloadProgress: (progressEvent) => {
                    document.querySelector("#loadingText").innerText = `Loading: ${(progressEvent.progress * 100).toFixed(2)}%`;
                    // console.log(progressEvent);
                },
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
            .match(/"[\+\/\\\!\(\)\[\]\{\}a-zA-Z0-9\s\._-]+\.[a-zA-Z0-9]+"/g)[0]
            .replaceAll('"', "");

        console.log(audioFilename, backgroundFilename);

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
        try {
            document.querySelector(".loading").style.display = "";
            document.querySelector(".loading").style.opacity = 1;
            await this.getOsz();
            // console.log(this.osuFile, this.audioBlobURL, this.backgroundBlobURL);

            document.querySelector("#loadingText").innerText = `Setting up Audio`;
            this.audio = new Audio(this.audioBlobURL);
            document.querySelector("#loadingText").innerText = `Setting up HitObjects`;
            this.beatmapRenderData = new Beatmap(this.osuFile, 0);
            document.querySelector("#playerContainer").style.backgroundImage = `url(${this.backgroundBlobURL})`;
            document.body.style.backgroundImage = `url(${this.backgroundBlobURL})`;

            document.querySelector(".loading").style.opacity = 0;
            document.querySelector(".loading").style.display = "none";

            // document.querySelector("#playButton").addEventListener("click", playToggle);

            document.onkeydown = (e) => {
                if (!isPlaying) {
                    e = e || window.event;
                    switch (e.key) {
                        case "ArrowLeft":
                            // Left pressed
                            debugPosition -= 1;
                            // console.log("->");
                            break;
                        case "ArrowRight":
                            // Right pressed
                            debugPosition += 1;
                            // console.log("<-");
                            break;
                    }

                    this.beatmapRenderData.render();
                } else {
                    e = e || window.event;
                    switch (e.key) {
                        case "ArrowLeft":
                            // Left pressed
                            document.querySelector("audio").currentTime -= 10 / 1000;
                            document.querySelector("#progress").value = document.querySelector("audio").currentTime * 10;
                            setAudioTime();
                            // console.log(document.querySelector("#progress").value);
                            // console.log("->");
                            break;
                        case "ArrowRight":
                            // Right pressed
                            document.querySelector("audio").currentTime += 10 / 1000;
                            document.querySelector("#progress").value = document.querySelector("audio").currentTime * 10;
                            setAudioTime();
                            // console.log(document.querySelector("#progress").value);
                            // console.log("<-");
                            break;
                        case " ":
                            playToggle();
                            break;
                    }
                }
            };

            this.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
        } catch (err) {
            console.log(err);
        }
    }
}
