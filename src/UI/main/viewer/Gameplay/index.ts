import { LayoutContainer } from "@pixi/layout/components";
import { Container, Graphics, Rectangle } from "pixi.js";
import { provide } from "@/Context";

export default class Gameplay {
	container = new LayoutContainer({
		label: "gameplay",
		layout: {
			position: "absolute",
			width: "100%",
			height: "100%",
			flex: 1,
		},
		interactive: false,
		interactiveChildren: false
	});

	objectsContainer: Container;

	constructor() {
		this.objectsContainer = new Container({
			boundsArea: new Rectangle(0, 0, 512, 384),
		});

		this.container.addChild(this.objectsContainer);
		this.container.on("layout", () => {
			const width = this.container.layout?.computedLayout.width ?? 0;
			const height = this.container.layout?.computedLayout.height ?? 0;

			const scale = Math.min(width / 640, height / 480);
			const _w = 512 * scale;
			const _h = 384 * scale;

			this.objectsContainer.scale.set(scale);

			this.objectsContainer.x = (width - _w) / 2;
			this.objectsContainer.y = (height - _h) / 2;
		});
	}
}
