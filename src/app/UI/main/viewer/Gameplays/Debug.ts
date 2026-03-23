import type { LayoutOptions } from "@pixi/layout";
import { LayoutContainer } from "@pixi/layout/components";
import { BitmapText, type TextStyleOptions } from "pixi.js";
import { provide } from "@/Context";

export default class Debug {
	container = new LayoutContainer({
		layout: {
			position: "absolute",
			bottom: 10,
			left: 10,
			padding: 8,
			width: 160,
			backgroundColor: [0, 0, 0, 0.7],
			borderRadius: 10,
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
		},
	});

	constructor() {
		const style: TextStyleOptions = {
			fontFamily: "Rubik",
			fontWeight: "400",
			fill: 0xffffff,
			fontSize: 12,
			align: "left",
		};
		const layout: Omit<LayoutOptions, "target"> = {
			objectFit: "none",
			objectPosition: "center left",
		};
		
		const duration = provide(
			"ui/main/viewer/gameplays/debug/duration",
			new BitmapText({
				text: "Duration: 0ms",
				style,
				layout
			}),
		);
	
		this.container.addChild(duration);
	}
}
