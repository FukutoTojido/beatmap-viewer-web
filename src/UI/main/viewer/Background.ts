import { LayoutContainer } from "@pixi/layout/components";
import {
	ImageSource,
	Sprite,
	Texture,
	type TextureSource,
	type VideoSource,
} from "pixi.js";

export default class Background {
	container = new LayoutContainer({
		label: "background",
		layout: {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			height: "100%",
			backgroundColor: "black",
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
		alpha: 0.7,
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

	videoElement?: HTMLVideoElement;

	constructor() {
		this.container.addChild(this.sprite, this.video, this.dim);
	}

	updateTexture(texture: Texture) {
		this.sprite.texture = texture;

		this.container.removeChild(this.sprite);
		this.container.addChild(this.sprite, this.video, this.dim);
	}

	updateVideo(texture: Texture) {
		this.video.texture = texture;
		(texture.source as VideoSource).updateFPS = 60;
		this.videoElement = texture.source.resource as HTMLVideoElement;
		this.videoElement.autoplay = false;
		this.videoElement.currentTime = 0;
		this.videoElement.pause();
		this.container.removeChild(this.video);
		this.container.addChild(this.sprite, this.video, this.dim);
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
				this.container.addChild(this.sprite, this.video, this.dim);
				this.init = true;
			}
		}, 15);

		this.lastFrame = frame;
	}

	seekVideo(time: number) {
		if (!this.videoElement) return;
		this.videoElement.currentTime = time / 1000;
	}

	playVideo(time: number) {
		if (!this.videoElement) return;
		this.videoElement.currentTime = time / 1000;
		this.videoElement.play();
	}

	pauseVideo(time: number) {
		if (!this.videoElement) return;
		this.videoElement.currentTime = time / 1000;
		this.videoElement.pause();
	}
}