import BeatmapSet from "./BeatmapSet";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";

const ID = new URLSearchParams(window.location.search).get("b") ?? "1307291";

const blob = await getBeatmapFromId(ID);
console.log("Download Completed!");

const bms = new BeatmapSet(blob);
await bms.init();
console.log("Init!");

await bms.getDifficulties();
console.log(bms.difficulties);

await bms.loadResources();
const beatmap = bms.difficulties.find(diff => diff.data.metadata.beatmapId === +ID) ?? bms.difficulties[0];
if (!beatmap) throw new Error("Cannot find Beatmap");

const start = performance.now();
await beatmap.load();
console.log(`Took ${(performance.now() - start).toFixed(2)}ms to initiate ${beatmap.data.hitObjects.length} objects`)
// beatmap.update(22284);

document
	.querySelector<HTMLButtonElement>("#toggleAudio")
	?.addEventListener("click", () => beatmap.audio?.toggle());
