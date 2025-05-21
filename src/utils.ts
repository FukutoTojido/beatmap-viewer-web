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
	value: Partial<T>,
	list: T[],
	compareFn: (a: Partial<T>, b: Partial<T>) => number,
) {
	let start = 0;
	let end = list.length - 1;

	while (end >= start) {
		const mid = Math.floor((end - start) / 2);
		const compareValue = compareFn(list[mid], value);
		if (compareValue === 0) return mid;
		if (compareValue > 0) end = mid - 1;
		if (compareValue < 0) start = mid + 1;
	}

	return -1;
}

export function millisecondsToMinutesString(timestamp: number) {
	const minutes = Math.floor(timestamp / 60000) % 100;
	const seconds = Math.floor((timestamp % 60000) / 1000) % 60;
	const milliseconds = Math.floor(timestamp % 1000);

	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(3, "0")}`;
}
