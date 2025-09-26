import { LayoutContainer } from "@pixi/layout/components";
import type BeatmapSet from "@/BeatmapSet";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject, provide } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import Controls from "./controls";
import Viewer from "./viewer";
import Easings from "../Easings";

export default class Main {
	container = new LayoutContainer({
		label: "main",
		layout: {
			position: "relative",
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
				const isFullscreen =
					inject<FullscreenConfig>("config/fullscreen")?.fullscreen;
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							gap: isFullscreen ? 0 : 10,
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

		inject<FullscreenConfig>("config/fullscreen")?.onChange(
			"fullscreen",
			(isFullscreen) => {
				const direction =
					inject<ResponsiveHandler>("responsiveHandler")?.direction;
				this.container.layout = {
					gap: isFullscreen || direction === "portrait" ? 0 : 10,
				};
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

		this.container.addEventListener("pointermove", (event) => {
			if (!inject<FullscreenConfig>("config/fullscreen")?.fullscreen) return;
			if (
				inject<ResponsiveHandler>("responsiveHandler")?.direction === "portrait"
			)
				return;

			const pos = this.container.toLocal(event.global);
			const height = this.container.layout?.computedLayout.height ?? 0;
			const shouldShowControls = height - pos.y < 60;

			if (shouldShowControls === controls.open) return;
			controls.open = shouldShowControls;

			if (controls.open) {
				controls.container.visible = true;
				controls.container.triggerAnimation(
					"height",
					controls.container.layout?.computedLayout.height ?? 0,
					60,
					(val) => {
						controls.container.layout = { height: val };
					},
					200,
					Easings.InOut,
				);
			}

			if (!controls.open) {
				controls.container.triggerAnimation(
					"height",
					controls.container.layout?.computedLayout.height ?? 60,
					0,
					(val) => {
						controls.container.layout = { height: val };
					},
					200,
					Easings.InOut,
					() => {
						controls.container.visible = false;
					}
				);
			}
		});
	}
}
