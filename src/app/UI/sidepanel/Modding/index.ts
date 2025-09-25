import { LayoutContainer } from "@pixi/layout/components";
import { Container, Text } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject, provide } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { defaultStyle } from "../Metadata";
import DifficultyGraph from "./DifficultyGraph";
import Spectrogram from "./Spectrogram";

export default class Modding {
	container: LayoutContainer;

	constructor() {
		this.container = new LayoutContainer({
			label: "modding",
			layout: {
				width: 360,
				flexDirection: "column",
				gap: 15,
				overflow: "scroll",
				borderWidth: 1,
				borderColor: [0, 0, 0, 0],
				flex: 1,
			},
		});

		const spectrogram = this.createEntry(
			"spectrogram",
			provide("ui/sidepanel/modding/spectrogram", new Spectrogram()).container,
		);

		const difficultyGraph = this.createEntry(
			"difficulty graph",
			provide("ui/sidepanel/modding/difficulty", new DifficultyGraph())
				.container,
		);

		this.container.addChild(spectrogram, difficultyGraph);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							width: 360,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							width: "100%",
						};
						break;
					}
				}
			},
		);
	}

	createEntry(label: string, children: Container) {
		const container = new Container({
			layout: {
				flexDirection: "column",
				width: "100%",
				gap: 10,
				flexShrink: 0
			},
		});

		const text = new Text({
			text: label,
			style: {
				...defaultStyle,
				fontSize: 14,
				fontWeight: "300",
				fill: inject<ColorConfig>("config/color")?.color.subtext1,
			},
			layout: {
				objectPosition: "top left",
				objectFit: "none",
				width: "100%",
				flexShrink: 0
			},
		});

		inject<ColorConfig>("config/color")?.onChange("color", ({ subtext1 }) => {
			text.style.fill = subtext1;
		});

		container.addChild(text, children);

		return container;
	}
}
