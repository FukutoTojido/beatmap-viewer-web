import { LayoutContainer } from "@pixi/layout/components";

export default class Timeline {
	container = new LayoutContainer({
		label: "timeline",
		layout: {
			width: "100%",
			height: 80,
			backgroundColor: {
				r: 30,
				g: 30,
				b: 46,
				a: 0.8,
			},
		},
	});
}
