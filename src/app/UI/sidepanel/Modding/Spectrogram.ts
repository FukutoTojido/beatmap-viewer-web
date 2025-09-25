import { LayoutContainer } from "@pixi/layout/components";
import { Container, FillGradient, Graphics, Sprite, Text, type Texture } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import { defaultStyle } from "../Metadata";

export default class Spectrogram {
	container = new Container();
	sprite = new Sprite();
	mask = new Graphics();
	spinner = new Graphics({
		layout: true,
	});
	scale: LayoutContainer;
	background = new Graphics();
	overlay = new Graphics();

	constructor() {
		this.container.layout = {
			width: "100%",
			aspectRatio: 1,
			flexShrink: 0
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

		this.scale = new LayoutContainer({
			layout: {
				flexDirection: "column",
				justifyContent: "space-between",
				paddingLeft: 10,
				paddingTop: 10,
				paddingBottom: 10
			},
			x: 0,
			y: 0,
		});

		const scaleValues = this.generateScale();
		this.scale.addChild(...scaleValues);

		const gradient = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0.2, y: 0 },
			colorStops: [
				{ offset: 0, color: 'rgba(0, 0, 0, 0.5)' },
				{ offset: 1, color: 'rgba(0, 0, 0, 0)' },
			],
			textureSpace: "local",
			type: "linear",
			textureSize: 256,
			wrapMode: "clamp-to-edge",
		});
		
		this.overlay.rect(0, 0, 360, 360).fill(gradient);

		this.mask.roundRect(0, 0, 360, 360, 10).fill({
			color: 0x0,
			alpha: 0.1,
		});

		this.container.addChild(
			this.background,
			this.spinner,
			this.sprite,
			this.overlay,
			this.scale,
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
			this.spinner.x = width / 2;
			this.spinner.y = width / 2;
			this.overlay.clear().rect(0, 0, width, width).fill(gradient)
			this.scale.layout = {
				height: width,
			};
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

	private generateScale() {
		const scaleValues = [
			"22kHz",
			"20kHz",
			"",
			"16kHz",
			"",
			"12kHz",
			"",
			"8kHz",
			"",
			"4kHz",
			"",
			"0kHz",
		];

		const containers = scaleValues.map(
			(value) =>
				new Text({
					text: value,
					style: {
						...defaultStyle,
						fontSize: 12,
						fill: 0xffffff,
					},
					layout: true
				}),
		);

		return containers;
	}
}
