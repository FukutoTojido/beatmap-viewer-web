import { provide } from "../Context";
import MirrorConfig from "./MirrorConfig";
import RendererConfig from "./RendererConfig";
import TimelineConfig from "./TimelineConfig";

export default class Config {
	renderer: RendererConfig;
	mirror: MirrorConfig;
	timeline: TimelineConfig;

	constructor() {
		this.renderer = provide("config/renderer", new RendererConfig());
		this.mirror = provide("config/mirror", new MirrorConfig());
		this.timeline = provide("config/timeline", new TimelineConfig());
	}
}
