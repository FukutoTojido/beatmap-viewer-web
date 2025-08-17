import { LayoutContainer } from "@pixi/layout/components";
import FPS from "./FPS";
import { inject, provide } from "@/Context";
import Timeline from "./Timeline";
import Gameplay from "./Gameplay";
import Background from "./Background";
import type ResponsiveHandler from "@/ResponsiveHandler";
import Gameplays from "./Gameplay/Gameplays";
import type ColorConfig from "@/Config/ColorConfig";

export default class Viewer {
	container = new LayoutContainer({
		label: "viewer",
		layout: {
			width: "100%",
			flex: 1,
			flexDirection: "column",
			backgroundColor: [0, 0, 0, 0.2],
			borderRadius: 20,
			overflow: "hidden",
		},
			interactive: true
	});

	constructor() {
		const timeline = provide("ui/main/viewer/timeline", new Timeline());
		const gameplays = provide("ui/main/viewer/gameplays", new Gameplays());
		const background = provide("ui/main/viewer/background", new Background());

		this.container.addChild(
			background.container,
			timeline.container,
			gameplays.container,
		);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							borderRadius: 20,
							flex: 1,
							aspectRatio: undefined,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							flex: undefined,
							borderRadius: 0,
							// aspectRatio: 4 / 3,
						};
						break;
					}
				}
			},
		);
	}
}
