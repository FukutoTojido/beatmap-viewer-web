import { Game } from "./scripts/Game.js";
import { loadLocalStorage } from "./scripts/Utils.js";
import { Texture } from "./scripts/Texture.js";
import { BeatmapFile } from "./scripts/BeatmapFile.js";

document.querySelector(".loading").style.opacity = 1;
document.querySelector("#loadingText").textContent = `Initializing`;

(async () => {
    await loadLocalStorage();
    document.querySelector(".loading").style.opacity = 0;
    document.querySelector(".loading").style.display = "none";

    // Init
    Game.init();
    Texture.generateDefaultTextures();

    if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
        beatmapFile = new BeatmapFile(urlParams.get("b"));
        document.querySelector("#mapInput").value = urlParams.get("b");
    }
})();
