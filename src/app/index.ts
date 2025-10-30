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
			bms.smoothTick(
				-1,
				event.shiftKey,
				bms.context.consume<Audio>("audio")?.state === "PLAYING",
			);
			break;
		}
		case "ArrowRight": {
			bms.smoothTick(
				1,
				event.shiftKey,
				bms.context.consume<Audio>("audio")?.state === "PLAYING",
			);
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

			break;
		}
		case "c":
		case "C": {
			if (!event.ctrlKey) return;
			if (!bms.master) return;

			const selected = [];
			for (const idx of bms.master.container.selected) {
				selected.push(bms.master.objects[idx].object);
			}

			if (!selected.length) return;

			const timestamp = selected[0].startTime;
			const indexes = selected.toSorted((a, b) => a.startTime - b.startTime).map((o) => o.currentComboIndex + 1).join(",");

			const m = Math.floor(timestamp / 1000 / 60);
			const s = Math.floor((timestamp - m * 1000 * 60) / 1000);
			const ms = timestamp % 1000;

			navigator.clipboard.writeText(
				`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${ms.toString().padStart(3, "0")} (${indexes})`,
			);
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
	try {
		await navigator.wakeLock.request("screen");
	} catch (e) {
		// the wake lock request fails - usually system related, such being low on battery
		console.log(e);
	}

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
