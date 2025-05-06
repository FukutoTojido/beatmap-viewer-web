import { BeatmapDecoder } from "osu-parsers";
import { type StandardBeatmap, StandardRuleset } from "osu-standard-stable";
import { inject, ScopedClass } from "../../Context";
import type { Beatmap as BeatmapData } from "osu-classes";
import type DrawableHitObject from "./HitObjects/DrawableHitObject";
import { Circle, Slider } from "osu-standard-stable";
import DrawableHitCircle from "./HitObjects/DrawableHitCircle";
import DrawableSlider from "./HitObjects/DrawableSlider";
import Audio from "../../Audio";
import type { Resource } from "..";
import { Assets, type Container } from "pixi.js";
import type Background from "../../UI/main/viewer/Background";

const decoder = new BeatmapDecoder();
const ruleset = new StandardRuleset();

export default class Beatmap extends ScopedClass {
	data: StandardBeatmap;
	audioContext: AudioContext;
	objects: DrawableHitObject[] = [];
	audio?: Audio;

	private loaded = false;

	constructor(private raw: string) {
		super();
		this.data = this.context.provide(
			"beatmap",
			ruleset.applyToBeatmap(decoder.decodeFromString(this.raw)),
		);
		this.audioContext = new AudioContext();
	}

	async load() {
		this.objects = this.data.hitObjects
			.map((object) => {
				if (object instanceof Circle)
					return new DrawableHitCircle(object).hook(this.context);
				if (object instanceof Slider)
					return new DrawableSlider(object).hook(this.context);
				return null;
			})
			.filter((object) => object !== null);

		const audioFile = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.data.general.audioFilename);
		if (!audioFile?.arrayBuffer)
			throw new Error("Cannot find audio in resource?");

		this.audio = new Audio(this.audioContext);
		await this.audio.createBufferNode(audioFile.arrayBuffer);
		this.audio.on("time", (time) => this.update(time));

		const objectContainer = inject<Container>(
			"ui/main/viewer/gameplay/objectContainer",
		);
		const containers = this.objects
			.toReversed()
			.map((object) => object.container);
		if (containers.length > 0) objectContainer?.addChild(...containers);

		const background = inject<Background>("ui/main/viewer/background");
		const backgroundResource = this.context
			.consume<Map<string, Resource>>("resources")
			?.get(this.data.events.backgroundPath ?? "");

        console.log(backgroundResource);
		if (backgroundResource?.blob) {
			const url = URL.createObjectURL(backgroundResource.blob);
			background?.updateTexture(
				await Assets.load({ src: url, loadParser: "loadTextures" }),
			);
		}

		this.loaded = true;
	}

	update(time: number) {
		if (!this.loaded)
			throw new Error("Cannot update a beatmap that hasn't been initialized");

		for (const object of this.objects) object.update(time);
	}
}
