// @ts-ignore
import { getFileAudioBuffer } from "@soundcut/decode-audio-data-fast";
import type { Context } from "tone";
import { inject } from "../Context";
import type SkinManager from "../Skinning/SkinManager";
import type { Resource } from "../ZipHandler";

const HITSOUND_REGEX =
	/(normal|soft|drum)-(hitnormal|hitwhistle|hitclap|hitfinish|slidertick|sliderwhistle|sliderslide)([1-9][0-9]*)?/;

export default class SampleManager {
	private map = new Map<string, AudioBuffer>();

	constructor(
		private audioContext: Context | AudioContext,
		private files: Map<string, Resource>,
	) {}

	async load() {
		await Promise.all(
			[...this.files].map(async ([filename, resource]) => {
				if (!HITSOUND_REGEX.test(filename)) return;
				if (!resource) return;

				let audioBuffer: AudioBuffer;

				try {
					audioBuffer = await this.audioContext.decodeAudioData(
						await resource.arrayBuffer(),
					);
				} catch (e) {
					// console.warn(
					// 	`Cannot decode ${filename}. Default to silent sample.`,
					// );
					audioBuffer = this.audioContext.createBuffer(
						1,
						1,
						this.audioContext.sampleRate,
					);
					return;
				}

				const key = filename.split(".").slice(0, -1).join(".");
				this.map.set(key, audioBuffer);
			}),
		);
	}

	get(sampleSet: string, hitSound: string, idx: number) {
		const skinManager = inject<SkinManager>("skinManager");

		const key = `${sampleSet}-${hitSound}${idx === 1 ? "" : idx}`;
		const fallbackKey = `${sampleSet}-${hitSound}`;
		const currentSkin = skinManager?.currentSkin;
		const defaultSkin = skinManager?.defaultSkin;

		if (idx === 0)
			return (
				currentSkin?.getHitsound(fallbackKey) ??
				defaultSkin?.getHitsound(fallbackKey)
			);
		return (
			this.map.get(key) ??
			currentSkin?.getHitsound(fallbackKey) ??
			defaultSkin?.getHitsound(fallbackKey)
		);
	}
}
