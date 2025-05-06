import { LayoutContainer } from "@pixi/layout/components";
import FPS from "./FPS";
import { provide } from "/src/Context";
import Timeline from "./Timeline";
import Gameplay from "./Gameplay";
import Timestamp from "./Timestamp";
import Background from "./Background";

export default class Viewer {
	container = new LayoutContainer({
		label: "viewer",
		layout: {
			width: "100%",
			flex: 1,
			flexDirection: "column",
			backgroundColor: 0x11111b,
			borderColor: 0x585b70,
			borderWidth: 1,
			borderRadius: 20,
			overflow: "hidden",
		},
	});

	constructor() {
		const fps = new FPS();
		const timestamp = new Timestamp();
		const timeline = provide("ui/main/viewer/timeline", new Timeline());
		const gameplay = new Gameplay();
		const background = provide("ui/main/viewer/background", new Background());

		this.container.addChild(
			background.container,
			timeline.container,
			gameplay.container,
			timestamp.container,
			fps.container,
		);
	}
}
