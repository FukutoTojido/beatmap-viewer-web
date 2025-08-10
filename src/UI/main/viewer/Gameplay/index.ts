import { LayoutContainer } from "@pixi/layout/components";
import { Container, Graphics, Rectangle, Text } from "pixi.js";
import { provide } from "@/Context";
import type Beatmap from "@/BeatmapSet/Beatmap";

export default class Gameplay {
	container: Container;
	objectsContainer: Container;
	diffName: Text;
	statsContainer: LayoutContainer;

	constructor(public beatmap: Beatmap) {
		this.container = new Container({
			label: "gameplay",
			layout: {
				position: "absolute",
				width: 0,
				height: 0,
				alignItems: "flex-start"
			},
			isRenderGroup: true,
		});
		this.objectsContainer = new Container({
			boundsArea: new Rectangle(0, 0, 512, 384),
		});
		this.statsContainer = new LayoutContainer({
			label: "stats",
			layout: {
				display: "flex",
				alignItems: "center",
				flexDirection: "row",
				backgroundColor: 0x181825,
				borderRadius: 20,
				padding: 10,
				paddingInline: 20,
				flex: 0,
				height: "auto",
				position: "absolute",
				top: 20,
				left: 20
			}
		})
		this.diffName = new Text({
			text: this.beatmap.data.metadata.version,
			style: {
				fontFamily: "Rubik",
				fill: 0xbac2de,
				align: "left",
				fontSize: 14,
				fontWeight: "500",
			},
			layout: {
				objectPosition: "top left",
				objectFit: "none",
			},
		});

		this.statsContainer.addChild(this.diffName);
		this.container.addChild(this.objectsContainer);
		this.container.on("layout", () => {
			const width = this.container.layout?.computedLayout.width ?? 0;
			const height = this.container.layout?.computedLayout.height ?? 0;

			const scale = Math.min(width / 640, height / 480);
			const _w = 512 * scale;
			const _h = 384 * scale;

			this.objectsContainer.scale.set(scale);

			this.objectsContainer.x = (width - _w) / 2;
			this.objectsContainer.y = (height - _h) / 2;
		});
	}
}
