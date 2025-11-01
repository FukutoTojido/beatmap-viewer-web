import { LayoutContainer } from "@pixi/layout/components";
import { Assets, type FederatedPointerEvent, Sprite } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";

export default class Button {
	container = new LayoutContainer({
		label: "play",
		layout: {
			aspectRatio: 1,
			backgroundColor: inject<ColorConfig>("config/color")?.color.base,
			height: 40,
			width: 40,
			flexShrink: 0,
			alignItems: "center",
			justifyContent: "center",
		},
	});

	sprite = new Sprite();

	constructor(
		icon: string,
		public onClick?: (e?: FederatedPointerEvent) => void,
	) {
		(async () => {
			const texture = await Assets.load(icon);
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

		inject<ColorConfig>("config/color")?.onChange("color", ({ base, text }) => {
			this.container.layout = { backgroundColor: base };
			this.sprite.tint = text;
		});

		this.container.cursor = "pointer";

		this.container.addEventListener("pointertap", (e) => {
			this.onClick?.(e);
		});

		this.container.addEventListener("pointerenter", () => {
			this.container.layout = {
				backgroundColor:
					inject<ColorConfig>("config/color")?.color.surface2 ?? 0xffffff,
			};
		});

		this.container.addEventListener("pointerleave", () => {
			this.container.layout = {
				backgroundColor:
					inject<ColorConfig>("config/color")?.color.base ?? 0xffffff,
			};
		});
	}
}
