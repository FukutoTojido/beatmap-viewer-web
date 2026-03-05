import { LayoutContainer } from "@pixi/layout/components";
import { Assets, Color, Sprite } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import { inject } from "@/Context";

export default class Fullscreen {
	container = new LayoutContainer({
		label: "play",
		layout: {
			aspectRatio: 1,
			backgroundColor: new Color(inject<ColorConfig>("config/color")?.color.crust).setAlpha(0.7),
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
				this.container.layout = { backgroundColor: new Color(crust).setAlpha(0.7) };
				this.sprite.tint = text;
			},
		);

		this.container.cursor = "pointer";

		this.container.addEventListener("pointertap", () => {
			const config = inject<FullscreenConfig>("config/fullscreen");
			if (!config) return;

			config.fullscreen = !config.fullscreen;
		});

		this.container.addEventListener("pointerenter", () => {
			this.container.layout = {
				backgroundColor:
					new Color(inject<ColorConfig>("config/color")?.color.surface2 ?? 0xffffff).setAlpha(0.8),
			};
		});

		this.container.addEventListener("pointerleave", () => {
			this.container.layout = {
				backgroundColor:
					new Color(inject<ColorConfig>("config/color")?.color.crust ?? 0xffffff).setAlpha(0.7),
			};
		});
	}
}
