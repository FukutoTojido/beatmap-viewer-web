import "@pixi/layout";
import { runTest } from "./Test";
import { Game } from "./Game";
import { inject, provide } from "./Context";
import { Assets, BitmapFontManager } from "pixi.js";
import type BeatmapSet from "./BeatmapSet";
import type Audio from "./Audio";

document.addEventListener("keydown", (event) => {
	const bms = inject<BeatmapSet>("beatmapset");
	const audio = bms?.context.consume<Audio>("audio");

	if (!bms || !audio) return;

	switch (event.key) {
		case "ArrowLeft": {
			bms.seek(audio.currentTime - 1);
			break;
		}
		case "ArrowRight": {
			bms.seek(audio.currentTime + 1);
			break;
		}
		case " ": {
			bms.toggle();
		}
	}
});

document.addEventListener(
	"wheel",
	(e) => {
		if (e.ctrlKey) e.preventDefault();
	},
	{
		capture: true,
		passive: false,
	},
);

(async () => {
	await Promise.all([
		Assets.load({ src: "./assets/metadata.png", loadParser: "loadTextures" }),
		Assets.load({ src: "./assets/back.png", loadParser: "loadTextures" }),
		Assets.load({ src: "./assets/play.png", loadParser: "loadTextures" }),
		Assets.load({ src: "./assets/pause.png", loadParser: "loadTextures" }),
		Assets.load({ src: "./assets/next.png", loadParser: "loadTextures" }),
		Assets.load({ src: "./assets/maximize.png", loadParser: "loadTextures" }),
		Assets.load({ src: "./assets/x.png", loadParser: "loadTextures" }),
	]);

	const game = provide("game", new Game());
	await game.init();
	runTest();
})();
