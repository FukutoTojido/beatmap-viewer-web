import { LayoutContainer } from "@pixi/layout/components";
import {
	type ColorSource,
	type FederatedPointerEvent,
	Graphics,
} from "pixi.js";
import type Audio from "@/Audio";
import type BeatmapSet from "@/BeatmapSet";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";

export default class ProgressBar {
	container = new LayoutContainer({
		layout: {
			flex: 1,
			height: "100%",
			backgroundColor: inject<ColorConfig>("config/color")?.color.crust,
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
			backgroundColor: inject<ColorConfig>("config/color")?.color.surface0,
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
		.fill(inject<ColorConfig>("config/color")?.color.text);

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

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ crust, surface0, text }) => {
				this.container.layout = { backgroundColor: crust };
				this.line.layout = { backgroundColor: surface0 };
				this.thumb
					.clear()
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
					.fill(text);
			},
		);
	}

	isSeeking = false;
	addEventHandler() {
		const seekByPercentage = (event: FederatedPointerEvent, smooth = false) => {
			const beatmapset = inject<BeatmapSet>("beatmapset");
			const audio = beatmapset?.context.consume<Audio>("audio");

			const percentage = this.getPercentage(event);

			if (beatmapset) {
				beatmapset._currentNextTick = percentage * (audio?.duration ?? 0);
			}

			if (!smooth) {
				beatmapset?._currentTween?.stop();
				beatmapset?.seek(percentage * (audio?.duration ?? 0));
			}
			if (smooth) {
				beatmapset?.smoothSeek(percentage * (audio?.duration ?? 0), 100);
			}
		};

		this.container.addEventListener("pointerdown", (event) => {
			this.isSeeking = true;
			seekByPercentage(event, true);
		});

		this.container.addEventListener("pointermove", (event) => {
			if (!this.isSeeking) return;
			seekByPercentage(event, false);
		});

		this.container.addEventListener("pointerup", () => {
			this.isSeeking = false;
		});

		this.container.addEventListener("pointerupoutside", () => {
			this.isSeeking = false;
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
		breaks: {
			start: number;
			end: number;
		}[] = [],
	) {
		this.timeline.clear();

		for (const { start, end } of kiai) {
			this.timeline
				.rect(start, 8, end - start, 4)
				.fill({ color: 0xffd978, alpha: 0.7 });
		}

		for (const { start, end } of breaks) {
			this.timeline
				.rect(start, 8, end - start, 4)
				.fill({ color: 0xffffff, alpha: 0.3 });
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
