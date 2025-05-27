import { BlobReader, BlobWriter, ZipReader, type Entry } from "@zip.js/zip.js";
import Beatmap from "./Beatmap";
import { inject, provide, ScopedClass } from "../Context";
import SampleManager from "./SampleManager";
import Audio from "@/Audio";

import type { Resource } from "../ZipHandler";
import type Metadata from "@/UI/sidepanel/Metadata";
import type Play from "@/UI/main/controls/Play";
import { Assets, type FederatedWheelEvent } from "pixi.js";
import Video from "@/Video";
import type Background from "@/UI/main/viewer/Background";
import type Gameplay from "@/UI/main/viewer/Gameplay";
import type Gameplays from "@/UI/main/viewer/Gameplay/Gameplays";
import type Timeline from "@/UI/main/viewer/Timeline";
import type DrawableHitCircle from "./Beatmap/HitObjects/DrawableHitCircle";
import type DrawableSlider from "./Beatmap/HitObjects/DrawableSlider";
import type ProgressBar from "@/UI/main/controls/ProgressBar";
import type { DifficultyPoint, SamplePoint, TimingPoint } from "osu-classes";
import type Timing from "@/UI/sidepanel/Timing";
import type Timestamp from "@/UI/main/controls/Timestamp";
import type TimelineConfig from "@/Config/TimelineConfig";
import type { Tween } from "@tweenjs/tween.js";
import Easings from "@/UI/Easings";
import { tweenGroup } from "@/UI/animation/AnimationController";
import type Loading from "@/UI/loading";
import Storyboard from "./Beatmap/Storyboard";

export default class BeatmapSet extends ScopedClass {
	difficulties: Beatmap[] = [];
	audioContext = new AudioContext();

	constructor(private resources: Map<string, Resource>) {
		super();
		this.context.provide("audioContext", this.audioContext);
		this.context.provide("resources", resources);
		this.context.provide("beatmapset", this);

		provide("beatmapset", this);
		requestAnimationFrame(() => this.frame());
	}

	async loadResources() {
		inject<Loading>("ui/loading")?.setText("Loading hitSamples");
		inject<Loading>("ui/loading")?.on();

		console.time("Load hitSamples");
		const sampleManager = this.context.provide(
			"sampleManager",
			new SampleManager(this.audioContext, this.resources),
		);
		await sampleManager.loadDefaults();
		await sampleManager.load();
		console.timeEnd("Load hitSamples");
		inject<Loading>("ui/loading")?.off();

		await this.loadStoryboard();
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

		inject<Loading>("ui/loading")?.setText("Loading audio");

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
			!(
				videoResource &&
				new URLSearchParams(window.location.search).get("v") === "true"
			)
		)
			return;

		inject<Loading>("ui/loading")?.setText("Loading video");

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

	backgroundKey: string | null = null;
	async loadBackground(beatmap: Beatmap) {
		if (this.backgroundKey === beatmap.data.events.backgroundPath) return;

		this.backgroundKey = beatmap.data.events.backgroundPath;
		const background = inject<Background>("ui/main/viewer/background");
		const backgroundResource = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(beatmap.data.events.backgroundPath ?? "");

		if (!backgroundResource) return;

		inject<Loading>("ui/loading")?.setText("Loading background");

		const url = URL.createObjectURL(backgroundResource);
		background?.updateTexture(
			await Assets.load({ src: url, loadParser: "loadTextures" }),
		);

		document.body.style.backgroundImage = `url("${url}")`;
	}

	async loadStoryboard() {
		const storyboardKey = this.context
			.consume<Map<string, Resource>>("resources")
			?.keys()
			.find((key) => key.includes(".osb"));
		if (!storyboardKey) return;

		const storyboardFile = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(storyboardKey);

		const storyboard = this.context.provide(
			"storyboard",
			// biome-ignore lint/style/noNonNullAssertion: I found it already cmon!
			new Storyboard(storyboardFile!),
		);
		storyboard.hook(this.context);
		await storyboard.loadTextures();
		inject<Background>("ui/main/viewer/background")?.injectStoryboardContainer(
			storyboard.container,
		);
		await storyboard.loadCurrent();
	}

	async loadMaster(idx: number) {
		const beatmap = this.difficulties[idx];
		if (!beatmap) return;
		if (this.master === beatmap) return;

		inject<Loading>("ui/loading")?.on();

		if (this.master) {
			this.master.destroy();
			inject<Gameplays>("ui/main/viewer/gameplays")?.removeGameplay(
				this.master.container,
			);
		}

		const storyboard = this.context.consume<Storyboard>("storyboard");

		await Promise.all([
			this.loadAudio(beatmap),
			this.loadVideo(beatmap),
			this.loadBackground(beatmap),
			storyboard?.loadMaster(beatmap.raw),
		]);

		storyboard?.checkRemoveBG();
		storyboard?.sortChildren();

		inject<Loading>("ui/loading")?.setText("Loading hitObjects");

		beatmap.loadTimingPoints();
		beatmap.loadHitObjects();

		beatmap.load();

		inject<Metadata>("ui/sidepanel/metadata")?.updateMetadata(
			beatmap.data.metadata,
		);

		inject<Gameplays>("ui/main/viewer/gameplays")?.addGameplay(
			beatmap.container,
		);

		inject<Timeline>("ui/main/viewer/timeline")?.loadObjects(
			beatmap.objects as (DrawableHitCircle | DrawableSlider)[],
		);

		beatmap.seek(this.context.consume<Audio>("audio")?.currentTime ?? 0);
		beatmap.toggle();

		this.master = beatmap;
		inject<Loading>("ui/loading")?.off();
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

		audio.currentTime = time;

		this.master?.seek(audio.currentTime);
		for (const slave of this.slaves) {
			slave.seek(audio.currentTime);
		}

		this.context.consume<Video>("video")?.seek(audio.currentTime);
	}

	cacheBPM?: TimingPoint;
	cacheSV?: DifficultyPoint;
	cacheSample?: SamplePoint;

	frame() {
		if (!this.master) return requestAnimationFrame(() => this.frame());

		const audio = this.context.consume<Audio>("audio");
		if (!audio) return requestAnimationFrame(() => this.frame());

		const time = audio.currentTime;

		this.master?.frame(time);
		for (const slave of this.slaves) {
			slave.frame(time);
		}

		const timestamp = inject<Timestamp>("ui/main/controls/timestamp");
		timestamp?.updateDigit(time);

		const currentBPM = this.master.data.controlPoints.timingPointAt(time);
		const currentSV = this.master.data.controlPoints.difficultyPointAt(time);
		const currentSample = this.master.data.controlPoints.samplePointAt(time);

		if (
			this.cacheBPM !== currentBPM ||
			this.cacheSV !== currentSV ||
			this.cacheSample !== currentSample
		) {
			const time = Math.max(
				currentBPM.startTime,
				currentSV.startTime,
				currentSample.startTime,
			);
			inject<Timing>("ui/sidepanel/timing")?.scrollToTimingPoint(time);
		}

		if (this.cacheBPM !== currentBPM) {
			this.cacheBPM = currentBPM;
			timestamp?.updateBPM(currentBPM.bpm);
			inject<Timeline>("ui/main/viewer/timeline")?.updateTimingPoint(
				currentBPM,
			);
		}

		if (this.cacheSV !== currentSV) {
			this.cacheSV = currentSV;
			timestamp?.updateSliderVelocity(currentSV.sliderVelocity);
		}

		if (this.cacheSample !== currentSample) {
			this.cacheSample = currentSample;
		}

		inject<ProgressBar>("ui/main/controls/progress")?.setPercentage(
			time / audio.duration,
		);
		inject<Timeline>("ui/main/viewer/timeline")?.update(time);
		inject<Timeline>("ui/main/viewer/timeline")?.draw(time);

		this.context.consume<Storyboard>("storyboard")?.update(time);

		requestAnimationFrame(() => this.frame());
	}

	private _currentNextTick?: number;
	private _currentTween?: Tween;
	handleWheel(event: FederatedWheelEvent) {
		if (this._currentTween) {
			this._currentTween.stop();
		}

		const audio = this.context.consume<Audio>("audio");
		if (!audio) return;

		const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
		if (direction === 0) return;

		if (!this._currentNextTick) this._currentNextTick = audio.currentTime;

		const nextTick = this.getNextStep(direction);
		this._currentNextTick = Math.max(0, nextTick);

		this.seek(nextTick);
	}

	getNextStep(direction: -1 | 1, from?: number) {
		const audio = this.context.consume<Audio>("audio");
		if (!audio || !this.master) return 0;

		const currentTime = from ?? audio.currentTime;
		const timingPoint =
			this.master.data.controlPoints.timingPointAt(currentTime);
		const divisor = inject<TimelineConfig>("config/timeline")?.divisor ?? 1;

		const beatLength = timingPoint.beatLength / divisor;

		const nextTick =
			timingPoint.startTime +
			(direction +
				Math.floor((currentTime - timingPoint.startTime) / beatLength) +
				0.00000001) *
				beatLength;

		return nextTick;
	}
}
