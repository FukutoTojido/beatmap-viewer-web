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
			borderColor: { r: 0, g: 0, b: 0, a: 0 },
			borderWidth: 1,
		},
	});

	constructor() {
		const controls = provide("ui/main/controls", new Controls());
		const viewer = provide("ui/main/viewer", new Viewer());

		this.container.addChild(viewer.container, controls.container);
	}
}
