import type { Application } from "pixi.js";
import { inject } from "./Context";
import type Main from "./UI/main";
import type SidePanel from "./UI/sidepanel";
import type { Game } from "./Game";
import type Metadata from "./UI/sidepanel/Metadata";
import type Viewer from "./UI/main/viewer";
import type Controls from "./UI/main/controls";

type ResponsiveCallback = (direction: "landscape" | "portrait") => void;

export default class ResponsiveHandler {
	direction: "landscape" | "portrait" = "landscape";

	callbacks: Set<ResponsiveCallback> = new Set();
	on(_: "layout", callback: ResponsiveCallback) {
		this.callbacks.add(callback);
	}

	responsive() {
		const app = inject<Application>("ui/app");

		if (!app) return;

		const width = app.screen.width;
		const height = app.screen.height;

		if (width > height && this.direction !== "landscape") {
			this.direction = "landscape";

			for (const callback of this.callbacks) {
				callback(this.direction);
			}
		}

		if (width < height && this.direction !== "portrait") {
			this.direction = "portrait";

			for (const callback of this.callbacks) {
				callback(this.direction);
			}
		}
	}
}
