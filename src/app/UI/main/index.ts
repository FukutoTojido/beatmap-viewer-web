import { LayoutContainer } from "@pixi/layout/components";
import type BeatmapSet from "@/BeatmapSet";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject, provide } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import Controls from "./controls";
import Viewer from "./viewer";

export default class Main {
	container = new LayoutContainer({
		label: "main",
		layout: {
			flex: 1,
			height: "100%",
			boxSizing: "border-box",
			flexDirection: "column",
			gap: 10,
			overflow: "hidden",
		},
	});

	constructor() {
		const controls = provide("ui/main/controls", new Controls());
		const viewer = provide("ui/main/viewer", new Viewer());

		this.container.addChild(viewer.container, controls.container);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							gap: 10,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							gap: 0,
						};
						break;
					}
				}
			},
		);

		this.container.addEventListener(
			"wheel",
			(event) => {
				if (event.altKey) {
					return;
				}

				if (event.ctrlKey) {
					inject<TimelineConfig>("config/timeline")?.handleWheel(event);
					return;
				}

				inject<BeatmapSet>("beatmapset")?.handleWheel(event);
			},
			{
				capture: true,
				passive: false,
			},
		);
	}
}
