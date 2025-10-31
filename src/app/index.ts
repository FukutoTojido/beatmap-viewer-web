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
			const indexes = selected
				.toSorted((a, b) => a.startTime - b.startTime)
				.map((o) => o.currentComboIndex + 1)
				.join(",");

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

for (const ele of document.querySelectorAll(".flyout-toggle")) {
	const parent = ele.parentElement;
	if (!parent) continue;

	const container = parent.querySelector(".flyout");
	if (!container) continue;

	ele.addEventListener("click", (e) => {
		e.stopPropagation();

		if (container.classList.contains("hidden")) {
			container.classList.remove("hidden");
			container.classList.add("showIn");

			return;
		}

		container.classList.toggle("showOut");
		container.classList.toggle("showIn");
	});
}

document.body.addEventListener("click", (e) => {
	const flyouts = document.querySelectorAll(".flyout");

	for (const ele of flyouts) {
		const boundingRect = ele.getBoundingClientRect();
		const isOutBound =
			e.clientX < boundingRect.left ||
			e.clientX > boundingRect.right ||
			e.clientY < boundingRect.top ||
			e.clientY > boundingRect.bottom;
		const isOpen = ele.classList.contains("showIn");

		if (isOpen && isOutBound) {
			e.preventDefault();

			ele.classList.add("showOut");
			ele.classList.remove("showIn");

			return;
		}
	}
});

(async () => {
	try {
		await navigator.wakeLock.request("screen");
	} catch {
		// the wake lock request fails - usually system related, such being low on battery
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
