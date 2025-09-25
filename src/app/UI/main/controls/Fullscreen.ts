import { LayoutContainer } from "@pixi/layout/components";
import { Assets, Sprite } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import { inject } from "@/Context";

export default class Fullscreen {
	container = new LayoutContainer({
		label: "play",
		layout: {
			aspectRatio: 1,
			backgroundColor: inject<ColorConfig>("config/color")?.color.crust,
			height: "100%",
			flexShrink: 0,
			alignItems: "center",
			justifyContent: "center",
		},
	});

	sprite = new Sprite();

	constructor() {
		(async () => {
			const texture = await Assets.load("./assets/maximize.png");
			this.sprite.texture = texture;
			this.sprite.width = 20;
			this.sprite.height = 20;
			this.sprite.layout = {
				width: 20,
				height: 20,
			};
			this.sprite.tint =
				inject<ColorConfig>("config/color")?.color.text ?? 0xffffff;

			this.container.addChild(this.sprite);
		})();

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ crust, text }) => {
				this.container.layout = { backgroundColor: crust };
				this.sprite.tint = text;
			},
		);

		this.container.cursor = "pointer";

		this.container.addEventListener("pointertap", () => {
			const config = inject<FullscreenConfig>("config/fullscreen");
			if (!config) return;

			config.fullscreen = !config.fullscreen;
		});
	}
}
