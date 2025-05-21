import { millisecondsToMinutesString } from "@/utils";
import { LayoutContainer } from "@pixi/layout/components";
import { DifficultyPoint, SamplePoint, TimingPoint } from "osu-classes";
import { BitmapText, Container, Graphics, Rectangle, Text } from "pixi.js";

export default class Point {
	container: LayoutContainer;
	private indicator: Graphics;
	private timestamp: Text;
	private content1: Text;
	private content2: Text;

	constructor(public data: TimingPoint | DifficultyPoint | SamplePoint) {
		this.container = new LayoutContainer({
			layout: {
				position: "absolute",
				display: "flex",
				width: 360,
				height: 40,
				borderRadius: 10,
				paddingInline: 20,
				alignItems: "center",
				backgroundColor:
					data instanceof TimingPoint
						? 0xf38ba8
						: data instanceof DifficultyPoint
							? 0xa6e3a1
							: 0x181825,
				borderWidth: 2,
			},
		});

		this.timestamp = new Text({
			text: millisecondsToMinutesString(data.startTime),
			style: {
				fontSize: 14,
				fontFamily: "Rubik",
				fill: data instanceof SamplePoint ? 0xcdd6f4 : 0x11111b,
				align: "left",
			},
			layout: {
				width: 80,
				flexShrink: 0,
				objectPosition: "center left",
			},
		});

		this.content1 = new Text({
			text:
				data instanceof TimingPoint
					? `${Math.round(data.bpm)} BPM`
					: data instanceof DifficultyPoint
						? `x${data.sliderVelocity.toFixed(2)}`
						: `${data.sampleSet} : ${data.customIndex === 0 ? "Default" : `Custom ${data.customIndex}`}`,
			style: {
				fontSize: 14,
				fontFamily: "Rubik",
				fill: data instanceof SamplePoint ? 0xcdd6f4 : 0x11111b,
				align: "left",
				fontWeight: "500",
			},
			layout: {
				flex: 1,
				flexShrink: 0,
				objectPosition: "center left",
			},
		});

		this.content2 = new Text({
			text:
				data instanceof TimingPoint
					? `Measurement ${data.timeSignature}/4`
					: data instanceof DifficultyPoint
						? ""
						: `Volume ${data.volume}%`,
			style: {
				fontSize: 14,
				fontFamily: "Rubik",
				fill: data instanceof SamplePoint ? 0xcdd6f4 : 0x11111b,
				align: "left",
			},
			layout: {
				flexShrink: 0,
				objectPosition: "center right",
			},
		});

		this.indicator = new Graphics()
			.moveTo(0, 0)
			.lineTo(0, 10)
			.lineTo(5, 5)
			.lineTo(0, 0)
			.fill(data instanceof SamplePoint ? 0xcdd6f4 : 0x11111b);

		this.indicator.x = 10;
		this.indicator.y = 15;
		this.indicator.visible = false;

		this.container.addChild(this.timestamp, this.content1, this.content2, this.indicator);
		this.container.visible = false;
		this.container.interactiveChildren = false;
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
		this.indicator.visible = true;
	}

	unselect() {
		this.indicator.visible = false;
	}

	destroy() {
		this.container.destroy();
		this.timestamp.destroy();
		this.content1.destroy();
		this.content2.destroy();
		this.indicator.destroy();
	}
}
