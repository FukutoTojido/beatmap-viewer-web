import { LayoutContainer } from "@pixi/layout/components";
import { inject, provide } from "@/Context";
import Timestamp from "./Timestamp";
import Metadata from "./Metadata";
import type ResponsiveHandler from "@/ResponsiveHandler";
import Play from "./Play";
import ProgressBar from "./ProgressBar";
import type ColorConfig from "@/Config/ColorConfig";

export default class Controls {
	container = new LayoutContainer({
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

	constructor() {
		const timestamp = provide("ui/main/controls/timestamp", new Timestamp());
		const metadata = provide("ui/main/controls/metadata", new Metadata());
		const play = provide("ui/main/controls/play", new Play());
		const progressBar = provide("ui/main/controls/progress", new ProgressBar());

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
		);

		this.container.addChild(timestamp.container, restContainer);

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ crust, surface2 }) => {
				this.container.layout = {
					backgroundColor: crust,
				};
			},
		);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							borderRadius: 20,
							flexDirection: "row",
							height: 60,
						};
						restContainer.layout = {
							flex: 1,
							height: "100%",
						};
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
						break;
					}
				}
			},
		);
	}
}
