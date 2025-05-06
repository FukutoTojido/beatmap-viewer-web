import Audio from "./Audio";
import BeatmapSet from "./BeatmapSet";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";

const ID = "4535499";

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

await beatmap.load();
// beatmap.update(9347);

document
	.querySelector<HTMLButtonElement>("#toggleAudio")
	?.addEventListener("click", () => beatmap.audio?.toggle());
