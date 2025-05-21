import type BeatmapSet from "@/BeatmapSet";
import type Beatmap from "@/BeatmapSet/Beatmap";
import { inject } from "@/Context";
import type Audio from "@/Audio";
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
			overflow: "hidden",
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
			this.timeline.y =
				(this.container.layout?.computedLayout.height ?? 0) / 2 - 10;
		});

		this.addEventHandler();
	}

	addEventHandler() {
		let isSeeking = false;

		const seekByPercentage = (event: FederatedPointerEvent) => {
			const beatmapset = inject<BeatmapSet>("beatmapset");
			const audio = beatmapset?.context.consume<Audio>("audio");

			const percentage = this.getPercentage(event);
			beatmapset?.seek(percentage * (audio?.duration ?? 0));
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

		this.thumb.x = Math.round(
			30 + width * Math.min(1, Math.max(0, percentage)),
		);
	}

	drawTimeline(
		points: ({
			position: number;
			color: ColorSource;
		} | null)[],
		kiai: {
			start: number;
			end: number;
		}[],
	) {
		this.timeline.clear();

		for (const { start, end } of kiai) {
			this.timeline
				.rect(start, 8, end - start, 4)
				.fill({ color: 0xffd978, alpha: 0.7 });
		}

		for (const point of points) {
			if (!point) continue;
			const { position, color } = point;
			this.timeline
				.moveTo(position, 0)
				.lineTo(position, -12)
				.stroke({ color, alpha: 0.7, pixelLine: true });
		}
		this.container.addChild(this.line, this.timeline, this.thumb);
	}
}
