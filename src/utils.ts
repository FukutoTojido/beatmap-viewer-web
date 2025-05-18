export function lighten(color: [number, number, number, number?], amount: number) {
	const a = amount * 0.5;

	const ret = [];
	ret[0] = Math.min(1.0, color[0] * (1.0 + 0.5 * a) + 1.0 * a);
	ret[1] = Math.min(1.0, color[1] * (1.0 + 0.5 * a) + 1.0 * a);
	ret[2] = Math.min(1.0, color[2] * (1.0 + 0.5 * a) + 1.0 * a);

	return ret;
}

export function darken(color: [number, number, number, number?], amount: number) {
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