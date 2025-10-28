import {
	BlurFilter,
	Container,
	Sprite,
	Texture,
	type TextureSource,
} from "pixi.js";
import type BackgroundConfig from "@/Config/BackgroundConfig";
import type FullscreenConfig from "@/Config/FullscreenConfig";
import { inject } from "@/Context";

export default class Background {
	blurFilter = new BlurFilter({
		strength:
			((inject<BackgroundConfig>("config/background")?.backgroundBlur ?? 0) /
				100) *
			50,
		quality: 4,
	});

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
		filters: [this.blurFilter],
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
		this.container.addChild(this.sprite, this.video, this.storyboardContainer);

		this.container.on("layout", (layout) => {
			const { width, height } = layout.computedLayout;
			const timelineHeight = 80;

			const isFullscreen =
				inject<FullscreenConfig>("config/fullscreen")?.fullscreen;

			const _timelineHeight = isFullscreen ? 0 : timelineHeight;

			const scale = Math.min(width / 640, (height - _timelineHeight) / 480);
			const _w = 640 * scale;
			const _h = 480 * scale;

			this.storyboardContainer.scale.set(scale);

			this.storyboardContainer.x = (width - _w) / 2;
			this.storyboardContainer.y =
				_timelineHeight + (height - _timelineHeight - _h) / 2;
		});

		inject<BackgroundConfig>("config/background")?.onChange("video", (val) => {
			this.video.visible = val;
		});

		inject<BackgroundConfig>("config/background")?.onChange(
			"backgroundBlur",
			(value: number) => {
				this.blurFilter.strength = (value / 100) * 50;
			},
		);
	}

	updateTexture(texture: Texture) {
		this.sprite.texture = texture;

		this.container.removeChild(this.sprite);
		this.container.addChild(this.sprite, this.video, this.storyboardContainer);
	}

	currentFrame?: VideoFrame;
	lastFrameTime = 0;
	frameTime = 0;

	currentSource?: TextureSource;

	init = false;

	timer?: NodeJS.Timeout;
	lastFrame?: VideoFrame;

	updateFrame(frame?: VideoFrame) {
		if (!frame) {
			this.video.texture = new Texture();
			return;
		}

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

	ejectStoryboardContainer() {
		this.storyboardContainer.removeChildren();
	}
}
