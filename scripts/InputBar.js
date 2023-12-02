document.querySelector("#mapInput").onkeydown = mapInputEnter;
function mapInputEnter(e) {
    if (e.key === "Enter") {
        submitMap(false);
        document.querySelector("#mapInput").blur();
    }
}

document.querySelector("#map-dropper").onchange = () => {
    const file = document.querySelector("#map-dropper").files[0];
    if (!["osz", "osr", "osk"].includes(file.name.split(".").at(-1))) return;

    ScoreParser.reset();

    if (file.name.split(".").at(-1) === "osr") {
        const parser = new ScoreParser(file);
        parser.getReplayData();
        return;
    }

    if (file.name.split(".").at(-1) === "osk") {
        Skinning.import(file);
        return;
    }

    document.querySelector("#close").disabled = true;
    readZip(file);
};

document.querySelector("#choose-diff").onclick = () => {
    document.querySelector(".difficultySelector").style.display = "block";
};

document.querySelector("#close").onclick = () => {
    document.querySelector(".difficultySelector").style.display = "none";
};

function loadDiff() {
    diffFileName = this.dataset.filename;
    document.querySelector(".difficultySelector").style.display = "none";

    submitMap(true);
}

async function readZip(file) {
    dropBlob = null;
    diffFileName = "";

    const mapFileBlob = file;
    const mapFileBlobReader = new zip.BlobReader(mapFileBlob);
    const zipReader = new zip.ZipReader(mapFileBlobReader);
    const allEntries = await zipReader.getEntries();

    const diffList = document.querySelector(".difficultyList");
    diffList.innerHTML = "";
    document.querySelector(".difficultySelector").style.display = "block";

    const diffs = [];

    for (const content of allEntries) {
        if (content.filename.split(".").at(-1) !== "osu") continue;
        const blob = await content.getData(new zip.BlobWriter("text/plain"));
        const rawFile = await blob.text();

        const mode = rawFile
            .split("\r\n")
            .filter((line) => /Mode:\s[0-9]+/g.test(line))
            .at(0)
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
            .at(0)
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

    dropBlob = file;
    zipReader.close();
}

function submitMap(isDragAndDrop, beatmapID) {
    window.cancelAnimationFrame(ObjectsController.requestID);
    
    const inputValue = beatmapID ?? document.querySelector("#mapInput").value.trim();
    if (!isDragAndDrop && !/^https:\/\/osu\.ppy\.sh\/(beatmapsets\/[0-9]+\#osu\/[0-9]+|b\/[0-9]+)|[0-9]+$/.test(inputValue)) {
        document.querySelector("#mapInput").value = "";
        alert("This is not a valid URL or Beatmap ID");
        return;
    }

    if (document.querySelector("audio")) {
        document.querySelector("audio").pause();
        document.body.removeChild(document.querySelector("audio"));
    }

    const bID = inputValue.split("/").at(-1);

    if (beatmapFile !== undefined) {
        beatmapFile.audioNode?.pause();
        // beatmapFile.beatmapRenderData?.objectsController.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }

    const origin = window.location.origin;

    if (!isDragAndDrop) window.history.pushState({}, "JoSu!", `${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-web"}/?b=${bID}`);
    // else window.history.pushState({}, "JoSu!", `${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-web"}`);

    if (beatmapFile) {
        // Game.APP.ticker.remove(beatmapFile.beatmapRenderData.objectsController.render);
    }

    beatmapFile = undefined;
    beatmapFile = new BeatmapFile(bID ?? -1, isDragAndDrop);

    document.querySelector("#mapInput").value = !isDragAndDrop ? bID : "";
    // document.querySelector("#progress").value = 0;
    // if (document.querySelector("audio")) document.querySelector("audio").currentTime = 0.001;
}

document.querySelector("#submit").addEventListener("click", () => {
    ScoreParser.reset();
    submitMap(false);
});
