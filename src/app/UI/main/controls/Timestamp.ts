import { LayoutContainer } from "@pixi/layout/components";
import { BitmapText, Color } from "pixi.js";
import type ColorConfig from "@/Config/ColorConfig";
import { inject } from "@/Context";
import type { Game } from "@/Game";
import type ResponsiveHandler from "@/ResponsiveHandler";
import type SidePanel from "@/UI/sidepanel";

export default class Timestamp {
	container = new LayoutContainer({
		label: "timestamp",
		layout: {
			width: 150,
			height: "100%",
			backgroundColor: new Color(
				inject<ColorConfig>("config/color")?.color.base,
			).setAlpha(0.9),
			flexShrink: 0,
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			gap: 2,
		},
		cursor: "pointer",
	});

	digitsContainer = new LayoutContainer({
		cursor: "pointer",
	});
	digits: BitmapText[] = [];

	timingContainer = new LayoutContainer({
		layout: {
			gap: 5,
			alignItems: "baseline",
		},
		cursor: "pointer",
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
			this.container.layout = {
				backgroundColor: new Color(base).setAlpha(0.9),
			};
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
						this.container.layout = {
							width: 150,
							height: "100%",
							flex: undefined,
						};
						break;
					}
					case "portrait": {
						this.container.layout = { flex: 1, height: 60 };
						break;
					}
				}
			},
		);

		this.container.cursor = "pointer";
		this.container.addEventListener("pointertap", () => {
			const sidepanel = inject<SidePanel>("ui/sidepanel");
			const game = inject<Game>("game");

			if (!(game?.state.sidebar === "OPENED" && sidepanel?.index !== 1)) {
				inject<Game>("game")?.state.toggleSidebar();
			}

			inject<SidePanel>("ui/sidepanel")?.switchTab(1);
		});
		this.container.addEventListener("pointerenter", () => {
			this.container.layout = {
				backgroundColor: new Color(
					inject<ColorConfig>("config/color")?.color.surface2 ?? 0xffffff,
				).setAlpha(1.0),
			};
		});
		this.container.addEventListener("pointerleave", () => {
			this.container.layout = {
				backgroundColor: new Color(
					inject<ColorConfig>("config/color")?.color.base ?? 0xffffff,
				).setAlpha(0.9),
			};
		});
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
