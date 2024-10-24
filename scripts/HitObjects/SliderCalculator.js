export class Node {
	x;
	y;
	z;
	angle;
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
	static dist(start, end) {
		const diffX = end.x - start.x;
		const diffY = end.y - start.y;
		return Math.hypot(diffX, diffY);
	}
	static rotate(center, point, angle) {
		const x =
			center.x +
			(point.x - center.x) * Math.cos(angle) -
			(point.y - center.y) * Math.sin(angle);
		const y =
			center.y +
			(point.x - center.x) * Math.sin(angle) +
			(point.y - center.y) * Math.cos(angle);
		return new Node(x, y);
	}
	static lerp(a, b, t) {
		const x = a.x + (b.x - a.x) * t;
		const y = a.y + (b.y - a.y) * t;
		return new Node(x, y);
	}
	static add(a, b) {
		return new Node(a.x + b.x, a.y + b.y);
	}
	static subtract(a, b) {
		return new Node(a.x - b.x, a.y - b.y);
	}
}
export class Point extends Node {
	t;
	angle;
	constructor(x, y, t, angle) {
		super(x, y);
		this.t = t;
		this.angle = angle;
	}
}
export class Vector {
	x;
	y;
	constructor(d1, d2) {
		this.x = d2.x - d1.x;
		this.y = d2.y - d1.y;
	}
	get length() {
		return Math.hypot(this.x, this.y);
	}
	get angle() {
		const x = this.x / this.length;
		const y = this.y / this.length;
		const angle = (Math.atan2(y, x) * 180) / Math.PI;
		return angle;
	}
	static dot(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y;
	}
	static angle(v1, v2) {
		return Math.acos(Vector.dot(v1, v2) / (v1.length * v2.length));
	}
	static cross(v1, v2) {
		const x = v1.y - v2.y;
		const y = v2.x - v1.x;
		const z = v1.x * v2.y - v2.x * v1.y;
		return new Node(x, y, z);
	}
	static normalize(v) {
		const v2 = structuredClone(v);
		v2.x = v.x / v.length;
		v2.y = v.y / v.length;
		return v2;
	}
}
function binom(n, k) {
	if (k < 0 || k > n) return 0;
	if (k == 0 || k == n) return 1;
	let coeff = 1;
	for (var i = 0; i < k; i++) coeff = (coeff * (n - i)) / (i + 1);
	return coeff;
}
function bezier(t, points) {
	let order = points.length - 1;
	let y = 0;
	let x = 0;
	for (let i = 0; i <= order; i++) {
		x =
			x +
			binom(order, i) *
				Math.pow(1 - t, order - i) *
				Math.pow(t, i) *
				points[i].x;
		y =
			y +
			binom(order, i) *
				Math.pow(1 - t, order - i) *
				Math.pow(t, i) *
				points[i].y;
	}
	return {
		x: x,
		y: y,
	};
}
export function calculateCenter(a, b, c) {
	const m1 = a.x ** 2 - b.x ** 2 + a.y ** 2 - b.y ** 2;
	const m2 = a.x ** 2 - c.x ** 2 + a.y ** 2 - c.y ** 2;
	const n1 = b.x - a.x;
	const n2 = c.x - a.x;
	const z1 = b.y - a.y;
	const z2 = c.y - a.y;
	const r = -z1 / z2;
	if ((n1 === 0 && n2 === 0) || (z1 === 0 && z2 === 0)) return null;
	const centerX =
		z2 === 0 ? -m2 / (2 * n2) : -(m1 + m2 * r) / (2 * (n1 + n2 * r));
	const centerY =
		z1 === 0
			? -(m2 + 2 * centerX * n2) / (2 * z2)
			: -(m1 + 2 * centerX * n1) / (2 * z1);
	return new Node(centerX, centerY);
}
export class SliderCalculator {
	raw;
	nodes;
	type;
	length;
	points;
	constructor(nodesList, type, length, time) {
		// const start = performance.now();
		// this.raw = raw;
		// const { nodesList, type, length } = this.parse();
		this.time = time;
		this.nodes = nodesList;
		this.type = type;
		this.length = length;
		this.points = this.process();

		// console.log(performance.now() - start);
	}
	parse() {
		const [matched] =
			this.raw.match(
				/^(-?)[0-9]+,(-?)[0-9]+,(-?)[0-9]+,[0-9]+,[0-9],(L|P|B|C)(\|(-?)[0-9]+:(-?)[0-9]+)+,[0-9]+,[0-9]+/g,
			) ?? [];
		if (!matched)
			throw new Error(`Raw string is not a slider format!\n${this.raw}`);
		const [xString, yString, _, __, ___, nodesString, ____, lengthString] =
			matched.split(",");
		const x0 = parseFloat(xString);
		const y0 = parseFloat(yString);
		const length = parseFloat(lengthString);
		const [type, ...nodesRaw] = nodesString.split("|");
		const nodesList = [
			new Node(x0, y0),
			...nodesRaw.map((tuple) => {
				const [xString, yString] = tuple.split(":");
				return new Node(parseFloat(xString), parseFloat(yString));
			}),
		];
		return {
			nodesList,
			type: type,
			length,
		};
	}
	process() {
		switch (this.type) {
			case "L":
				return this.processLinear();
			case "P":
				return this.processPerfect();
			case "B":
				return this.processBezier();
			case "C":
				return this.processCatmull();
		}
	}
	processLinear() {
		const points = [];
		let calculatedLength = 0;
		for (let i = 1; i < this.nodes.length; i++) {
			const end = this.nodes[i];
			const start = this.nodes[i - 1];
			const vec = new Vector(start, end);
			const angle = vec.angle;
			const distance = Math.min(Node.dist(start, end), 512);
			for (let j = 0; j <= distance; j++) {
				if (calculatedLength + 1 > this.length) break;
				const point = new Point(
					start.x + (end.x - start.x) * (j / distance),
					start.y + (end.y - start.y) * (j / distance),
					(calculatedLength + 1) / this.length,
					angle,
				);
				points.push(point);
				calculatedLength++;
			}
		}
		return points;
	}
	processPerfect() {
		if (this.nodes.length < 3) return this.processLinear();
		if (this.nodes.length > 3) return this.processBezier();
		const [a, b, c] = this.nodes;
		const center = calculateCenter(a, b, c);
		if (
			center === null ||
			Math.abs(center.x) === Infinity ||
			Math.abs(center.y) === Infinity
		)
			return this.processLinear();
		const v1 = new Vector(b, a);
		const v2 = new Vector(b, c);
		const o1 = new Vector(center, a);
		const o2 = new Vector(center, c);
		const sign = Math.sign(Vector.cross(v1, v2).z ?? 0);
		const angle = 2 * Math.PI - Vector.angle(o1, o2);
		const perimeter = (angle / (2 * Math.PI)) * (2 * Math.PI * o1.length);
		const unit = angle / perimeter;
		const points = [new Point(a.x, a.y, 0)];
		for (let i = 1; i <= this.length; i++) {
			const node = Node.rotate(center, a, -sign * unit * i);
			const vec = new Vector(points.at(-1), node);
			points.push(new Point(node.x, node.y, i / this.length, vec.angle));
		}
		points[0].angle = points[1].angle;
		return points;
	}
	processSubPathBezier(controlPoints) {
		const points = [new Node(controlPoints[0].x, controlPoints[0].y)];
		let i = 1;
		while (i <= this.length) {
			const point = bezier(i / this.length, controlPoints);
			const dist = Node.dist(points.at(-1), point);

			if (i + 1 > this.length) {
				const node = new Node(point.x, point.y);
				const vec = new Vector(points.at(-1), node);
				node.angle = vec.angle;
				points.push(node);
				break;
			}
			if (dist > 1) {
				const node = Node.lerp(points.at(-1), point, 1 / dist);
				const vec = new Vector(points.at(-1), node);
				node.angle = vec.angle;
				points.push(node);
			}
			if (dist <= 1) {
				i++;
			}
		}
		points[0].angle = points[1].angle;
		return points;
	}
	processBezier() {
		const breakPoints = this.nodes
			.map((point, idx) => {
				if (idx === this.nodes.length - 1) return null;
				if (Node.dist(point, this.nodes[idx + 1]) === 0) return idx;
				return null;
			})
			.filter((element) => element !== null);
		const subPaths = breakPoints.map((index, idx) => {
			if (idx === 0) return this.nodes.slice(0, index + 1);
			return this.nodes.slice(breakPoints[idx - 1] + 1, index + 1);
		});
		subPaths.push(this.nodes.slice((breakPoints.at(-1) ?? -1) + 1));
		const points = [];
		for (const subPath of subPaths) {
			const subPoints = this.processSubPathBezier(subPath);
			points.push(...subPoints);
		}
		const reduced = [];
		let cummulativeLength = 0;
		for (let i = 0; i < points.length; i++) {
			if (i === 0) {
				reduced.push(points[i]);
				continue;
			}
			const dist = Node.dist(points[i - 1], points[i]);
			if (cummulativeLength + dist > this.length) break;
			reduced.push(points[i]);
			cummulativeLength += dist;
		}
		return reduced.map(
			(point, idx, arr) =>
				new Point(point.x, point.y, idx / arr.length, point.angle),
		);
	}
	getCatmullPoint(p0, p1, p2, p3, alpha) {
		const t0 = 0;
		const t1 = t0 + Node.dist(p0, p1) ** alpha;
		const t2 = t1 + Node.dist(p1, p2) ** alpha;
		const t3 = t2 + Node.dist(p2, p3) ** alpha;
		const m1x =
			(t2 - t1) *
			((p0.x - p1.x) / (t0 - t1) -
				(p0.x - p2.x) / (t0 - t2) +
				(p1.x - p2.x) / (t1 - t2));
		const m1y =
			(t2 - t1) *
			((p0.y - p1.y) / (t0 - t1) -
				(p0.y - p2.y) / (t0 - t2) +
				(p1.y - p2.y) / (t1 - t2));
		const m2x =
			(t2 - t1) *
			((p1.x - p2.x) / (t1 - t2) -
				(p1.x - p3.x) / (t1 - t3) +
				(p2.x - p3.x) / (t2 - t3));
		const m2y =
			(t2 - t1) *
			((p1.y - p2.y) / (t1 - t2) -
				(p1.y - p3.y) / (t1 - t3) +
				(p2.y - p3.y) / (t2 - t3));
		const ax = 2 * p1.x - 2 * p2.x + m1x + m2x;
		const ay = 2 * p1.y - 2 * p2.y + m1y + m2y;
		const bx = -3 * p1.x + 3 * p2.x - 2 * m1x - m2x;
		const by = -3 * p1.y + 3 * p2.y - 2 * m1y - m2y;
		const cx = m1x;
		const cy = m1y;
		const dx = p1.x;
		const dy = p1.y;
		const amount = Math.floor(Node.dist(p0, p1));
		const points = [];
		for (let j = 1; j <= amount; j++) {
			const t = j / amount;
			const px = ax * t * t * t + bx * t * t + cx * t + dx;
			const py = ay * t * t * t + by * t * t + cy * t + dy;
			points.push(new Node(px, py));
		}
		return points;
	}
	processCatmull() {
		if (this.nodes.length < 3) return this.processLinear();
		const first = new Node(
			2 * this.nodes[0].x - this.nodes[1].x,
			2 * this.nodes[0].y - this.nodes[1].y,
		);
		const last = new Node(
			2 * this.nodes.at(-1).x - this.nodes.at(-2).x,
			2 * this.nodes.at(-1).y - this.nodes.at(-2).y,
		);
		const nodes = [first, ...this.nodes, last];
		const points = [];
		for (let i = 1; i < nodes.length - 2; i++) {
			points.push(
				...this.getCatmullPoint(
					nodes[i - 1],
					nodes[i],
					nodes[i + 1],
					nodes[i + 2],
					0,
				),
			);
		}
		const reduced = [];
		let cummulativeLength = 0;
		for (let i = 0; i < points.length; i++) {
			if (i === 0) {
				reduced.push(points[i]);
				continue;
			}
			const dist = Node.dist(points[i - 1], points[i]);
			if (cummulativeLength + dist > this.length) break;
			const vec = new Vector(points[i - 1], points[i]);
			points[i].angle = vec.angle;
			reduced.push(points[i]);
			cummulativeLength += dist;
		}
		reduced[0].angle = reduced[1].angle;
		return reduced.map(
			(point, idx, arr) =>
				new Point(point.x, point.y, idx / arr.length, point.angle),
		);
	}
}
