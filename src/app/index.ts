import "@pixi/layout";
import { Assets } from "pixi.js";
import type Audio from "./Audio";
import type BeatmapSet from "./BeatmapSet";
import { inject, provide } from "./Context";
import { Game } from "./Game";

document.addEventListener("keydown", (event) => {
	const bms = inject<BeatmapSet>("beatmapset");
	const audio = bms?.context.consume<Audio>("audio");

	if (!bms || !audio) return;

	switch (event.key) {
		case "ArrowLeft": {
			bms.smoothTick(-1);
			break;
		}
		case "ArrowRight": {
			bms.smoothTick(1);
			break;
		}
		case " ": {
			const activeElement = document.activeElement;
			if (
				activeElement?.tagName === "INPUT" &&
				activeElement?.getAttribute("type") === "text"
			)
				return;
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

document
	.querySelector<HTMLButtonElement>("#diffs")
	?.addEventListener("click", () => {
		document
			.querySelector<HTMLDivElement>("#diffsContainer")
			?.classList.toggle("hidden");
		document
			.querySelector<HTMLDivElement>("#diffsContainer")
			?.classList.toggle("flex");
	});

document
	.querySelector<HTMLButtonElement>("#skins")
	?.addEventListener("click", () => {
		document
			.querySelector<HTMLDivElement>("#skinsContainer")
			?.classList.toggle("hidden");
		document
			.querySelector<HTMLDivElement>("#skinsContainer")
			?.classList.toggle("flex");
	});

(async () => {
	await Promise.all([
		Assets.load({ src: "./assets/metadata.png", parser: "texture" }),
		Assets.load({ src: "./assets/back.png", parser: "texture" }),
		Assets.load({ src: "./assets/play.png", parser: "texture" }),
		Assets.load({ src: "./assets/pause.png", parser: "texture" }),
		Assets.load({ src: "./assets/next.png", parser: "texture" }),
		Assets.load({ src: "./assets/maximize.png", parser: "texture" }),
		Assets.load({ src: "./assets/x.png", parser: "texture" }),
	]);

	const game = provide("game", new Game());
	await game.init();
})();
