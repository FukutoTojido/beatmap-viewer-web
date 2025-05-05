import type { Application } from "pixi.js";
import { inject } from "./Context";
import type { Game } from "./Game";
import type SidePanel from "./UI/sidepanel";

type SidebarState = "OPENED" | "CLOSED";

export default class State {
	sidebar: SidebarState = "OPENED";

	constructor() {
		document
			.querySelector<HTMLButtonElement>("#toggleSideBar")
			?.addEventListener("click", () => this.toggleSidebar());
	}

	toggleSidebar() {
		const game: Game = inject("game");
		const app: Application = inject("ui/app");
		const sidepanel: SidePanel = inject("ui/sidepanel");

		if (!game || !sidepanel || !app) return;

		const ANIMATION_DURATION = 200;

		switch (this.sidebar) {
			case "OPENED": {
				this.sidebar = "CLOSED";
				game.animationController.addAnimation("gap", 10, 0, (val) => {
					app.stage.layout = { gap: val }
				}, ANIMATION_DURATION);
				sidepanel.container.triggerAnimation("width", sidepanel.container.layout?.computedLayout.width ?? 400, 0, (val) => {
					sidepanel.container.layout = { width: val };
				}, ANIMATION_DURATION);
				sidepanel.container.triggerAnimation("padding", 20, 0, (val) => {
					sidepanel.container.layout = { paddingInline: val };
				}, ANIMATION_DURATION);
				sidepanel.container.triggerAnimation("opacity", sidepanel.container.alphaFilter.alpha, 0, (val) => {
					sidepanel.container.alphaFilter.alpha = val;
				}, ANIMATION_DURATION);
				break;
			}
			case "CLOSED": {
				this.sidebar = "OPENED";
				game.animationController.addAnimation("gap", 0, 10, (val) => {
					app.stage.layout = { gap: val }
				}, ANIMATION_DURATION);
				sidepanel.container.triggerAnimation("width", sidepanel.container.layout?.computedLayout.width ?? 0, 400, (val) => {
					sidepanel.container.layout = { width: val };
				}, ANIMATION_DURATION);
				sidepanel.container.triggerAnimation("padding", 0, 20, (val) => {
					sidepanel.container.layout = { paddingInline: val };
				}, ANIMATION_DURATION);
				sidepanel.container.triggerAnimation("opacity", sidepanel.container.alphaFilter.alpha, 1, (val) => {
					sidepanel.container.alphaFilter.alpha = val;
				}, ANIMATION_DURATION);
				break;
			}
		}
	}
}
