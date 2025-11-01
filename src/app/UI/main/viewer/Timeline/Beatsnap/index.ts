import { LayoutContainer } from "@pixi/layout/components";
import { Assets, Container, Text } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { defaultStyle } from "@/UI/sidepanel/Metadata";
import Button from "./Button";

export default class Beatsnap {
	container: LayoutContainer;

	constructor() {
		this.container = new LayoutContainer({
			layout: {
				width: 160,
				height: 80,
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				paddingInline: 20,
				paddingBlock: 5,
				gap: 5,
				backgroundColor: inject<ColorConfig>("config/color")?.color.mantle,
			},
		});

		const text = new Text({
			text: "Beat Snap Divisor",
			style: {
				...defaultStyle,
				fontSize: 14,
				fontWeight: "500",
				align: "center",
				fill: inject<ColorConfig>("config/color")?.color.text,
			},
			layout: {
				objectFit: "none",
				width: "100%",
			},
		});

		const divisorText = new Text({
			text: `1/${inject<TimelineConfig>("config/timeline")?.divisor ?? 4}`,
			style: {
				...defaultStyle,
				wordWrap: false,
				fontSize: 14,
				fill: inject<ColorConfig>("config/color")?.color.text,
			},
			layout: {
				objectFit: "none",
			},
		});

		const divisorDown = new Button("./assets/left.png", () => {
			const timeline = inject<TimelineConfig>("config/timeline");
			if (!timeline) return;

			timeline.divisor = Math.min(
				16,
				timeline.divisor === 9
					? 12
					: timeline.divisor === 12
						? 16
						: timeline.divisor + 1,
			);
		});

		const divisorUp = new Button("./assets/right.png", () => {
			const timeline = inject<TimelineConfig>("config/timeline");
			if (!timeline) return;

			timeline.divisor = Math.max(
				1,
				timeline.divisor === 16
					? 12
					: timeline.divisor === 12
						? 9
						: timeline.divisor - 1,
			);
		});

		const divisorContainer = new Container({
			layout: {
				width: "100%",
				justifyContent: "space-between",
				alignItems: "center",
			},
		});

		this.container.addChild(text, divisorContainer);
		divisorContainer.addChild(
			divisorDown.container,
			divisorText,
			divisorUp.container,
		);

		inject<FullscreenConfig>("config/fullscreen")?.onChange(
			"fullscreen",
			(isFullscreen) => {
				if (isFullscreen) {
					this.container.renderable = false;
				}

				if (!isFullscreen) {
					this.container.renderable = true;
				}
			},
		);

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ mantle, text: color }) => {
				this.container.layout = { backgroundColor: mantle };
				text.style.fill = color;
				divisorText.style.fill = color;
			},
		);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				if (direction === "landscape") {
					text.visible = true;
					this.container.layout = { width: 160 };
					divisorContainer.layout = { flexDirection: "row", height: undefined };

					Assets.load("./assets/left.png").then((texture) => {
						divisorDown.sprite.texture = texture;
					});

					Assets.load("./assets/right.png").then((texture) => {
						divisorUp.sprite.texture = texture;
					});

					return;
				}

				if (direction === "portrait") {
					text.visible = false;
					this.container.layout = { width: 40 };
					divisorContainer.layout = { flexDirection: "column", height: "100%" };

					Assets.load("./assets/up.png").then((texture) => {
						divisorDown.sprite.texture = texture;
					});

					Assets.load("./assets/down.png").then((texture) => {
						divisorUp.sprite.texture = texture;
					});

					return;
				}
			},
		);

		inject<TimelineConfig>("config/timeline")?.onChange("divisor", (val) => {
			divisorText.text = `1/${val}`;
		});
	}
}
