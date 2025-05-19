import { LayoutContainer } from "@pixi/layout/components";
import { type Container, Graphics, Rectangle } from "pixi.js";
import { provide } from "@/Context";

export default class Gameplay {
	container = new LayoutContainer({
		label: "gameplay",
		layout: {
			width: "100%",
			flex: 1,
		},
	});

	containers: Set<Container> = new Set();

	addContainer(container: Container) {
		this.containers.add(container);
		this.container.addChildAt(container, 0);

		const width = this.container.layout?.computedLayout.width ?? 0;
		const height = this.container.layout?.computedLayout.height ?? 0;

		const scale = Math.min(width / 640, height / 480);
		const _w = 512 * scale;
		const _h = 384 * scale;

		container.scale.set(scale);

		container.x = (width - _w) / 2;
		container.y = (height - _h) / 2;
	}

	constructor() {
		this.container.on("layout", () => {
			const width = this.container.layout?.computedLayout.width ?? 0;
			const height = this.container.layout?.computedLayout.height ?? 0;

			const scale = Math.min(width / 640, height / 480);
			const _w = 512 * scale;
			const _h = 384 * scale;

			for (const container of this.containers) {
				container.scale.set(scale);

				container.x = (width - _w) / 2;
				container.y = (height - _h) / 2;
			}
		});
	}
}
