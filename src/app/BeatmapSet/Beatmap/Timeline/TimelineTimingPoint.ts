import type { TimingPoint } from "osu-classes";
import { Container, Graphics, Text } from "pixi.js";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import { DEFAULT_SCALE } from "@/UI/main/viewer/Timeline";

export default class TimelineTimingPoint {
	container: Container = new Container();

	constructor(public data: TimingPoint) {
		const graphics = new Graphics();

		const text = new Text({
			text: `${data.bpm.toFixed(0)}BPM`,
			style: {
				fontFamily: "Rubik",
				align: "center",
				fill: 0xffffff,
				fontSize: 10,
			},
			anchor: {
				x: 0,
				y: 1,
			},
			x: 5,
			y: 38,
		});

		const width = text.width;
		const height = text.height;

		graphics
			.rect(0, 40 - (height + 4), width + 10, height + 4)
			.fill(0xf54254)
			.moveTo(0, -40)
			.lineTo(0, 40)
			.stroke({
				color: 0xffffff,
				width: 2,
				cap: "round",
			});

		this.container.addChild(graphics, text);

		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;

		this.container.x = this.data.startTime / (DEFAULT_SCALE / scale);
		this.container.y = 40;

		inject<TimelineConfig>("config/timeline")?.onChange("scale", (newValue) => {
			this.container.x = this.data.startTime / (DEFAULT_SCALE / newValue);
		});
	}

	destroy() {
		this.container.destroy();
	}
}
