import { MathUtils, Vector2, type SliderPath } from "osu-classes";

function interpolateVertices(path: SliderPath, i: number, d: number) {
	if (path.calculatedPath.length === 0) {
		return new Vector2(0, 0);
	}

	if (i <= 0) {
		return path.calculatedPath[0];
	}

	if (i >= path.calculatedPath.length) {
		return path.calculatedPath[path.calculatedPath.length - 1];
	}

	const p0 = path.calculatedPath[i - 1];
	const p1 = path.calculatedPath[i];

	// biome-ignore lint/suspicious/noExplicitAny: Reimplementing requires accessing to private properties
	const d0 = (path as any)._cumulativeLength[i - 1];
	// biome-ignore lint/suspicious/noExplicitAny: Reimplementing requires accessing to private properties
	const d1 = (path as any)._cumulativeLength[i];

	if (Math.abs(d0 - d1) < 0.001) return p0;

	const w = (d - d0) / (d1 - d0);
	return p0.fadd(p1.fsubtract(p0).fscale(w));
}

function progressToDistance(path: SliderPath, progress: number) {
	return MathUtils.clamp01(progress) * path.distance;
}

export default function calculateSliderProgress(
	path: SliderPath,
	p0: number,
	p1: number,
) {
	const d0 = progressToDistance(path, p0);
	const d1 = progressToDistance(path, p1);

	let i = 0;

	while (
		i < path.calculatedPath.length &&
		// biome-ignore lint/suspicious/noExplicitAny: Reimplementing requires accessing to private properties
		(path as any)._cumulativeLength[i] < d0
	) {
		i++;
	}

	const ret: Vector2[] = [interpolateVertices(path, i, d0)];

	while (
		i < path.calculatedPath.length &&
		// biome-ignore lint/suspicious/noExplicitAny: Reimplementing requires accessing to private properties
		(path as any)._cumulativeLength[i] <= d1
	) {
		if (ret.length > 0) {
			const lastPoint = ret[ret.length - 1];
			const distance = lastPoint.fdistance(path.calculatedPath[i]);

			if (distance <= 0) {
				i++;
				continue;
			}
		}

		ret.push(path.calculatedPath[i]);
		++i;
	}

	const lastPoint = interpolateVertices(path, i, d1);
	const distance = lastPoint.fdistance(ret[ret.length - 1]);

	if (distance > 0) {
		ret.push(interpolateVertices(path, i, d1));
	}
	
    return ret;
}
