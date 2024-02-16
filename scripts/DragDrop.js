import { Skinning } from "./Skinning.js";
import { readZip } from "./InputBar.js";
import { ScoreParser } from "./ScoreParser.js";

document.querySelector(".contentWrapper").addEventListener("dragover", function (e) {
    e.preventDefault();
});

document.querySelector(".contentWrapper").addEventListener("drop", function (e) {
    e.preventDefault();
    if (!e.dataTransfer.files.length) return;

    const file = e.dataTransfer.files[0];
    if (!["osz", "osr", "osk"].includes(file.name.split(".").at(-1))) return;

    if (file.name.split(".").at(-1) === "osr") {
        ScoreParser.reset();
        const parser = new ScoreParser(file);
        parser.getReplayData();
        return;
    }

    if (file.name.split(".").at(-1) === "osk") {
        Skinning.import(file);
        return;
    }

    ScoreParser.reset();

    document.querySelector("#close").disabled = true;
    readZip(file);
});
