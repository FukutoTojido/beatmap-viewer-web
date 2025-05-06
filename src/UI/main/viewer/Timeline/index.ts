import { LayoutContainer } from "@pixi/layout/components";

export default class Timeline {
	container = new LayoutContainer({
		label: "timeline",
		layout: {
			width: "100%",
			height: 80,
			backgroundColor: 0x1e1e2e,
		},
	});
}
