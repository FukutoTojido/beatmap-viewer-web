import BeatmapSet from "./BeatmapSet";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";
import { inject } from "./Context";
import type Audio from "./Audio";
import ZipHandler from "./ZipHandler";
import type Main from "./UI/main";
import type TimelineConfig from "./Config/TimelineConfig";
import { gcd } from "./utils";
import axios from "axios";

export const runTest = async () => {
	const queries = new URLSearchParams(window.location.search).getAll("b");
	const IDs = queries.length !== 0 ? queries : [];

	let blob: Blob;
	try {
		blob =
			queries.length !== 0
				? await getBeatmapFromId(IDs[0])
				: (
						await axios.get("./beatmapsets/test.osz", {
							responseType: "blob",
							headers: { Accept: "application/x-osu-beatmap-archive" },
						})
					).data;
	} catch (e) {
		console.error(e);
		return;
	}

	console.log("Download Completed!");

	const resources = await ZipHandler.extract(blob);
	const bms = new BeatmapSet(resources);
	console.log("Init!");

	await bms.getDifficulties();
	console.log(bms.difficulties);

	await bms.loadResources();

	let baseIdx = 0;

	if (IDs.length === 0) {
		await bms.loadMaster(4);
	}

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

	if (IDs.length > 1) {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		document.querySelector<HTMLButtonElement>("#toggleBeatmap")!.style.display =
			"none";
	} else {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		document.querySelector<HTMLButtonElement>("#toggleBeatmap")!.style.display =
			"block";
		document
			.querySelector<HTMLButtonElement>("#toggleBeatmap")
			?.addEventListener("click", () => {
				baseIdx = (baseIdx + 1) % bms.difficulties.length;
				bms.loadMaster(baseIdx);
			});
	}
};
