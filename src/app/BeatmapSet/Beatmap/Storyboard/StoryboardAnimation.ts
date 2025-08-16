import type { Texture } from "pixi.js";
import StoryboardSprite from "./StoryboardSprite";
import {
    AnimationLoopType,
	type StoryboardAnimation as StoryboardAnimationData,
	type StoryboardLayerType,
} from "@rian8337/osu-base";

export class StoryboardAnimation extends StoryboardSprite {
	constructor(
		public data: StoryboardAnimationData,
		public layerType: StoryboardLayerType,
	) {
		super(data, layerType);
	}

	private _textureArr: Texture[] = [];
	loadTexture(): void {
		const textures = this.context.consume<Map<string, Texture>>("textures");
		if (!textures) return;

		for (let i = 0; i < this.data.frameCount; i++) {
			const basePath = this.data.path.replaceAll("\\", "/").toLowerCase();
			const pre = basePath.split(".").slice(0, -1).join(".");
			const ext = basePath.split(".").at(-1) ?? "";

			const texture = textures.get(`${pre}${i}.${ext}`);
			if (!texture) return;

			this._textureArr.push(texture);
		}
	}

	update(timestamp: number) {
		const f = Math.floor(
			(timestamp - this.data.startTime) / this.data.frameDelay,
		);

        const frameIndex = this.data.loopType === AnimationLoopType.loopForever ? f % this.data.frameCount : Math.min(f, this.data.frameCount);
        this.container.texture = this._textureArr[frameIndex];

		super.update(timestamp);
	}
}
