import { LayoutContainer } from "@pixi/layout/components";
import {
	Assets,
	Container,
	Graphics,
	Rectangle,
	Sprite,
	Text,
	type TextStyleOptions,
} from "pixi.js";
import { inject, provide } from "@/Context";
import type Beatmap from "@/BeatmapSet/Beatmap";
import type BeatmapSet from "@/BeatmapSet";
import type { LayoutOptions } from "@pixi/layout";
import type BackgroundConfig from "@/Config/BackgroundConfig";
import type ColorConfig from "@/Config/ColorConfig";
import { BackdropBlurFilter } from "pixi-filters";
import Spinner from "./Spinner";

const defaultStyle: TextStyleOptions = {
	fontFamily: "Rubik",
	fill: 0xbac2de,
	align: "left",
	fontSize: 14,
	fontWeight: "400",
};

const defaultLayout: Omit<LayoutOptions, "target"> = {
	objectPosition: "top left",
	objectFit: "none",
};

export default class Gameplay {
	container: Container;
	wrapper: Container;
	background: LayoutContainer;
	objectsContainer: Container;
	diffName!: Text;
	statsContainer!: LayoutContainer;
	closeButton!: LayoutContainer;
	spinner: Spinner;

	csText!: Text;
	arText!: Text;
	odText!: Text;
	hpText!: Text;

	constructor(public beatmap: Beatmap) {
		const backdropFilter = new BackdropBlurFilter({
			strength:
				((inject<BackgroundConfig>("config/background")?.backgroundBlur ?? 0) /
					100) *
				20,
			quality: 6,
		});

		this.container = new Container({
			label: "gameplay",
			layout: {
				position: "absolute",
				width: 0,
				height: 0,
				alignItems: "flex-start",
			},
			isRenderGroup: true,
		});
		this.wrapper = new Container({
			label: "wrapper",
			layout: {
				width: "100%",
				height: "100%",
			},
		});
		this.background = new LayoutContainer({
			label: "dim",
			layout: {
				width: "100%",
				height: "100%",
				backgroundColor: [
					0,
					0,
					0,
					Math.min(
						1,
						(inject<BackgroundConfig>("config/background")?.backgroundDim ??
							70) / 100,
					),
				],
			},
			filters: [backdropFilter],
		});

		this.objectsContainer = new Container({
			boundsArea: new Rectangle(0, 0, 512, 384),
		});

		this.spinner = new Spinner(this);
		this.spinner.spin = true;

		this.createStats();
		this.createCloseButton();

		this.container.addChild(this.wrapper, this.spinner.graphics);
		this.wrapper.addChild(this.background, this.objectsContainer);
		this.wrapper.on("layout", () => {
			const width = this.wrapper.layout?.computedLayout.width ?? 0;
			const height = this.wrapper.layout?.computedLayout.height ?? 0;

			const scale = Math.min(width / 640, height / 480);
			const _w = 512 * scale;
			const _h = 384 * scale;

			this.objectsContainer.scale.set(scale);

			this.objectsContainer.x = (width - _w) / 2;
			this.objectsContainer.y = (height - _h) / 2;

			this.spinner.graphics.x = width / 2;
			this.spinner.graphics.y = height / 2;
		});

		inject<ColorConfig>("config/color")?.onChange("color", ({ base, text }) => {
			this.closeButton.layout = { backgroundColor: base };
			this.statsContainer.layout = { backgroundColor: base };
			this.diffName.style.fill = text;
		});

		inject<BackgroundConfig>("config/background")?.onChange(
			"backgroundDim",
			(value: number) => {
				this.background.layout = {
					backgroundColor: [0, 0, 0, Math.max(0.01, value / 100)],
				};
			},
		);

		inject<BackgroundConfig>("config/background")?.onChange(
			"backgroundBlur",
			(value: number) => {
				backdropFilter.strength = (value / 100) * 20;
			},
		);
	}

	showCloseButton() {
		this.container.addChild(this.closeButton);
	}

	hideCloseButton() {
		this.container.removeChild(this.closeButton);
	}

	showDiffName() {
		this.container.addChild(this.statsContainer);
	}

	hideDiffName() {
		this.container.removeChild(this.statsContainer);
	}

	createCloseButton() {
		const closeButtonContainer = new LayoutContainer({
			layout: {
				width: 30,
				height: 30,
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: inject<ColorConfig>("config/color")?.color.base,
				borderRadius: 15,
				position: "absolute",
				top: 20,
				right: 20,
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

		closeButton.tint =
			inject<ColorConfig>("config/color")?.color.text ?? 0xffffff;

		inject<ColorConfig>("config/color")?.onChange("color", ({ text }) => {
			closeButton.tint = text;
		});

		(async () => {
			closeButton.texture = await Assets.load({
				src: "./assets/x.png",
				parser: "texture",
			});
		})();

		closeButtonContainer.cursor = "pointer";
		const unloadSelf = () => {
			const bms = this.beatmap.context.consume<BeatmapSet>("beatmapset");
			if (!bms) return;

			const idx = bms.difficulties.findIndex((b) => b === this.beatmap);
			bms.unloadSlave(idx);
		};
		closeButtonContainer.addEventListener("click", () => unloadSelf());
		closeButtonContainer.addEventListener("tap", () => unloadSelf());

		closeButtonContainer.addChild(closeButton);
		this.closeButton = closeButtonContainer;
	}

	createStats() {
		this.statsContainer = new LayoutContainer({
			label: "stats",
			layout: {
				display: "flex",
				alignItems: "center",
				flexDirection: "row",
				gap: 10,
				backgroundColor: inject<ColorConfig>("config/color")?.color.base,
				borderRadius: 20,
				padding: 10,
				paddingInline: 20,
				flex: 0,
				height: "auto",
				position: "absolute",
				top: 20,
				left: 20,
				transformOrigin: "top left",
			},
		});

		this.diffName = new Text({
			text: this.beatmap.data.metadata.version,
			style: {
				...defaultStyle,
				fill: inject<ColorConfig>("config/color")?.color.text,
			},
			layout: defaultLayout,
		});

		this.statsContainer.addChild(this.diffName);
	}
}
