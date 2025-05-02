import "@pixi/layout";
import { initDevtools } from "@pixi/devtools";
import {
	Application,
	Assets,
	RenderTarget,
	Sprite,
	Text,
	type TextStyle,
	type TextStyleOptions,
} from "pixi.js";
import { tw } from "@pixi/layout/tailwind";
import AnimationController, {
	tweenGroup,
} from "./UI/animation/AnimationController";
import State from "./State";
import { frameData } from "./FPSSystem";
import { LayoutContainer } from "@pixi/layout/components";
import ZContainer from "./UI/core/ZContainer";

RenderTarget.defaultOptions.depth = true;
RenderTarget.defaultOptions.stencil = true;

export class Game {
	app?: Application;
	s?: ZContainer;

	state = new State();

	animationController = new AnimationController();

	async init() {
		RenderTarget.defaultOptions.depth = true;
		RenderTarget.defaultOptions.stencil = true;

		this.app = new Application();
		await this.app.init({
			// biome-ignore lint/style/noNonNullAssertion: It should be there already lol
			resizeTo: document.querySelector<HTMLDivElement>("#app")!,
			antialias: true,
			backgroundAlpha: 0,
			useBackBuffer: true,
			clearBeforeRender: true,
			depth: true,
		});
		this.app.stage.layout = {
			width: this.app.screen.width,
			height: this.app.screen.width,
			flexDirection: "row",
			gap: 10,
		};

		const c = new LayoutContainer({
			label: "main",
			layout: {
				flex: 1,
				height: "100%",
				backgroundColor: 0x181825,
				borderColor: 0x585b70,
				borderWidth: 1,
				borderRadius: 20,
				boxSizing: "border-box",
				overflow: "hidden"
			},
		});

		const sprite = new Sprite({
			texture: await Assets.load({
				src: "/anon.jpg",
				loadParser: "loadTextures",
			}),
			layout: {
				width: "100%",
				height: "100%",
				objectFit: "cover",
				objectPosition: "center",
			}
		});

		c.addChild(sprite);

		const headerStyle: TextStyle | TextStyleOptions | undefined = {
			fontFamily: "Rubik",
			fontSize: 14,
			fill: 0xcdd6f4,
			fontWeight: "600",
			wordWrap: true,
			align: "left",
		};

		const contentStyle: TextStyle | TextStyleOptions | undefined = {
			fontFamily: "Rubik",
			fontSize: 16,
			fontWeight: "400",
			fill: 0xcdd6f4,
			wordWrap: true,
			align: "left",
		};

		const texts = [
			"artist",
			"MyGO!!!!!",
			"romanized artist",
			"MyGO!!!!!",
			"title",
			"春日影 (MyGO!!!!! Ver.)",
			"romanized title",
			"Haruhikage (MyGO!!!! Ver.)",
			"difficulty name",
			"Past",
			"source",
			"BanG Dream! It's MyGO!!!!!",
			"tags",
			"crychic 1st album 迷跡波 meisekiha bushiroad gbp garupa girls band party! bandori バンドリ！ ガールズバンドパーティ！ 高松燈 千早愛音 要楽奈 長崎そよ 椎名立希 羊宮妃那 立石凛 青木陽菜 小日向美香 林鼓子 tomori takamatsu anon chihaya raana kaname soyo nagasaki taki shiina hina youmiya rin tateishi hina aoki mika kohinata koko hayashi rock japanese anime jrock j-rock kalibe hey lululu hey_lululu lu^3 coco",
		];

		const ts = [...Array(14)].map((_, idx) => {
			const text = texts[idx % texts.length];
			return new Text({
				text,
				style: idx % 2 === 0 ? headerStyle : contentStyle,
				layout: {
					width: "100%",
					objectFit: "none",
					objectPosition: "top left",
					alignSelf: "flex-start",
					alignContent: "flex-start",
					flexShrink: 0,
				},
			});
		});

		const s = new LayoutContainer({
			label: "side",
			layout: {
				width: 360,
				flex: 1,
				flexDirection: "column",
				overflow: "scroll",
				justifyContent: "flex-start",
				alignItems: "flex-start",
				alignContent: "flex-start",
				gap: 10,
				// padding: 10,
				boxSizing: "border-box",
				backgroundColor: 0x181825,
				borderRadius: 0,
				borderWidth: 1,
			},
		});

		const tabSwitcher = new LayoutContainer({
			label: "tab switcher",
			layout: {
				width: 360,
				height: 80,
				flexShrink: 0,
				backgroundColor: 0x1e1e2e,
				borderRadius: 10,
				borderColor: 0x585b70,
				borderWidth: 1,
			}
		})

		const sWrapper = new ZContainer({
			layout: {
				width: 400,
				height: "100%",
				backgroundColor: 0x181825,
				borderColor: 0x585b70,
				borderWidth: 1,
				borderRadius: 20,
				flexDirection: "column",
				overflow: "hidden",
				padding: 20,
				gap: 20
			},
		});

		s.addChild(...ts);
		sWrapper.addChild(tabSwitcher, s);

		this.app.stage.addChild(c, sWrapper);
		this.s = sWrapper;

		this.state.setGame(this);

		initDevtools({
			app: this.app,
		});

		document.querySelector<HTMLDivElement>("#app")?.append(this.app.canvas);
	}

	private resize() {
		if (!this.app) return;

		const width = this.app.canvas.width;
		const height = this.app.canvas.height;

		const _width = this.app.stage.layout?._computedLayout.width;
		const _height = this.app.stage.layout?._computedLayout.height;

		if (_width === width && _height === height) return;

		this.app.stage.layout = {
			width,
			height,
		};
	}

	update() {
		// console.log(frameData.fps)
		this.resize();
		tweenGroup.update();
	}
}

const game = new Game();
export default game;
