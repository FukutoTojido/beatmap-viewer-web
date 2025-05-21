import { initDevtools } from "@pixi/devtools";
import { Application, RenderTarget } from "pixi.js";
import AnimationController, {
	tweenGroup,
} from "./UI/animation/AnimationController";
import State from "./State";
import "./FPSSystem";
import SidePanel from "./UI/sidepanel";
import Main from "./UI/main";
import { inject, provide } from "./Context";
import Config from "./Config";
import SkinManager from "./Skinning/SkinManager";
import ResponsiveHandler from "./ResponsiveHandler";

RenderTarget.defaultOptions.depth = true;
RenderTarget.defaultOptions.stencil = true;

export class Game {
	app?: Application;
	state = new State();
	animationController = new AnimationController();
	responsiveHandler = provide("responsiveHandler", new ResponsiveHandler());

	constructor() {
		provide("skinManager", new SkinManager());
		provide("config", new Config());
	}

	async initApplication() {
		RenderTarget.defaultOptions.depth = true;
		RenderTarget.defaultOptions.stencil = true;
		const app = new Application();
		await app.init({
			// biome-ignore lint/style/noNonNullAssertion: It should be there already lol
			resizeTo: document.querySelector<HTMLDivElement>("#app")!,
			antialias: devicePixelRatio <= 1.5,
			backgroundAlpha: 0,
			useBackBuffer: true,
			clearBeforeRender: true,
			depth: true,
			autoDensity: true,
			resolution: devicePixelRatio,
		});
		app.stage.layout = {
			width: app.screen.width,
			height: app.screen.width,
			flexDirection: "row",
			gap: 0,
		};

		return app;
	}

	async init() {
		const app = provide("ui/app", await this.initApplication());
		const main = provide("ui/main", new Main());
		const sidepanel = provide("ui/sidepanel", new SidePanel());

		app.stage.addChild(main.container, sidepanel.container);
		this.responsiveHandler.on("layout", (direction) => {
			switch (direction) {
				case "landscape": {
					app.stage.layout = {
						flexDirection: "row",
					};
					break;
				}
				case "portrait": {
					app.stage.layout = {
						flexDirection: "column",
					};
					break;
				}
			}
		});

		initDevtools({ app });

		document.querySelector<HTMLDivElement>("#app")?.append(app.canvas);
		await inject<SkinManager>("skinManager")?.loadSkins();
	}

	private resize() {
		const app = inject<Application>("ui/app");
		if (!app) return;

		const width = app.screen.width;
		const height = app.screen.height;

		const _width = app.stage.layout?._computedLayout.width;
		const _height = app.stage.layout?._computedLayout.height;

		this.responsiveHandler.responsive();

		if (_width === width && _height === height) return;

		app.stage.layout = {
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
