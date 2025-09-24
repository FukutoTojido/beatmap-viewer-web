import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";
import { BLANK_TEXTURE } from "@/Skinning/Skin";

export default class Spectrogram {
	container = new Container();
	sprite = new Sprite();
	mask = new Graphics();
	spinner = new Graphics({
		layout: true,
	});

	background = new Graphics();

	constructor() {
		this.container.layout = {
			width: "100%",
		};

		this.background.roundRect(0, 0, 360, 360, 10).fill({
			color: inject<ColorConfig>("config/color")?.color.surface0,
		});

		this.spinner.layout = false;
		this.spinner.arc(0, 0, 30, 0, (5 * Math.PI) / 6).stroke({
			color: "white",
			width: 10,
			cap: "round",
		});

		this.sprite.width = 360;
		this.sprite.height = 360;

		this.mask.roundRect(0, 0, 360, 360, 10).fill({
			color: 0x0,
			alpha: 0.1,
		});

		this.container.addChild(
			this.background,
			this.spinner,
			this.sprite,
			this.mask,
		);
		this.container.mask = this.mask;

		this.container.on("layout", (layout) => {
			const { width } = layout.computedLayout;
			this.mask.clear().roundRect(0, 0, width, width, 10).fill({
				color: 0x0,
				alpha: 0.01,
			});
			this.background
				.clear()
				.roundRect(0, 0, width, width, 10)
				.fill({
					color: inject<ColorConfig>("config/color")?.color.surface0,
				});
			this.sprite.width = width;
			this.sprite.height = width;
			this.spinner.x = width / 2 - 15;
			this.spinner.y = width / 2 - 15;
		});

		inject<ColorConfig>("config/color")?.onChange("color", ({ surface0 }) => {
			this.background
				.clear()
				.roundRect(
					0,
					0,
					this.container.layout?.computedLayout.width ?? 360,
					this.container.layout?.computedLayout.width ?? 360,
					10,
				)
				.fill({
					color: surface0,
				});
		});

		this.spin = true;
	}

	setTexture(texture: Texture) {
		this.sprite.texture = texture;
		this.spin = false;
	}

	unloadTexture() {
		this.sprite.texture = BLANK_TEXTURE;
		this.spin = true;
	}

	private _lastTime = 0;
	spinFn(t: number) {
		this.spinner.angle += 0.4 * (t - this._lastTime);
		this._lastTime = t;

		if (!this.spin) return;
		requestAnimationFrame((time) => this.spinFn(time));
	}

	private _spin = false;

	get spin() {
		return this._spin;
	}

	set spin(val: boolean) {
		this._spin = val;

		if (val) {
			requestAnimationFrame((time) => this.spinFn(time));
		}
	}
}
