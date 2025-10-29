import { provide } from "../Context";
import AudioConfig, { type AudioProps } from "./AudioConfig";
import BackgroundConfig, { type BackgroundProps } from "./BackgroundConfig";
import ColorConfig from "./ColorConfig";
import ExperimentalConfig, {
	type ExperimentalProps,
} from "./ExperimentalConfig";
import FullscreenConfig from "./FullscreenConfig";
import GameplayConfig, { type GameplayProps } from "./GameplayConfig";
import MirrorConfig, { type MirrorProps } from "./MirrorConfig";
import RendererConfig, { type RendererProps } from "./RendererConfig";
import SkinningConfig, { type SkinningProps } from "./SkinningConfig";
import TimelineConfig, { type TimelineProps } from "./TimelineConfig";

type Configs = {
	renderer: RendererProps;
	mirror: MirrorProps;
	timeline: TimelineProps;
	background: BackgroundProps;
	skinning: SkinningProps;
	audio: AudioProps;
	experimental: ExperimentalProps;
	gameplay: GameplayProps;
};

export default class Config {
	renderer: RendererConfig;
	mirror: MirrorConfig;
	timeline: TimelineConfig;
	background: BackgroundConfig;
	skinning: SkinningConfig;
	audio: AudioConfig;
	color: ColorConfig;
	experimental: ExperimentalConfig;
	fullscreen: FullscreenConfig;
	gameplay: GameplayConfig;

	constructor() {
		const savedSettings = this.loadSettings();

		this.renderer = provide(
			"config/renderer",
			new RendererConfig(savedSettings?.renderer ?? {
				antialiasing: true
			}),
		);
		this.mirror = provide(
			"config/mirror",
			new MirrorConfig(savedSettings?.mirror),
		);
		this.timeline = provide(
			"config/timeline",
			new TimelineConfig(savedSettings?.timeline),
		);
		this.background = provide(
			"config/background",
			new BackgroundConfig(
				savedSettings?.background ?? {
					backgroundDim: 60,
					backgroundBlur: 0,
					storyboard: true,
					video: true,
					breakSection: false,
				},
			),
		);
		this.audio = provide(
			"config/audio",
			new AudioConfig(
				savedSettings?.audio ?? {
					masterVolume: 0.8,
					musicVolume: 0.5,
					effectVolume: 0.5,
					hitsound: false,
				},
			),
		);
		this.skinning = provide(
			"config/skinning",
			new SkinningConfig(
				savedSettings?.skinning ?? {
					skinningIdx: 0,
					disableBeatmapSkin: false,
				},
			),
		);
		this.color = provide("config/color", new ColorConfig());
		this.experimental = provide(
			"config/experimental",
			new ExperimentalConfig(
				savedSettings?.experimental ?? {
					asyncLoading: true,
					overlapGameplays: false,
				},
			),
		);
		this.fullscreen = provide(
			"config/fullscreen",
			new FullscreenConfig({
				fullscreen: false,
			}),
		);
		this.gameplay = provide(
			"config/gameplay",
			new GameplayConfig(
				savedSettings?.gameplay ?? {
					showGrid: true,
					hitAnimation: true,
					snakeInSlider: true,
					snakeOutSlider: true,
				},
			),
		);

		const overlay = document.querySelector<HTMLDivElement>("#overlay");
		const settings = document.querySelector<HTMLDivElement>("#settings");
		if (overlay) {
			overlay.addEventListener("click", () => {
				overlay?.classList.add("overlayHidden");
				overlay?.classList.remove("overlay");
				settings?.classList.remove("show");
			});
		}

		const button = document.querySelector<HTMLButtonElement>("#settingsButton");
		if (button) {
			button.addEventListener("click", () => {
				settings?.classList.add("show");
				overlay?.classList.add("overlay");
				overlay?.classList.remove("overlayHidden");
			});
		}

		document.addEventListener("keydown", (event) => {
			if (event.key.toLowerCase() !== "o" || !event.ctrlKey) return;

			event.preventDefault();
			settings?.classList.toggle("show");
			overlay?.classList.toggle("overlay");
			overlay?.classList.toggle("overlayHidden");
		});
	}

	loadSettings(): Configs | null {
		return JSON.parse(localStorage.getItem("josuSettings") ?? "null");
	}

	saveSettings() {
		localStorage.setItem(
			"josuSettings",
			JSON.stringify({
				audio: this.audio.jsonify(),
				background: this.background.jsonify(),
				mirror: this.mirror.jsonify(),
				renderer: this.renderer.jsonify(),
				skinning: this.skinning.jsonify(),
				timeline: this.timeline.jsonify(),
				experimental: this.experimental.jsonify(),
				gameplay: this.gameplay.jsonify(),
			}),
		);
	}
}
