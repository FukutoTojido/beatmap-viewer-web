import { initDevtools } from "@pixi/devtools";
import { Application, RenderTarget } from "pixi.js";
import State from "./State";
import AnimationController, {
	tweenGroup,
} from "./UI/animation/AnimationController";
import "./FPSSystem";
import ky from "ky";
import BeatmapSet from "./BeatmapSet";
import { getBeatmapFromId } from "./BeatmapSet/BeatmapDownloader";
import Config from "./Config";
import type FullscreenConfig from "./Config/FullscreenConfig";
import RendererConfig from "./Config/RendererConfig";
import { inject, provide } from "./Context";
import ResponsiveHandler from "./ResponsiveHandler";
import SkinManager from "./Skinning/SkinManager";
import Loading from "./UI/loading";
import Main from "./UI/main";
import SidePanel from "./UI/sidepanel";
import ZipHandler from "./ZipHandler";

RenderTarget.defaultOptions.depth = true;
RenderTarget.defaultOptions.stencil = true;

export class Game {
	app?: Application;
	animationController = new AnimationController();

	state = provide("state", new State());
	responsiveHandler = provide("responsiveHandler", new ResponsiveHandler());

	constructor() {
		provide("skinManager", new SkinManager());
		const config = provide("config", new Config());

		config.experimental.onChange("mods", (modsString) => {
			const url = window.location;
			const params = new URLSearchParams(url.search);

			if (modsString === "") {
				params.delete("m");
			} else {
				params.set("m", modsString);
			}

			window.history.replaceState(null, "", `?${params.toString()}`);
		});

		config.fullscreen.onChange("fullscreen", (isFullscreen) => {
			const url = window.location;
			const params = new URLSearchParams(url.search);

			if (isFullscreen) {
				params.set("fullscreen", "true");
				document.body.classList.add("fullscreen");
			} else {
				params.delete("fullscreen");
				document.body.classList.remove("fullscreen");
			}

			window.history.replaceState(null, "", `?${params.toString()}`);
		});
	}

	async initApplication() {
		RenderTarget.defaultOptions.depth = true;
		RenderTarget.defaultOptions.stencil = true;
		const app = new Application();
		await app.init({
			// // biome-ignore lint/style/noNonNullAssertion: It should be there already lol
			// resizeTo: document.querySelector<HTMLDivElement>("#app")!,
			antialias: inject<RendererConfig>("config/renderer")?.antialiasing,
			// powerPreference: "high-performance",
			backgroundAlpha: 0,
			// useBackBuffer: true,
			// clearBeforeRender: true,
			// depth: true,
			autoDensity: true,
			resolution: devicePixelRatio,
		});
		app.stage.layout = {
			width: app.screen.width,
			height: app.screen.width,
			flexDirection: "row",
			gap: 0,
		};

		const divApp = document.querySelector<HTMLDivElement>("#app");
		if (divApp) {
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					if (entry.target !== divApp) continue;

					const width = Math.round(
						+getComputedStyle(divApp).width.replaceAll("px", ""),
					);
					const height = Math.round(
						+getComputedStyle(divApp).height.replaceAll("px", ""),
					);

					requestAnimationFrame(() => {
						app.renderer.resize(width, height);
						app.render();
					});
				}
			});

			resizeObserver.observe(divApp);
		}

		return app;
	}

	async init() {
		const app = provide("ui/app", await this.initApplication());
		const main = provide("ui/main", new Main());
		const sidepanel = provide("ui/sidepanel", new SidePanel());

		// biome-ignore lint/style/noNonNullAssertion: I'm tired boss
		inject<FullscreenConfig>("config/fullscreen")!.fullscreen =
			!!new URLSearchParams(window.location.search).get("fullscreen");

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
					document.body.classList.add("sidepanel");
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
					document.body.classList.remove("sidepanel");
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

		document.addEventListener("dragover", (e) => e.preventDefault());
		document.addEventListener("drop", async (e) => {
			e.preventDefault();
			if (!e.dataTransfer?.files.length) return;

			const file = e.dataTransfer.files[0];
			const fileExt = file.name.split(".").at(-1);
			if (!fileExt) return;
			if (!["osz", "osk"].includes(fileExt)) return;

			if (fileExt === "osz") {
				inject<Loading>("ui/loading")?.on();
				inject<Loading>("ui/loading")?.setText("Importing beatmapset ");
				await this.loadBlob(new Blob([file]));
				inject<Loading>("ui/loading")?.off();
				document
					.querySelector<HTMLDivElement>("#diffsContainer")
					?.classList.remove("hidden");
				document
					.querySelector<HTMLDivElement>("#diffsContainer")
					?.classList.add("flex");

				return;
			}

			if (fileExt === "osk") {
				inject<Loading>("ui/loading")?.on();
				inject<Loading>("ui/loading")?.setText("Loading skin");
				const resource = await ZipHandler.extract(new Blob([file]));
				await inject<SkinManager>("skinManager")?.addSkin(resource);
				inject<Loading>("ui/loading")?.off();
			}
		});

		inject<RendererConfig>("config/renderer")?.onChange("antialiasing", () => {
			window.location.reload();
		})

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

		await bms.loadResources();
		await bms.getDifficulties();

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
