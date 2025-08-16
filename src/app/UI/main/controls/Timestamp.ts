import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";
import type ResponsiveHandler from "@/ResponsiveHandler";
import { LayoutContainer } from "@pixi/layout/components";
import { BitmapText } from "pixi.js";

export default class Timestamp {
	container = new LayoutContainer({
		label: "timestamp",
		layout: {
			width: 150,
			height: "100%",
			backgroundColor: inject<ColorConfig>("config/color")?.color.base,
			flexShrink: 0,
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			gap: 2,
		},
	});

	digitsContainer = new LayoutContainer();
	digits: BitmapText[] = [];

	timingContainer = new LayoutContainer({
		layout: {
			gap: 5,
			alignItems: "baseline",
		},
	});
	bpm = new BitmapText({
		text: "0BPM",
		style: {
			fontFamily: "Rubik",
			fontSize: 12,
			fontWeight: "500",
			fill: inject<ColorConfig>("config/color")?.color.text,
			align: "center",
		},
		layout: {
			objectFit: "none",
			objectPosition: "center",
		},
	});
	sliderVelocity = new BitmapText({
		text: "x0.00",
		style: {
			fontFamily: "Rubik",
			fontSize: 10,
			fontWeight: "400",
			fill: inject<ColorConfig>("config/color")?.color.text,
			align: "center",
		},
		layout: {
			objectFit: "none",
			objectPosition: "center",
		},
	});

	constructor() {
		this.digits.push(
			this.createDigit("0"),
			this.createDigit("0"),
			this.createDigit(":", 4),
			this.createDigit("0"),
			this.createDigit("0"),
			this.createDigit(":", 4),
			this.createDigit("0"),
			this.createDigit("0"),
			this.createDigit("0"),
		);

		this.digitsContainer.addChild(...this.digits);
		this.timingContainer.addChild(this.bpm, this.sliderVelocity);
		this.container.addChild(this.digitsContainer, this.timingContainer);

		inject<ColorConfig>("config/color")?.onChange("color", ({ base, text }) => {
			this.container.layout = { backgroundColor: base };
			this.bpm.style.fill = text;
			this.sliderVelocity.style.fill = text;
			
			for (const digit of this.digits) {
				digit.style.fill = text;
			}
		});

		inject<ResponsiveHandler>("responsiveHandler")?.on(
			"layout",
			(direction) => {
				switch (direction) {
					case "landscape": {
						this.container.layout = { width: 150, height: "100%" };
						break;
					}
					case "portrait": {
						this.container.layout = { width: "100%", height: 60 };
						break;
					}
				}
			},
		);
	}

	createDigit(text: string, width = 9) {
		return new BitmapText({
			text: text,
			style: {
				fontFamily: "Rubik",
				fontSize: 15,
				fontWeight: "400",
				fill: inject<ColorConfig>("config/color")?.color.text,
				align: "center",
			},
			layout: {
				width,
				objectFit: "none",
				objectPosition: "center",
			},
		});
	}

	updateDigit(timestamp: number) {
		const minutes = Math.floor(timestamp / 60000) % 100;
		const seconds = Math.floor((timestamp % 60000) / 1000) % 60;
		const milliseconds = Math.floor(timestamp % 1000);

		this.digits[0].text = Math.floor(minutes / 10);
		this.digits[1].text = minutes % 10;
		this.digits[3].text = Math.floor(seconds / 10);
		this.digits[4].text = seconds % 10;
		this.digits[6].text = Math.floor(milliseconds / 100);
		this.digits[7].text = Math.floor((milliseconds % 100) / 10);
		this.digits[8].text = milliseconds % 10;
	}

	updateBPM(bpm: number) {
		this.bpm.text = `${bpm.toFixed(0)}BPM`;
	}

	updateSliderVelocity(sv: number) {
		this.sliderVelocity.text = `x${sv.toFixed(2)}`;
	}
}
