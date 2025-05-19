import type BeatmapSet from "@/BeatmapSet";
import type Beatmap from "@/BeatmapSet/Beatmap";
import { inject } from "@/Context";
import { LayoutContainer } from "@pixi/layout/components";
import { Assets, Sprite } from "pixi.js";

export default class Play {
	container = new LayoutContainer({
		label: "play",
		layout: {
			aspectRatio: 1,
			backgroundColor: 0x11111b,
			height: "100%",
			flexShrink: 0,
			alignItems: "center",
			justifyContent: "center",
		},
	});

	sprite = new Sprite();

	constructor() {
		(async () => {
			const texture = await Assets.load("./assets/play.png");
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

		this.container.addEventListener("pointertap", () =>
			inject<BeatmapSet>("beatmapset")?.toggle(),
		);
	}
}
