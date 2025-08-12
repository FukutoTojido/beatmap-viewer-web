import { LayoutContainer } from "@pixi/layout/components";
import { provide } from "@/Context";
import { BitmapText } from "pixi.js";

export default class FPS {
	container = new LayoutContainer({
		layout: {
			position: "absolute",
			bottom: 10,
			right: 10,
			padding: 8,
			width: 70,
			backgroundColor: [0, 0, 0, 0.7],
			borderRadius: 10,
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-end",
		},
	});

	constructor() {
		const fps = provide(
			"ui/main/viewer/gameplays/fps",
			new BitmapText({
				text: "0 fps",
				style: {
					fontFamily: "Rubik",
					fontWeight: "400",
					fill: 0xffffff,
					fontSize: 12,
					align: "right",
				},
				layout: {
					objectFit: "none",
					objectPosition: "center right",
				},
			}),
		);

		const frameTime = provide(
			"ui/main/viewer/gameplays/frametime",
			new BitmapText({
				text: "0 ms",
				style: {
					fontFamily: "Rubik",
					fontWeight: "400",
					fill: 0xffffff,
					fontSize: 12,
					align: "right",
				},
				layout: {
					objectFit: "none",
					objectPosition: "center right",
				},
			}),
		);

		this.container.addChild(fps, frameTime);
	}
}
