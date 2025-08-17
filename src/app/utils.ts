import * as d3 from "d3";
import { Vibrant } from "node-vibrant/browser";
import type ColorConfig from "./Config/ColorConfig";
import type { ColorPalette } from "./Config/ColorConfig";
import { inject } from "./Context";
import type { Vector2 } from "osu-classes";

export function lighten(
	color: [number, number, number, number?],
	amount: number,
) {
	const a = amount * 0.5;

	const ret = [];
	ret[0] = Math.min(1.0, color[0] * (1.0 + 0.5 * a) + 1.0 * a);
	ret[1] = Math.min(1.0, color[1] * (1.0 + 0.5 * a) + 1.0 * a);
	ret[2] = Math.min(1.0, color[2] * (1.0 + 0.5 * a) + 1.0 * a);

	return ret;
}

export function darken(
	color: [number, number, number, number?],
	amount: number,
) {
	const scalar = Math.max(1.0, 1.0 + amount);
	const ret = [];
	ret[0] = Math.min(1.0, color[0] / scalar);
	ret[1] = Math.min(1.0, color[1] / scalar);
	ret[2] = Math.min(1.0, color[2] / scalar);

	return ret;
}

// biome-ignore lint/suspicious/noExplicitAny: Could be any
export function debounce(fn: (...args: any) => void, timeout = 100) {
	let timer: NodeJS.Timeout;
	// biome-ignore lint/suspicious/noExplicitAny: Literally any
	return (...args: any) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => fn(...args), timeout);
	};
}

export function binarySearch<T>(
	value: number,
	list: T[],
	compareFn: (mid: T, value: number) => number,
) {
	let start = 0;
	let end = list.length - 1;
	let mid = start + Math.floor((end - start) / 2);

	while (end >= start) {
		mid = start + Math.floor((end - start) / 2);
		const compareValue = compareFn(list[mid], value);
		if (compareValue === 0) return mid;
		if (compareValue > 0) end = mid - 1;
		if (compareValue < 0) start = mid + 1;
	}

	return mid;
}

export function millisecondsToMinutesString(timestamp: number) {
	const minutes = Math.floor(timestamp / 60000) % 100;
	const seconds = Math.floor((timestamp % 60000) / 1000) % 60;
	const milliseconds = Math.floor(timestamp % 1000);

	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(3, "0")}`;
}

export function gcd(m: number, n: number) {
	let [a, b] = [m, n];
	if (a < b) [a, b] = [b, a];
	while (a % b !== 0) [a, b] = [b, a % b];
	return b;
}

const difficultyColourSpectrum = d3
	.scaleLinear<string>()
	.domain([0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9])
	.clamp(true)
	.range([
		"#4290FB",
		"#4FC0FF",
		"#4FFFD5",
		"#7CFF4F",
		"#F6F05C",
		"#FF8068",
		"#FF4E6F",
		"#C645B8",
		"#6563DE",
		"#18158E",
		"#000000",
	])
	.interpolate(d3.interpolateRgb.gamma(2.2));

export function getDiffColour(rating: number) {
	if (rating < 0.1) return "#AAAAAA";
	if (rating >= 9) return "#000000";
	return d3.rgb(difficultyColourSpectrum(rating)).formatHex();
}

export async function loadColorPalette(url: string) {
	const vibrant = new Vibrant(url);
	const swatches = await vibrant.getPalette();
	let palette: Partial<ColorPalette> = {};

	const primary = swatches.DarkMuted ?? swatches.Muted;
	if (primary) {
		const lumi =
			(0.299 * primary.rgb[0] +
				0.587 * primary.rgb[1] +
				0.114 * primary.rgb[2]) /
			255;

		let color = d3.color(primary.hex);
		if (color) {
			if (lumi < 0.1) {
				const ratio = 0.1 / lumi;
				const k = -Math.log(ratio) / Math.log(0.7);
				color = color.brighter(k);
			}

			palette = {
				...palette,
				crust: Number.parseInt(color.darker(3.0).formatHex().slice(1), 16),
				mantle: Number.parseInt(color.darker(2.5).formatHex().slice(1), 16),
				base: Number.parseInt(color.darker(2.0).formatHex().slice(1), 16),
				surface0: Number.parseInt(color.darker(1.5).formatHex().slice(1), 16),
				surface1: Number.parseInt(color.darker(1.0).formatHex().slice(1), 16),
				surface2: Number.parseInt(color.darker(0.5).formatHex().slice(1), 16),
				overlay0: Number.parseInt(color.formatHex().slice(1), 16),
				overlay1: Number.parseInt(color.brighter(0.5).formatHex().slice(1), 16),
				overlay2: Number.parseInt(color.brighter(1).formatHex().slice(1), 16),
			};
		}
	}

	const accent = swatches.LightMuted ?? swatches.Muted;
	if (accent) {
		const color = d3.color(accent.hex);
		if (color) {
			palette = {
				...palette,
				subtext0: Number.parseInt(color.formatHex().slice(1), 16),
				subtext1: Number.parseInt(color.brighter(0.5).formatHex().slice(1), 16),
				text: Number.parseInt(color.brighter(1.0).formatHex().slice(1), 16),
			};
		}
	}

	const colorConfig = inject<ColorConfig>("config/color");
	if (!colorConfig) return;
	colorConfig.color = palette;
}

export const Clamp = (val: number, min = 0, max = 1) => {
	return Math.min(max, Math.max(min, val));
};

export const difficultyRange = (
	val: number,
	min: number,
	mid: number,
	max: number,
) => {
	if (val > 5) return mid + ((max - mid) * (val - 5)) / 5;
	if (val < 5) return mid - ((mid - min) * (5 - val)) / 5;
	return mid;
};

export const closestPointTo = (p: Vector2, start: Vector2, end: Vector2): Vector2 => {
	const v = end.subtract(start);
	const w = p.subtract(start);

	const c1 = w.dot(v);
	if (c1 <= 0) return start;

	const c2 = v.dot(v);
	if (c2 <= c1) return end;

	const b = c1 / c2;
	return start.add(v.scale(b));
}