import "@pixi/layout";
import { Game } from "./Game";
import { provide } from "./Context";

const game = provide("game", new Game());
await game.init();

import "./Test";
