import type FullscreenConfig from "@/Config/FullscreenConfig";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import ZContainer from "@/UI/core/ZContainer";
import Button from "./Button";

export default class Zoomer {
	container = new ZContainer({
		label: "zoomer",
		layout: {
			height: 80,
			width: 40,
			flexDirection: "column",
		},
	});

	constructor() {
		const zoomIn = new Button("./assets/plus.png", () => {
			const timeline = inject<TimelineConfig>("config/timeline");

			if (!timeline) return;
			timeline.scale = Math.min(1.5, timeline.scale + 0.1);
		});
		const zoomOut = new Button("./assets/minus.png", () => {
			const timeline = inject<TimelineConfig>("config/timeline");

			if (!timeline) return;
			timeline.scale = Math.min(1.5, timeline.scale - 0.1);
		});

		this.container.addChild(zoomIn.container, zoomOut.container);

		inject<FullscreenConfig>("config/fullscreen")?.onChange(
			"fullscreen",
			(isFullscreen) => {
				if (isFullscreen) {
					this.container.renderable = false;
				}

				if (!isFullscreen) {
					this.container.renderable = true;
				}
			},
		);
	}
}
