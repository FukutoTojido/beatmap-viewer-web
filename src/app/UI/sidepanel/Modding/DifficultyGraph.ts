import { LayoutContainer } from "@pixi/layout/components";
import { Graphics, GraphicsContext } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";

export type StrainPoint = {
	time: number;
	strain: number;
};

export default class DifficultyGraph {
	container: LayoutContainer;
	graph = new Graphics();
	context = new GraphicsContext();

	_data: StrainPoint[] = [];

	get data() {
		return this._data;
	}

	set data(val: StrainPoint[]) {
		this._data = val;
		this.drawGraph();
	}

	constructor() {
		this.container = new LayoutContainer({
			layout: {
				width: "100%",
				aspectRatio: 2,
				backgroundColor: inject<ColorConfig>("config/color")?.color.crust,
				borderRadius: 10,
				overflow: "hidden",
				flexShrink: 0,
			},
		});

		this.container.addChild(this.graph);

		this.container?.on("layout", (layout) => {
			const { width, height } = layout.computedLayout;
			this.drawGraph(width, height);
		});

		this.graph.tint =
			inject<ColorConfig>("config/color")?.color.subtext0 ?? 0xffffff;

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ crust, subtext0 }) => {
				this.container.layout = {
					backgroundColor: crust,
				};
				this.graph.tint = subtext0;
			},
		);
	}

	drawGraph(width = 360, height = 180) {
		const newContext = new GraphicsContext();

		const maxStrain = Math.max(...this.data.map(({ strain }) => strain));
		const maxTime = this.data.at(-1)?.time ?? 1;

		for (let i = 0; i < 6; i++) {
			if (i === 0 || i === 5) continue;

			newContext.moveTo(i * (width / 5), height);
			newContext.lineTo(i * (width / 5), 0).stroke({
				color: 0xffffff,
				alpha: 0.2,
			});
		}

		for (let i = 0; i < 4; i++) {
			if (i === 0 || i === 3) continue;

			newContext.moveTo(0, i * (height / 3));
			newContext.lineTo(width, i * (height / 3)).stroke({
				color: 0xffffff,
				alpha: 0.2,
			});
		}

		newContext.moveTo(0, height);
		for (const { time, strain } of this.data) {
			newContext.lineTo(
				(time / maxTime) * width,
				-(strain / maxStrain) * height + height,
			);
		}

		newContext.moveTo(0, height);
		newContext.fill({ color: 0xffffff, alpha: 0.2 });
		newContext.stroke(0xffffff);

		this.graph.context = newContext;
		this.context.destroy();
		this.context = newContext;
	}
}
