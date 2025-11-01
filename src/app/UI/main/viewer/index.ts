import { LayoutContainer } from "@pixi/layout/components";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import { inject, provide } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import Background from "./Background";
import Gameplays from "./Gameplay/Gameplays";
import Timeline from "./Timeline";
import Zoomer from "./Timeline/Zoomer";
import Beatsnap from "./Timeline/Beatsnap";

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
		interactive: true,
	});

	constructor() {
		const timeline = provide("ui/main/viewer/timeline", new Timeline());
		const zoomer = provide("ui/main/viewer/zoomer", new Zoomer());
		const beatsnap = provide("ui/main/viewer/beatsnap", new Beatsnap());
		const gameplays = provide("ui/main/viewer/gameplays", new Gameplays());
		const background = provide("ui/main/viewer/background", new Background());

		const wrapper = new LayoutContainer({
			layout: {
				width: "100%",
				height: 80,
				backgroundColor: {
					r: 0,
					g: 0,
					b: 0,
					a: 0.8,
				},
			},
		});

		wrapper.addChild(timeline.container, zoomer.container, beatsnap.container);

		this.container.addChild(background.container, wrapper, gameplays.container);

		inject<FullscreenConfig>("config/fullscreen")?.onChange(
			"fullscreen",
			(isFullscreen) => {
				const direction =
					inject<ResponsiveHandler>("responsiveHandler")?.direction;
				this.container.layout = {
					borderRadius: isFullscreen || direction === "portrait" ? 0 : 20,
				};

				wrapper.layout = {
					height: isFullscreen ? (direction === "portrait" ? 80 : 0) : 80,
				};
			},
		);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				const isFullscreen =
					inject<FullscreenConfig>("config/fullscreen")?.fullscreen;
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							borderRadius: isFullscreen ? 0 : 20,
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

				wrapper.layout = {
					height: isFullscreen ? (direction === "portrait" ? 80 : 0) : 80,
				};
			},
		);
	}
}
