import { Game } from "./Game.js";
import { ScoreParser } from "./ScoreParser.js";
import * as PIXI from "pixi.js";
import { loadParallel } from "./Utils.js";

const CURSOR_SIZE = 0.3;

export class Cursor {
	obj;
	cursor;
	trailList;

	async init() {
		const container = new PIXI.Container();

		const [cursorTexture, trailTexture] = await Promise.all([
			PIXI.Assets.load("/static/cursor.png"),
			PIXI.Assets.load("/static/cursortrail.png"),
		]);
		this.cursor = PIXI.Sprite.from(cursorTexture);
		this.cursor.anchor.set(0.5);
		this.cursor.width = 128 * (1024 / 640);
		this.cursor.height = 128 * (1024 / 640);
		this.cursor.scale.set(CURSOR_SIZE);

		const trailList = [...Array(10).keys()].map(() =>
			PIXI.Sprite.from(trailTexture),
		);
		this.trailList = trailList;

		trailList.forEach((cursor) => {
			cursor.anchor.set(0.5);
			cursor.width = 64 * (1024 / 640);
			cursor.height = 64 * (1024 / 640);
			cursor.scale.set(CURSOR_SIZE);
			container.addChild(cursor);
		});
		container.addChild(this.cursor);
		container.x = Game.OFFSET_X;
		container.y = Game.OFFSET_Y;

		this.obj = container;
		this.obj.alpha = 0;
	}

	constructor() {}

	update(index, current_x, current_y) {
		if (!ScoreParser.CURSOR_DATA) return;
		this.obj.x = Game.OFFSET_X;
		this.obj.y = Game.OFFSET_Y;
		this.obj.scale.set(Game.SCALE_RATE);

		this.cursor.x = current_x;
		this.cursor.y = current_y;
		this.cursor.scale.set(CURSOR_SIZE);

		index--;

		this.trailList.toReversed().forEach((graphic, graphic_idx) => {
			if (index < 0) return;

			const x_delta = ScoreParser.CURSOR_DATA[index].x;
			const y_delta = ScoreParser.CURSOR_DATA[index].y;

			graphic.x = x_delta;
			graphic.y = y_delta;
			graphic.scale.set(CURSOR_SIZE * 2);
			graphic.alpha = 1 - graphic_idx / this.trailList.length;

			index--;
			return;
		});
	}
}
