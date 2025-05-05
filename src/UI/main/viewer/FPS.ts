import { LayoutContainer } from "@pixi/layout/components";
import { provide } from "/src/Context";
import { BitmapText } from "pixi.js";

export default class FPS {
	container = new LayoutContainer({
		layout: {
			position: "absolute",
			bottom: 0,
			right: 0,
			padding: 20,
			flexDirection: "column",
			alignItems: "flex-end",
		},
	});

	constructor() {
		const fps = provide(
			"ui/main/viewer/fps",
			new BitmapText({
				text: "0 fps",
				style: {
					fontFamily: "Rubik",
					fontWeight: "400",
					fill: 0xcdd6f4,
					fontSize: 12,
					align: "right",
				},
				layout: {
                    width: "100%",
					objectFit: "none",
					objectPosition: "center right",
				},
			}),
		);

		const frameTime = provide(
			"ui/main/viewer/frametime",
			new BitmapText({
				text: "0 ms",
				style: {
					fontFamily: "Rubik",
					fontWeight: "400",
					fill: 0xcdd6f4,
					fontSize: 12,
					align: "right",
				},
				layout: {
                    width: "100%",
					objectFit: "none",
					objectPosition: "center right",
				},
			}),
		);

		this.container.addChild(fps, frameTime);
	}
}
