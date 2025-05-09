import { LayoutContainer } from "@pixi/layout/components";
import { provide } from "@/Context";
import { BitmapText } from "pixi.js";

export default class Timestamp {
	container = new LayoutContainer({
		layout: {
			position: "absolute",
			bottom: 0,
			left: 0,
			padding: 20,
			flexDirection: "column",
			alignItems: "flex-end",
		},
	});

	constructor() {
		const timestamp = provide(
			"ui/main/viewer/timestamp",
			new BitmapText({
				text: "0",
				style: {
					fontFamily: "Rubik",
					fontWeight: "400",
					fill: 0xcdd6f4,
					fontSize: 12,
					align: "left",
				},
				layout: {
                    width: "100%",
					objectFit: "none",
					objectPosition: "center left",
				},
			}),
		);

		this.container.addChild(timestamp);
	}
}
