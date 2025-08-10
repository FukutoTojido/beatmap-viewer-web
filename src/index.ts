import "@pixi/layout";
import 'remixicon/fonts/remixicon.css'
import { Game } from "./Game";
import { inject, provide } from "./Context";
import { Assets } from "pixi.js";
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
			const activeElement = document.activeElement
			if (activeElement?.tagName === "INPUT" && activeElement?.getAttribute("type") === "text") return;
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

document.querySelector<HTMLButtonElement>("#diffs")?.addEventListener("click", () => {
	document.querySelector<HTMLDivElement>("#diffsContainer")?.classList.toggle("hidden");
	document.querySelector<HTMLDivElement>("#diffsContainer")?.classList.toggle("flex");
});

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
})();
