import * as PIXI from "pixi.js";
import { Game } from "../Game";
import { Background } from "../Background";
import { FadeCommand } from "./FadeCommand";
import { MoveCommand } from "./MoveCommand";
import { ScaleCommand } from "./ScaleCommand";
import { RotateCommand } from "./RotateCommand";
import { ColourCommand } from "./ColourCommand";
import { ParameterCommand } from "./ParameterCommand";
import { LoopCommand } from "./LoopCommand";
import MyWorker from "../Workers/StoryboardWorker.js?worker";

export const EASINGS = {
	0: "linear",
	1: "easeOutSine" /* EaseOut */,
	2: "easeInSine" /* EaseIn */,
	3: "easeInQuad",
	4: "easeOutQuad",
	5: "easeInOutQuad",
	6: "easeInCubic",
	7: "easeOutCubic",
	8: "easeInOutCubic",
	9: "easeInQuart",
	10: "easeOutQuart",
	11: "easeInOutQuart",
	12: "easeInQuint",
	13: "easeOutQuint",
	14: "easeInOutQuint",
	15: "easeInSine",
	16: "easeOutSine",
	17: "easeInOutSine",
	18: "easeInExpo",
	19: "easeOutExpo",
	20: "easeInOutExpo",
	21: "easeInCirc",
	22: "easeOutCirc",
	23: "easeInOutCirc",
	24: "easeInElastic",
	25: "easeOutElastic",
	26: "easeOutElasticHalf" /* ElasticHalf */,
	27: "easeOutElasticQuart" /* ElasticQuarter */,
	28: "easeInOutElastic",
	29: "easeInBack",
	30: "easeOutBack",
	31: "easeInOutBack",
	32: "easeInBounce",
	33: "easeOutBounce",
	34: "easeInOutBounce",
};

const ANCHOR = {
	TopLeft: [0, 0],
	TopCentre: [0.5, 0],
	TopRight: [1, 0],
	CentreLeft: [0, 0.5],
	Centre: [0.5, 0.5],
	CentreRight: [1, 0.5],
	BottomLeft: [0, 1],
	BottomCentre: [0.5, 1],
	BottomRight: [1, 1],
};

const LAYER = {
	Background: 0,
	Fail: 1,
	Pass: 2,
	Foreground: 3,
};

export class StoryboardSprite {
	raw;
	commands = [];
	isInRender = false;
	isOsu = false;

	props = {
		posX: 0,
		posY: 0,
		scaleX: 1,
		scaleY: 1,
		alpha: 1,
		tint: 0xffffff,
		rotation: 0,
		blendMode: "normal",
		flipH: false,
		flipW: false,
	};

	constructor(raw, isOsu) {
		this.raw = raw;
		this.isOsu = isOsu;
		this.sprite = new PIXI.Sprite();
		this.sprite.visible = false;

		this.getSpriteInfo();

		this.commands = this.parse(raw);
		// if (this.texturepath === "sb/bg/b2.jpg") {
		// 	console.log(this.commands);
		// }

		this.startTime = Math.min(
			...Object.values(this.commands)
				.reduce((accm, curr) => [...accm, ...curr], [])
				.map((command) => command.startTime),
		);
		this.endTime = Math.max(
			...Object.values(this.commands)
				.reduce((accm, curr) => [...accm, ...curr], [])
				.map((command) => command.startTime + command.duration),
		);

		// console.log(this.texturepath, this.startTime, this.endTime);
	}

	static fadeParse(line, object) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		if (
			object?.texturepath === Storyboard.backgroundFilename &&
			params.at(0) === "0"
		) {
			Storyboard.BLACK_BG = true;

			if (Game.IS_STORYBOARD) Background.sprite.tint = 0x000000;
		}

		return new FadeCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			params: params.map((param) => parseFloat(param)),
		});
	}

	static moveParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		const paramsX = params.filter((_, idx) => idx % 2 === 0);
		const paramsY = params.filter((_, idx) => idx % 2 !== 0);

		return new MoveCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			paramsX: paramsX.map((param) => parseFloat(param)),
			paramsY: paramsY.map((param) => parseFloat(param)),
		});
		// console.log("MOVE", easing, startTime, endTime, params);
	}

	static moveXParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		return new MoveCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			paramsX: params.map((param) => parseFloat(param)),
			paramsY: [],
		});
		// console.log("MOVE_X", easing, startTime, endTime, params);
	}

	static moveYParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		return new MoveCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			paramsX: [],
			paramsY: params.map((param) => parseFloat(param)),
		});
		// console.log("MOVE_Y", easing, startTime, endTime, params);
	}

	static scaleParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		return new ScaleCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			paramsX: params.map((param) => parseFloat(param)),
			paramsY: params.map((param) => parseFloat(param)),
		});

		// console.log("SCALE", easing, startTime, endTime, params);
	}

	static vectorParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		const paramsX = params.filter((_, idx) => idx % 2 === 0);
		const paramsY = params.filter((_, idx) => idx % 2 !== 0);

		return new ScaleCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			paramsX: paramsX.map((param) => parseFloat(param)),
			paramsY: paramsY.map((param) => parseFloat(param)),
		});

		// console.log("SCALE", easing, startTime, endTime, params);
	}

	static rotateParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		return new RotateCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			params: params.map((param) => parseFloat(param)),
		});
		// console.log("ROTATE", easing, startTime, endTime, params);
	}

	static colourParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		const paramsR = params.filter((_, idx) => idx % 3 === 0);
		const paramsG = params.filter((_, idx) => idx % 3 === 1);
		const paramsB = params.filter((_, idx) => idx % 3 === 2);

		return new ColourCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			paramsR: paramsR.map((param) => parseFloat(param)),
			paramsG: paramsG.map((param) => parseFloat(param)),
			paramsB: paramsB.map((param) => parseFloat(param)),
		});
		// console.log("COLOUR", easing, startTime, endTime, params);
	}

	static parameterParse(line) {
		let [, easing, startTime, endTime, ...params] = line.split(",");
		if (endTime === "") endTime = startTime;

		return new ParameterCommand({
			easing,
			startTime: parseFloat(startTime),
			endTime: parseFloat(endTime),
			params,
		});
		// console.log("PARAMETER", easing, startTime, endTime, params);
	}

	static loopParse(block) {
		const [line, ...rest] = block.split("\r\n");
		const [, startTime, loopCount] = line.split(",");
		const rawCommands = rest.join("\r\n");

		return new LoopCommand({
			startTime: parseFloat(startTime),
			loopCount: parseInt(loopCount),
			rawCommands,
		});
	}

	getSpriteInfo() {
		const [infoLine] = this.raw.split("\r\n");
		const [, layer, origin, texturepath, x, y] = infoLine.split(",");

		this.layer = layer;
		this.origin = origin;
		this.texturepath = texturepath.slice(1, -1).replaceAll("\\", "/");
		this.base_x = parseFloat(x);
		this.base_y = parseFloat(y);

		this.props.posX = this.base_x;
		this.props.posY = this.base_y;
		this.sprite.anchor.set(...ANCHOR[this.origin]);
		this.sprite.label = `${this.texturepath} ${this.layer}`;
		this.sprite.zIndex = LAYER[this.layer];
	}

	loadTexture() {
		this.texture = Storyboard.TEXTURES[this.texturepath];
		this.sprite.texture = this.texture;
	}

	parse(raw) {
		const fade = (
			raw.match(new RegExp(`^${Storyboard.REGEX.FADE.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.fadeParse(command, this));
		const move = (
			raw.match(new RegExp(`^${Storyboard.REGEX.MOVE.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.moveParse(command));
		const moveX = (
			raw.match(new RegExp(`^${Storyboard.REGEX.MOVE_X.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.moveXParse(command));
		const moveY = (
			raw.match(new RegExp(`^${Storyboard.REGEX.MOVE_Y.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.moveYParse(command));
		const scale = (
			raw.match(new RegExp(`^${Storyboard.REGEX.SCALE.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.scaleParse(command));
		const vector = (
			raw.match(new RegExp(`^${Storyboard.REGEX.VECTOR.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.vectorParse(command));
		const rotate = (
			raw.match(new RegExp(`^${Storyboard.REGEX.ROTATE.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.rotateParse(command));
		const colour = (
			raw.match(new RegExp(`^${Storyboard.REGEX.COLOUR.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.colourParse(command));
		const parameter = (
			raw.match(new RegExp(`^${Storyboard.REGEX.PARAMETER.source}`, "gm")) ?? []
		).map((command) => StoryboardSprite.parameterParse(command));
		const loop = (
			raw.match(new RegExp(`^${Storyboard.REGEX.LOOP_BLOCK.source}`, "gm")) ??
			[]
		).map((command) => StoryboardSprite.loopParse(command));

		return {
			fade,
			move,
			moveX,
			moveY,
			scale,
			vector,
			rotate,
			colour,
			parameter,
			loop,
		};
	}

	draw(timestamp) {
		if (timestamp < this.startTime || timestamp > this.endTime) {
			if (this.isInRender) {
				this.isInRender = false;
				this.sprite.visible = false;
			}
			return;
		}

		if (!this.isInRender) {
			this.isInRender = true;
			this.sprite.visible = true;

			// this.sprite.scale.set(Game.SCALE_RATE);
			// this.sprite.x = Game.NON_SCALE_OFFSET_X + this.base_x.x * Game.SCALE_RATE;
			// this.sprite.y = Game.NON_SCALE_OFFSET_Y + this.base_y.y * Game.SCALE_RATE;
			// this.sprite.alpha = 1;
			// this.sprite.tint = 0xFFFFFF;
		}

		Object.values(this.commands).forEach((commandGroup) => {
			commandGroup.forEach((command, idx, arr) => {
				if (timestamp < command.startTime && idx !== 0) return;
				if (
					idx !== 0 &&
					arr[idx - 1].startTime === command.startTime &&
					arr[idx - 1].duration === command.duration &&
					!(command instanceof LoopCommand)
				)
					return;

				command.execute(this, timestamp);
			});
		});

		this.sprite.x = this.props.posX * Game.SB_SCALE_RATE;
		this.sprite.y = this.props.posY * Game.SB_SCALE_RATE;
		this.sprite.alpha = this.props.alpha;
		this.sprite.scale.set(
			this.props.scaleX * Game.SB_SCALE_RATE * (this.props.flipW ? -1 : 1),
			this.props.scaleY * Game.SB_SCALE_RATE * (this.props.flipH ? -1 : 1),
		);
		this.sprite.rotation = this.props.rotation;
		this.sprite.tint = this.props.tint;
		this.sprite.blendMode = this.props.blendMode;
	}
}

export class StoryboardAnimatedSprite extends StoryboardSprite {
	currentFrame = 0;

	constructor(raw, isOsu) {
		super(raw, isOsu);
	}

	getSpriteInfo() {
		const [infoLine] = this.raw.split("\r\n");
		const [
			,
			layer,
			origin,
			texturepath,
			x,
			y,
			frameCount,
			frameDelay,
			loopType,
		] = infoLine.split(",");

		this.layer = layer;
		this.origin = origin;
		this.texturepath = texturepath.slice(1, -1).replaceAll("\\", "/");
		this.base_x = parseFloat(x);
		this.base_y = parseFloat(y);
		this.frameCount = parseInt(frameCount);
		this.frameDelay = parseFloat(frameDelay);
		this.loopType = loopType;

		this.props.posX = this.base_x;
		this.props.posY = this.base_y;
		this.sprite.anchor.set(...ANCHOR[this.origin]);
		this.sprite.label = `${this.texturepath} ${this.layer}`;
		this.sprite.zIndex = LAYER[this.layer];
	}

	loadTexture() {
		this.texture =
			Storyboard.TEXTURES[
				`${this.texturepath.split(".").slice(0, -1).join(".")}0.${this.texturepath.split(".").at(-1)}`
			];
		this.sprite.texture = this.texture;
	}

	draw(timestamp) {
		super.draw(timestamp);
		if (timestamp < this.startTime) return;

		const step = Math.floor((timestamp - this.startTime) / this.frameDelay);
		if (
			this.loopType === "LoopOnce" &&
			this.currentFrame >= this.frameCount - 1
		)
			return;

		const frame = step % this.frameCount;
		// console.log(`${this.texturepath.split(".").slice(0, -1).join(".")}${frame}.png`, frame, step);
		if (frame !== this.currentFrame) {
			this.currentFrame = frame;
			this.sprite.texture =
				Storyboard.TEXTURES[
					`${this.texturepath.split(".").slice(0, -1).join(".")}${frame}.${this.texturepath.split(".").at(-1)}`
				];
		}
	}
}

export class Storyboard {
	static rawOsb;
	static sprites = [];
	static backgroundFilename = "";
	static BLACK_BG = false;
	static TEXTURES = {};

	static WORKER = new MyWorker();

	static filtered = [];

	static REGEX = {
		FADE: /(_| )F,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		MOVE: /(_| )M,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		MOVE_X:
			/(_| )MX,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		MOVE_Y:
			/(_| )MY,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		SCALE:
			/(_| )S,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		VECTOR:
			/(_| )V,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		ROTATE:
			/(_| )R,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		COLOUR:
			/(_| )C,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?(E(\+|-)[0-9]+)?)+/g,
		PARAMETER:
			/(_| )P,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,(H|V|A))+/g,
		LOOP: /(_| )L,-?[0-9]+(\.[0-9]+)?,[0-9]+/g,
		SPRITE:
			/Sprite,(0|1|2|3|Background|Foreground|Pass|Fail),([0-9]|Top(Left|Right|Centre)|Centre(Left|Right)?|Bottom(Left|Right|Centre)|Custom),"((?:\w+\\?)*\\)?[;\+\/\\\!\(\)\[\]\{\}\&\%\#a-zA-Z0-9\s\._\-\~\@']+\.[a-zA-Z0-9]+",-?[0-9]+(\.[0-9]+)?,-?[0-9]+(\.[0-9]+)?/g,
		ANIMATION:
			/Animation,(0|1|2|3|Background|Foreground|Pass|Fail),([0-9]|Top(Left|Right|Centre)|Centre(Left|Right)?|Bottom(Left|Right|Centre)|Custom),"((?:\w+\\?)*\\)?[;\+\/\\\!\(\)\[\]\{\}\&\%\#a-zA-Z0-9\s\._\-\~\@']+\.[a-zA-Z0-9]+",-?[0-9]+(\.[0-9]+)?,-?[0-9]+(\.[0-9]+)?,-?[0-9]+(\.[0-9]+)?,-?[0-9]+(\.[0-9]+)?,(LoopOnce|LoopForever)/g,
		VARIABLE: /^\$[0-9A-Za-z]+=.+/gm,
	};

	static init() {
		this.container = new PIXI.Container();
		this.container.label = "Storyboard";
		this.container.eventMode = "none";

		this.mask = new PIXI.Graphics();
		this.mask.label = "MASK";
		this.mask
			.clear()
			.rect(
				(Game.MASTER_CONTAINER.h * (4 / 3 - 16 / 9)) / 2,
				0,
				(Game.MASTER_CONTAINER.h * 16) / 9,
				Game.MASTER_CONTAINER.h,
			)
			.fill(0xffffff);

		this.container.mask = this.mask;

		this.container.addChild(this.mask);

		this.REGEX.COMMAND_REGEX = new RegExp(
			`${Storyboard.REGEX.FADE.source}|${Storyboard.REGEX.MOVE.source}|${Storyboard.REGEX.MOVE_X.source}|${Storyboard.REGEX.MOVE_Y.source}|${Storyboard.REGEX.SCALE.source}|${Storyboard.REGEX.VECTOR.source}|${Storyboard.REGEX.ROTATE.source}|${Storyboard.REGEX.COLOUR.source}|${Storyboard.REGEX.PARAMETER.source}`,
		);
		this.REGEX.LOOP_BLOCK = new RegExp(
			`${Storyboard.REGEX.LOOP.source}((\\r)?\\n(_| )(${Storyboard.REGEX.COMMAND_REGEX.source}))+`,
			"gm",
		);
		this.REGEX.SPRITE_BLOCK = new RegExp(
			`(${Storyboard.REGEX.SPRITE.source}|${Storyboard.REGEX.ANIMATION.source})((\\r)?\\n(${Storyboard.REGEX.COMMAND_REGEX.source}|${this.REGEX.LOOP_BLOCK.source}))+`,
			"gm",
		);
		this.REGEX.FORBIDDEN = new RegExp(
			`((Sprite|Animation),.*?)(?=(\r)?\n((Sprite|Animation),.*?))`,
			"gm",
		);

		// this.WORKER.onmessage = (event) => {
		//     const { type } = event.data;
		//     switch (type) {
		//         case "updateOrder": {
		//             const { filtered, add, removed } = event.data.objects;
		//             this.filtered = filtered;

		//             removed.forEach((object) => Storyboard.sprites[object.idx].sprite.visible = false);
		//             // addTop.forEach((object) => Storyboard.container.addChild(Storyboard.sprites[object.idx].sprite));
		//             // addBack.reverse().forEach((object) => Storyboard.container.addChildAt(Storyboard.sprites[object.idx].sprite, 0));
		//             // this.filtered.forEach((object) => Storyboard.container.addChild(Storyboard.sprites[object.idx].sprite));
		//             // add.forEach((object) => Storyboard.sprites[object.idx].sprite.visible = true);

		//             break;
		//         }
		//     }
		// };

		// this.REGEX.SPRITE_BLOCK = new RegExp(`${Storyboard.REGEX.SPRITE.source}((\\r)?\\n(${Storyboard.REGEX.FADE.source}))+`, "gm");
	}

	static load(content, isOsu) {
		const variablesRaw = content.match(this.REGEX.VARIABLE) ?? [];
		const variables = variablesRaw.map((variable) => {
			const [key, ...rest] = variable.split("=");
			return {
				key,
				value: rest.join(""),
			};
		});

		const parsed = variables.reduce(
			(accm, curr) => accm.replaceAll(curr.key, curr.value),
			content,
		);

		const illegals = parsed.match(this.REGEX.FORBIDDEN) ?? [];
		if (illegals.length > 0) {
			Storyboard.BLACK_BG = true;
			if (Game.IS_STORYBOARD) Background.sprite.tint = 0x000000;
		}
		const clean = illegals.reduce(
			(accm, curr) => accm.replaceAll(curr, ""),
			parsed,
		);

		const blocks = clean.match(this.REGEX.SPRITE_BLOCK) ?? [];
		return blocks.map((line) => {
			const test = line.split(",").at(0) === "Sprite";
			if (test) return new StoryboardSprite(line, isOsu ?? false);
			return new StoryboardAnimatedSprite(line, isOsu ?? false);
		});
	}

	static async parse(
		osbContent,
		osuOsbContent,
		allEntries,
		backgroundFilename,
	) {
		Storyboard.backgroundFilename = backgroundFilename;

		const osbSprites = Storyboard.load(osbContent);
		const osuSprites = Storyboard.load(osuOsbContent, true);
		Storyboard.sprites = [...osuSprites, ...osbSprites];

		// Storyboard.sprites = Storyboard.sprites.toSorted((a, b) => {
		//     if (a.startTime === b.startTime) {
		//         if (a.isOsu && !b.isOsu) return 1;
		//         if (!a.isOsu && b.isOsu) return -1;
		//         return 0;
		//     }

		//     return a.startTime - b.startTime;
		// });

		// console.log(Storyboard.sprites);

		const texturePaths = Storyboard.sprites.reduce(
			(accm, curr) =>
				curr instanceof StoryboardAnimatedSprite
					? [
							...accm,
							...Array(curr.frameCount)
								.fill(true)
								.map((_, idx) => {
									return `${curr.texturepath.split(".").slice(0, -1).join(".")}${idx}.${curr.texturepath.split(".").at(-1)}`;
								}),
						]
					: [...accm, curr.texturepath],
			[],
		);
		// console.log(texturePaths.join("\n"));

		for (const texturepath of texturePaths) {
			if (Storyboard.TEXTURES[texturepath]) continue;

			const file = allEntries.find(
				(entry) => entry.filename.toLowerCase() === texturepath.toLowerCase(),
			);

			if (!file) {
				Storyboard.TEXTURES[texturepath] = new PIXI.Texture();
				continue;
			}

			const data = await file.getData(
				new zip.BlobWriter(`image/${texturepath.split(".").at(-1)}`),
			);
			const url = URL.createObjectURL(data);

			const texture = await PIXI.Assets.load({
				src: url,
				loadParser: "loadTextures",
			});

			Storyboard.TEXTURES[texturepath] = texture;
		}

		for (const sprite of Storyboard.sprites) {
			sprite.loadTexture();
			Storyboard.container.addChild(sprite.sprite);

			// if (sprite.texturepath === "sb/our_boy/whale.png") console.log(sprite);
		}

		// this.WORKER.postMessage({
		//     type: "objects",
		//     objects: Storyboard.sprites.map((sprite, idx) => {
		//         return {
		//             startTime: sprite.startTime,
		//             endTime: sprite.endTime,
		//             texturepath: sprite.texturepath,
		//             idx,
		//             isOsu: sprite.isOsu,
		//         };
		//     }),
		// });

		// console.log(Storyboard.sprites);
	}

	static reset() {
		Storyboard.rawOsb;
		Storyboard.sprites = [];
		Storyboard.backgroundFilename = "";
		Storyboard.BLACK_BG = false;
		Storyboard.TEXTURES = {};
		Storyboard.WORKER.postMessage({
			type: "clear",
		});
	}

	static draw(timestamp) {
		if (Game.EMIT_STACK.length > 0) {
			this.container.x = Game.SB_OFFSET_X;
			this.container.y = Game.SB_OFFSET_Y;

			this.mask
				.clear()
				.rect(
					(Game.MASTER_CONTAINER.h * (4 / 3 - 16 / 9)) / 2,
					0,
					(Game.MASTER_CONTAINER.h * 16) / 9,
					Game.MASTER_CONTAINER.h,
				)
				.fill(0xffffff);
		}

		if (!Game.IS_STORYBOARD) return;

		Storyboard.sprites.forEach((sprite) => sprite.draw(timestamp));
		// Storyboard.filtered.forEach((spriteInfo) => Storyboard.sprites[spriteInfo.idx].draw(timestamp));
	}
}
