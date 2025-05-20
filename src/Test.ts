import BeatmapSet from "./BeatmapSet";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";
import { inject } from "./Context";
import type Audio from "./Audio";
import ZipHandler from "./ZipHandler";

export const runTest = async () => {
	const IDs = new URLSearchParams(window.location.search).getAll("b") ?? [
		"1307291",
	];

	const blob = await getBeatmapFromId(IDs[0]);
	console.log("Download Completed!");

	const resources = await ZipHandler.extract(blob);
	const bms = new BeatmapSet(resources);
	console.log("Init!");

	await bms.getDifficulties();
	console.log(bms.difficulties);

	await bms.loadResources();

	let baseIdx = 0;

	for (let i = 0; i < IDs.length; i++) {
		const ID = IDs[i];

		const idx = bms.difficulties.findIndex(
			(diff) => diff.data.metadata.beatmapId === +ID,
		);

		if (idx === -1) continue;
		
		if (i === 0) baseIdx = i;
		if (i === 0) await bms.loadMaster(idx);
		if (i !== 0) bms.loadSlave(idx);
	}

	document.addEventListener("keydown", (event) => {
		const audio = bms.context.consume<Audio>("audio");

		switch (event.key) {
			case "ArrowLeft": {
				bms.seek((audio?.currentTime ?? 0) - 1);
				break;
			}
			case "ArrowRight": {
				bms.seek((audio?.currentTime ?? 0) + 1);
				break;
			}
			case " ": {
				bms.toggle();
			}
		}
	});

	document.addEventListener("wheel", (event) => {
		const audio = bms.context.consume<Audio>("audio");

		if (event.deltaY > 0) {
			bms.seek((audio?.currentTime ?? 0) + 100);
		}
		if (event.deltaY < 0) {
			bms.seek((audio?.currentTime ?? 0) - 100);
		}
	});

	if (IDs.length > 1) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		document.querySelector<HTMLButtonElement>("#toggleBeatmap")!.style.display = "none";
	} else {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		document.querySelector<HTMLButtonElement>("#toggleBeatmap")!.style.display = "block";
		document.querySelector<HTMLButtonElement>("#toggleBeatmap")?.addEventListener("click", () => {
			baseIdx = (baseIdx + 1) % bms.difficulties.length;
			bms.loadMaster(baseIdx);
		})
	}
};
