import { Game } from "./scripts/Game.js";
import { loadLocalStorage } from "./scripts/Utils.js";
import { Texture } from "./scripts/Texture.js";
import { BeatmapFile } from "./scripts/BeatmapFile.js";
import { urlParams } from "./scripts/GlobalVariables.js";
// import { toggleSidePanel } from "./scripts/SidePanel.js";
import { toggleTimingPanel } from "./scripts/BPM.js";
import { openMenu } from "./scripts/Settings.js";
import { toggleMetadataPanel } from "./scripts/SidePanel.js";
import * as PIXI from "pixi.js";
import { readZip } from "./scripts/InputBar.js";

document.querySelector(".loading").style.opacity = 1;
document.querySelector("#loadingText").textContent = `Initializing\nMight take a while on first load.`;

PIXI.BitmapFont.install({
    name: "Torus",
    style: {
        fontSize: 15,
        align: "right",
        fill: "white",
        fontFamily: "Torus",
        fontWeight: 400,
    },
    chars: [["a", "z"], ["A", "Z"], ["0", "9"], ". :\n"],
});

PIXI.BitmapFont.install({
    name: "Torus16",
    style: {
        fontSize: 16,
        align: "center",
        fill: "white",
        fontFamily: "Torus",
        fontWeight: 400,
    },
    chars: [["a", "z"], ["A", "Z"], ["0", "9"], ". :\n"],
});

PIXI.BitmapFont.install({
    name: "Nicolatte",
    style: {
        fontSize: 15,
        align: "right",
        fill: "white",
        fontFamily: "Nicolatte",
        fontWeight: 600,
        letterSpacing: 5,
    },
    chars: [["a", "z"], ["A", "Z"], ["0", "9"], ". :\n"],
});

PIXI.UniformGroup;

function setupDefaultStorage() {
    const settingsTemplate = {
        renderer: {
            val: "webgl",
            resolution: 1,
            aa: false
        },
        mirror: {
            val: "nerinyan",
            custom: "",
        },
        mapping: {
            beatsnap: 4,
            offset: 0,
            showGreenLine: false,
        },
        background: {
            dim: 0.8,
            blur: 0,
            video: false,
            storyboard: false,
            transcodeVideo: false,
        },
        volume: {
            master: 1,
            music: 0.5,
            hs: 0.2,
            disableBMHS: false,
        },
        skinning: {
            type: "0",
            val: "-1",
        },
        sliderAppearance: {
            snaking: true,
            sliderend: true,
            hitAnim: true,
            ignoreSkin: false,
            showGrid: true,
            disablePerfect: false,
        },
        timeline: {
            zoomRate: 200,
        },
    };

    if (!localStorage.getItem("settings")) {
        localStorage.setItem("settings", JSON.stringify(settingsTemplate));
    } else {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        Object.keys(settingsTemplate).forEach((k) => {
            if (currentLocalStorage[k] === undefined) currentLocalStorage[k] = settingsTemplate[k];

            Object.keys(settingsTemplate[k]).forEach((k2) => {
                if (currentLocalStorage[k][k2] === undefined) currentLocalStorage[k][k2] = settingsTemplate[k][k2];
            });
        });

        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }
}

(async () => {
    try {
        const adapter = await navigator.gpu.requestAdapter();
        const device = adapter && (await adapter.requestDevice());
        const maxTextures = device?.limits.maxSampledTexturesPerShaderStage;
        if (maxTextures) {
            PIXI.Batcher.defaultOptions.maxTextures = maxTextures;
        }
    } catch (error) {
        console.warn("Failed to configure Batcher with WebGPU limits:", error);
    }

    if (urlParams.get("fullscreen") === "true") {
        document.body.style.padding = 0;
        document.querySelector("#inputContainer").style.maxHeight = 0;
        document.querySelector("#inputContainer").style.padding = 0;
        document.querySelector("#inputContainer").style.margin = 0;
    }

    setupDefaultStorage();

    const baseSettings = JSON.parse(localStorage.getItem("settings"));
    Game.MASTER_VOL = baseSettings.volume.master;
    Game.MUSIC_VOL = baseSettings.volume.music;
    Game.HS_VOL = baseSettings.volume.hs;
    Game.DISABLE_BMHS = baseSettings.volume.disableBMHS;
    Game.SLIDER_APPEARANCE = baseSettings.sliderAppearance;
    Game.SKINNING = baseSettings.skinning;
    Game.MAPPING = baseSettings.mapping;
    Game.IS_VIDEO = baseSettings.background.video;

    // Init
    await Game.init();
    await loadLocalStorage();

    await Texture.generateDefaultTextures();

    document.querySelector(".loading").style.opacity = 0;
    document.querySelector(".loading").style.display = "none";
    document.querySelector(".switchMirrorContainer").style.display = "flex";

    document.body.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "F6": {
                e.preventDefault();
                break;
            }
            case "F4": {
                e.preventDefault();
                break;
            }
            case "o": {
                if (e.ctrlKey) e.preventDefault();
                break;
            }
        }
    });

    document.body.addEventListener("keyup", (e) => {
        switch (e.key) {
            case "F6": {
                e.preventDefault();
                toggleTimingPanel();
                break;
            }
            case "F4": {
                e.preventDefault();
                // toggleSidePanel("metadata");
                toggleMetadataPanel();
                break;
            }
            case "o": {
                if (e.ctrlKey) {
                    e.preventDefault();
                    openMenu();
                }

                break;
            }
        }
    });

    document.querySelector(".contentWrapper").addEventListener(
        "wheel",
        (e) => {
            if (e.ctrlKey) e.preventDefault();
        },
        {
            capture: true,
            passive: false,
        }
    );

    if (/#[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=-]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi.test(window.location.hash)) {
        const url = window.location.hash.slice(1);
        console.log(url);
        const blob = await BeatmapFile.downloadCustom(url);

        readZip(blob);
    }

    if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
        Game.BEATMAP_FILE = new BeatmapFile(urlParams.get("b"));
        document.querySelector("#mapInput").value = urlParams.get("b");

        return;
    }
})();
