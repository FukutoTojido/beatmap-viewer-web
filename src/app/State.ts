import type { Application } from "pixi.js";
import { inject } from "./Context";
import type { Game } from "./Game";
import type SidePanel from "./UI/sidepanel";

export type SidebarState = "OPENED" | "CLOSED";

type StatesType = "sidebar";

type SidebarStateCallback = (newState: SidebarState) => void;

type StateCallback = SidebarStateCallback;

export default class State {
	sidebar: SidebarState = "CLOSED";

	private _maps: Map<StatesType, Set<StateCallback>> = new Map([
		["sidebar", new Set<SidebarStateCallback>()]
	]);

	on(type: "sidebar", callback: SidebarStateCallback) {
		this._maps.get(type)?.add(callback);
	}

	toggleSidebar(force? : SidebarState) {
		const game = inject<Game>("game");
		const app = inject<Application>("ui/app");
		const sidepanel = inject<SidePanel>("ui/sidepanel");
		const timing = inject<SidePanel>("ui/sidepanel/timing");

		if (!game || !sidepanel || !app || !timing) return;

		if (force) this.sidebar = force === "CLOSED" ? "OPENED" : "CLOSED";

		switch (this.sidebar) {
			case "OPENED": {
				this.sidebar = "CLOSED";
				break;
			}
			case "CLOSED": {
				this.sidebar = "OPENED";
				break;
			}
		}

		for (const callback of this._maps.get("sidebar") ?? []) {
			callback(this.sidebar)
		}
	}
}
