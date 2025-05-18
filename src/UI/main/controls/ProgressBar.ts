import { LayoutContainer } from "@pixi/layout/components";
import { Graphics, type FederatedPointerEvent } from "pixi.js";

export default class ProgressBar {
	container = new LayoutContainer({
		layout: {
			flex: 1,
			height: "100%",
			backgroundColor: 0x181825,
			alignItems: "center",
			justifyContent: "center",
			paddingInline: 30,
		},
	});

	line = new LayoutContainer({
		layout: {
			height: 4,
			width: "100%",
			backgroundColor: 0x313244,
			borderRadius: 4,
		},
	});

	thumb = new Graphics().roundRect(-2, -15, 4, 30, 4).fill(0xcdd6f4);

	currentPercentage = 0;

	constructor() {
		this.container.addChild(this.line, this.thumb);
		this.thumb.x = 30;
		this.thumb.y = 30;

		this.container.on("layout", () => {
			this.thumb.y = (this.container.layout?.computedLayout.height ?? 0) / 2;
		});
	}

	getPercentage(event: FederatedPointerEvent) {
		const { x } = event.getLocalPosition(this.container);
		const width = this.container.layout?.computedLayout.width;

		if (!width) return 0;
		return Math.min(1, Math.max(0, (x - 30) / (width - 60)));
	}

	setPercentage(percentage: number) {
		this.currentPercentage = percentage;
		const width = (this.container.layout?.computedLayout.width ?? 60) - 60;
		if (!width) return;

		this.thumb.x = 30 + width * Math.min(1, Math.max(0, percentage));
	}
}
