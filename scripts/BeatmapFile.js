class BeatmapFile {
    osuFile;
    mapId;
    audioBlobURL;
    backgroundBlobURL;
    audio;
    audioArrayBuffer;
    audioNode;
    beatmapRenderData;
    hitsoundList = [];
    title;
    artist;
    diff;

    constructor(mapId) {
        this.mapId = mapId;
        this.constructMap();
    }

    async getOsuFile() {
        const rawOsuFile = (await axios.get(`https://tryz.vercel.app/api/b/${this.mapId}/osu`)).data;
        this.osuFile = rawOsuFile;
    }

    async readBlobAsBuffer(blob) {
        const res = await new Promise((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = (event) => resolve(fileReader.result);
            fileReader.readAsArrayBuffer(blob);
        });

        // console.log(res);
        return res;
    }

    async getOsz() {
        const mapsetData = (await axios.get(`https://tryz.vercel.app/api/b/${this.mapId}`)).data;
        this.artist = mapsetData.artist_unicode;
        this.title = mapsetData.title_unicode;
        this.diff = mapsetData.beatmaps.filter((diff) => diff.id === parseInt(this.mapId))[0].version;

        document.title = `${this.artist} - ${this.title} [${this.diff}] | JoSu!`;

        // console.log(mapsetData.beatmaps.filter((diff) => diff.id === parseInt(this.mapId)));

        if (mapsetData.beatmaps.filter((diff) => diff.id === parseInt(this.mapId))[0].mode !== "osu") {
            throw new Error("Not a standard map!");
        }

        document.querySelector("#artistTitle").innerHTML = `${mapsetData.artist} - ${mapsetData.title}`;
        document.querySelector("#versionCreator").innerHTML = `Difficulty: <span>${
            mapsetData.beatmaps.find((map) => map.id == this.mapId).version
        }</span> - Mapset by <span>${mapsetData.creator}</span>`;
        const setId = mapsetData.id;

        const requestClient = axios.create({
            // baseURL: `https://txy1.sayobot.cn/beatmaps/download/full/`,
            // baseURL: `https://chimu.moe/d/`,
            // baseURL: `https://subapi.nerinyan.moe/d/`,
            baseURL: `https://proxy.nerinyan.moe/d/`,
            // params: { nv: 1, nh: 0, nsb: 1 },
        });
        const mapFileBlob = (
            await requestClient.get(`${setId}?server=auto`, {
                responseType: "blob",
                onDownloadProgress: (progressEvent) => {
                    document.querySelector("#loadingText").innerText = `Downloading map: ${(progressEvent.progress * 100).toFixed(2)}%`;
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
            .match(/"[;\+\/\\\!\(\)\[\]\{\}\&a-zA-Z0-9\s\._-]+\.[a-zA-Z0-9]+"/g)[0]
            .replaceAll('"', "");

        console.log(audioFilename, backgroundFilename);

        const mapFileBlobReader = new zip.BlobReader(mapFileBlob);
        const zipReader = new zip.ZipReader(mapFileBlobReader);
        const allEntries = await zipReader.getEntries();
        // console.log(allEntries);

        document.querySelector("#loadingText").innerHTML = `Setting up Audio<br>Might take long if the audio file is large`;
        const audioFile = allEntries.filter((e) => e.filename === audioFilename).shift();
        const audioBlob = await audioFile.getData(new zip.BlobWriter(`audio/${audioFilename.split(".").at(-1)}`));
        // console.log("Audio Blob Generated");
        this.audioBlobURL = URL.createObjectURL(audioBlob);
        const audioArrayBuffer = await this.readBlobAsBuffer(audioBlob);
        console.log("Audio Loaded");

        const hitsoundFiles = allEntries.filter((file) => {
            console.log(file.filename);
            return /(normal|soft|drum)-(hitnormal|hitwhistle|hitclap|hitfinish)([1-9][0-9]*)?/.test(file.filename);
        });

        const hitsoundArrayBuffer = [];
        document.querySelector("#loadingText").innerHTML = `Setting up Hitsounds<br>Might take long if there are many hitsound files`;
        for (const file of hitsoundFiles) {
            const writer = new zip.BlobWriter(`audio/${file.filename.split(".").at(-1)}`);
            const fileBlob = await file.getData(writer);
            // console.log(`Hitsound ${file.filename} Blob Generated`);
            const fileArrayBuffer = await this.readBlobAsBuffer(fileBlob);
            // console.log(`Hitsound ${file.filename} ArrayBuffer Generated`);

            hitsoundArrayBuffer.push({
                filename: file.filename,
                buf: fileArrayBuffer,
            });
        }

        this.hitsoundList = hitsoundArrayBuffer;
        console.log("Hitsound Loaded");

        // document.querySelector(
        //     "#loadingText"
        // ).innerHTML = `Setting up Background<br>In case this takes too long, please refresh the page. I'm having issue with files not being able to read randomly`;
        const backgroundFile = allEntries.filter((e) => e.filename === backgroundFilename).shift();
        if (backgroundFile) {
            backgroundFile.getData(new zip.BlobWriter(`image/${backgroundFilename.split(".").at(-1)}`)).then((data) => {
                // console.log("Background Blob Generated");
                this.backgroundBlobURL = URL.createObjectURL(data);
                console.log("Background Loaded");
                document.querySelector("#background").style.backgroundImage = `url(${this.backgroundBlobURL})`;
                document.body.style.backgroundImage = `url(${this.backgroundBlobURL})`;
            });
        }

        zipReader.close();
        document.querySelector("#loadingText").innerHTML = `Map data loaded`;
        console.log("Get .osz completed");
        return audioArrayBuffer;
    }

    async loadHitsounds() {
        for (const sampleset of ["normal", "soft", "drum"]) {
            for (const hs of ["hitnormal", "hitwhistle", "hitfinish", "hitclap"]) {
                await loadSampleSound(`${sampleset}-${hs}`, 0);
            }
        }

        for (const hs of this.hitsoundList) {
            // console.log(hs);
            const idx = hs.filename
                .replace(hs.filename.match(/normal|soft|drum/)[0], "")
                .replaceAll(hs.filename.match(/hitnormal|hitwhistle|hitfinish|hitclap/), "")
                .replace("-", "")
                .split(".")[0];

            // console.log(hs.filename.split(".")[0].replaceAll(`${idx}`, ""), idx);

            await loadSampleSound(hs.filename.split(".")[0].replaceAll(`${idx}`, ""), idx === "" ? 1 : parseInt(idx), hs.buf);
        }

        // console.log(hitsoundsBuffer);

        // ["normal", "soft", "drum"].forEach((sampleset) => {
        //     ["hitnormal", "hitwhistle", "hitfinish", "hitclap"].forEach((hs) => {
        //         const src = audioCtx.createBufferSource();
        //         src.buffer = hitsoundsBuffer[`${sampleset}-${hs}`];

        //         // defaultHitsoundsList[`${sampleset}-${hs}`] = src;
        //     });
        // });

        // console.log(defaultHitsoundsList);
    }

    async constructMap() {
        try {
            app.stage.removeChild(container);
            container = new Container();
            app.stage.addChild(container);
            container.x = offsetX;
            container.y = offsetY;

            currentMapId = this.mapId;
            audioCtx = new AudioContext();
            document.querySelector(".loading").style.display = "";
            document.querySelector(".loading").style.opacity = 1;
            const audioArrayBuffer = await this.getOsz();
            this.audioArrayBuffer = audioArrayBuffer;
            // console.log(this.audioArrayBuffer, audioArrayBuffer);
            this.audioNode = new PAudio(audioArrayBuffer);
            await this.loadHitsounds();
            // console.log(this.osuFile, this.audioBlobURL, this.backgroundBlobURL);

            // this.audio = new Audio(this.audioBlobURL);

            document.querySelector("#loadingText").innerText = `Setting up HitObjects`;
            this.beatmapRenderData = new Beatmap(this.osuFile, 0);

            document.querySelector(".loading").style.opacity = 0;
            document.querySelector(".loading").style.display = "none";

            document.querySelector("#loadingText").innerText = `Getting map data`;

            // document.querySelector("#playButton").addEventListener("click", playToggle);

            document.onkeydown = (e) => {
                e = e || window.event;
                switch (e.key) {
                    case "ArrowLeft":
                        // Left pressed
                        goBack(e.shiftKey);
                        break;
                    case "ArrowRight":
                        // Right pressed
                        goNext(e.shiftKey);
                        break;
                    case " ":
                        playToggle();
                        break;
                }

                if (e.key === "c" && e.ctrlKey) {
                    // console.log("Copied");
                    if (selectedHitObject.length) {
                        const objs = this.beatmapRenderData.objectsList.objectsList.filter((o) => selectedHitObject.includes(o.time));
                        const obj = objs.reduce((prev, curr) => (prev.time > curr.time ? curr : prev));
                        const currentMiliseconds = Math.floor(obj.time % 1000)
                            .toString()
                            .padStart(3, "0");
                        const currentSeconds = Math.floor((obj.time / 1000) % 60)
                            .toString()
                            .padStart(2, "0");
                        const currentMinute = Math.floor(obj.time / 1000 / 60)
                            .toString()
                            .padStart(2, "0");

                        navigator.clipboard.writeText(
                            `${currentMinute}:${currentSeconds}:${currentMiliseconds} (${objs.map((o) => o.comboIdx).join(",")}) - `
                        );
                    }
                }
            };

            if (urlParams.get("b") === currentMapId && urlParams.get("t") && /[0-9]+/g.test(urlParams.get("t"))) {
                updateTime(parseInt(urlParams.get("t")));
                this.beatmapRenderData.objectsList.draw(parseInt(urlParams.get("t")), true);
            } else {
                this.beatmapRenderData.objectsList.draw(this.audioNode.getCurrentTime(), true);
            }

            // canvas.addEventListener("mousedown", (event) => {
            //     isDragging = true;
            //     draggingStartTime = this.audioNode.getCurrentTime();

            //     startX = event.clientX;
            //     startY = event.clientY;

            //     window.requestAnimationFrame((currentTime) => {
            //         return drawStatic();
            //     });
            // });

            // canvas.addEventListener("mouseup", (event) => {
            //     if (currentX !== -1 && currentY !== -1) {
            //         handleCanvasDrag();
            //         // console.log(selectedHitObject);
            //         // console.log(startX, startY, currentX, currentY);
            //     }
            //     // currentX = -1;
            //     // currentY = -1;
            //     isDragging = false;
            // });

            // canvas.addEventListener("mousemove", (event) => {
            //     if (isDragging) {
            //         draggingEndTime = this.audioNode.getCurrentTime();

            //         currentX = event.clientX;
            //         currentY = event.clientY;

            //         handleCanvasDrag();
            //         // console.log(startX, startY, currentX, currentY);
            //     }
            // });

            document.querySelector("#playerContainer").addEventListener(
                "wheel",
                (event) => {
                    // event.preventDefault();

                    if (isDragging && currentX !== -1 && currentY !== -1) {
                        draggingEndTime = this.audioNode.getCurrentTime();
                        handleCanvasDrag();
                    }

                    if (event.deltaY > 0) goNext(event.shiftKey);
                    if (event.deltaY < 0) goBack(event.shiftKey);

                    // console.log("Scrolled");
                },
                {
                    capture: true,
                    passive: true,
                }
            );
        } catch (err) {
            alert(err);
            console.log(err);

            document.querySelector(".loading").style.opacity = 0;
            document.querySelector(".loading").style.display = "none";
        }
    }
}
