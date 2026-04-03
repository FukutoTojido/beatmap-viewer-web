import ky from "ky";
import type Loading from "@/UI/loading";
import type MirrorConfig from "../Config/MirrorConfig";
import { inject } from "../Context";

type BeatmapData = {
	beatmapset_id: number;
	id: number;
};

export enum IDType {
	BEATMAP_SET = "s",
	BEATMAP = "b",
}

const sanitizeID = (id: string) => {
	if (!/^[0-9]+$/g.test(id)) {
		return null;
	}

	return id;
};

export function processID(id: string): {
	id: string;
	type: IDType;
} | null {
	if (/^[0-9]+$/g.test(id)) return { id, type: IDType.BEATMAP };

	try {
		const url = new URL(id);

		if (url.hostname !== "osu.ppy.sh") {
			return null;
		}

		const params = url.pathname.split("/");
		if (!params[1] || !params[2]) return null;

		switch (params[1]) {
			case "beatmapsets": {
				if (!url.hash) {
					const id = sanitizeID(params[2]);
					return id ? { id, type: IDType.BEATMAP_SET } : null;
				}

				const [_, strId] = url.hash.split("/");
				if (!strId) {
					const id = sanitizeID(params[2]);
					return id ? { id, type: IDType.BEATMAP_SET } : null;
				}

				const id = sanitizeID(strId);
				return id ? { id, type: IDType.BEATMAP } : null;
			}
			case "s": {
				const id = sanitizeID(params[2]);
				return id ? { id, type: IDType.BEATMAP_SET } : null;
			}
			case "beatmaps":
			case "b": {
				const id = sanitizeID(params[2]);
				return id ? { id, type: IDType.BEATMAP } : null;
			}
		}

		return null;
	} catch {
		return null;
	}
}

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

export async function getBeatmapFromId(
	beatmapId: string,
	beatmapSetId?: string,
) {
	const beatmapsetId = beatmapSetId ?? (await getBeatmapsetId(beatmapId));
	if (!beatmapsetId)
		throw new Error(
			`Map(set) with id ${beatmapId ?? beatmapSetId} does not exist!!!`,
		);

	return await fetchBlobFromMirror(beatmapsetId);
}

export async function getBeatmapFromHash(hash: string) {
	const beatmapsetId = await getBeatmapsetIdFromHash(hash);
	if (!beatmapsetId) throw new Error(`Map with hash ${hash} does not exist!!!`);

	return await fetchBlobFromMirror(beatmapsetId);
}

const fetchBlobFromMirror = async (
	beatmapsetId: string | number,
	retry = 0,
) => {
	const mirrorConfig = inject<MirrorConfig>("config/mirror");
	if (!mirrorConfig) throw new Error("Mirror Config not initialized yet!!!");

	const {
		mirror: { urlTemplate },
	} = mirrorConfig;

	const allMirrors = [
		...document.querySelectorAll<HTMLInputElement>("[name=beatmapMirror]"),
	]
		.map((ele) => ({
			url: ele.dataset.url,
			rank: ele.dataset.rank as string,
			name: ele.value,
		}))
		.toSorted((a, b) => +a.rank - +b.rank);

	const configIndex = allMirrors.findIndex(
		(entry) => entry.url === urlTemplate.trim(),
	);
	const sortedMirrors = [
		allMirrors[configIndex],
		...allMirrors.slice(0, configIndex),
		{
			url: "https://beatmaps.akatsuki.gg/api/d/$setId",
			name: "Akatsuki",
			rank: -1,
		},
		...allMirrors.slice(configIndex + 1),
	];

	const selectedMirror = sortedMirrors[retry % allMirrors.length];
	inject<Loading>("ui/loading")?.setText(
		retry === 0
			? `Downloading with ${selectedMirror.name}`
			: `Retrying with ${selectedMirror.name}`,
	);

	try {
		inject<Loading>("ui/loading")?.setText("Getting beatmap...");
		const blob = await ky
			.get(
				selectedMirror.url?.replaceAll("$setId", beatmapsetId.toString()) ?? "",
				{
					headers: { Accept: "application/x-osu-beatmap-archive" },
					onDownloadProgress(progressEvent) {
						inject<Loading>("ui/loading")?.setText(
							retry === 0
								? `Downloading with ${selectedMirror.name}: ${(100 * (progressEvent.percent ?? 0)).toFixed(2)}%`
								: `Retrying with ${selectedMirror.name}: ${(100 * (progressEvent.percent ?? 0)).toFixed(2)}%`,
						);
					},
				},
			)
			.blob();

		return blob;
	} catch (e) {
		console.error(e);
		if (retry >= allMirrors.length) return null;
		return await fetchBlobFromMirror(beatmapsetId, retry + 1);
	}
};

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
