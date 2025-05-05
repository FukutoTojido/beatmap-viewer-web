import { BlobReader, BlobWriter, ZipReader, type Entry } from "@zip.js/zip.js";
import type { Beatmap } from "osu-classes";
import { BeatmapDecoder } from "osu-parsers";

const beatmapDecoder = new BeatmapDecoder();

export default class BeatmapSet {
	private _isInit = false;
	private _entries?: Entry[];

	difficulties: Beatmap[] = [];
	resources: Map<
		string,
		{
			blob?: Blob;
			arrayBuffer?: ArrayBuffer;
		}
	> = new Map();

	constructor(private blob: Blob) {}

	async init() {
		const blobReader = new BlobReader(this.blob);
		const zipReader = new ZipReader(blobReader);
		this._entries = await zipReader.getEntries();
		this._isInit = true;
		zipReader.close();
	}

	async loadResources() {
		if (!this._isInit) throw new Error("You must init BeatmapSet!!!");
		const mediaFiles =
			this._entries?.filter(
				(file) => file.filename.split(".").at(-1) !== "osu",
			) ?? [];

		for (const file of mediaFiles) {
			const writer = new BlobWriter();

			const blob = await file.getData?.(writer);
			const arrayBuffer = await blob?.arrayBuffer();
			this.resources.set(file.filename, {
				blob,
				arrayBuffer,
			});
		}
	}

	async getDifficulties() {
		if (!this._isInit) throw new Error("You must init BeatmapSet!!!");
		const osuFiles =
			this._entries?.filter(
				(file) => file.filename.split(".").at(-1) === "osu",
			) ?? [];

		this.difficulties = (
			await Promise.all<Promise<Beatmap | null>[]>(
				osuFiles.map(async (file) => {
					const writer = new BlobWriter();
					const blob = await file.getData?.(writer);
					const rawString = await blob?.text();

					if (!rawString) return null;
					return beatmapDecoder.decodeFromString(rawString);
				}),
			)
		).filter((beatmap) => beatmap !== null);
	}
}
