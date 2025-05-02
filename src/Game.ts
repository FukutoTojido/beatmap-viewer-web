import "@pixi/layout";
import { initDevtools } from "@pixi/devtools";
import {
	Application,
	Assets,
	RenderTarget,
	Sprite,
} from "pixi.js";
import AnimationController, {
	tweenGroup,
} from "./UI/animation/AnimationController";
import State from "./State";
import { frameData } from "./FPSSystem";
import { LayoutContainer } from "@pixi/layout/components";
import type ZContainer from "./UI/core/ZContainer";
import SidePanel from "./UI/sidepanel";

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

		const sidepanel = new SidePanel();
		this.s = sidepanel.container;


		this.app.stage.addChild(c, sidepanel.container);

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
