import { LayoutContainer, LayoutText } from "@pixi/layout/components";
import Metadata from "./Metadata";
import ZContainer from "../core/ZContainer";
import { Assets, Sprite, Text } from "pixi.js";
import { inject, provide } from "@/Context";
import type { Game } from "@/Game";
import type ResponsiveHandler from "@/ResponsiveHandler";

export default class SidePanel {
	tabs = [
		{
			title: "Metadata",
			content: provide("ui/sidepanel/metadata", new Metadata()),
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
			backgroundColor: 0x181825,
			borderColor: 0x585b70,
			borderWidth: 1,
			borderRadius: 20,
			flexDirection: "column",
			justifyContent: "flex-start",
			boxSizing: "border-box",
			overflow: "hidden",
			padding: 20,
			paddingInline: 0,
			gap: 20,
		},
	});

	constructor() {
		this.container.alphaFilter.alpha = 0;
		const tabs = this.tabs.map(({ title }) => {
			const container = new LayoutContainer({
				layout: {
					width: "intrinsic",
					paddingInline: 50,
					height: 40,
					backgroundColor: 0x313244,
					borderColor: 0x585b70,
					borderWidth: 1,
					borderRadius: 10,
					alignItems: "center",
					flexShrink: 0,
				},
			});
			const text = new Text({
				text: title,
				style: {
					fontFamily: "Rubik",
					fontSize: 14,
					fill: 0xcdd6f4,
					fontWeight: "400",
					align: "center",
				},
				layout: {
					objectFit: "none",
				},
			});

			container.addChild(text);
			return container;
		});
		this.tabSwitcher.addChild(...tabs);

		const closeButtonContainer = new LayoutContainer({
			layout: {
				width: 30,
				height: 30,
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "rgba(0, 0, 0, 0)"
			}
		})

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
				loadParser: "loadTextures",
			});
		})();

		closeButtonContainer.cursor = "pointer";
		closeButtonContainer.addEventListener("click", () => this.closeSidePanel());
		closeButtonContainer.addEventListener("tap", () => this.closeSidePanel());

		closeButtonContainer.addChild(closeButton);

		this.header.addChild(this.tabSwitcher, closeButtonContainer);
		this.container.addChild(this.header, this.tabs[0].content.container);

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
	}

	closeSidePanel() {
		const game = inject<Game>("game");
		game?.state.toggleSidebar("CLOSED");
	}
}
