import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { LayoutContainer } from "@pixi/layout/components";
import {
	Container,
	ImageSource,
	Sprite,
	Texture,
	type TextureSource,
	type VideoSource,
} from "pixi.js";

export default class Background {
	container = new Container({
		label: "background",
		layout: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
		},
	});

	dim = new LayoutContainer({
		label: "dim",
		layout: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			backgroundColor: "black",
		},
		alpha: 0.5,
	});

	private sprite = new Sprite({
		layout: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			objectPosition: "center",
			objectFit: "cover",
		},
	});

	private video = new Sprite({
		layout: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			objectPosition: "center",
			objectFit: "cover",
		},
	});

	private storyboardContainer = new Container();

	constructor() {
		this.container.addChild(
			this.sprite,
			this.video,
			this.storyboardContainer,
			this.dim,
		);

		this.container.on("layout", (layout) => {
			const { width, height } = layout.computedLayout;
			const timelineHeight = 80;

			const scale = Math.min(width / 640, (height - timelineHeight) / 480);
			const _w = 640 * scale;
			const _h = 480 * scale;

			this.storyboardContainer.scale.set(scale);

			this.storyboardContainer.x = (width - _w) / 2;
			this.storyboardContainer.y = timelineHeight + (height - timelineHeight - _h) / 2;
		});
	}

	updateTexture(texture: Texture) {
		this.sprite.texture = texture;

		this.container.removeChild(this.sprite);
		this.container.addChild(
			this.sprite,
			this.video,
			this.storyboardContainer,
			this.dim,
		);
	}

	currentFrame?: VideoFrame;
	lastFrameTime = 0;
	frameTime = 0;

	currentSource?: TextureSource;

	init = false;

	timer?: NodeJS.Timeout;
	lastFrame?: VideoFrame;

	updateFrame(frame: VideoFrame) {
		if (this.timer) {
			clearTimeout(this.timer);
			this.lastFrame?.close();
		}

		this.timer = setTimeout(() => {
			const now = performance.now();
			this.frameTime = now - this.lastFrameTime;
			this.currentFrame?.close();
			this.lastFrame = undefined;

			this.video.texture.source.resource = frame;
			this.video.texture.source.update();
			this.video.texture.update();

			this.currentFrame = frame;
			this.lastFrameTime = now;

			if (!this.init) {
				this.video.texture.destroy();
				this.video.texture = Texture.from(frame);
				this.video.texture.update();
				this.container.removeChild(this.video);
				this.container.addChild(
					this.sprite,
					this.video,
					this.storyboardContainer,
					this.dim,
				);
				this.init = true;
			}
		}, 15);

		this.lastFrame = frame;
	}

	injectStoryboardContainer(container: Container) {
		this.storyboardContainer.removeChildren();
		this.storyboardContainer.addChild(container);
	}
}
