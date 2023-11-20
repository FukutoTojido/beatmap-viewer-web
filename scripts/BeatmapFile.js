async function showSelector() {}

class BeatmapFile {
    isFromFile = false;
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
    md5Map;
    isLoaded = false;

    constructor(mapId, isFromFile) {
        this.mapId = mapId;
        this.isFromFile = isFromFile;
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

    async downloadOsz(setId) {
        try {
            const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
            const selectedMirror = currentLocalStorage.mirror.val;
            const customURL = document.querySelector("#custom-mirror").value;

            const urls = {
                nerinyan: "https://api.nerinyan.moe/d/",
                sayobot: "https://dl.sayobot.cn/beatmaps/download/novideo/",
                chimu: "https://chimu.moe/d/",
            };

            if (!urls[selectedMirror] && customURL === "") throw "You need a beatmap mirror download link first!";

            const requestClient = axios.create({
                // baseURL: `https://txy1.sayobot.cn/beatmaps/download/full/`,
                // baseURL: `https://chimu.moe/d/`,
                // baseURL: `https://subapi.nerinyan.moe/d/`,
                // baseURL: `https://proxy.nerinyan.moe/d/`,
                baseURL: urls[selectedMirror] ?? customURL,
                // params: { nv: 1, nh: 0, nsb: 1 },
            });

            // const blob = (
            //     await requestClient.get(`${setId}`, {
            //         responseType: "blob",
            //         onDownloadProgress: (progressEvent) => {
            //             document.querySelector("#loadingText").innerText = `Downloading map: ${(progressEvent.progress * 100).toFixed(2)}%`;
            //             // console.log(progressEvent);
            //         },
            //     })
            // ).data;

            const rawData = await ky.get(`${setId}/`, {
                prefixUrl: urls[selectedMirror] ?? customURL,
                onDownloadProgress: (progressEvent) => {
                    document.querySelector("#loadingText").innerText = `Downloading map: ${(progressEvent.percent * 100).toFixed(2)}%`;
                    // console.log(progressEvent);
                },
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS, POST, HEAD",
                },
            });

            // const rawData = await fetch(`${urls[selectedMirror] ?? customURL}${setId}`, {
            //     // onDownloadProgress: (progressEvent) => {
            //     //     document.querySelector("#loadingText").innerText = `Downloading map: ${(progressEvent.percent * 100).toFixed(2)}%`;
            //     //     // console.log(progressEvent);
            //     // },
            //     mode: "no-cors",
            // });

            const blob = await rawData.blob();

            // console.log(rawData, blob, `${urls[selectedMirror] ?? customURL}${setId}`);

            dropBlob = blob;
            return blob;
        } catch (e) {
            // return;
            console.log(e);
            throw "This map is not available on the selected beatmap provider\nPlease open the settings to choose another one.";
        }
    }

    async getOsz() {
        let mapsetData;
        if (!this.isFromFile) {
            mapsetData = (await axios.get(`https://tryz.vercel.app/api/b/${this.mapId}`)).data;
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
        }

        const setId = mapsetData?.id;

        const mapFileBlob = !this.isFromFile ? await this.downloadOsz(setId) : dropBlob;
        const mapFileBlobReader = new zip.BlobReader(mapFileBlob);
        const zipReader = new zip.ZipReader(mapFileBlobReader);
        const allEntries = await zipReader.getEntries();

        if (!this.isFromFile) {
            await this.getOsuFile();
            const diffList = document.querySelector(".difficultyList");
            diffList.innerHTML = "";
            // document.querySelector(".difficultySelector").style.display = "block";

            const diffs = [];

            for (const content of allEntries) {
                if (content.filename.split(".").at(-1) !== "osu") continue;
                const blob = await content.getData(new zip.BlobWriter("text/plain"));
                const rawFile = await blob.text();

                const mode = rawFile
                    .split("\r\n")
                    .filter((line) => /Mode:\s[0-9]+/g.test(line))
                    .shift()
                    ?.replace("Mode: ", "");
                if (parseInt(mode) !== 0) continue;

                const builderOptions = {
                    addStacking: true,
                    mods: [],
                };
                const blueprintData = osuPerformance.parseBlueprint(rawFile);
                const beatmapData = osuPerformance.buildBeatmap(blueprintData, builderOptions);
                const difficultyAttributes = osuPerformance.calculateDifficultyAttributes(beatmapData, true)[0];

                const diffName = rawFile
                    .split("\r\n")
                    .filter((line) => /Version:.+/g.test(line))
                    .shift()
                    ?.replace("Version:", "");

                const ele = createDifficultyElement({
                    name: diffName,
                    fileName: content.filename,
                    starRating: difficultyAttributes.starRating,
                });

                diffs.push(ele);
            }

            diffs.sort((a, b) => {
                return -a.starRating + b.starRating;
            });

            for (const obj of diffs) diffList.appendChild(obj.ele);
        } else {
            const map = allEntries.filter((e) => e.filename === diffFileName).shift();
            const blob = await map.getData(new zip.BlobWriter("text/plain"));
            this.osuFile = await blob.text();

            const splitted = this.osuFile.split("\r\n");

            const artist = splitted
                .filter((line) => /Artist:.+/g.test(line))
                .shift()
                ?.replace("Artist:", "");
            const artistUnicode = splitted
                .filter((line) => /ArtistUnicode:.+/g.test(line))
                .shift()
                ?.replace("ArtistUnicode:", "");
            const title = splitted
                .filter((line) => /Title:.+/g.test(line))
                .shift()
                ?.replace("Title:", "");
            const titleUnicode = splitted
                .filter((line) => /TitleUnicode:.+/g.test(line))
                .shift()
                ?.replace("TitleUnicode:", "");
            const creator = splitted
                .filter((line) => /Creator:.+/g.test(line))
                .shift()
                ?.replace("Creator:", "");
            const version = splitted
                .filter((line) => /Version:.+/g.test(line))
                .shift()
                ?.replace("Version:", "");

            document.querySelector("#artistTitle").innerHTML = `${artist} - ${title}`;
            document.querySelector("#versionCreator").innerHTML = `Difficulty: <span>${version}</span> - Mapset by <span>${creator}</span>`;
            document.title = `${artistUnicode} - ${titleUnicode} [${version}] | JoSu!`;
        }

        const modsTemplate = ["HARD_ROCK", "EASY", "DOUBLE_TIME", "HALF_TIME"];

        const modsFlag = [mods.HR, mods.EZ, mods.DT, mods.HT];

        const builderOptions = {
            addStacking: true,
            mods: modsTemplate.filter((mod, idx) => modsFlag[idx]),
        };
        const blueprintData = osuPerformance.parseBlueprint(this.osuFile);
        const beatmapData = osuPerformance.buildBeatmap(blueprintData, builderOptions);
        const difficultyAttributes = osuPerformance.calculateDifficultyAttributes(beatmapData, true)[0];

        document.querySelector("#CS").innerText = round(beatmapData.difficulty.circleSize);
        document.querySelector("#AR").innerText = round(beatmapData.difficulty.approachRate);
        document.querySelector("#OD").innerText = round(beatmapData.difficulty.overallDifficulty);
        document.querySelector("#HP").innerText = round(beatmapData.difficulty.drainRate);
        document.querySelector("#SR").innerText = `${round(difficultyAttributes.starRating)}★`;
        document.querySelector("#SR").style.backgroundColor = getDiffColor(difficultyAttributes.starRating);

        if (difficultyAttributes.starRating >= 6.5) document.querySelector("#SR").style.color = "hsl(45deg, 100%, 70%)";
        else document.querySelector("#SR").style.color = "black";

        // console.log(beatmapData)
        // console.log(difficultyAttributes)

        const audioFilename = this.osuFile
            .split("\r\n")
            .filter((line) => line.match(/AudioFilename: /g))[0]
            .replace("AudioFilename: ", "");
        const backgroundFilename = this.osuFile
            .split("\r\n")
            .filter((line) => line.match(/0,0,"*.*"/g))
            .shift()
            ?.match(/"[;\+\/\\\!\(\)\[\]\{\}\&a-zA-Z0-9\s\._-]+\.[a-zA-Z0-9]+"/g)[0]
            .replaceAll('"', "");

        console.log(audioFilename, backgroundFilename);
        // console.log(allEntries);

        document.querySelector("#loadingText").innerHTML = `Setting up Audio<br>Might take long if the audio file is large`;
        const audioFile = allEntries.filter((e) => e.filename === audioFilename).shift();

        if (!audioFile) {
            throw "This map has no audio file";
        }

        const audioBlob = await audioFile.getData(new zip.BlobWriter(`audio/${audioFilename.split(".").at(-1)}`));
        // console.log("Audio Blob Generated");
        this.audioBlobURL = URL.createObjectURL(audioBlob);
        const audioArrayBuffer = await this.readBlobAsBuffer(audioBlob);
        console.log("Audio Loaded");

        const backgroundFile = allEntries.filter((e) => e.filename === backgroundFilename).shift();
        if (backgroundFile) {
            const data = await backgroundFile.getData(new zip.BlobWriter(`image/${backgroundFilename.split(".").at(-1)}`));

            // console.log("Background Blob Generated");
            this.backgroundBlobURL = URL.createObjectURL(data);
            console.log("Background Loaded");
            document.querySelector("#background").style.backgroundImage = `url(${this.backgroundBlobURL})`;
            document.body.style.backgroundImage = `url(${this.backgroundBlobURL})`;

            const bg = new Image();
            bg.src = this.backgroundBlobURL;

            if (bg.complete) {
                loadColorPalette(bg);
            } else {
                bg.addEventListener("load", () => loadColorPalette(bg));
            }
        }

        const hitsoundFiles = allEntries.filter((file) => {
            // console.log(file.filename);
            return /(normal|soft|drum)-(hitnormal|hitwhistle|hitclap|hitfinish)([1-9][0-9]*)?/.test(file.filename);
        });

        // console.log(hitsoundFiles);

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

        zipReader.close();
        document.querySelector("#loadingText").innerHTML = `Setting up HitObjects`;
        console.log("Get .osz completed");
        return audioArrayBuffer;
    }

    async loadHitsounds() {
        HitSample.SAMPLES.MAP = {};
        for (const hs of this.hitsoundList) {
            const idx = hs.filename
                .replace(hs.filename.match(/normal|soft|drum/)[0], "")
                .replaceAll(hs.filename.match(/hitnormal|hitwhistle|hitfinish|hitclap/), "")
                .replace("-", "")
                .split(".")[0];

            await loadSampleSound(hs.filename.split(".")[0].replaceAll(`${idx}`, ""), idx === "" ? 1 : parseInt(idx), hs.buf);
        }
    }

    async constructMap() {
        try {
            const removedChildren = Game.CONTAINER.removeChildren();
            removedChildren.forEach((ele) => ele.destroy());

            currentMapId = this.mapId;
            // audioCtx = new AudioContext();
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
            this.md5Map = CryptoJS.MD5(this.osuFile).toString();
            this.beatmapRenderData = new Beatmap(this.osuFile, 0);

            document.querySelector(".loading").style.opacity = 0;
            document.querySelector(".loading").style.display = "none";

            document.querySelector("#loadingText").innerText = `Getting map data`;

            document.querySelector("#choose-diff").disabled = false;
            document.querySelector("#close").disabled = false;

            if (ScoreParser.REPLAY_DATA && ScoreParser.REPLAY_DATA.md5map !== this.md5Map) {
                ScoreParser.reset();
            }

            // document.querySelector("#playButton").addEventListener("click", playToggle);

            if (ScoreParser.CURSOR_DATA) {
                ScoreParser.eval();
                document.querySelector("#HD").disabled = true;
                document.querySelector("#HR").disabled = true;
                document.querySelector("#DT").disabled = true;
                document.querySelector("#EZ").disabled = true;
                document.querySelector("#HT").disabled = true;

                calculateCurrentSR([mods.HR, mods.EZ, mods.DT, mods.HT]);
            } else {
                document.querySelector("#HD").disabled = false;
                document.querySelector("#HR").disabled = false;
                document.querySelector("#DT").disabled = false;
                document.querySelector("#EZ").disabled = false;
                document.querySelector("#HT").disabled = false;

                document.querySelector("#HD").checked = false;
                document.querySelector("#HR").checked = false;
                document.querySelector("#DT").checked = false;
                document.querySelector("#EZ").checked = false;
                document.querySelector("#HT").checked = false;
            }

            document.onkeydown = (e) => {
                e = e || window.event;
                switch (e.key) {
                    case "ArrowLeft":
                        // Left pressed
                        go(e.shiftKey, false);
                        break;
                    case "ArrowRight":
                        // Right pressed
                        go(e.shiftKey, true);
                        break;
                    case " ":
                        if (document.querySelector(".difficultySelector").style.display !== "block") playToggle();
                        break;
                }

                if (e.key === "c" && e.ctrlKey) {
                    // console.log("Copied");
                    if (selectedHitObject.length) {
                        const objs = this.beatmapRenderData.objectsController.objectsList.filter((o) => selectedHitObject.includes(o.obj.time));
                        const obj = objs.reduce((prev, curr) => (prev.obj.time > curr.obj.time ? curr : prev));
                        const currentMiliseconds = Math.floor(obj.obj.time % 1000)
                            .toString()
                            .padStart(3, "0");
                        const currentSeconds = Math.floor((obj.obj.time / 1000) % 60)
                            .toString()
                            .padStart(2, "0");
                        const currentMinute = Math.floor(obj.obj.time / 1000 / 60)
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
                this.beatmapRenderData.objectsController.draw(parseInt(urlParams.get("t")), true);
            } else {
                this.beatmapRenderData.objectsController.draw(this.audioNode.getCurrentTime(), true);
            }

            document.querySelector("#playerContainer").addEventListener(
                "wheel",
                (event) => {
                    // event.preventDefault();

                    if (isDragging && currentX !== -1 && currentY !== -1) {
                        draggingEndTime = this.audioNode.getCurrentTime();
                        handleCanvasDrag();
                    }

                    if (event.deltaY > 0) go(event.shiftKey, true);
                    if (event.deltaY < 0) go(event.shiftKey, false);

                    // console.log("Scrolled");
                },
                {
                    capture: true,
                    passive: true,
                }
            );

            this.isLoaded = true;
        } catch (err) {
            alert(err);
            console.error(err);

            document.querySelector(".loading").style.opacity = 0;
            document.querySelector(".loading").style.display = "none";

            beatmapFile = undefined;
        }
    }
}
