import { LayoutContainer } from "@pixi/layout/components";
import { provide } from "/src/Context";
import Timestamp from "./Timestamp";
import Metadata from "./Metadata";

export default class Controls {
	container = new LayoutContainer({
		label: "controls",
		layout: {
			width: "100%",
			height: 60,
			flexGrow: 0,
			backgroundColor: 0x11111b,
            flexDirection: "row",
			borderColor: 0x585b70,
			borderWidth: 1,
			borderRadius: 20,
			overflow: "hidden",
		},
	});

	constructor() {
		const timestamp = provide("ui/main/controls/timestamp", new Timestamp());
		const metadata = provide("ui/main/controls/metadata", new Metadata());
		this.container.addChild(timestamp.container, metadata.container);
	}
}
