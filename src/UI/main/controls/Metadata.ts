import { LayoutContainer } from "@pixi/layout/components";

export default class Metadata {
	container = new LayoutContainer({
		label: "metadata",
		layout: {
			aspectRatio: 1,
			height: "100%",
            backgroundColor: 0x181825,
			flexShrink: 0
		},
	});
}
