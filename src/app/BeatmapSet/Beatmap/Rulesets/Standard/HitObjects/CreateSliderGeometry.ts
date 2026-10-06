import type { Vector2 } from "osu-classes";

const RADIUS = 20;
const DIVIDES = 64;

export type Vector3 = {
	x: number;
	y: number;
	t: number;
};

const VECS = 3;

export default function createGeometry(
	// path: Vector3[],
	path: Vector2[],
	radius = RADIUS,
) {
	const vertices: number[] = [];
	const indices: number[] = [];
	// const isCirc: number[] = [];

	vertices.push(path[0].x, path[0].y, 0);
	// isCirc.push(0);

	const pointsCount = path.length - 1;
	for (let i = 1; i <= pointsCount; i++) {
		const { x, y /* t */ } = path[i];
		const { x: _x, y: _y /* t: _t */ } = path[i - 1];

		const dx = x - _x;
		const dy = y - _y;
		const length = Math.hypot(dx, dy);

		const ox = length === 0 ? 0 : (radius * -dy) / length;
		const oy = length === 0 ? 0 : (radius * dx) / length;

		vertices.push(
			_x + ox,
			_y + oy,
			1,

			_x - ox,
			_y - oy,
			1,

			x + ox,
			y + oy,
			1,

			x - ox,
			y - oy,
			1,

			x,
			y,
			0,
		);

		const n = 5 * i + 1;
		indices.push(
			n - 6,
			n - 5,
			n - 1,
			n - 5,
			n - 1,
			n - 3,
			n - 6,
			n - 4,
			n - 1,
			n - 4,
			n - 1,
			n - 2,
		);
	}

	const addArc = (c: number, p1: number, p2: number) => {
		const theta1 = Math.atan2(
			vertices[VECS * p1 + 1] - vertices[VECS * c + 1],
			vertices[VECS * p1] - vertices[VECS * c],
		);
		let theta2 = Math.atan2(
			vertices[VECS * p2 + 1] - vertices[VECS * c + 1],
			vertices[VECS * p2] - vertices[VECS * c],
		);

		if (theta1 > theta2) theta2 += 2 * Math.PI;

		let theta = theta2 - theta1;
		const divs = Math.ceil((DIVIDES * Math.abs(theta)) / (2 * Math.PI));

		theta /= divs;

		let last = p1;
		for (let i = 1; i < divs; ++i) {
			vertices.push(
				vertices[VECS * c] + radius * Math.cos(theta1 + i * theta),
				vertices[VECS * c + 1] + radius * Math.sin(theta1 + i * theta),
				1,
			);

			const newVert = vertices.length / VECS - 1;
			indices.push(c, last, newVert);
			last = newVert;
		}

		indices.push(c, last, p2);
	};

	for (let i = 1; i < pointsCount; ++i) {
		const dx1 = path[i].x - path[i - 1].x;
		const dy1 = path[i].y - path[i - 1].y;

		const dx2 = path[i + 1].x - path[i].x;
		const dy2 = path[i + 1].y - path[i].y;

		const t = dx1 * dy2 - dx2 * dy1;

		if (t > 0) {
			addArc(5 * i, 5 * i - 1, 5 * i + 2);
		} else {
			addArc(5 * i, 5 * i + 1, 5 * i - 2);
		}
	}

	addArc(0, 1, 2);
	addArc(5 * path.length - 5, 5 * path.length - 6, 5 * path.length - 7);

	return {
		aPosition: vertices,
		indexBuffer: indices,
	};
}
