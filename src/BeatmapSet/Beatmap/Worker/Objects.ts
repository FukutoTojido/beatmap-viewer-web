type HitObjectMini = {
	startTime: number,
	endTime: number,
	timePreempt: number
}

let objects: HitObjectMini[] = [];
let isPlaying = false;

let currentTime = 0;
let startTime = 0;
let previousTime = 0;

function getTimeRange(object: HitObjectMini) {
	return {
		start: object.startTime - object.timePreempt,
		end: (object.endTime ?? object.startTime) + 800,
	};
}

function getCurrentTime() {
	if (!isPlaying) return currentTime;
	return currentTime + (performance.now() - startTime);
}

function inRange(val: number, start: number, end: number) {
	if (start <= val && val <= end) return 0;
	if (val > end) return 1;
	if (val < start) return -1;
	return -1;
}

function binarySearchNearestIndex(time: number) {
	let start = 0;
	let end = objects.length - 1;

	while (end >= start) {
		const mid = start + Math.floor((end - start) / 2);
		const { start: midStart, end: midEnd } = getTimeRange(objects[mid]);
		const isInTimeRange = inRange(time, midStart, midEnd);

		if (isInTimeRange === 0) return mid;
		if (isInTimeRange === 1) {
			start = mid + 1;
			continue;
		}
		if (isInTimeRange === -1) {
			end = mid - 1;
		}
	}

	return -1;
}

function searchObjects(time: number) {
	const idx = binarySearchNearestIndex(time);
	if (idx === -1) return new Set<number>();

	const objects_ = new Set<number>();
	objects_.add(idx);

	let start = idx - 1;
	while (
		start >= 0 &&
		inRange(
			time,
			getTimeRange(objects[start]).start,
			getTimeRange(objects[start]).end,
		) === 0
	) {
		objects_.add(start);
		start--;
	}

	let end = idx + 1;
	while (
		end <= objects.length - 1 &&
		inRange(
			time,
			getTimeRange(objects[end]).start,
			getTimeRange(objects[end]).end,
		) === 0
	) {
		objects_.add(end);
		end++;
	}

	return objects_;
}

function loop() {
	if (objects.length === 0) return;

	const currentTime = getCurrentTime();
	const _objects = searchObjects(currentTime);

	postMessage({
		type: "update",
		objects: _objects,
		currentTime,
		previousTime,
	});

	previousTime = currentTime;
}

// biome-ignore lint/suspicious/noGlobalAssign: Shut!
onmessage = (event) => {
	switch (event.data.type) {
		case "init": {
			objects = event.data.objects;
			break;
		}
		case "start": {
			isPlaying = true;
			startTime = performance.now();
			break;
		}
		case "stop": {
			isPlaying = false;
			currentTime += performance.now() - startTime;
			break;
		}
		case "seek": {
			currentTime = event.data.time;
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
