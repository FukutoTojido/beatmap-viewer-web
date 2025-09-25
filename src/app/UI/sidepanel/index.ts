import { LayoutContainer } from "@pixi/layout/components";
import { Assets, Sprite, Text } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject, provide } from "@/Context";
import type { Game } from "@/Game";
import type ResponsiveHandler from "@/ResponsiveHandler";
import type State from "@/State";
import type { SidebarState } from "@/State";
import ZContainer from "../core/ZContainer";
import Metadata from "./Metadata";
import Modding from "./Modding";
import Timing from "./Timing";

export default class SidePanel {
	tabs = [
		{
			title: "Metadata",
			content: provide("ui/sidepanel/metadata", new Metadata()),
		},
		{
			title: "Timing",
			content: provide("ui/sidepanel/timing", new Timing()),
		},
		{
			title: "Modding",
			content: provide("ui/sidepanel/modding", new Modding()),
		},
	];

	header = new LayoutContainer({
		label: "header",
		layout: {
			width: "100%",
			alignItems: "center",
			justifyContent: "space-between",
		},
	});

	tabSwitcher = new LayoutContainer({
		label: "tab switcher",
		layout: {
			gap: 5,
			flex: 1,
		},
	});

	container = new ZContainer({
		label: "side panel",
		layout: {
			width: 0,
			height: "100%",
			backgroundColor: inject<ColorConfig>("config/color")?.color.mantle,
			borderRadius: 20,
			flexDirection: "column",
			justifyContent: "flex-start",
			boxSizing: "border-box",
			overflow: "hidden",
			padding: 20,
			paddingInline: 0,
			gap: 20,
			// borderWidth: 1,
			borderColor: [0, 0, 0, 0],
		},
	});

	headers: LayoutContainer[];

	constructor() {
		this.container.alphaFilter.alpha = 0;
		this.headers = this.tabs.map(({ title }, idx) => {
			const container = new LayoutContainer({
				layout: {
					width: "intrinsic",
					paddingInline: 50,
					height: 40,
					alignItems: "center",
					flexShrink: 0,
					borderRadius: 10,
					backgroundColor: inject<ColorConfig>("config/color")?.color.base,
				},
				cursor: "pointer",
			});
			const text = new Text({
				text: title,
				style: {
					fontFamily: "Rubik",
					fontSize: 14,
					fill: inject<ColorConfig>("config/color")?.color.text,
					fontWeight: "400",
					align: "center",
				},
				layout: {
					objectFit: "none",
				},
			});

			container.addChild(text);
			container.addEventListener("pointertap", () => {
				this.switchTab(idx);
			});

			inject<ColorConfig>("config/color")?.onChange(
				"color",
				({ base, text: textColor }) => {
					container.layout = { backgroundColor: base };
					text.style.fill = textColor;
				},
			);

			return container;
		});
		this.tabSwitcher.addChild(...this.headers);

		const closeButtonContainer = new LayoutContainer({
			layout: {
				width: 30,
				height: 30,
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "rgba(0, 0, 0, 0)",
			},
		});

		const closeButton = new Sprite({
			width: 20,
			height: 20,
			layout: {
				width: 20,
				height: 20,
			},
		});

		(async () => {
			closeButton.texture = await Assets.load({
				src: "./assets/x.png",
				parser: "texture",
			});

			closeButton.tint =
				inject<ColorConfig>("config/color")?.color.text ?? 0xffffff;
		})();

		inject<ColorConfig>("config/color")?.onChange("color", ({ text }) => {
			closeButton.tint = text;
		});

		closeButtonContainer.cursor = "pointer";
		closeButtonContainer.addEventListener("click", () => this.closeSidePanel());
		closeButtonContainer.addEventListener("tap", () => this.closeSidePanel());

		closeButtonContainer.addChild(closeButton);

		this.header.addChild(this.tabSwitcher, closeButtonContainer);
		this.container.addChild(this.header);
		this.index = 0;

		this.switchTab(0);

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ mantle, surface1, base }) => {
				this.container.layout = {
					backgroundColor: mantle,
				};

				for (let i = 0; i < this.headers.length; i++) {
					if (i === this.index) {
						this.headers[i].layout = {
							backgroundColor: surface1,
						};
					} else {
						this.headers[i].layout = {
							backgroundColor: base,
						};
					}
				}
			},
		);

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = {
							position: "relative",
							width: inject<Game>("game")?.state.sidebar === "CLOSED" ? 0 : 400,
							height: "100%",
							padding: 20,
						};
						break;
					}
					case "portrait": {
						this.container.layout = {
							position: "absolute",
							bottom: 0,
							width: "100%",
							height:
								inject<Game>("game")?.state.sidebar === "CLOSED" ? 0 : "70%",
							padding:
								inject<Game>("game")?.state.sidebar === "CLOSED" ? 1 : 20,
						};
						break;
					}
				}
			},
		);

		inject<State>("state")?.on("sidebar", (newState) =>
			this.handleState(newState),
		);
	}

	handleState(state: SidebarState) {
		const direction =
			inject<ResponsiveHandler>("responsiveHandler")?.direction ?? "landscape";

		const ANIMATION_DURATION = 200;

		switch (state) {
			case "OPENED": {
				if (direction === "landscape") {
					this.container.triggerAnimation(
						"width",
						this.container.layout?.computedLayout.width ?? 0,
						400,
						(val) => {
							this.container.layout = { width: val };
						},
						ANIMATION_DURATION,
					);
				}

				if (direction === "portrait") {
					this.container.triggerAnimation(
						"height",
						0,
						70,
						(val) => {
							this.container.layout = { height: `${val}%` };
						},
						ANIMATION_DURATION,
					);
					this.container.triggerAnimation(
						"paddingAll",
						0,
						20,
						(val) => {
							this.container.layout = { padding: val };
						},
						ANIMATION_DURATION,
					);
				}

				this.container.triggerAnimation(
					"padding",
					0,
					20,
					(val) => {
						this.container.layout = { paddingInline: val };
					},
					ANIMATION_DURATION,
				);

				this.container.triggerAnimation(
					"opacity",
					this.container.alphaFilter.alpha,
					1,
					(val) => {
						this.container.alphaFilter.alpha = val;
					},
					ANIMATION_DURATION,
				);

				break;
			}
			case "CLOSED": {
				if (direction === "landscape") {
					this.container.triggerAnimation(
						"width",
						this.container.layout?.computedLayout.width ?? 400,
						0,
						(val) => {
							this.container.layout = { width: val };
						},
						ANIMATION_DURATION,
					);
				}

				if (direction === "portrait") {
					this.container.triggerAnimation(
						"height",
						70,
						0,
						(val) => {
							this.container.layout = { height: `${val}%` };
						},
						ANIMATION_DURATION,
					);
					this.container.triggerAnimation(
						"paddingAll",
						20,
						0,
						(val) => {
							this.container.layout = { padding: val };
						},
						ANIMATION_DURATION,
					);
				}

				this.container.triggerAnimation(
					"padding",
					20,
					0,
					(val) => {
						this.container.layout = { paddingInline: val };
					},
					ANIMATION_DURATION,
				);

				this.container.triggerAnimation(
					"opacity",
					this.container.alphaFilter.alpha,
					0,
					(val) => {
						this.container.alphaFilter.alpha = val;
					},
					ANIMATION_DURATION,
				);

				break;
			}
		}
	}

	closeSidePanel() {
		const game = inject<Game>("game");
		game?.state.toggleSidebar("CLOSED");
	}

	private index: number;
	switchTab(index: number) {
		this.container.removeChild(this.tabs[this.index].content.container);
		this.headers[this.index].layout = {
			backgroundColor: inject<ColorConfig>("config/color")?.color.base,
		};
		this.index = index;

		this.container.addChild(this.tabs[this.index].content.container);
		this.headers[this.index].layout = {
			backgroundColor: inject<ColorConfig>("config/color")?.color.surface1,
		};
	}
}
