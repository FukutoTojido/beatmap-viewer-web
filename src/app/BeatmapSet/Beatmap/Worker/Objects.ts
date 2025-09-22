import IntervalTree from "@flatten-js/interval-tree";

type HitObjectMini = {
	startTime: number;
	endTime: number;
	timePreempt: number;
};

const objectsTree = new IntervalTree<number>();
const connectorsTree = new IntervalTree<number>();

let objects: HitObjectMini[] = [];
let connectors: HitObjectMini[] = [];
let isPlaying = false;

let currentTime = 0;
let startTime = 0;
let previousTime = 0;

let preempt = 1200;

let playbackRate = 1;

function getTimeRange(object: HitObjectMini) {
	return {
		start: object.startTime,
		end: (object.endTime ?? object.startTime) + 800,
	};
}

function getCurrentTime() {
	if (!isPlaying) return currentTime;
	return currentTime + (performance.now() - startTime) * playbackRate;
}

function searchObjects(tree: IntervalTree, time: number) {
	return findRange(tree, time);
}

function loop() {
	if (objects.length === 0) return;

	const currentTime = getCurrentTime();
	const _objects = searchObjects(objectsTree, currentTime);
	const _connectors = searchObjects(connectorsTree, currentTime);

	postMessage({
		type: "update",
		objects: _objects,
		connectors: _connectors,
		currentTime,
		previousTime,
	});

	previousTime = currentTime;
}

function findRange(tree: IntervalTree, time: number) {
	const res = tree.search([time - 800, time + preempt]);
	return new Set<number>(res as Array<number>);
}

function initTree(tree: IntervalTree, objects: HitObjectMini[]) {
	tree.clear();

	for (let i = 0; i < objects.length; i++) {
		const { start, end } = getTimeRange(objects[i]);
		tree.insert([start, end], i);
	}
}

// biome-ignore lint/suspicious/noGlobalAssign: Shut!
onmessage = (event) => {
	switch (event.data.type) {
		case "init": {
			objects = event.data.objects;
			connectors = event.data.connectors;

			initTree(objectsTree, objects);
			initTree(connectorsTree, connectors);
			break;
		}
		case "preempt": {
			preempt = event.data.preempt;
			break;
		}
		case "start": {
			isPlaying = true;
			startTime = performance.now();
			break;
		}
		case "stop": {
			isPlaying = false;
			currentTime += (performance.now() - startTime) * playbackRate;
			break;
		}
		case "seek": {
			currentTime = event.data.time;
			startTime = performance.now();
			break;
		}
		case "destroy": {
			objects = [];
			connectors = [];
			isPlaying = false;
			objectsTree.clear();
			connectorsTree.clear();
			break;
		}
		case "playbackRate": {
			playbackRate = event.data.playbackRate;
			break;
		}
	}
};

setInterval(() => loop(), 0);

// function signal() {
//     postMessage({
//         type: "signal"
//     })
// }

// setInterval(() => signal(), 0);
