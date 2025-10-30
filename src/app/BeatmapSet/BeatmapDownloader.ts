import ky from "ky";
import type Loading from "@/UI/loading";
import type MirrorConfig from "../Config/MirrorConfig";
import { inject } from "../Context";

type BeatmapData = {
	beatmapset_id: number;
	id: number;
};

async function getBeatmapsetId(beatmapId: string) {
	try {
		if (!/\d+/g.test(beatmapId)) throw new Error("beatmapId is not a number!");
		inject<Loading>("ui/loading")?.setText("Getting beatmapsetId...");
		const { beatmaps }: { beatmaps: BeatmapData[] } = await ky
			.get(`https://api.try-z.net/beatmaps?ids=${beatmapId}`)
			.json();

		if (beatmaps.length === 0) return null;
		return beatmaps[0]?.beatmapset_id ?? null;
	} catch (e) {
		console.error(e);
		return null;
	}
}

async function getBeatmapsetIdFromHash(hash: string) {
	try {
		if (!/\d+[a-f]+/g.test(hash))
			throw new Error("checksum is not in valid format!");
		inject<Loading>("ui/loading")?.setText("Getting beatmapsetId...");
		const beatmap: BeatmapData = await ky
			.get(`https://api.try-z.net/b/h/${hash}`)
			.json();

		return beatmap.beatmapset_id ?? null;
	} catch (e) {
		console.error(e);
		return null;
	}
}

export async function getBeatmapFromId(beatmapId: string) {
	const mirrorConfig = inject<MirrorConfig>("config/mirror");
	if (!mirrorConfig) throw new Error("Mirror Config not initialized yet!!!");

	const {
		mirror: { urlTemplate },
	} = mirrorConfig;

	const beatmapsetId = await getBeatmapsetId(beatmapId);
	if (!beatmapsetId)
		throw new Error(`Map with id ${beatmapId} does not exist!!!`);

	try {
		inject<Loading>("ui/loading")?.setText("Getting beatmap...");
		const blob = await ky
			.get(urlTemplate.replaceAll("$setId", beatmapsetId.toString()), {
				headers: { Accept: "application/x-osu-beatmap-archive" },
				onDownloadProgress(progressEvent) {
					inject<Loading>("ui/loading")?.setText(
						`Downloading map: ${(100 * (progressEvent.percent ?? 0)).toFixed(2)}%`,
					);
				},
			})
			.blob();

		return blob;
	} catch (e) {
		console.error(e);
		return null;
	}
}

export async function getBeatmapFromHash(hash: string) {
	const mirrorConfig = inject<MirrorConfig>("config/mirror");
	if (!mirrorConfig) throw new Error("Mirror Config not initialized yet!!!");

	const {
		mirror: { urlTemplate },
	} = mirrorConfig;

	const beatmapsetId = await getBeatmapsetIdFromHash(hash);
	if (!beatmapsetId) throw new Error(`Map with hash ${hash} does not exist!!!`);

	try {
		inject<Loading>("ui/loading")?.setText("Getting beatmap...");
		const blob = await ky
			.get(urlTemplate.replaceAll("$setId", beatmapsetId.toString()), {
				headers: { Accept: "application/x-osu-beatmap-archive" },
				onDownloadProgress(progressEvent) {
					inject<Loading>("ui/loading")?.setText(
						`Downloading map: ${(100 * (progressEvent.percent ?? 0)).toFixed(2)}%`,
					);
				},
			})
			.blob();

		return blob;
	} catch (e) {
		console.error(e);
		return null;
	}
}

export async function getBeatmapFromExternalUrl(url: string) {
	try {
		inject<Loading>("ui/loading")?.setText("Getting beatmap...");
		
		const formData = new FormData();
		formData.append("url", url);
		const blob = await ky
			.post(`./api/download`, {
				body: formData,
				onDownloadProgress(progressEvent) {
					inject<Loading>("ui/loading")?.setText(
						`Downloading map: ${(100 * (progressEvent.percent ?? 0)).toFixed(2)}%`,
					);
				},
			})
			.blob();

		return blob;
	} catch (e) {
		console.error(e);
		return null;
	}
}
