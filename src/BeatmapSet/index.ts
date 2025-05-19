import { BlobReader, BlobWriter, ZipReader, type Entry } from "@zip.js/zip.js";
import Beatmap from "./Beatmap";
import { inject, provide, ScopedClass } from "../Context";
import SampleManager from "./SampleManager";
import Audio from "@/Audio";

import type { Resource } from "../ZipHandler";
import type Metadata from "@/UI/sidepanel/Metadata";
import type Play from "@/UI/main/controls/Play";
import { Assets } from "pixi.js";
import Video from "@/Video";
import type Background from "@/UI/main/viewer/Background";
import type Gameplay from "@/UI/main/viewer/Gameplay";
import type Gameplays from "@/UI/main/viewer/Gameplay/Gameplays";

export default class BeatmapSet extends ScopedClass {
	difficulties: Beatmap[] = [];
	audioContext = new AudioContext();

	constructor(private resources: Map<string, Resource>) {
		super();
		this.context.provide("audioContext", this.audioContext);
		this.context.provide("resources", resources);

		provide("beatmapset", this);
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

	master?: Beatmap;
	slaves: Set<Beatmap> = new Set();

	audioKey = "";
	async loadAudio(beatmap: Beatmap) {
		if (beatmap.data.general.audioFilename === this.audioKey) return;

		this.audioKey = beatmap.data.general.audioFilename;
		console.time("Constructing audio");
		const audioFile = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.audioKey);

		if (!audioFile) throw new Error("Cannot find audio in resource?");

		const audio = this.context.provide(
			"audio",
			new Audio(this.audioContext).hook(this.context),
		);
		await audio.createBufferNode(audioFile);

		console.timeEnd("Constructing audio");
	}

	videoKey = "";
	async loadVideo(beatmap: Beatmap) {
		const videoFilePath =
			beatmap.data.events.storyboard?.layers.get("Video")?.elements.at(0)
				?.filePath ?? "";

		if (this.videoKey === videoFilePath) return;

		this.videoKey = videoFilePath;
		const videoResource = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(
				beatmap.data.events.storyboard?.layers.get("Video")?.elements.at(0)
					?.filePath ?? "",
			);

		if (
			videoResource &&
			new URLSearchParams(window.location.search).get("v") === "true"
		) {
			const video = this.context.provide("video", new Video());
			try {
				await video.load(
					videoResource,
					beatmap.data.events.storyboard?.layers.get("Video")?.elements.at(0)
						?.startTime ?? 0,
				);
			} catch (e) {
				console.error(e);
			}
		}
	}

	backgroundKey: string | null = null;
	async loadBackground(beatmap: Beatmap) {
		if (this.backgroundKey === beatmap.data.events.backgroundPath) return;

		this.backgroundKey = beatmap.data.events.backgroundPath;
		const background = inject<Background>("ui/main/viewer/background");
		const backgroundResource = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(beatmap.data.events.backgroundPath ?? "");

		if (backgroundResource) {
			const url = URL.createObjectURL(backgroundResource);
			background?.updateTexture(
				await Assets.load({ src: url, loadParser: "loadTextures" }),
			);
		}
	}

	async loadMaster(idx: number) {
		const beatmap = this.difficulties[idx];
		if (!beatmap) return;

		await Promise.all([
			this.loadAudio(beatmap),
			this.loadVideo(beatmap),
			this.loadBackground(beatmap),
		]);

		beatmap.loadTimingPoints();
		beatmap.loadHitObjects();

		beatmap.load();

		inject<Metadata>("ui/sidepanel/metadata")?.updateMetadata(
			beatmap.data.metadata,
		);

		this.master = beatmap;
		inject<Gameplays>("ui/main/viewer/gameplays")?.addGameplay(
			beatmap.container,
		);
	}

	loadSlave(idx: number) {
		const beatmap = this.difficulties[idx];
		if (!beatmap) return;
		if (beatmap === this.master || this.slaves.has(beatmap)) return;

		beatmap.loadHitObjects();
		beatmap.load();

		this.slaves.add(beatmap);
		inject<Gameplays>("ui/main/viewer/gameplays")?.addGameplay(
			beatmap.container,
		);
	}

	toggle() {
		const playButton = inject<Play>("ui/main/controls/play");

		const audio = this.context.consume<Audio>("audio");
		audio?.toggle();

		this.master?.toggle();
		for (const slave of this.slaves) {
			slave.toggle();
		}

		if (audio?.state === "PLAYING") {
			this.context.consume<Video>("video")?.play(audio?.currentTime);
		}

		if (audio?.state === "STOPPED") {
			this.context.consume<Video>("video")?.stop(audio?.currentTime);
		}

		if (playButton) {
			switch (this.context.consume<Audio>("audio")?.state) {
				case "PLAYING": {
					(async () => {
						playButton.sprite.texture = await Assets.load("./assets/pause.png");
					})();
					break;
				}
				case "STOPPED": {
					(async () => {
						playButton.sprite.texture = await Assets.load("./assets/play.png");
					})();
					break;
				}
			}
		}
	}

	seek(time: number) {
		const audio = this.context.consume<Audio>("audio");
		if (!audio) throw new Error("Audio hasn't been initialized");

		this.master?.seek(time);
		for (const slave of this.slaves) {
			slave.seek(time);
		}

		audio.currentTime = time;
		this.context.consume<Video>("video")?.seek(audio?.currentTime);
	}
}
