import { BlobReader, BlobWriter, ZipReader, type Entry } from "@zip.js/zip.js";
import Beatmap from "./Beatmap";
import { ScopedClass } from "../Context";
import SampleManager from "./SampleManager";

import type { Resource } from "../ZipHandler";

export default class BeatmapSet extends ScopedClass {
	difficulties: Beatmap[] = [];
	audioContext = new AudioContext();

	constructor(private resources: Map<string, Resource>) {
		super();
		this.context.provide("audioContext", this.audioContext);
		this.context.provide("resources", resources);
	}

	async loadResources() {
		console.time("Load hitSamples");
		const sampleManager = this.context.provide(
			"sampleManager",
			new SampleManager(this.audioContext, this.resources),
		);
		await sampleManager.loadDefaults();
		await sampleManager.load();
		console.timeEnd("Load hitSamples");
	}

	async getDifficulties() {
		const osuFiles =
			[...this.resources].filter(
				([filename]) => filename.split(".").at(-1) === "osu",
			) ?? [];

		this.difficulties = (
			await Promise.all<Promise<Beatmap | null>[]>(
				osuFiles.map(async ([_, blob]) => {
					const rawString = await blob?.text();

					if (!rawString) return null;
					return new Beatmap(rawString).hook(this.context);
				}),
			)
		).filter((beatmap) => beatmap !== null);
	}
}
