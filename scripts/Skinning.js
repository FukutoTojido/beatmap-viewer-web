import { Texture } from "./Texture.js";
import { HitSample } from "./Audio.js";
import { refreshSkinDB } from "./Utils.js";
import { Notification } from "./Notification.js";
import { Database } from "./Database.js";
import { Game } from "./Game.js";

export class Skinning {
    static HIT_CIRCLE = null;
    static HIT_CIRCLE_OVERLAY = null;
    static SLIDER_B = null;
    static SLIDER_FOLLOW_CIRCLE = null;
    static REVERSE_ARROW = null;
    static APPROACH_CIRCLE = null;
    static DEFAULTS = [...Array(10)].fill(null, 0, 10);

    static SLIDER_BORDER = null;
    static SLIDER_TRACK_OVERRIDE = null;
    static HIT_CIRCLE_OVERLAP = 0;
    static HIT_CIRCLE_OVERLAP_ARGON = 20;
    static HIT_CIRCLE_PREFIX = "default";

    static DEFAULT_COLORS = [0xffc000, 0x00ca00, 0x127cff, 0xf21839];

    static SKIN_ENUM = {
        ARGON: "0",
        TINTED: "1",
        LEGACY: "2",
        TRIANGLES: "3",
        CUSTOM: "4",
        0: "ARGON",
        1: "LEGACY",
        2: "LEGACY",
        3: "LEGACY",
        4: "CUSTOM",
    };

    static SKIN_NAME = {
        0: "Argon",
        1: "Tinted Legacy",
        2: "Legacy",
        3: "Triangles",
        4: "",
    };

    static SKIN_IDX = -1;
    static SKIN_LIST = [];

    static async changeSkin() {
        if (Game.SKINNING.type !== "4") {
            Skinning.DEFAULT_COLORS = [0xffc000, 0x00ca00, 0x127cff, 0xf21839];
            Skinning.HIT_CIRCLE_PREFIX = "default";
            Skinning.SLIDER_BORDER = null;
            Skinning.SLIDER_TRACK_OVERRIDE = null;
            document.querySelector(".skinSelector").textContent = Skinning.SKIN_NAME[Game.SKINNING.type];
            // console.log(Game.SKINNING.type);
            return;
        }

        if (!Skinning.SKIN_LIST[Skinning.SKIN_IDX]) {
            Game.SKINNING.type = "2";
            Skinning.SKIN_IDX = -1;
            Skinning.DEFAULT_COLORS = [0xffc000, 0x00ca00, 0x127cff, 0xf21839];
            Skinning.HIT_CIRCLE_PREFIX = "default";
            Skinning.SLIDER_BORDER = null;
            Skinning.SLIDER_TRACK_OVERRIDE = null;
            document.querySelector(".skinSelector").textContent = "Legacy";
            return;
        }

        Skinning.SLIDER_BORDER = Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.SLIDER_BORDER;
        Skinning.SLIDER_TRACK_OVERRIDE = Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.SLIDER_TRACK_OVERRIDE;
        Skinning.HIT_CIRCLE_PREFIX = Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.HIT_CIRCLE_PREFIX;
        Skinning.DEFAULT_COLORS = Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.DEFAULT_COLORS;

        document.querySelector(".skinSelector").textContent = Skinning.SKIN_LIST[Skinning.SKIN_IDX].ini.NAME;
    }

    static async getBase64(allEntries, filename) {
        const entry =
            allEntries.find((entry) => entry.filename === `${filename}@2x.png`) ??
            allEntries.find((entry) => entry.filename === `${filename}.png`) ??
            null;

        if (!entry) return {};
        // console.log(entry);

        const base64 = await entry.getData(new zip.Data64URIWriter("image/png"));
        return {
            base64,
            isHD: entry.filename.includes("@2x"),
        };
    }

    static async readSkinIni(allEntries) {
        const entry = allEntries.find((entry) => entry.filename.toLowerCase() === "skin.ini");
        const blob = await entry.getData(new zip.BlobWriter("text/plain"));
        const text = await blob.text();

        const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => !/^(\/\/|\#|\;).*/g.test(line));

        const name = lines
            .find((line) => line.includes("Name: "))
            .trim()
            .replace("Name: ", "");

        const sliderBorder = lines
            .find((line) => line.includes("SliderBorder:"))
            ?.replaceAll(" ", "")
            .match(/[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}/g)
            .at(0)
            .split(",")
            .map((value) => value / 255)
            .concat([1.0]);

        const sliderTrackOverride = lines
            .find((line) => /^SliderTrackOverride\s*:/.test(line))
            ?.replaceAll(" ", "")
            .match(/[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}/g)
            .at(0)
            .split(",")
            .map((value) => value / 255)
            .concat([1.0]);

        const hitCircleOverlap = parseInt(
            lines
                .find((line) => line.includes("HitCircleOverlap:"))
                ?.replaceAll(" ", "")
                .match(/[0-9]+/g)
                .at(0) ?? "0"
        );

        const hitCirclePrefix = lines
            .find((line) => line.includes("HitCirclePrefix:"))
            ?.replaceAll(" ", "")
            .replaceAll("HitCirclePrefix:", "")
            .replaceAll("\r", "");

        let coloursList = lines
            .filter(
                (line) =>
                    /Combo[0-9]+:/g.test(line.replaceAll(" ", "").replaceAll("\r")) &&
                    line.replaceAll(" ", "").slice(0, 2) !== "//" &&
                    line.replaceAll(" ", "")[0] !== ";" &&
                    line.replaceAll(" ", "")[0] !== "#"
            )
            .map(
                (colour) =>
                    `rgb(${colour
                        .replaceAll(" ", "")
                        .replaceAll("\r", "")
                        .replaceAll(/Combo[0-9]+:/g, "")})`
            )
            .map((colour) =>
                parseInt(
                    colour
                        .replaceAll("\r", "")
                        .replaceAll("rgb(", "")
                        .replaceAll(")", "")
                        .split(",")
                        .map((val) => parseInt(val).toString(16).padStart(2, "0"))
                        .join(""),
                    16
                )
            );

        if (coloursList.length === 0) coloursList = [0xffc000, 0x00ca00, 0x127cff, 0xf21839];

        Skinning.SLIDER_BORDER = sliderBorder ?? null;
        Skinning.SLIDER_TRACK_OVERRIDE = sliderTrackOverride ?? null;
        Skinning.HIT_CIRCLE_OVERLAP = hitCircleOverlap ?? 0;
        Skinning.HIT_CIRCLE_PREFIX = hitCirclePrefix ?? "default";
        Skinning.DEFAULT_COLORS = coloursList;

        return {
            NAME: name,
            SLIDER_BORDER: sliderBorder ?? null,
            SLIDER_TRACK_OVERRIDE: sliderTrackOverride ?? null,
            HIT_CIRCLE_OVERLAP: hitCircleOverlap,
            HIT_CIRCLE_PREFIX: hitCirclePrefix ?? "default",
            DEFAULT_COLORS: coloursList,
        };
    }

    static async getHitsounds(allEntries) {
        const hitsoundFiles = allEntries.filter((file) => {
            return /^(normal|soft|drum)-(hitnormal|hitwhistle|hitclap|hitfinish|slidertick|sliderwhistle|sliderslide)([1-9][0-9]*)?/.test(
                file.filename
            );
        });

        const hitsoundArrayBuffer = [];
        for (const file of hitsoundFiles) {
            const writer = new zip.BlobWriter(`audio/${file.filename.split(".").at(-1)}`);
            const fileBlob = await file.getData(writer);
            const fileArrayBuffer = await Skinning.readBlobAsBuffer(fileBlob);

            hitsoundArrayBuffer.push({
                filename: file.filename,
                buf: fileArrayBuffer,
                blob: fileBlob,
            });
        }

        return hitsoundArrayBuffer;
    }

    static async loadHitsounds(arrayBuffers, forIdx) {
        if (!HitSample.SAMPLES.CUSTOM[forIdx]) HitSample.SAMPLES.CUSTOM[forIdx] = {};

        for (const sample of ["normal", "soft", "drum"])
            for (const hitsound of ["hitnormal", "hitwhistle", "hitclap", "hitfinish", "slidertick", "sliderwhistle", "sliderslide"]) {
                const name = `${sample}-${hitsound}`;
                const hs = arrayBuffers.find((hitsound) => hitsound.filename.split(".")[0] === name);

                if (!hs) {
                    HitSample.SAMPLES.CUSTOM[forIdx][name] = HitSample.DEFAULT_SAMPLES.LEGACY[name];
                    continue;
                }

                try {
                    const buffer = await Game.AUDIO_CTX.decodeAudioData(hs.buf);
                    HitSample.SAMPLES.CUSTOM[forIdx][name] = buffer;
                } catch {
                    continue;
                }
            }
    }

    static async readBlobAsBuffer(blob) {
        const res = await new Promise((resolve) => {
            let fileReader = new FileReader();
            fileReader.onload = (event) => resolve(fileReader.result);
            fileReader.readAsArrayBuffer(blob);
        });

        // console.log(res);
        return res;
    }

    static async getAllBase64s(allEntries) {
        const HIT_CIRCLE = await Skinning.getBase64(allEntries, "hitcircle");
        const HIT_CIRCLE_OVERLAY = await Skinning.getBase64(allEntries, "hitcircleoverlay");
        let SLIDER_B = await Skinning.getBase64(allEntries, "sliderb0");
        const SLIDER_FOLLOW_CIRCLE = await Skinning.getBase64(allEntries, "sliderfollowcircle");
        const REVERSE_ARROW = await Skinning.getBase64(allEntries, "reversearrow");
        const APPROACH_CIRCLE = await Skinning.getBase64(allEntries, "approachcircle");
        let DEFAULTS = [...Array(10)].fill(null, 0, 10);

        if (!SLIDER_B.base64) SLIDER_B = await Skinning.getBase64(allEntries, "sliderb");

        for (let i = 0; i < 10; i++) {
            DEFAULTS[i] = (await Skinning.getBase64(allEntries, `${Skinning.HIT_CIRCLE_PREFIX}-${i}`)) ?? {};
        }

        return {
            HIT_CIRCLE,
            HIT_CIRCLE_OVERLAY,
            SLIDER_B,
            SLIDER_FOLLOW_CIRCLE,
            REVERSE_ARROW,
            APPROACH_CIRCLE,
            DEFAULTS,
        };
    }

    static async import(blob) {
        Skinning.SLIDER_BORDER = null;
        Skinning.SLIDER_TRACK_OVERRIDE = null;
        Skinning.HIT_CIRCLE_OVERLAP = 0;

        const blobReader = new zip.BlobReader(blob);
        const zipReader = new zip.ZipReader(blobReader);

        const allEntries = await zipReader.getEntries();

        const ini = await Skinning.readSkinIni(allEntries);
        const samples = await Skinning.getHitsounds(allEntries);
        const base64s = await Skinning.getAllBase64s(allEntries);

        const storeValue = {
            ini,
            samples,
            base64s,
        };

        await Database.addToObjStore(storeValue);

        const skinIdx = (await Database.getAllKeys()).at(-1);

        for (const element of [
            "HIT_CIRCLE",
            "HIT_CIRCLE_OVERLAY",
            "SLIDER_B",
            "REVERSE_ARROW",
            "DEFAULTS",
            "SLIDER_FOLLOW_CIRCLE",
            "APPROACH_CIRCLE",
        ]) {
            if (!base64s[element]) continue;

            if (element === "DEFAULTS") {
                await Texture.updateNumberTextures(base64s[element], skinIdx);
                continue;
            }

            const { base64, isHD } = base64s[element];
            await Texture.updateTextureFor(element, base64, isHD, skinIdx);
        }

        await Skinning.loadHitsounds(samples, skinIdx);
        await refreshSkinDB();

        Skinning.SKIN_IDX = skinIdx;
        Game.SKINNING.type = "4";
        Skinning.changeSkin();

        zipReader.close();

        new Notification({
            message: `${storeValue.ini.NAME} imported`,
        }).notify();
    }
}
