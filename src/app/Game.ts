import { initDevtools } from "@pixi/devtools";
import { Application, RenderTarget } from "pixi.js";
import State from "./State";
import AnimationController, {
	tweenGroup,
} from "./UI/animation/AnimationController";
import "./FPSSystem";
import ky from "ky";
import BeatmapSet from "./BeatmapSet";
import {
	getBeatmapFromExternalUrl,
	getBeatmapFromHash,
	getBeatmapFromId,
} from "./BeatmapSet/BeatmapDownloader";
import Config from "./Config";
import type FullscreenConfig from "./Config/FullscreenConfig";
import type RendererConfig from "./Config/RendererConfig";
import { inject, provide } from "./Context";
import ResponsiveHandler from "./ResponsiveHandler";
import SkinManager from "./Skinning/SkinManager";
import Loading from "./UI/loading";
import Main from "./UI/main";
import SidePanel from "./UI/sidepanel";
import ZipHandler from "./ZipHandler";
import Replay from "./BeatmapSet/Beatmap/Replay";
import { debounce } from "./utils";

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

		config.experimental.onChange(
			"mods",
			({ mods: modsString }: { mods: string }) => {
				const url = window.location;
				const params = new URLSearchParams(url.search);

				if (modsString === "") {
					params.delete("m");
				} else {
					params.set("m", modsString);
				}

				window.history.replaceState(null, "", `?${params.toString()}`);
			},
		);

		config.fullscreen.onChange("fullscreen", (isFullscreen) => {
			const url = new URL(window.location.href);
			const params = url.searchParams;

			if (isFullscreen) {
				params.set("fullscreen", "true");
				document.body.classList.add("fullscreen");
			} else {
				params.delete("fullscreen");
				document.body.classList.remove("fullscreen");
			}

			window.history.replaceState(null, "", url);
		});
	}

	resizeFrame = debounce((app: Application, width: number, height: number) => {
		app.renderer.resize(width, height);
		app.render();
	}, 50);

	async initApplication() {
		RenderTarget.defaultOptions.depth = true;
		RenderTarget.defaultOptions.stencil = true;
		const app = new Application();
		await app.init({
			// // biome-ignore lint/style/noNonNullAssertion: It should be there already lol
			// resizeTo: document.querySelector<HTMLDivElement>("#app")!,
			antialias: inject<RendererConfig>("config/renderer")?.antialiasing,
			powerPreference: "high-performance",
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

					requestAnimationFrame(() => this.resizeFrame(app, width, height));
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
		document.addEventListener("drop", (e) => {
			e.preventDefault();
			if (!e.dataTransfer?.files.length) return;
			this.processFile(e.dataTransfer.files[0]);
		});

		document
			.querySelector<HTMLInputElement>("#fileInput")
			?.addEventListener("change", (e) => {
				if (!(e.target as HTMLInputElement)?.files?.length) return;
				this.processFile((e.target as HTMLInputElement)?.files?.[0] as File);
			});

		inject<RendererConfig>("config/renderer")?.onChange("antialiasing", () => {
			window.location.reload();
		});

		await inject<SkinManager>("skinManager")?.loadSkins();

		const hasUrl = await this.loadFromHash();

		if (hasUrl) return;
		await this.loadFromQuery();
	}

	private async processFile(file: File) {
		const fileExt = file.name.split(".").at(-1);
		if (!fileExt) return;
		if (!["osz", "osk", "osr"].includes(fileExt)) return;

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

		if (fileExt === "osr") {
			const bms = inject<BeatmapSet>("beatmapset");

			const replay = new Replay();
			await replay.process(new Blob([file]));

			const bm = bms?.difficulties.findIndex(
				(bm) => bm.md5 === replay.data?.info.beatmapHashMD5,
			);

			if (bm === -1 || bm === undefined || bm === null) {
				const container = document.createElement("div");
				const text = document.createElement("div");
				const buttons = document.createElement("div");
				const fetch = document.createElement("button");
				const force = document.createElement("button");
				const cancel = document.createElement("button");

				text.innerText =
					"Cannot find beatmap matching with the replay hash. Please select the following options.";
				fetch.innerText = "Fetch from online source";
				force.innerText = "Force using replay";
				cancel.innerText = "Cancel";

				if (replay.data?.info.beatmapHashMD5) {
					buttons.append(fetch);
				}
				buttons.append(force, cancel);

				container.append(text, buttons);

				container.classList.add(
					"absolute",
					"top-[50%]",
					"left-[50%]",
					"-translate-[50%]",
					"w-[600px]",
					"max-w-full",
					"p-8",
					"flex",
					"flex-col",
					"gap-5",
					"rounded-xl",
					"border",
					"border-surface-1",
					"bg-base",
					"text-text",
				);
				buttons.classList.add("flex", "items-center", "justify-end", "gap-2.5");
				cancel.classList.add(
					"p-2",
					"px-4",
					"bg-crust",
					"rounded-lg",
					"hover:bg-mantle",
					"text-text",
					"text-sm",
					"cursor-pointer",
				);
				fetch.classList.add(
					"p-2",
					"px-4",
					"bg-text",
					"rounded-lg",
					"hover:bg-subtext-0",
					"text-mantle",
					"text-sm",
					"cursor-pointer",
				);
				force.classList.add(
					"p-2",
					"px-4",
					"bg-surface-0",
					"rounded-lg",
					"hover:bg-surface-1",
					"text-text",
					"text-sm",
					"cursor-pointer",
				);

				cancel.addEventListener("click", () => {
					document.body.removeChild(container);
				});

				force.addEventListener("click", () => {
					bms?.master?.hookReplay(replay);
					document.body.removeChild(container);
				});

				fetch.addEventListener("click", async () => {
					if (!replay.data?.info.beatmapHashMD5) return;
					await this.loadHash(replay.data?.info.beatmapHashMD5);

					const bms = inject<BeatmapSet>("beatmapset");

					const bm = bms?.difficulties.findIndex(
						(bm) => bm.md5 === replay.data?.info.beatmapHashMD5,
					);
					if (bm !== -1 && bm !== undefined && bm !== null)
						bms?.difficulties[bm].hookReplay(replay);

					document.body.removeChild(container);
				});

				document.body.append(container);
			} else {
				if (
					bms?.master !== bms?.difficulties[bm] &&
					!bms?.slaves.has(bms?.difficulties[bm])
				) {
					await bms?.loadMaster(bm);
				}
				bms?.difficulties[bm]?.hookReplay(replay);
			}
		}
	}

	private async loadFromHash() {
		const url = new URL(window.location.href).hash.slice(1);
		if (!url) return false;

		inject<Loading>("ui/loading")?.on();

		try {
			const blob = await getBeatmapFromExternalUrl(url);
			if (!blob) return false;

			await this.loadBlob(blob);
		} catch (e) {
			console.error(e);
		}

		inject<Loading>("ui/loading")?.off();
		
		document
			.querySelector<HTMLDivElement>("#diffsContainer")
			?.classList.remove("hidden");
		document
			.querySelector<HTMLDivElement>("#diffsContainer")
			?.classList.add("flex");

		return true;
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

	private async loadHash(hash: string) {
		inject<Loading>("ui/loading")?.on();

		try {
			let bms = inject<BeatmapSet>("beatmapset");
			if (!bms || !bms?.difficulties.some((diff) => diff.md5 === hash)) {
				bms?.destroy();
				const blob = await getBeatmapFromHash(hash);

				if (blob === null) throw new Error("Cannot download beatmap");
				console.log("Download Completed!");

				bms = await this.loadBlob(blob);
			}

			const idx = bms.difficulties.findIndex((diff) => diff.md5 === hash);
			if (idx !== -1) await bms.loadMaster(idx);
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
