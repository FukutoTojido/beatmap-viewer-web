import type Beatmap from "@/BeatmapSet/Beatmap";
import { inject } from "@/Context";
import { LayoutContainer } from "@pixi/layout/components";
import {
	Graphics,
	type ColorSource,
	type FederatedPointerEvent,
} from "pixi.js";

export default class ProgressBar {
	container = new LayoutContainer({
		layout: {
			flex: 1,
			height: "100%",
			backgroundColor: 0x11111b,
			alignItems: "center",
			justifyContent: "center",
			paddingInline: 30,
			overflow: "hidden"
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

	thumb = new Graphics()
		.rect(-1, -30, 2, 60)
		.moveTo(-6, -30)
		.lineTo(-1, -26)
		.lineTo(1, -26)
		.lineTo(6, -30)
		.lineTo(-6, -30)
		.moveTo(-6, 30)
		.lineTo(-1, 26)
		.lineTo(1, 26)
		.lineTo(6, 30)
		.lineTo(-6, 30)
		.fill(0xcdd6f4);

	timeline: Graphics;

	constructor() {
		this.timeline = new Graphics();
		this.timeline.interactive = false;

		this.container.addChild(this.line, this.thumb, this.timeline);
		this.thumb.x = 30;
		this.thumb.y = 30;

		this.timeline.x = 30;
		this.timeline.y = 20;

		this.container.on("layout", () => {
			this.thumb.y = (this.container.layout?.computedLayout.height ?? 0) / 2;

			this.timeline.scale.set(
				(this.container.layout?.computedLayout.width ?? 60) - 60,
				1,
			);
			this.timeline.y = (this.container.layout?.computedLayout.height ?? 0) / 2 - 10;
		});

		this.addEventHandler();
	}

	addEventHandler() {
		let isSeeking = false;

		const seekByPercentage = (event: FederatedPointerEvent) => {
			const beatmap = inject<Beatmap>("beatmap");

			const percentage = this.getPercentage(event);
			beatmap?.seek(
				percentage * (beatmap?.audio?.src?.buffer?.duration ?? 0) * 1000,
			);
		};

		this.container.addEventListener("pointerdown", (event) => {
			isSeeking = true;
			seekByPercentage(event);
		});

		this.container.addEventListener("pointermove", (event) => {
			if (!isSeeking) return;
			seekByPercentage(event);
		});

		this.container.addEventListener("pointerup", (event) => {
			isSeeking = false;
			// seekByPercentage(event);
		});
	}

	getPercentage(event: FederatedPointerEvent) {
		const { x } = event.getLocalPosition(this.container);
		const width = this.container.layout?.computedLayout.width;

		if (!width) return 0;
		return Math.min(1, Math.max(0, (x - 30) / (width - 60)));
	}

	setPercentage(percentage: number) {
		const width = (this.container.layout?.computedLayout.width ?? 60) - 60;
		if (!width) return;

		this.thumb.x = Math.round(30 + width * Math.min(1, Math.max(0, percentage)));
	}

	drawTimeline(
		points: {
			position: number;
			color: ColorSource;
		}[],
	) {
		this.timeline.clear();
		for (const { position, color } of points) {
			this.timeline
				.moveTo(position, 0)
				.lineTo(position, -12)
				.stroke({ color, alpha: 0.7, pixelLine: true });
		}
		this.container.addChild(this.line, this.thumb);
	}
}
