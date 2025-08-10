import * as d3 from "d3";

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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function debounce(fn: (...args: any) => void, timeout = 100) {
	let timer: NodeJS.Timeout;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
