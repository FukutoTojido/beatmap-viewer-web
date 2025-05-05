import { LayoutContainer } from "@pixi/layout/components";

export default class Timestamp {
	container = new LayoutContainer({
		label: "timestamp",
		layout: {
			width: 150,
			height: "100%",
			backgroundColor: 0x1e1e2e,
		},
	});
}
