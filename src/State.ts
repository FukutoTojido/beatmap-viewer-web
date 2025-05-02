import type { Game } from "./Game";

type SidebarState = "OPENED" | "CLOSED";

export default class State {
	sidebar: SidebarState = "OPENED";
	game?: Game;

	constructor() {
		document
			.querySelector<HTMLButtonElement>("#toggleSideBar")
			?.addEventListener("click", () => this.toggleSidebar());
	}

	setGame(game: Game) {
		this.game = game;
	}

	toggleSidebar() {
		if (!this.game || !this.game.s) return;

		switch (this.sidebar) {
			case "OPENED": {
				this.sidebar = "CLOSED";
				this.game.animationController.addAnimation("gap", 10, 0, (val) => {
					if (!this.game?.app) return;
					this.game.app.stage.layout = { gap: val }
				}, 500);
				this.game.s?.triggerAnimation("width", 400, 0, (val) => {
					if (!this.game?.s) return;
					this.game.s.layout = { width: val };
				}, 500);
				this.game.s?.triggerAnimation("opacity", 1, 0, (val) => {
					if (!this.game?.s) return;
					this.game.s.alpha = val;
				}, 500);
				break;
			}
			case "CLOSED": {
				this.sidebar = "OPENED";
				this.game.animationController.addAnimation("gap", 0, 10, (val) => {
					if (!this.game?.app) return;
					this.game.app.stage.layout = { gap: val }
				}, 500);
				this.game.s?.triggerAnimation("width", 0, 400, (val) => {
					if (!this.game?.s) return;
					this.game.s.layout = { width: val };
				}, 500);
				this.game.s?.triggerAnimation("opacity", 0, 1, (val) => {
					if (!this.game?.s) return;
					this.game.s.alpha = val;
				}, 500);
				break;
			}
		}
	}
}
