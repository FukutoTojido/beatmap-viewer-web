import "@pixi/layout";
import { runTest } from "./Test";
import { Game } from "./Game";
import { provide } from "./Context";
import { Assets, BitmapFontManager } from "pixi.js";

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
