import { LayoutContainer } from "@pixi/layout/components";
import Controls from "./controls";
import { inject, provide } from "@/Context";
import Viewer from "./viewer";
import type ResponsiveHandler from "@/ResponsiveHandler";
import type TimelineConfig from "@/Config/TimelineConfig";
import type BeatmapSet from "@/BeatmapSet";
import type Audio from "@/Audio";

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
			borderColor: { r: 0, g: 0, b: 0, a: 0 },
			borderWidth: 1,
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
							borderWidth: 1,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							gap: 0,
							borderWidth: 0,
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
