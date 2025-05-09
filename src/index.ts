import "@pixi/layout";
import { runTest } from "./Test";
import { Game } from "./Game";
import { provide } from "./Context";

(async () => {
	const game = provide("game", new Game());
	await game.init();
	runTest();
})();
