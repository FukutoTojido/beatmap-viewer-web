class Skinning {
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
        const entry = allEntries.find((entry) => entry.filename === "skin.ini");
        const blob = await entry.getData(new zip.BlobWriter("text/plain"));
        const text = await blob.text();

        const lines = text.split("\n");
        const sliderBorder = lines
            .find((line) => line.includes("SliderBorder:"))
            ?.replaceAll(" ", "")
            .match(/[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}/g)
            .shift()
            .split(",")
            .map((value) => value / 255)
            .concat([1.0]);

        const sliderTrackOverride = lines
            .find((line) => line.includes("SliderTrackOverride:"))
            ?.replaceAll(" ", "")
            .match(/[0-9]{0,3},[0-9]{0,3},[0-9]{0,3}/g)
            .shift()
            .split(",")
            .map((value) => value / 255)
            .concat([1.0]);

        const hitCircleOverlap = parseInt(
            lines
                .find((line) => line.includes("HitCircleOverlap:"))
                ?.replaceAll(" ", "")
                .match(/[0-9]+/g)
                .shift() ?? "0"
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
        Skinning.HIT_CIRCLE_OVERLAP = hitCircleOverlap;
        Skinning.HIT_CIRCLE_PREFIX = hitCirclePrefix ?? "default";
        Skinning.DEFAULT_COLORS = coloursList;
    }

    static async loadHitsounds(allEntries) {
        const hitsoundFiles = allEntries.filter((file) => {
            return /(normal|soft|drum)-(hitnormal|hitwhistle|hitclap|hitfinish)([1-9][0-9]*)?/.test(file.filename);
        });

        const hitsoundArrayBuffer = [];
        for (const file of hitsoundFiles) {
            const writer = new zip.BlobWriter(`audio/${file.filename.split(".").at(-1)}`);
            const fileBlob = await file.getData(writer);
            const fileArrayBuffer = await Skinning.readBlobAsBuffer(fileBlob);

            hitsoundArrayBuffer.push({
                filename: file.filename,
                buf: fileArrayBuffer,
            });
        }

        for (const sample of ["normal", "soft", "drum"])
            for (const hitsound of ["hitnormal", "hitwhistle", "hitclap", "hitfinish"]) {
                const name = `${sample}-${hitsound}`;
                const hs = hitsoundArrayBuffer.find((hitsound) => hitsound.filename.split(".")[0] === name);

                if (!hs) {
                    HitSample.SAMPLES.LEGACY[name] = HitSample.DEFAULT_SAMPLES.LEGACY[name];
                    continue;
                }

                try {
                    const buffer = await audioCtx.decodeAudioData(hs.buf);
                    HitSample.SAMPLES.LEGACY[name] = buffer;
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

    static async import(blob) {
        Skinning.HIT_CIRCLE = null;
        Skinning.HIT_CIRCLE_OVERLAY = null;
        Skinning.SLIDER_B = null;
        Skinning.REVERSE_ARROW = null;
        Skinning.APPROACH_CIRCLE = null;
        Skinning.SLIDER_FOLLOW_CIRCLE = null;
        Skinning.DEFAULTS = [...Array(10)].fill(null, 0, 10);

        Skinning.SLIDER_BORDER = null;
        Skinning.SLIDER_TRACK_OVERRIDE = null;
        Skinning.HIT_CIRCLE_OVERLAP = 0;

        const blobReader = new zip.BlobReader(blob);
        const zipReader = new zip.ZipReader(blobReader);

        const allEntries = await zipReader.getEntries();
        // console.log(allEntries);

        Skinning.readSkinIni(allEntries);
        Skinning.loadHitsounds(allEntries);

        Skinning.HIT_CIRCLE = await Skinning.getBase64(allEntries, "hitcircle");
        Skinning.HIT_CIRCLE_OVERLAY = await Skinning.getBase64(allEntries, "hitcircleoverlay");

        Skinning.SLIDER_B = await Skinning.getBase64(allEntries, "sliderb0");
        if (!Skinning.SLIDER_B.base64) Skinning.SLIDER_B = await Skinning.getBase64(allEntries, "sliderb");

        Skinning.SLIDER_FOLLOW_CIRCLE = await Skinning.getBase64(allEntries, "sliderfollowcircle");
        Skinning.REVERSE_ARROW = await Skinning.getBase64(allEntries, "reversearrow");
        Skinning.APPROACH_CIRCLE = await Skinning.getBase64(allEntries, "approachcircle");

        for (let i = 0; i < 10; i++) {
            Skinning.DEFAULTS[i] = (await Skinning.getBase64(allEntries, `${Skinning.HIT_CIRCLE_PREFIX}-${i}`)) ?? {};
        }

        // console.log(Skinning.HIT_CIRCLE);
        // console.log(Skinning.HIT_CIRCLE_OVERLAY);
        // console.log(Skinning.SLIDER_B);
        // console.log(Skinning.REVERSE_ARROW);
        // console.log(Skinning.APPROACH_CIRCLE);

        ["HIT_CIRCLE", "HIT_CIRCLE_OVERLAY", "SLIDER_B", "REVERSE_ARROW", "DEFAULTS", "SLIDER_FOLLOW_CIRCLE", "APPROACH_CIRCLE"].forEach(
            (element) => {
                if (!Skinning[element]) return;

                if (element === "DEFAULTS") {
                    Texture.updateNumberTextures(Skinning[element]);
                    return;
                }

                const { base64, isHD } = Skinning[element];
                Texture.updateTextureFor(element, base64, isHD);
            }
        );

        zipReader.close();
    }
}
