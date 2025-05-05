import { LayoutContainer, LayoutText } from "@pixi/layout/components";
import Metadata from "./Metadata";
import ZContainer from "../core/ZContainer";
import { Text } from "pixi.js";

export default class SidePanel {
	tabs = [
		{
			title: "Metadata",
			content: new Metadata(),
		},
	];

	tabSwitcher = new LayoutContainer({
		label: "tab switcher",
		layout: {
			gap: 5,
		},
	});

	container = new ZContainer({
		label: "side panel",
		layout: {
			width: 400,
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
			gap: 20,
		},
	});

	constructor() {
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
                    flexShrink: 0
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
                    objectFit: "none"
                }
			});

			container.addChild(text);
			return container;
		});
		this.tabSwitcher.addChild(...tabs);

		// biome-ignore lint/style/noNonNullAssertion: Troll
		this.container.addChild(this.tabSwitcher, this.tabs[0]!.content.container);
	}
}
