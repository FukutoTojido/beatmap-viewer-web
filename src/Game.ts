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
import Loading from "./UI/loading";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";
import ky from "ky";
import ZipHandler from "./ZipHandler";
import BeatmapSet from "./BeatmapSet";

RenderTarget.defaultOptions.depth = true;
RenderTarget.defaultOptions.stencil = true;

export class Game {
	app?: Application;
	animationController = new AnimationController();

	state = provide("state", new State());
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
			// antialias: false,
			// powerPreference: "high-performance",
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
		provide("ui/loading", new Loading());

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

		this.state.on("sidebar", (newState) => {
			const ANIMATION_DURATION = 200;
			switch (newState) {
				case "OPENED": {
					this.animationController.addAnimation(
						"gap",
						0,
						10,
						(val) => {
							app.stage.layout = { gap: val };
						},
						ANIMATION_DURATION,
					);
					break;
				}
				case "CLOSED": {
					this.animationController.addAnimation(
						"gap",
						10,
						0,
						(val) => {
							app.stage.layout = { gap: val };
						},
						ANIMATION_DURATION,
					);
					break;
				}
			}
		});

		initDevtools({ app });

		document.querySelector<HTMLDivElement>("#app")?.append(app.canvas);

		document
			.querySelector<HTMLInputElement>("#idInput")
			?.addEventListener("keydown", (event) => {
				if (event.key !== "Enter") return;

				this.loadFromInput();
			});

		document
			.querySelector<HTMLButtonElement>("#submitId")
			?.addEventListener("click", () => this.loadFromInput());

		await inject<SkinManager>("skinManager")?.loadSkins();
		await this.loadFromQuery();
	}

	private async loadFromQuery() {
		const queries = new URLSearchParams(window.location.search).getAll("b");
		const IDs = queries.length !== 0 ? queries : [];

		if (IDs.length === 0) {
			inject<Loading>("ui/loading")?.off();
			return;
		}

		await this.loadIDs(IDs);
	}

	private async loadFromInput() {
		const input = document.querySelector<HTMLInputElement>("#idInput");
		const ids =
			input?.value
				.split(",")
				.map((id) => id.trim())
				.filter((id) => /\d+/g.test(id)) ?? [];

		input?.blur();

		await this.loadIDs(ids);
	}

	private async loadIDs(IDs: string[]) {
		inject<Loading>("ui/loading")?.on();

		try {
			let bms = inject<BeatmapSet>("beatmapset");
			if (
				!bms ||
				!bms?.difficulties.some(
					(diff) => diff.data.metadata.beatmapId === +IDs[0],
				)
			) {
				bms?.destroy();
				const blob =
					IDs.length !== 0
						? await getBeatmapFromId(IDs[0])
						: await (
								await ky.get("./beatmapsets/test.osz", {
									headers: { Accept: "application/x-osu-beatmap-archive" },
								})
							).blob();

				if (blob === null) throw new Error("Cannot download beatmap");
				console.log("Download Completed!");

				bms = await this.loadBlob(blob);
			}

			if (IDs.length === 0) {
				await bms.loadMaster(0);
			}

			for (let i = 0; i < IDs.length; i++) {
				const ID = IDs[i];

				const idx = bms.difficulties.findIndex(
					(diff) => diff.data.metadata.beatmapId === +ID,
				);

				if (idx === -1) continue;
				if (i === 0) await bms.loadMaster(idx);
				if (i !== 0) bms.loadSlave(idx);
			}
		} catch (e) {
			console.error(e);
		}

		inject<Loading>("ui/loading")?.off();
	}

	async loadBlob(blob: Blob) {
		const resources = await ZipHandler.extract(blob);
		const bms = new BeatmapSet(resources);
		console.log("Init beatmapset");

		await bms.getDifficulties();
		await bms.loadResources();

		return bms;
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
