import { Application, RenderTarget } from "pixi.js";

RenderTarget.defaultOptions.depth = true;
RenderTarget.defaultOptions.stencil = true;

class Game {
	app?: Application;

	async init() {
		this.app = new Application();
        await this.app.init({
            // biome-ignore lint/style/noNonNullAssertion: It should be there already lol
            resizeTo: document.querySelector<HTMLDivElement>("#app")!,
            useBackBuffer: true,
            antialias: true
        });

        document.querySelector<HTMLDivElement>("#app")?.append(this.app.canvas);
	}

    update() {
    }
}

const game = new Game();
export default game;
