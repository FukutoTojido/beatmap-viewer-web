import ConfigSection from "./ConfigSection";

export type ColorPalette = {
	crust: number;
	mantle: number;
	base: number;
	surface0: number;
	surface1: number;
	surface2: number;
	overlay0: number;
	overlay1: number;
	overlay2: number;
	subtext0: number;
	subtext1: number;
	text: number;
};

const defaultPalette = {
	crust: 0x11111b,
	mantle: 0x181825,
	base: 0x1e1e2e,
	surface0: 0x313244,
	surface1: 0x45475a,
	surface2: 0x585b70,
	overlay0: 0x6c7086,
	overlay1: 0x7f849c,
	overlay2: 0x9399b2,
	subtext0: 0xa6adc8,
	subtext1: 0xbac2de,
	text: 0xcdd6f4,
};

export default class ColorConfig extends ConfigSection {
	private _color: ColorPalette = defaultPalette;
	get color() {
		return this._color;
	}
	set color(val: Partial<ColorPalette>) {
		this._color = { ...defaultPalette, ...val };
        this.emitChange("color", this._color);
	}
}
