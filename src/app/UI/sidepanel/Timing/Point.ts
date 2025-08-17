import { DifficultyPoint, type SamplePoint, TimingPoint } from "osu-classes";
import { BitmapText, type ColorSource, Container, Graphics } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";
import { millisecondsToMinutesString } from "@/utils";

export default class Point {
	container: Container;
	private indicator: Graphics;
	private timestamp: BitmapText;
	private content1: BitmapText;
	private content2: BitmapText;
	private color: Graphics;

	private accent: ColorSource;
	private bg = inject<ColorConfig>("config/color")?.color.mantle ?? 0x181825;

	constructor(public data: TimingPoint | DifficultyPoint | SamplePoint) {
		this.accent =
			data instanceof TimingPoint
				? 0xf38ba8
				: data instanceof DifficultyPoint
					? 0xa6e3a1
					: (inject<ColorConfig>("config/color")?.color.text ?? 0xcdd6f4);

		this.color = new Graphics().roundRect(0, 0, 360, 40, 10).fill(0xffffff);
		this.color.tint = this.bg;

		this.container = new Container({
			width: 360,
			height: 40,
			alpha: 0.5,
		});

		inject<ColorConfig>("config/color")?.onChange("color", ({ mantle }) => {
			if (this._destroyed) return;

			this.bg = mantle;
			this.accent =
				data instanceof TimingPoint
					? 0xf38ba8
					: data instanceof DifficultyPoint
						? 0xa6e3a1
						: (inject<ColorConfig>("config/color")?.color.text ?? 0xcdd6f4);

			if (this.indicator.visible) this.select();
			if (!this.indicator.visible) this.unselect();
		});

		this.timestamp = new BitmapText({
			text: millisecondsToMinutesString(data.startTime),
			style: {
				fontSize: 14,
				fontFamily: "Rubik",
				fill: this.accent,
				align: "left",
			},
			layout: false,
		});

		this.content1 = new BitmapText({
			text:
				data instanceof TimingPoint
					? `${Math.round(data.bpm)} BPM`
					: data instanceof DifficultyPoint
						? `x${data.sliderVelocity.toFixed(2)}`
						: `${data.sampleSet} : ${data.customIndex === 0 ? "Default" : `Custom ${data.customIndex}`}`,
			style: {
				fontSize: 14,
				fontFamily: "Rubik",
				fill: this.accent,
				align: "left",
				fontWeight: "500",
			},
			layout: false,
		});
		this.content1.x = 80;

		this.content2 = new BitmapText({
			text:
				data instanceof TimingPoint
					? `Signature ${data.timeSignature}/4`
					: data instanceof DifficultyPoint
						? ""
						: `Volume ${data.volume}%`,
			style: {
				fontSize: 14,
				fontFamily: "Rubik",
				fill: this.accent,
				align: "left",
			},
			layout: false,
		});

		this.indicator = new Graphics()
			.moveTo(0, 0)
			.lineTo(0, 10)
			.lineTo(5, 5)
			.lineTo(0, 0)
			.fill(0xffffff);
		this.indicator.tint = this.accent;

		this.indicator.x = 10;
		this.indicator.y = 15;
		this.indicator.visible = false;

		this.container.addChild(
			this.color,
			this.timestamp,
			this.content1,
			this.content2,
			this.indicator,
		);
		this.container.visible = false;
		this.container.interactiveChildren = false;

		this.reWidth(360);
	}

	reWidth(width: number, height = 40) {
		this.color.clear().roundRect(0, 0, width, 40, 10).fill(0xffffff);

		this.content2.x = width - this.content2.width - 20;
		this.content2.y = (height - this.content2.height) / 2;

		this.timestamp.x = 20;
		this.timestamp.y = (height - this.timestamp.height) / 2;

		this.content1.x = 20 + 80;
		this.content1.y = (height - this.content1.height) / 2;
	}

	on() {
		if (this.container.visible === true) {
			return;
		}

		this.container.visible = true;
		this.container.layout?.forceUpdate();
	}

	off() {
		if (this.container.visible === false) {
			return;
		}

		this.container.visible = false;
	}

	select() {
		this.container.alpha = 1;

		this.color.tint = this.accent;
		this.timestamp.style.fill = this.bg;
		this.content1.style.fill = this.bg;
		this.content2.style.fill = this.bg;
		this.indicator.tint = this.bg;

		this.indicator.visible = true;
	}

	unselect() {
		this.container.alpha = 0.5;

		this.color.tint = this.bg;
		this.timestamp.style.fill = this.accent;
		this.content1.style.fill = this.accent;
		this.content2.style.fill = this.accent;
		this.indicator.tint = this.accent;

		this.indicator.visible = false;
	}

	private _destroyed = false;
	destroy() {
		this.container.destroy();
		this.color.destroy();
		this.timestamp.destroy();
		this.content1.destroy();
		this.content2.destroy();
		this.indicator.destroy();

		this._destroyed = true;
	}
}
