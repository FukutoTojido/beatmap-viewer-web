import { Assets, Texture } from "pixi.js";
import type { Resource } from "../ZipHandler";
import { parse } from "js-ini";
// @ts-ignore
import { getFileAudioBuffer } from "@soundcut/decode-audio-data-fast";
import { inject } from "@/Context";
import type SkinningConfig from "@/Config/SkinningConfig";
import type SkinManager from "./SkinManager";

type SkinConfig = {
	General: {
		Name: string;
		Author?: string;
		Version: number | string;
		AnimationFrameRate?: number;
		HitCircleOverlayAboveNumber?: 0 | 1;
		SliderBallFlip?: 0 | 1;
		Argon?: boolean;
	};
	Colours: {
		Combo1: string;
		Combo2: string;
		Combo3: string;
		Combo4: string;
		Combo5?: string;
		Combo6?: string;
		Combo7?: string;
		Combo8?: string;
		SliderBorder: string;
		SliderTrackOverride?: string;
	};
	Fonts: {
		HitCirclePrefix: string;
		HitCircleOverlap: number;
	};
};

export const BLANK_TEXTURE = new Texture();

export default class Skin {
	config: SkinConfig = {
		General: {
			Name: "Skin",
			Version: "latest",
			HitCircleOverlayAboveNumber: 1,
			SliderBallFlip: 1,
		},
		Colours: {
			Combo1: "255,192,0",
			Combo2: "0,202,0",
			Combo3: "18,124,255",
			Combo4: "242,24,57",
			SliderBorder: "255,255,255",
		},
		Fonts: {
			HitCirclePrefix: "default",
			HitCircleOverlap: -2,
		},
	};

	textures = new Map<string, Texture>();
	hitsounds = new Map<string, AudioBuffer>();
	colorsLength = 4;

	constructor(private resources?: Map<string, Resource>) {}

	async init() {
		await this.loadConfig();
		await Promise.all([this.loadTextures(), this.loadHitsounds()]);
	}

	private async loadConfig() {
		const configFile = await this.resources?.get("skin.ini")?.text();
		if (!configFile) return;

		const config = parse(configFile, {
			comment: ["//", "--", ";", "=="],
			delimiter: ":",
		});

		this.config = {
			General: {
				...this.config.General,
				...(config as SkinConfig).General,
			},
			Colours: {
				...this.config.Colours,
				...(config as SkinConfig).Colours,
			},
			Fonts: {
				...this.config.Fonts,
				...(config as SkinConfig).Fonts,
			},
		};

		// console.log(this.config);

		this.colorsLength = Object.keys(this.config.Colours).filter((key) =>
			/Combo[1-8]/g.test(key),
		).length;
	}

	private async loadTextures() {
		const defaults = [...Array(10)].map((_, idx) => `default-${idx}`);
		const filenames = [
			"approachcircle",
			...defaults,
			"followpoint",
			"timelinehitcircle",
			"hitcircle",
			"hitcircleoverlay",
			"hitcircleflash",
			"sliderb",
			"sliderb0",
			"slidernd",
			"sliderstartcircle",
			"sliderstartcircleoverlay",
			"sliderendcircle",
			"sliderendcircleoverlay",
			"sliderfollowcircle",
			"sliderscorepoint",
			"reversearrow",
			"repeat-edge-piece",
		];

		await Promise.all(
			[...filenames].map(async (filename) => {
				const blob =
					this.resources?.get(`${filename}@2x.png`) ??
					this.resources?.get(`${filename}.png`);
				const isHD = this.resources?.has(`${filename}@2x.png`);

				if (!blob) return;

				try {
					const texture = await Assets.load<Texture>({
						src: `${URL.createObjectURL(blob)}`,
						parser: "texture",
					});
					texture.source.resolution = isHD ? 2 : 1;
					texture.update();

					this.textures.set(filename, texture);
				} catch (e) {
					return;
				}
			}),
		);
	}

	private async loadHitsounds() {
		const audioContext = new AudioContext();
		const hitSounds = ["drum", "normal", "soft"]
			.map((hitSample) =>
				[
					"hitclap",
					"hitfinish",
					"hitnormal",
					"hitwhistle",
					"sliderslide",
					"slidertick",
					"sliderwhistle",
				].map((hitSound) => `${hitSample}-${hitSound}`),
			)
			.reduce((accm, curr) => {
				accm.push(...curr);
				return accm;
			}, []);

		await Promise.all(
			hitSounds.map(async (filename) => {
				let resource = this.resources?.get(`${filename}.wav`);
				if (!resource) {
					resource = this.resources?.get(`${filename}.ogg`);
				}
				if (!resource) return;

				let audioBuffer: AudioBuffer;
				try {
					audioBuffer = await audioContext.decodeAudioData(
						await resource.arrayBuffer(),
					);
				} catch (e) {
					// console.warn(`Cannot decode ${filename}. Default to silent sample.`);
					audioBuffer = audioContext.createBuffer(
						1,
						1,
						audioContext.sampleRate,
					);
					return;
				}
				this.hitsounds.set(filename, audioBuffer);
			}),
		);
	}

	getTexture(filename: string, beatmapSkin?: Skin): Texture | undefined {
		const disableBeatmapSkin =
			inject<SkinningConfig>("config/skinning")?.disableBeatmapSkin;

		if (disableBeatmapSkin || this.config.General.Argon)
			return (
				this.textures.get(filename) ??
				inject<SkinManager>("skinManager")?.defaultSkin?.textures.get(filename)
			);
		return (
			beatmapSkin?.textures.get(filename) ??
			this.textures.get(filename) ??
			inject<SkinManager>("skinManager")?.defaultSkin?.textures.get(filename)
		);
	}

	getHitsound(filename: string) {
		return this.hitsounds.get(filename);
	}
}
