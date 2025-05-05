import { extensions, ExtensionType, type Renderer } from "pixi.js";
import { inject } from "./Context";

export const frameData = {
    fps: 0,
    deltaMS: 0,
};

export class FPSSystem {
    static extension = {
        type: [ExtensionType.WebGLSystem, ExtensionType.WebGPUSystem],
        name: "fps",
    };

    _renderer;

    private _renderStart = 0;
    private _lastFrame = 0;
    private _fpsQueue: number[] = [];
    private _msQueue: number[] = [];

    constructor(renderer: Renderer) {
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

    prerender() {
        this._renderStart = performance.now();
        const fps = 1000 / (this._renderStart - this._lastFrame);
        this._fpsQueue.push(fps);

        while (this._fpsQueue.length > 100) {
            this._fpsQueue.shift();
        }

        frameData.fps =
            this._fpsQueue.reduce((accm, curr, idx) => {
                return accm + curr * ((idx + 1) / this._fpsQueue.length);
            }, 0) /
            ((1 / this._fpsQueue.length + 1) * (this._fpsQueue.length / 2));

        this._lastFrame = this._renderStart;
    }

    postrender() {
        const deltaMS = performance.now() - this._renderStart;
        this._msQueue.push(deltaMS);

        while (this._msQueue.length > 100) {
            this._msQueue.shift();
        }

        frameData.deltaMS =
            this._msQueue.reduce((accm, curr, idx) => {
                return accm + curr * ((idx + 1) / this._msQueue.length);
            }, 0) /
            ((1 / this._msQueue.length + 1) * (this._msQueue.length / 2));

        const game = inject("game");
        game.update();
    }
}

extensions.add(FPSSystem);
