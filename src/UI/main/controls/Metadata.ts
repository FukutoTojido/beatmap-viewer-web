import { inject } from "@/Context";
import type { Game } from "@/Game";
import { LayoutContainer } from "@pixi/layout/components";
import { Assets, Sprite } from "pixi.js";

export default class Metadata {
	container = new LayoutContainer({
		label: "metadata",
		layout: {
			aspectRatio: 1,
			height: "100%",
			backgroundColor: 0x181825,
			flexShrink: 0,
			alignItems: "center",
			justifyContent: "center",
		},
	});

	sprite = new Sprite();

	constructor() {
		(async () => {
			const texture = await Assets.load("./assets/metadata.png");
			this.sprite.texture = texture;
			this.sprite.width = 20;
			this.sprite.height = 20;
			this.sprite.layout = {
				width: 20,
				height: 20,
			};

			this.container.addChild(this.sprite);
		})();

		this.container.cursor = "pointer";
		this.container.addEventListener("click", () => {
			inject<Game>("game")?.state.toggleSidebar();
		});
		this.container.addEventListener("tap", () => {
			inject<Game>("game")?.state.toggleSidebar();
		});
	}
}
