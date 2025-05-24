import type Loading from "@/UI/loading";
import type MirrorConfig from "../Config/MirrorConfig";
import { inject } from "../Context";
import axios from "axios";

type BeatmapData = {
	beatmapset_id: number;
	id: number;
};

async function getBeatmapsetId(beatmapId: string) {
	try {
		if (!/\d+/g.test(beatmapId)) throw new Error("beatmapId is not a number!");
		const {
			data: { beatmaps },
		}: { data: { beatmaps: BeatmapData[] } } = await axios.get(
			`https://api.try-z.net/beatmaps?ids=${beatmapId}`,
		);

		if (beatmaps.length === 0) return null;
		return beatmaps[0]?.beatmapset_id ?? null;
	} catch (e) {
		console.error(e);
		return null;
	}
}

export async function getBeatmapFromId(beatmapId: string) {
	inject<Loading>("ui/loading")?.on();

	const mirrorConfig = inject<MirrorConfig>("config/mirror");
	if (!mirrorConfig) throw new Error("Mirror Config not initialized yet!!!");

	const {
		mirror: { urlTemplate },
	} = mirrorConfig;

	const beatmapsetId = await getBeatmapsetId(beatmapId);
	if (!beatmapsetId)
		throw new Error(`Map with id ${beatmapId} does not exist!!!`);

	try {
		const { data: blob } = await axios.get(
			urlTemplate.replaceAll("$setId", beatmapsetId.toString()),
			{
				responseType: "blob",
				headers: { Accept: "application/x-osu-beatmap-archive" },
				onDownloadProgress(progressEvent) {
					inject<Loading>("ui/loading")?.setText(`Downloading map: ${(100 * (progressEvent.progress ?? 0)).toFixed(2)}%`);
				},
			},
		);

		inject<Loading>("ui/loading")?.off();
		return blob;
	} catch (e) {
		console.error(e);
		return null;
	}
}
