import Kali from "../../lib/Kali";
function doStretch(inputData, stretchFactor, rate, numChannels = 1) {
	var numInputFrames = inputData.length / numChannels;
	var bufsize = 4096 * numChannels;

	// Create a Kali instance and initialize it
	var kali = new Kali(numChannels);
	kali.setup(rate, stretchFactor, true);

	// Create an array for the stretched output
	var completed = new Float32Array(
		Math.floor((numInputFrames / stretchFactor) * numChannels + 1),
	);

	var inputOffset = 0;
	var completedOffset = 0;
	var loopCount = 0;
	var flushed = false;

	while (completedOffset < completed.length) {
		// if (loopCount % 100 == 0) {
		// 	console.log("Stretching", completedOffset / completed.length);
		// }

		// Read stretched samples into our output array
		completedOffset += kali.output(
			completed.subarray(
				completedOffset,
				Math.min(completedOffset + bufsize, completed.length),
			),
		);

		if (inputOffset < inputData.length) {
			// If we have more data to write, write it
			var dataToInput = inputData.subarray(
				inputOffset,
				Math.min(inputOffset + bufsize, inputData.length),
			);
			inputOffset += dataToInput.length;

			// Feed Kali samples
			kali.input(dataToInput);
			kali.process();
		} else if (!flushed) {
			// Flush if we haven't already
			kali.flush();
			flushed = true;
		}

		loopCount++;
	}

	console.log("Finished stretching for rate: ", stretchFactor);
	return completed;
}

onmessage = (event) => {
	console.log("Start stretching in parallel", event.data.stretchFactor);
	postMessage({
		data: doStretch(event.data.data, event.data.stretchFactor, event.data.rate),
	});
};
