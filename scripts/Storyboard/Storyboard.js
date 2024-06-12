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

    props = {
        posX: 0,
        posY: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        tint: 0xffffff,
        rotation: 0,
        blendMode: "normal",
    };

    constructor(raw) {
        this.raw = raw;
        this.sprite = new PIXI.Sprite();
        this.sprite.visible = false;

        this.getSpriteInfo();

        this.commands = this.parse(raw);
        // console.log(this.texturepath, this.commands);
        this.startTime = Math.min(
            ...Object.values(this.commands)
                .reduce((accm, curr) => [...accm, ...curr], [])
                .map((command) => command.startTime)
        );
        this.endTime = Math.max(
            ...Object.values(this.commands)
                .reduce((accm, curr) => [...accm, ...curr], [])
                .map((command) => command.startTime + command.duration)
        );

        // console.log(this.texturepath, this.startTime, this.endTime);
    }

    static fadeParse(line, object) {
        let [, easing, startTime, endTime, ...params] = line.split(",");
        if (endTime === "") endTime = startTime;

        if (object?.texturepath === Storyboard.backgroundFilename && startTime === "0" && params.at(0) === "0") {
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
        // console.log("LOOP", startTime, loopCount, commands)
    }

    getSpriteInfo() {
        const [infoLine] = this.raw.split("\r\n");
        const [, layer, origin, texturepath, x, y] = infoLine.split(",");

        this.layer = layer;
        this.origin = origin;
        this.texturepath = texturepath.slice(1, -1).replaceAll("\\", "/");
        this.base_x = x;
        this.base_y = y;

        this.props.posX = x;
        this.props.posY = y;
        this.sprite.anchor.set(...ANCHOR[this.origin]);
        this.sprite.label = `${this.texturepath} ${this.layer}`;
    }

    async loadTexture(allEntries) {
        try {
            const file = allEntries.find((entry) => entry.filename.toLowerCase() === this.texturepath.toLowerCase());
            const data = await file.getData(new zip.BlobWriter(`image/${this.texturepath.split(".").at(-1)}`));
            this.textureBlobURL = URL.createObjectURL(data);

            this.texture = await PIXI.Assets.load({ src: this.textureBlobURL, loadParser: "loadTextures" });
            this.sprite.texture = this.texture;
        } catch {
            console.log(this.texturepath, allEntries);
        }
    }

    parse(raw) {
        const fade = (raw.match(new RegExp(`^${Storyboard.REGEX.FADE.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.fadeParse(command, this)
        );
        const move = (raw.match(new RegExp(`^${Storyboard.REGEX.MOVE.source}`, "gm")) ?? []).map((command) => StoryboardSprite.moveParse(command));
        const moveX = (raw.match(new RegExp(`^${Storyboard.REGEX.MOVE_X.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.moveXParse(command)
        );
        const moveY = (raw.match(new RegExp(`^${Storyboard.REGEX.MOVE_Y.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.moveYParse(command)
        );
        const scale = (raw.match(new RegExp(`^${Storyboard.REGEX.SCALE.source}`, "gm")) ?? []).map((command) => StoryboardSprite.scaleParse(command));
        const vector = (raw.match(new RegExp(`^${Storyboard.REGEX.VECTOR.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.vectorParse(command)
        );
        const rotate = (raw.match(new RegExp(`^${Storyboard.REGEX.ROTATE.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.rotateParse(command)
        );
        const colour = (raw.match(new RegExp(`^${Storyboard.REGEX.COLOUR.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.colourParse(command)
        );
        const parameter = (raw.match(new RegExp(`^${Storyboard.REGEX.PARAMETER.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.parameterParse(command)
        );
        const loop = (raw.match(new RegExp(`^${Storyboard.REGEX.LOOP_BLOCK.source}`, "gm")) ?? []).map((command) =>
            StoryboardSprite.loopParse(command)
        );

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

        // osbContent.split("\r\n").forEach((line) => {
        //     // if (Storyboard.REGEX.SPRITE.test(line)) console.log(line);
        //     // if (Storyboard.REGEX.FADE.test(line)) Storyboard.fadeParse(line);
        //     // if (Storyboard.REGEX.MOVE.test(line)) Storyboard.moveParse(line);
        //     // if (Storyboard.REGEX.MOVE_X.test(line)) Storyboard.moveX(line);
        //     // if (Storyboard.REGEX.MOVE_Y.test(line)) Storyboard.moveY(line);
        //     // if (Storyboard.REGEX.SCALE.test(line)) Storyboard.scaleParse(line);
        //     // if (Storyboard.REGEX.ROTATE.test(line)) Storyboard.rotateParse(line);
        //     // if (Storyboard.REGEX.COLOUR.test(line)) Storyboard.colourParse(line);
        //     // if (Storyboard.REGEX.PARAMETER.test(line)) Storyboard.parameterParse(line);
        // });
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
                if (idx !== 0 && arr[idx - 1].startTime === command.startTime && arr[idx - 1].duration === command.duration) return;
                command.execute(this, timestamp);
            });
        });

        this.sprite.x = this.props.posX * Game.SB_SCALE_RATE;
        this.sprite.y = this.props.posY * Game.SB_SCALE_RATE;
        this.sprite.alpha = this.props.alpha;
        this.sprite.scale.set(this.props.scaleX * Game.SB_SCALE_RATE, this.props.scaleY * Game.SB_SCALE_RATE);
        this.sprite.rotation = this.props.rotation;
        this.sprite.tint = this.props.tint;
        this.sprite.blendMode = this.props.blendMode;
    }
}

export class Storyboard {
    static rawOsb;
    static sprites = [];
    static backgroundFilename = "";
    static BLACK_BG = false;

    static REGEX = {
        FADE: /(_| )F,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        MOVE: /(_| )M,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        MOVE_X: /(_| )MX,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        MOVE_Y: /(_| )MY,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        SCALE: /(_| )S,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        VECTOR: /(_| )V,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        ROTATE: /(_| )R,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        COLOUR: /(_| )C,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,-?[0-9]+(\.[0-9]+)?)+/g,
        PARAMETER: /(_| )P,[0-9]{1,2},-?[0-9]+(\.[0-9]+)?,(-?[0-9]+(\.[0-9]+)?)?(,(H|V|A))+/g,
        LOOP: /(_| )L,-?[0-9]+(\.[0-9]+)?,[0-9]+/g,
        SPRITE: /Sprite,(0|1|2|3|Background|Foreground|Pass|Fail),([0-9]|Top(Left|Right|Centre)|Centre(Left|Right)?|Bottom(Left|Right|Centre)|Custom),"((?:\w+\\?)*\\)?[;\+\/\\\!\(\)\[\]\{\}\&\%\#a-zA-Z0-9\s\._\-\~\@']+\.[a-zA-Z0-9]+",-?[0-9]+(\.[0-9]+)?,-?[0-9]+(\.[0-9]+)?/g,
    };

    static init() {
        this.container = new PIXI.Container();
        this.container.label = "Storyboard";

        this.mask = new PIXI.Graphics();
        this.mask.label = "MASK";
        this.mask
            .clear()
            .rect(Game.MASTER_CONTAINER.h * (4 / 3 - 16 / 9) / 2, 0, (Game.MASTER_CONTAINER.h * 16) / 9, Game.MASTER_CONTAINER.h)
            .fill(0xffffff);

        this.container.mask = this.mask;

        this.container.addChild(this.mask);

        this.REGEX.COMMAND_REGEX = new RegExp(
            `${Storyboard.REGEX.FADE.source}|${Storyboard.REGEX.MOVE.source}|${Storyboard.REGEX.MOVE_X.source}|${Storyboard.REGEX.MOVE_Y.source}|${Storyboard.REGEX.SCALE.source}|${Storyboard.REGEX.VECTOR.source}|${Storyboard.REGEX.ROTATE.source}|${Storyboard.REGEX.COLOUR.source}|${Storyboard.REGEX.PARAMETER.source}`
        );
        this.REGEX.LOOP_BLOCK = new RegExp(`${Storyboard.REGEX.LOOP.source}((\\r)?\\n(_| )(${Storyboard.REGEX.COMMAND_REGEX.source}))+`, "gm");
        this.REGEX.SPRITE_BLOCK = new RegExp(
            `${Storyboard.REGEX.SPRITE.source}((\\r)?\\n(${Storyboard.REGEX.COMMAND_REGEX.source}|${this.REGEX.LOOP_BLOCK.source}))+`,
            "gm"
        );
        // this.REGEX.SPRITE_BLOCK = new RegExp(`${Storyboard.REGEX.SPRITE.source}((\\r)?\\n(${Storyboard.REGEX.FADE.source}))+`, "gm");
    }

    static async parse(osbContent, allEntries, backgroundFilename) {
        const blocks = osbContent.match(this.REGEX.SPRITE_BLOCK) ?? [];
        Storyboard.backgroundFilename = backgroundFilename;
        Storyboard.sprites = blocks.map((line) => new StoryboardSprite(line));
        Storyboard.sprites = Storyboard.sprites.toSorted((a, b) => {
            // if (LAYER[a.layer] === LAYER[b.layer]) {
            //     return a.startTime - b.startTime;
            // }

            return LAYER[a.layer] - LAYER[b.layer];
        });
        for (const sprite of Storyboard.sprites) {
            await sprite.loadTexture(allEntries);
            Storyboard.container.addChild(sprite.sprite);
        }

        console.log(Storyboard.sprites);
    }

    static draw(timestamp) {
        if (Game.EMIT_STACK.length > 0) {
            this.container.x = Game.SB_OFFSET_X;
            this.container.y = Game.SB_OFFSET_Y;

            this.mask
                .clear()
                .rect(Game.MASTER_CONTAINER.h * (4 / 3 - 16 / 9) / 2, 0, (Game.MASTER_CONTAINER.h * 16) / 9, Game.MASTER_CONTAINER.h)
                .fill(0xffffff);
        }

        if (!Game.IS_STORYBOARD) return;

        Storyboard.sprites.forEach((sprite) => sprite.draw(timestamp));
    }
}
