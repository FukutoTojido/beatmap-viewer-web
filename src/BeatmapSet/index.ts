import { BlobReader, BlobWriter, ZipReader, type Entry } from "@zip.js/zip.js";
import Beatmap from "./Beatmap";
import { ScopedClass } from "../Context";
import SampleManager from "./SampleManager";

export type Resource = Blob | undefined;

export default class BeatmapSet extends ScopedClass {
	private _isInit = false;
	private _entries?: Entry[];

	difficulties: Beatmap[] = [];
	audioContext = new AudioContext();

	constructor(private blob: Blob) {
		super();
		this.context.provide("audioContext", this.audioContext);
	}

	async init() {
		const blobReader = new BlobReader(this.blob);
		const zipReader = new ZipReader(blobReader);
		this._entries = await zipReader.getEntries();
		this._isInit = true;
		zipReader.close();
	}

	async loadResources() {
		if (!this._isInit) throw new Error("You must init BeatmapSet!!!");
		console.time("Load resources");
		const mediaFiles =
			this._entries?.filter(
				(file) => file.filename.split(".").at(-1) !== "osu",
			) ?? [];

		const resources: Map<string, Resource> = new Map();

		for (const file of mediaFiles) {
			const writer = new BlobWriter();

			const blob = await file.getData?.(writer);
			resources.set(file.filename, blob);
		}
		console.timeEnd("Load resources");

		this.context.provide("resources", resources);

		console.time("Load hitSamples");
		const sampleManager = this.context.provide("sampleManager", new SampleManager(this.audioContext, resources));
		await sampleManager.loadDefaults();
		await sampleManager.load();
		console.timeEnd("Load hitSamples");
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
					return new Beatmap(rawString).hook(this.context);
				}),
			)
		).filter((beatmap) => beatmap !== null);
	}
}
