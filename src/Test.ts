import BeatmapSet from "./BeatmapSet";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";

const blob = await getBeatmapFromId("4276778");
console.log("Download Completed!");

const bms = new BeatmapSet(blob);
await bms.init();
console.log("Init!");

await bms.getDifficulties();
console.log(bms.difficulties);

await bms.loadResources();
console.log(bms.resources);