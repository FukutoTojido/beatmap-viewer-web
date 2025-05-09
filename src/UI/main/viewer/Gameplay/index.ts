import { LayoutContainer } from "@pixi/layout/components";
import { Container, Graphics, Rectangle } from "pixi.js";
import { provide } from "@/Context";

export default class Gameplay {
	container = new LayoutContainer({
		label: "gameplay",
		layout: {
			width: "100%",
			flex: 1,
		},
	});

	constructor() {
		const objectContainer = provide(
			"ui/main/viewer/gameplay/objectContainer",
			new Container({
				boundsArea: new Rectangle(0, 0, 512, 384),
			}),
		);

		this.container.addChild(objectContainer);
		this.container.on("layout", () => {
			const width = this.container.layout?.computedLayout.width ?? 0;
			const height = this.container.layout?.computedLayout.height ?? 0;

			const scale = Math.min(width / 640, height / 480);
			objectContainer.scale.set(scale);

			const _w = 512 * scale;
			const _h = 384 * scale;

			objectContainer.x = (width - _w) / 2;
            objectContainer.y = (height - _h) / 2;
		});
	}
}
