import { LayoutContainer } from "@pixi/layout/components";
import { Assets, Color, Sprite } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";
import type { Game } from "@/Game";

export default class Metadata {
	container = new LayoutContainer({
		label: "metadata",
		layout: {
			aspectRatio: 1,
			height: "100%",
			backgroundColor: new Color(
				inject<ColorConfig>("config/color")?.color.mantle,
			).setAlpha(0.7),
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
			this.sprite.tint =
				inject<ColorConfig>("config/color")?.color.text ?? 0xffffff;

			this.container.addChild(this.sprite);
		})();

		inject<ColorConfig>("config/color")?.onChange(
			"color",
			({ mantle, text }) => {
				this.container.layout = {
					backgroundColor: new Color(mantle).setAlpha(0.7),
				};
				this.sprite.tint = text;
			},
		);

		this.container.cursor = "pointer";
		this.container.addEventListener("pointertap", () => {
			inject<Game>("game")?.state.toggleSidebar();
		});

		this.container.addEventListener("pointerenter", () => {
			this.container.layout = {
				backgroundColor: new Color(
					inject<ColorConfig>("config/color")?.color.surface2 ?? 0xffffff,
				).setAlpha(0.7),
			};
		});

		this.container.addEventListener("pointerleave", () => {
			this.container.layout = {
				backgroundColor: new Color(
					inject<ColorConfig>("config/color")?.color.mantle ?? 0xffffff,
				).setAlpha(0.7),
			};
		});
	}
}
