import type { Application } from "pixi.js";
import { inject } from "./Context";
import type { Game } from "./Game";
import type SidePanel from "./UI/sidepanel";

type SidebarState = "OPENED" | "CLOSED";

export default class State {
	sidebar: SidebarState = "CLOSED";

	toggleSidebar(force? : SidebarState) {
		const game = inject<Game>("game");
		const app = inject<Application>("ui/app");
		const sidepanel = inject<SidePanel>("ui/sidepanel");

		if (!game || !sidepanel || !app) return;

		const ANIMATION_DURATION = 200;
		if (force) this.sidebar = force === "CLOSED" ? "OPENED" : "CLOSED";

		switch (this.sidebar) {
			case "OPENED": {
				this.sidebar = "CLOSED";
				game.animationController.addAnimation(
					"gap",
					10,
					0,
					(val) => {
						app.stage.layout = { gap: val };
					},
					ANIMATION_DURATION,
				);

				if (game.responsiveHandler.direction === "landscape") {
					sidepanel.container.triggerAnimation(
						"width",
						sidepanel.container.layout?.computedLayout.width ?? 400,
						0,
						(val) => {
							sidepanel.container.layout = { width: val };
						},
						ANIMATION_DURATION,
					);
				}

				if (game.responsiveHandler.direction === "portrait") {
					sidepanel.container.triggerAnimation(
						"height",
						70,
						0,
						(val) => {
							sidepanel.container.layout = { height: `${val}%` };
						},
						ANIMATION_DURATION,
					);
					sidepanel.container.triggerAnimation(
						"paddingAll",
						20,
						0,
						(val) => {
							sidepanel.container.layout = { padding: val };
						},
						ANIMATION_DURATION,
					);
				}

				sidepanel.container.triggerAnimation(
					"padding",
					20,
					0,
					(val) => {
						sidepanel.container.layout = { paddingInline: val };
					},
					ANIMATION_DURATION,
				);
				sidepanel.container.triggerAnimation(
					"opacity",
					sidepanel.container.alphaFilter.alpha,
					0,
					(val) => {
						sidepanel.container.alphaFilter.alpha = val;
					},
					ANIMATION_DURATION,
				);
				break;
			}
			case "CLOSED": {
				this.sidebar = "OPENED";
				game.animationController.addAnimation(
					"gap",
					0,
					10,
					(val) => {
						app.stage.layout = { gap: val };
					},
					ANIMATION_DURATION,
				);

				if (game.responsiveHandler.direction === "landscape") {
					sidepanel.container.triggerAnimation(
						"width",
						sidepanel.container.layout?.computedLayout.width ?? 0,
						400,
						(val) => {
							sidepanel.container.layout = { width: val };
						},
						ANIMATION_DURATION,
					);
				}

				if (game.responsiveHandler.direction === "portrait") {
					sidepanel.container.triggerAnimation(
						"height",
						0,
						70,
						(val) => {
							sidepanel.container.layout = { height: `${val}%` };
						},
						ANIMATION_DURATION,
					);
					sidepanel.container.triggerAnimation(
						"paddingAll",
						0,
						20,
						(val) => {
							sidepanel.container.layout = { padding: val };
						},
						ANIMATION_DURATION,
					);
				}

				sidepanel.container.triggerAnimation(
					"padding",
					0,
					20,
					(val) => {
						sidepanel.container.layout = { paddingInline: val };
					},
					ANIMATION_DURATION,
				);
				sidepanel.container.triggerAnimation(
					"opacity",
					sidepanel.container.alphaFilter.alpha,
					1,
					(val) => {
						sidepanel.container.alphaFilter.alpha = val;
					},
					ANIMATION_DURATION,
				);
				break;
			}
		}
	}
}
