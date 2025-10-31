import { LayoutContainer } from "@pixi/layout/components";
import type ColorConfig from "@/Config/ColorConfig";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import { inject, provide } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import Fullscreen from "./Fullscreen";
import Metadata from "./Metadata";
import Play from "./Play";
import ProgressBar from "./ProgressBar";
import Timestamp from "./Timestamp";
import ZContainer from "@/UI/core/ZContainer";

export default class Controls {
	container = new ZContainer({
		label: "controls",
		layout: {
			width: "100%",
			height: 60,
			flexGrow: 0,
			backgroundColor: inject<ColorConfig>("config/color")?.color.crust,
			flexDirection: "row",
			borderRadius: 20,
			overflow: "hidden",
		},
	});

	open = false;

	constructor() {
		const timestamp = provide("ui/main/controls/timestamp", new Timestamp());
		const metadata = provide("ui/main/controls/metadata", new Metadata());
		const play = provide("ui/main/controls/play", new Play());
		const progressBar = provide("ui/main/controls/progress", new ProgressBar());
		const fullscreen = provide("ui/main/controls/fullscreen", new Fullscreen());

		const restContainer = provide(
			"ui/main/controls/rest",
			new LayoutContainer({
				layout: {
					flex: 1,
					height: "100%",
				},
			}),
		);
		restContainer.addChild(
			metadata.container,
			play.container,
			progressBar.container,
			fullscreen.container,
		);

		this.container.addChild(timestamp.container, restContainer);

		this.container.addEventListener("pointertap", (event) => {
			event.stopPropagation();
		});

		inject<ColorConfig>("config/color")?.onChange("color", ({ crust }) => {
			this.container.layout = {
				backgroundColor: crust,
			};
		});

		inject<FullscreenConfig>("config/fullscreen")?.onChange(
			"fullscreen",
			(isFullscreen) => {
				const direction =
					inject<ResponsiveHandler>("responsiveHandler")?.direction;

				this.container.layout = {
					position:
						isFullscreen && direction === "landscape" ? "absolute" : "relative",
					borderRadius: isFullscreen || direction === "portrait" ? 0 : 20,
					bottom: isFullscreen ? 0 : undefined,
					height:
						isFullscreen && direction === "landscape"
							? 0
							: direction === "portrait"
								? "auto"
								: 60,
				};
				this.container.visible = !isFullscreen;
				this.open = !isFullscreen;
				this.container.alpha = direction === "portrait" && isFullscreen ? 0 : 1;
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
							flexDirection: "row",
							height: 60,
						};
						restContainer.layout = {
							flex: 1,
							height: "100%",
						};
						this.container.layout = {
							position: isFullscreen ? "absolute" : "relative",
						};
						this.container.visible = !isFullscreen;
						this.open = !isFullscreen;
						this.container.alpha = 1;
						break;
					}
					case "portrait": {
						this.container.layout = {
							borderRadius: 0,
							flexDirection: "column",
							height: "auto",
						};
						restContainer.layout = {
							flex: undefined,
							height: 60,
						};

						this.container.layout = {
							position: "relative",
						};
						this.container.visible = !isFullscreen;
						this.open = !isFullscreen;
						this.container.alpha = isFullscreen ? 0 : 1;
						break;
					}
				}
			},
		);
	}
}
