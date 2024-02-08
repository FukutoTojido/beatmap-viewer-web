import * as PIXI from "pixi.js";
import * as TWEEN from "@tweenjs/tween.js";
import { ObjectsController } from "./HitObjects/ObjectsController";
import { Game } from "./Game";

export const frameData = {
    fps: 0,
    deltaMS: 0,
};

export class FPSSystem {
    static extension = {
        type: [PIXI.ExtensionType.WebGLSystem, PIXI.ExtensionType.WebGPUSystem],
        name: "fps",
    };

    _renderer;

    constructor(renderer) {
        this._renderer = renderer;
    }

    init() {
        this._renderer.runners.prerender.add(this);
        this._renderer.runners.postrender.add(this);
    }

    destroy() {
        this._renderer.runners.prerender.remove(this);
        this._renderer.runners.postrender.remove(this);
    }

    _renderStart = 0;
    _lastFrame = 0;

    _fpsQueue = [];
    _msQueue = [];

    prerender() {
        // console.log("prerender");
        this._renderStart = performance.now();
        frameData.fps = 1000 / (this._renderStart - this._lastFrame);
        this._lastFrame = this._renderStart;

        if (!Game.INIT) return;

        TWEEN.update();
        ObjectsController.render();
        Game.DEVE_RATIO = devicePixelRatio;
    }

    postrender() {
        // console.log("postrender");
        frameData.deltaMS = performance.now() - this._renderStart;
    }
}

PIXI.extensions.add(FPSSystem);
