import { LayoutContainer } from "@pixi/layout/components";
import Controls from "./controls";
import { provide } from "/src/Context";
import Viewer from "./viewer";

export default class Main {
	container = new LayoutContainer({
		label: "main",
		layout: {
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
	}
}
