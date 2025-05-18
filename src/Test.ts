import BeatmapSet from "./BeatmapSet";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";
import ZipHandler from "./ZipHandler";

export const runTest = async () => {
	const ID = new URLSearchParams(window.location.search).get("b") ?? "1307291";

	const blob = await getBeatmapFromId(ID);
	console.log("Download Completed!");

	const resources = await ZipHandler.extract(blob);
	const bms = new BeatmapSet(resources);
	console.log("Init!");

	await bms.getDifficulties();
	console.log(bms.difficulties);

	await bms.loadResources();
	const beatmap =
		bms.difficulties.find((diff) => diff.data.metadata.beatmapId === +ID) ??
		bms.difficulties[0];
	if (!beatmap) throw new Error("Cannot find Beatmap");
	await beatmap.load();

	document.addEventListener("keydown", (event) => {
		switch (event.key) {
			case "ArrowLeft": {
				beatmap.seek((beatmap.audio?.currentTime ?? 0) - 1);
				break;
			}
			case "ArrowRight": {
				beatmap.seek((beatmap.audio?.currentTime ?? 0) + 1);
				break;
			}
			case " ": {
				beatmap.toggle();
			}
		}
	});

	document.addEventListener("wheel", (event) => {
		if (event.deltaY > 0) {
			beatmap.seek((beatmap.audio?.currentTime ?? 0) + 100);
		}
		if (event.deltaY < 0) {
			beatmap.seek((beatmap.audio?.currentTime ?? 0) - 100);
		}
	});
};
