import { LayoutContainer } from "@pixi/layout/components";
import FPS from "./FPS";

export default class Viewer {
	container = new LayoutContainer({
		label: "viewer",
		layout: {
			width: "100%",
			flex: 1,
			backgroundColor: 0x11111b,
			borderColor: 0x585b70,
			borderWidth: 1,
			borderRadius: 20,
			overflow: "hidden",
		},
	});

	constructor() {
		const fps = new FPS();
		this.container.addChild(fps.container);
	}
}
