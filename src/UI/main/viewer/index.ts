import { LayoutContainer } from "@pixi/layout/components";
import FPS from "./FPS";
import { inject, provide } from "@/Context";
import Timeline from "./Timeline";
import Gameplay from "./Gameplay";
import Background from "./Background";
import type ResponsiveHandler from "@/ResponsiveHandler";
import Gameplays from "./Gameplay/Gameplays";

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
		const timeline = provide("ui/main/viewer/timeline", new Timeline());
		const gameplays = provide("ui/main/viewer/gameplays", new Gameplays());
		const background = provide("ui/main/viewer/background", new Background());

		this.container.addChild(
			background.container,
			// timeline.container,
			gameplays.container,
			fps.container,
		);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							borderWidth: 1,
							borderRadius: 20,
							flex: 1,
							aspectRatio: undefined,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							borderWidth: 0,
							borderRadius: 0,
							flex: undefined,
							aspectRatio: 4 / 3,
						};
						break;
					}
				}
			},
		);
	}
}
