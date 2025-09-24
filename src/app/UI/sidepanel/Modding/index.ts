import { inject, provide } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { Container, Text } from "pixi.js";
import Spectrogram from "./Spectrogram";
import type ColorConfig from "@/Config/ColorConfig";
import { defaultStyle } from "../Metadata";

export default class Modding {
	container: Container;

	constructor() {
		this.container = new Container({
			layout: {
				width: 360,
                flexDirection: "column",
                gap: 15
			},
		});

		const spectrogram = this.createEntry(
			"spectrogram",
			provide("ui/sidepanel/modding/spectrogram", new Spectrogram()).container,
		);

		this.container.addChild(spectrogram);

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
				gap: 10,
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
			},
		});

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ subtext1 }) => {
				text.style.fill = subtext1;
			},
		);

		container.addChild(text, children);

		return container;
	}
}
