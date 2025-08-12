import { provide } from "../Context";
import BackgroundConfig from "./BackgroundConfig";
import ColorConfig from "./ColorConfig";
import MirrorConfig from "./MirrorConfig";
import RendererConfig from "./RendererConfig";
import TimelineConfig from "./TimelineConfig";

export default class Config {
	renderer: RendererConfig;
	mirror: MirrorConfig;
	timeline: TimelineConfig;
	background: BackgroundConfig;
	color: ColorConfig;

	constructor() {
		this.renderer = provide("config/renderer", new RendererConfig());
		this.mirror = provide("config/mirror", new MirrorConfig());
		this.timeline = provide("config/timeline", new TimelineConfig());
		this.background = provide("config/background", new BackgroundConfig());
		this.color = provide("config/color", new ColorConfig());
	}
}
