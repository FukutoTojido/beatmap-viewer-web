import { provide } from "../Context";
import AudioConfig from "./AudioConfig";
import BackgroundConfig from "./BackgroundConfig";
import ColorConfig from "./ColorConfig";
import MirrorConfig from "./MirrorConfig";
import RendererConfig from "./RendererConfig";
import SkinningConfig from "./SkinningConfig";
import TimelineConfig from "./TimelineConfig";

export default class Config {
	renderer: RendererConfig;
	mirror: MirrorConfig;
	timeline: TimelineConfig;
	background: BackgroundConfig;
	skinning: SkinningConfig;
	audio: AudioConfig;
	color: ColorConfig;

	constructor() {
		this.renderer = provide("config/renderer", new RendererConfig());
		this.mirror = provide("config/mirror", new MirrorConfig());
		this.timeline = provide("config/timeline", new TimelineConfig());
		this.background = provide(
			"config/background",
			new BackgroundConfig({
				backgroundDim: 80,
				backgroundBlur: 0,
				storyboard: true,
				video: true,
			}),
		);
		this.audio = provide(
			"config/audio",
			new AudioConfig({
				masterVolume: 0.8,
				musicVolume: 0.5,
				effectVolume: 0.5,
				hitsound: false,
			}),
		);
		this.skinning = provide(
			"config/skinning",
			new SkinningConfig({
				skinningIdx: 0,
				disableBeatmapSkin: false,
			}),
		);
		this.color = provide("config/color", new ColorConfig());

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
	}
}
