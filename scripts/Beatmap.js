import { Game } from "./Game.js";
import { Clamp } from "./Utils.js";
import { GreenLineInfo } from "./Timeline/BeatLines.js";
import { Timeline } from "./Timeline/Timeline.js";
import { ProgressBar } from "./Progress.js";
import { binarySearchNearest } from "./Utils.js";
import { ObjectsController } from "./HitObjects/ObjectsController.js";
import { HitCircle } from "./HitObjects/HitCircle.js";
import { Slider } from "./HitObjects/Slider.js";
import { Spinner } from "./HitObjects/Spinner.js";
import { TimelineHitCircle } from "./Timeline/HitCircle.js";
import { TimelineSlider } from "./Timeline/Slider.js";
import { Skinning } from "./Skinning.js";
import { HitSample } from "./Audio.js";
import { HitSound } from "./HitSound.js";
import { Texture } from "./Texture.js";
import { TimingPanel } from "./TimingPanel.js";
import { MetadataPanel } from "./SidePanel.js";
import { Notification } from "./Notification.js";
import { FollowPoint } from "./HitObjects/FollowPoint.js";

export class Beatmap {
	objectsController;
	static SAMPLE_SET = "Normal";
	static COLORS;
	static HREF = null;

	static hasILLEGAL = false;

	static difficultyMultiplier = 1;
	static stats = {
		approachRate: 5,
		circleSize: 5,
		HPDrainRate: 5,
		overallDifficulty: 5,
		stackLeniency: 7,
		circleDiameter: (2 * (54.4 - 4.48 * 5) * 236) / 256,
		preempt: 1200,
		fadeIn: 800,
		sliderTickRate: 1,
		radius: 54.4 - 4.48 * 5,
		stackOffset: (-6.4 * (1 - (0.7 * (5 - 5)) / 5)) / 2,
	};

	static moddedStats = {
		approachRate: 5,
		circleSize: 5,
		HPDrainRate: 5,
		overallDifficulty: 5,
		stackLeniency: 7,
		circleDiameter: (2 * (54.4 - 4.48 * 5) * 236) / 256,
		preempt: 1200,
		fadeIn: 800,
		sliderTickRate: 1,
		radius: 54.4 - 4.48 * 5,
		stackOffset: (-6.4 * (1 - (0.7 * (5 - 5)) / 5)) / 2,
	};

	static difficultyRange(val, min, mid, max) {
		if (val > 5) return mid + ((max - mid) * (val - 5)) / 5;
		if (val < 5) return mid - ((mid - min) * (5 - val)) / 5;
		return mid;
	}

	static reverseDifficultyRange(val, min, mid, max) {
		const case_1 = ((val - mid) * 5) / (max - mid) + 5;
		const case_2 = 5 - ((mid - val) * 5) / (mid - min);

		if (case_1 > 5 && case_2 > 5) return case_1;
		if (case_2 < 5 && case_1 < 5) return case_2;
		return 5;
	}

	static hitWindows = {
		GREAT: 80,
		OK: 140,
		MEH: 200,
	};

	static beatStepsList = [];
	static timingPointsList = [];
	static breakPeriods = [];
	static kiaiList = [];
	static mergedPoints = [];

	static stackThreshold;

	static updateModdedStats() {
		const HRMul = !Game.MODS.HR ? 1 : 1.4;
		const EZMul = !Game.MODS.EZ ? 1 : 0.5;
		const HRMulCS = !Game.MODS.HR ? 1 : 1.3;

		const circleSize = Math.min(Beatmap.stats.circleSize * HRMulCS * EZMul, 10);
		const approachRate = Math.min(
			Beatmap.stats.approachRate * HRMul * EZMul,
			10,
		);
		const HPDrainRate = Math.min(Beatmap.stats.HPDrainRate * HRMul * EZMul, 10);
		const overallDifficulty = Math.min(
			Beatmap.stats.overallDifficulty * HRMul * EZMul,
			10,
		);

		// Don't look at this
		// if (Game.PLAYBACK_RATE !== 1) {
		//     const newPreempt = Beatmap.difficultyRange(approachRate, 1800, 1200, 450) / Game.PLAYBACK_RATE;
		//     const newHitWindow = Beatmap.difficultyRange(approachRate, 79.5, 49.5, 19.5) / Game.PLAYBACK_RATE;

		//     const ratedAR = Beatmap.reverseDifficultyRange(newPreempt, 1800, 1200, 450);
		//     const ratedOD = Beatmap.reverseDifficultyRange(newHitWindow, 79.5, 49.5, 19.5);

		//     Beatmap.moddedStats = {
		//         ...Beatmap.stats,
		//         circleSize,
		//         approachRate: ratedAR,
		//         HPDrainRate,
		//         overallDifficulty: ratedOD,
		//         preempt: Beatmap.difficultyRange(approachRate, 1800, 1200, 450),
		//         fadeIn: Beatmap.difficultyRange(approachRate, 1200, 800, 300),
		//         radius: 54.4 - 4.48 * circleSize,
		//         stackOffset: (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2,
		//     };

		//     return;
		// }

		Game.WORKER.postMessage({
			type: "updateStats",
			mods: Game.MODS,
			playbackRate: Game.PLAYBACK_RATE,
			moddedStats: {
				circleSize,
				approachRate,
				HPDrainRate,
				overallDifficulty,
				preempt: Beatmap.difficultyRange(approachRate, 1800, 1200, 450),
				fadeIn: Beatmap.difficultyRange(approachRate, 1200, 800, 300),
				radius: 54.4 - 4.48 * circleSize,
				stackOffset: (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2,
			},
		});

		Beatmap.moddedStats = {
			...Beatmap.stats,
			circleSize,
			approachRate,
			HPDrainRate,
			overallDifficulty,
			preempt: Beatmap.difficultyRange(approachRate, 1800, 1200, 450),
			fadeIn: Beatmap.difficultyRange(approachRate, 1200, 800, 300),
			radius: 54.4 - 4.48 * circleSize,
			stackOffset: (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2,
		};

		Beatmap.stackThreshold =
			Beatmap.moddedStats.preempt * Beatmap.moddedStats.stackLeniency;
	}

	static updateStats() {
		const { circleSize, approachRate } = Beatmap.stats;

		Beatmap.stats = {
			...Beatmap.stats,
			preempt: Beatmap.difficultyRange(approachRate, 1800, 1200, 450),
			fadeIn: Beatmap.difficultyRange(approachRate, 1200, 800, 300),
			radius: 54.4 - 4.48 * circleSize,
			stackOffset: (-6.4 * (1 - (0.7 * (circleSize - 5)) / 5)) / 2,
		};

		Beatmap.stackThreshold =
			Beatmap.moddedStats.preempt * Beatmap.moddedStats.stackLeniency;
	}

	static constructSpinner(params, currentSVMultiplier) {
		const parameters = params.map((p) => (p === "" || !p ? null : p));
		const startTime = parseInt(parameters[2]);
		const endTime = parseInt(parameters[5]);
		const hitSoundIdx = parameters[4];
		const hitSampleIdx = parameters.at(-1);

		const samples = HitSound.GetName(
			hitSampleIdx,
			hitSoundIdx,
			currentSVMultiplier,
		);
		const hitsounds = new HitSample(
			samples,
			currentSVMultiplier.sampleVol / 100,
		);
		return {
			obj: new Spinner(startTime, endTime, hitsounds),
			hitsounds,
		};
	}

	static constructSlider(
		params,
		timingPoints,
		beatSteps,
		initialSliderVelocity,
		raw,
	) {
		const hitSoundIdx = parseInt(params[4]);
		const time = parseInt(params[2]);
		const svPrecise = Beatmap.findNearestTimingPoint(
			time,
			"timingPointsList",
			true,
		);
		const svStart = Beatmap.findNearestTimingPoint(time, "timingPointsList");

		// console.log(time, svPrecise, svStart);

		const { beatstep: beatStep } = Beatmap.findNearestTimingPoint(
			time,
			"beatStepsList",
			true,
		);
		const slides = parseInt(params[6]);
		const length = parseFloat(params[7]);
		const endTime =
			time +
			((slides * length) / svStart.svMultiplier / initialSliderVelocity) *
				beatStep;
		const svEnd = Beatmap.findNearestTimingPoint(endTime, "timingPointsList");

		const edgeSounds = params[8];
		const edgeSets = params[9];
		const defaultSetIdx = /^\d:\d.*/g.test(params.at(-1))
			? params.at(-1)
			: "0:0";

		const headSamples = HitSound.GetName(
			edgeSets?.split("|")[0] ?? defaultSetIdx,
			edgeSounds?.split("|")[0] ?? hitSoundIdx,
			svStart,
		);
		const endSamples = HitSound.GetName(
			edgeSets?.split("|").at(-1) ?? defaultSetIdx,
			edgeSounds?.split("|").at(-1) ?? hitSoundIdx,
			svEnd,
		);

		const reversesSamples = [...Array(slides - 1)].map((_, idx) => {
			const reverseTime =
				time +
				(((idx + 1) * length) / svStart.svMultiplier / initialSliderVelocity) *
					beatStep;
			const sv = Beatmap.findNearestTimingPoint(
				reverseTime,
				"timingPointsList",
			);

			const samples = HitSound.GetName(
				edgeSets?.split("|")[idx + 1] ?? defaultSetIdx,
				edgeSounds?.split("|")[idx + 1] ?? hitSoundIdx,
				sv,
			);
			return new HitSample(samples, sv.sampleVol / 100);
		});

		const [x, y, , type] = params;
		const anchors = params[5].slice(2);
		const sliderType = params[5][0];

		const defaultSet = {
			normal: parseInt(defaultSetIdx.split(":")[0]),
			additional: parseInt(defaultSetIdx.split(":")[1]),
			hitSoundIdx,
		};

		const { normalSet: defaultSample } = HitSound.GetHitSample(
			defaultSetIdx,
			svStart,
		);
		const sliderSlide = new HitSample(
			[`${defaultSample}-sliderslide${svStart.sampleIdx}`],
			svStart.sampleVol / 100,
		);
		const sliderWhistle = new HitSample(
			[`${defaultSample}-sliderwhistle${svStart.sampleIdx}`],
			svStart.sampleVol / 100,
		);

		const hitsounds = {
			sliderHead: new HitSample(headSamples, svStart.sampleVol / 100),
			sliderTail: new HitSample(endSamples, svEnd.sampleVol / 100),
			sliderReverse: reversesSamples,
			sliderSlide,
			sliderWhistle,
			defaultSet,
		};

		const obj = new Slider(
			`${x}:${y}|${anchors}`,
			sliderType,
			length,
			svPrecise.svMultiplier,
			initialSliderVelocity,
			beatStep,
			time,
			slides,
			hitsounds,
			raw,
		);

		return {
			obj,
			hitsounds,
		};
	}

	static constructHitCircle(params, currentSVMultiplier) {
		const parameters = params.map((p) => (p === "" || !p ? null : p));
		const [x, y, time, type, hitSoundIdx, ...rest] = parameters;
		const hitSampleIdx = rest.at(-1);

		const samples = HitSound.GetName(
			hitSampleIdx,
			hitSoundIdx,
			currentSVMultiplier,
		);
		if (parseInt(time) === 208128) {
			console.log(currentSVMultiplier, samples);
		}

		const hitsounds = new HitSample(
			samples,
			currentSVMultiplier.sampleVol / 100,
		);

		return {
			obj: new HitCircle(x, y, parseInt(time), hitsounds),
			hitsounds,
		};
	}

	static findNearestTimingPoint(time, type, precise) {
		return Beatmap[type][
			Beatmap.findNearestTimingPointIndex(time, type, precise)
		];
	}

	static findNearestTimingPointIndex(time, type, precise) {
		const compensate = precise ? 0 : 2;
		let foundIndex = binarySearchNearest(Beatmap[type], time, (point, time) => {
			if (point.time < time + compensate) return -1;
			if (point.time > time + compensate) return 1;
			return 0;
		});

		while (foundIndex > 0 && Beatmap[type][foundIndex].time > time + compensate)
			foundIndex--;
		while (
			foundIndex + 1 < Beatmap[type].length &&
			Beatmap[type][foundIndex + 1].time <= time + compensate
		)
			foundIndex++;

		if (Beatmap[type][foundIndex].time > time + compensate) return 0;
		return foundIndex;
	}

	static async loadProgressBar() {
		const wrapper = document.createElement("div");
		wrapper.classList.add("timingWrapper");

		Beatmap.timingPointsList.forEach((greenLine) => {
			const div = document.createElement("div");
			div.classList.add("greenLine");

			div.style.left = `${(greenLine.time / Game.BEATMAP_FILE.audioNode.duration) * 100}%`;

			wrapper.appendChild(div);
		});

		Beatmap.beatStepsList.forEach((redLine) => {
			const div = document.createElement("div");
			div.classList.add("redLine");

			div.style.left = `${(redLine.time / Game.BEATMAP_FILE.audioNode.duration) * 100}%`;

			wrapper.appendChild(div);
		});

		document.querySelector(".timingPointsContainer").prepend(wrapper);

		domtoimage.toPng(wrapper).then((dataURL) => {
			document.querySelector(".timingPointsContainer").removeChild(wrapper);
			document.querySelector(".timingPointsContainer img").src = dataURL;
		});
	}

	static async loadTimingPoints() {
		[...document.querySelectorAll(".timingPoint")].forEach((ele) =>
			document.querySelector(".timingPanel").removeChild(ele),
		);

		Beatmap.mergedPoints.forEach((point) => {
			const container = document.createElement("div");
			container.classList.add("timingPoint");

			const timeStamp = document.createElement("div");
			timeStamp.classList.add("timestamp");

			const content = document.createElement("div");
			content.classList.add("timingContent");

			const flair = document.createElement("div");
			flair.classList.add("timingFlair");

			const baseValue = document.createElement("div");
			baseValue.classList.add("timingValue");

			content.append(flair, baseValue);
			container.append(timeStamp, content);

			let currentTime = point.time;
			const isNeg = currentTime < 0;
			if (currentTime < 0) currentTime *= -1;

			const minute = Math.floor(currentTime / 60000);
			const second = Math.floor((currentTime - minute * 60000) / 1000);
			const mili = currentTime - minute * 60000 - second * 1000;

			timeStamp.textContent = `${isNeg ? "-" : ""}${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}:${mili
				.toFixed(0)
				.padStart(3, "0")}`;

			if (point.beatstep) {
				baseValue.textContent = `${(60000 / point.beatstep).toFixed(2)} BPM`;
				container.classList.add("beatStepPoint");
				document.querySelector(".timingPanel").append(container);
				return;
			}

			const sampleType = document.createElement("div");
			sampleType.classList.add("timingValue");

			if (point.isKiai) content.classList.add("kiai");

			if (point.sampleIdx !== 0) {
				sampleType.textContent = `${HitSound.HIT_SAMPLES[point.sampleSet][0].toUpperCase()}:C${point.sampleIdx}`;
			} else {
				sampleType.textContent = `${HitSound.HIT_SAMPLES[point.sampleSet][0].toUpperCase()}`;
			}

			const sampleVol = document.createElement("div");
			sampleVol.classList.add("timingValue");
			sampleVol.textContent = `${point.sampleVol}%`;

			content.append(sampleType, sampleVol);

			baseValue.textContent = `${point.svMultiplier.toFixed(2)}x`;
			container.classList.add("svPoint");

			document.querySelector(".timingPanel").append(container);
		});

		document.querySelector(".timings").textContent =
			`timings (${Beatmap.mergedPoints.length})`;
		// document.querySelector(".timings").textContent = `timings (${Beatmap.beatStepsList.length})`;
	}

	static loadMetadata(lines) {
		const getValue = (name) => {
			return (
				lines
					.filter((line) => line.includes(`${name}:`))
					.at(0)
					?.replaceAll(`${name}:`, "") ?? ""
			);
		};

		const artist = getValue("Artist");
		const artistUnicode = getValue("ArtistUnicode");
		const title = getValue("Title");
		const titleUnicode = getValue("TitleUnicode");
		const diff = getValue("Version");
		const source = getValue("Source");
		const tags = getValue("Tags");

		// document.querySelector(".meta-artist").textContent = artistUnicode;
		// document.querySelector(".meta-r-artist").textContent = artist;
		// document.querySelector(".meta-title").textContent = titleUnicode;
		// document.querySelector(".meta-r-title").textContent = title;
		// document.querySelector(".meta-diff").textContent = diff;
		// document.querySelector(".meta-source").textContent = source;
		// document.querySelector(".meta-tags").textContent = tags;

		MetadataPanel.artist = artistUnicode;
		MetadataPanel.romanized_artist = artist;
		MetadataPanel.title = titleUnicode;
		MetadataPanel.romanized_title = title;
		MetadataPanel.difficulty_name = diff;
		MetadataPanel.source = source;
		MetadataPanel.tag = tags;
	}

	applyStacking() {
		let extendedEndIndex = this.objectsController.objectsList.length - 1;
		let extendedStartIndex = 0;
		const stackDistance = 3;

		// console.log(this.objectsController);

		for (let i = extendedEndIndex; i > 0; i--) {
			let n = i;
			let currentObj = this.objectsController.objectsList[i];

			if (
				currentObj.obj.stackHeight != 0 ||
				currentObj.obj instanceof Spinner ||
				currentObj.obj.ILLEGAL
			)
				continue;

			if (currentObj.obj instanceof HitCircle) {
				while (--n >= 0) {
					const nObj = this.objectsController.objectsList[n];
					const endTime = nObj.obj.endTime;

					if (currentObj.obj.time - endTime > Beatmap.stackThreshold) break;
					if (n < extendedStartIndex) {
						nObj.obj.stackHeight = 0;
						extendedStartIndex = n;
					}

					// console.log(nObj.time);

					if (
						nObj.obj instanceof Slider &&
						this.calculateDistance(
							[nObj.obj.angleList.at(-1).x, nObj.obj.angleList.at(-1).y],
							[
								parseInt(currentObj.obj.originalX),
								parseInt(currentObj.obj.originalY),
							],
						) < stackDistance
					) {
						let offset = currentObj.obj.stackHeight - nObj.obj.stackHeight + 1;

						for (let j = n + 1; j <= i; j++) {
							const jObj = this.objectsController.objectsList[j];

							if (
								this.calculateDistance(
									[nObj.obj.angleList.at(-1).x, nObj.obj.angleList.at(-1).y],
									jObj.obj instanceof Slider
										? [jObj.obj.angleList.at(0).x, jObj.obj.angleList.at(0).y]
										: [
												parseInt(jObj.obj.originalX),
												parseInt(jObj.obj.originalY),
											],
								)
							) {
								jObj.obj.stackHeight -= offset;
							}
						}

						break;
					}

					if (
						this.calculateDistance(
							nObj.obj instanceof Slider
								? [nObj.obj.angleList.at(0).x, nObj.obj.angleList.at(0).y]
								: [parseInt(nObj.obj.originalX), parseInt(nObj.obj.originalY)],
							[
								parseInt(currentObj.obj.originalX),
								parseInt(currentObj.obj.originalY),
							],
						) < stackDistance
					) {
						nObj.obj.stackHeight = currentObj.obj.stackHeight + 1;
						currentObj = nObj;
					}
				}
			} else if (currentObj.obj instanceof Slider) {
				while (--n >= 0) {
					// console.log(currentObj);
					const nObj = this.objectsController.objectsList[n];
					// console.log(nObj);
					if (currentObj.obj.time - nObj.obj.time > Beatmap.stackThreshold)
						break;

					if (
						this.calculateDistance(
							nObj.obj instanceof Slider
								? [nObj.obj.angleList.at(-1).x, nObj.obj.angleList.at(-1).y]
								: [parseInt(nObj.obj.originalX), parseInt(nObj.obj.originalY)],
							currentObj.obj instanceof Slider
								? [
										currentObj.obj.angleList.at(0).x,
										currentObj.obj.angleList.at(0).y,
									]
								: [
										parseInt(currentObj.obj.originalX),
										parseInt(currentObj.obj.originalY),
									],
						) < stackDistance
					) {
						nObj.obj.stackHeight = currentObj.obj.stackHeight + 1;
						currentObj = nObj;
					}
				}
			}
		}
	}

	constructor(rawBeatmap, delay) {
		Beatmap.hasILLEGAL = false;

		Beatmap.COLORS = Skinning.DEFAULT_COLORS;
		Beatmap.loadMetadata(rawBeatmap.split("\n"));
		// Get Approach Rate
		if (
			rawBeatmap.split("\n").filter((line) => line.includes("ApproachRate:"))
				.length === 0
		) {
			Beatmap.stats.approachRate = parseFloat(
				rawBeatmap
					.split("\n")
					.filter((line) => line.includes("OverallDifficulty:"))
					.at(0)
					.replaceAll("OverallDifficulty:", ""),
			);
		} else {
			Beatmap.stats.approachRate = parseFloat(
				rawBeatmap
					.split("\n")
					.filter((line) => line.includes("ApproachRate:"))
					.at(0)
					.replaceAll("ApproachRate:", ""),
			);
		}

		// Get Circle Size
		Beatmap.stats.circleSize = parseFloat(
			rawBeatmap
				.split("\n")
				.filter((line) => line.includes("CircleSize:"))
				.at(0)
				.replaceAll("CircleSize:", ""),
		);

		// Get Circle Size
		Beatmap.stats.HPDrainRate = parseFloat(
			rawBeatmap
				.split("\n")
				.filter((line) => line.includes("HPDrainRate:"))
				.at(0)
				.replaceAll("HPDrainRate:", ""),
		);

		// Get Stack Leniency
		Beatmap.stats.stackLeniency = rawBeatmap.includes("StackLeniency: ")
			? parseFloat(
					rawBeatmap
						.split("\n")
						.filter((line) => line.includes("StackLeniency: "))
						.at(0)
						.replaceAll("StackLeniency: ", ""),
				)
			: 0.7;

		// Get Stack Leniency
		Beatmap.SAMPLE_SET = rawBeatmap.includes("SampleSet: ")
			? rawBeatmap
					.split("\n")
					.filter((line) => line.includes("SampleSet: "))
					.at(0)
					.replaceAll("SampleSet: ", "")
			: "Normal";

		// Get Slider Tick Rate
		Beatmap.stats.sliderTickRate = parseFloat(
			rawBeatmap
				.split("\n")
				.filter((line) => line.includes("SliderTickRate:"))
				.at(0)
				.replaceAll("SliderTickRate:", ""),
		);

		// Get Overall Difficulty
		Beatmap.stats.overallDifficulty = parseFloat(
			rawBeatmap
				.split("\n")
				.filter((line) => line.includes("OverallDifficulty:"))
				.at(0)
				.replaceAll("OverallDifficulty:", ""),
		);

		const HRMultiplier = !Game.MODS.HR ? 1 : 1.3;
		const EZMultiplier = !Game.MODS.EZ ? 1 : 0.5;

		Beatmap.hitWindows = {
			GREAT: Math.floor(
				80 -
					6 *
						Clamp(
							Beatmap.stats.overallDifficulty * HRMultiplier * EZMultiplier,
							0,
							10,
						),
			),
			OK: Math.floor(
				140 -
					8 *
						Clamp(
							Beatmap.stats.overallDifficulty * HRMultiplier * EZMultiplier,
							0,
							10,
						),
			),
			MEH: Math.floor(
				200 -
					10 *
						Clamp(
							Beatmap.stats.overallDifficulty * HRMultiplier * EZMultiplier,
							0,
							10,
						),
			),
		};

		Beatmap.stats.circleDiameter =
			(2 * (54.4 - 4.48 * Beatmap.stats.circleSize) * 236) / 256;

		Beatmap.stackThreshold =
			Beatmap.stats.preempt * Beatmap.stats.stackLeniency;

		const difficultyPosition =
			rawBeatmap.indexOf("[Difficulty]") + "[Difficulty]\n".length;
		const timingPosition =
			rawBeatmap.indexOf("[TimingPoints]") + "[TimingPoints]\n".length;
		const colourPosition =
			rawBeatmap.indexOf("[Colours]") + "[Colours]\n".length;
		const hitObjectsPosition =
			rawBeatmap.indexOf("[HitObjects]") + "[HitObjects]\n".length;

		const initialSliderVelocity =
			parseFloat(
				rawBeatmap
					.split("\n")
					.find(line => /^SliderMultiplier:/g.test(line))
					.replace("SliderMultiplier:", "")
			) * 100;
		// console.log(difficultyPosition, initialSliderVelocity, rawBeatmap);
		const beatStepsList = rawBeatmap
			.slice(
				timingPosition,
				rawBeatmap.indexOf("[Colours]") !== -1
					? colourPosition - "[Colours]\n".length
					: hitObjectsPosition - "[HitObjects]\n".length,
			)
			.split("\n")
			.filter((timingPoint) => {
				const params = timingPoint.split(",");
				return timingPoint !== "" && params[1] > 0;
			})
			.map((timingPoint) => {
				const params = timingPoint.split(",");
				return {
					time: parseInt(params[0]),
					beatstep: parseFloat(params[1]),
				};
			});

		Beatmap.beatStepsList = beatStepsList;

		const timingPointsList = rawBeatmap
			.slice(
				timingPosition,
				rawBeatmap.indexOf("[Colours]") !== -1
					? colourPosition - "[Colours]\n".length
					: hitObjectsPosition - "[HitObjects]\n".length,
			)
			.split("\n")
			.filter((timingPoint) => timingPoint !== "")
			.map((timingPoint) => {
				const params = timingPoint.split(",");
				return {
					time: parseInt(params[0]),
					beatstep:
						parseFloat(params[1]) > 0 ? parseFloat(params[1]) : undefined,
					svMultiplier:
						parseFloat(params[1]) > 0
							? 1
							: parseFloat(((-1 / params[1]) * 100).toFixed(2)),
					sampleSet: parseInt(params[3] ?? "0"),
					sampleIdx: parseInt(params[4] ?? "0"),
					sampleVol: parseInt(params[5] ?? "100"),
					isKiai: parseInt(params[7] ?? 0) === 0 ? false : true,
				};
			});

		Beatmap.timingPointsList = timingPointsList;
		timingPointsList.forEach((greenLine, idx) => {
			const graphic = new GreenLineInfo(greenLine);
			Timeline.beatLines.greenLines.push(graphic);
		});

		Beatmap.kiaiList = timingPointsList.filter((point, idx) => {
			if (
				point.isKiai &&
				(!timingPointsList[idx - 1] || !timingPointsList[idx - 1].isKiai)
			)
				return true;
			if (!point.isKiai && timingPointsList[idx - 1]?.isKiai) return true;
			if (point.isKiai && idx === timingPointsList.length - 1) return true;
			return false;
		});

		// console.log(Beatmap.kiaiList);

		Beatmap.mergedPoints = [
			...Beatmap.beatStepsList,
			...Beatmap.timingPointsList,
		].sort((a, b) => {
			if (a.time < b.time) return -1;
			if (a.time > b.time) return 1;
			if (a.beatstep) return 1;
			if (b.beatstep) return -1;
			return 0;
		});

		// Beatmap.loadProgressBar();
		ProgressBar.initTimingPoints();
		TimingPanel.initTimingPoints();
		// Beatmap.loadTimingPoints();

		// console.log(beatStepsList, timingPointsList);
		let coloursList =
			rawBeatmap.indexOf("[Colours]") !== -1
				? rawBeatmap
						.slice(
							colourPosition,
							hitObjectsPosition - "[HitObjects]\n".length,
						)
						.split("\n")
						.filter((line) => line !== "" && line.match(/Combo[0-9]+\s:\s/g))
						.map(
							(colour) =>
								`rgb(${colour.replaceAll(colour.match(/Combo[0-9]+\s:\s/g)[0], "")})`,
						)
						.map((colour) =>
							parseInt(
								colour
									.replaceAll("rgb(", "")
									.replaceAll(")", "")
									.split(",")
									.map((val) => parseInt(val).toString(16).padStart(2, "0"))
									.join(""),
								16,
							),
						)
				: [];

		if (coloursList.length === 0) coloursList = Skinning.DEFAULT_COLORS;

		Beatmap.COLORS = Skinning.DEFAULT_COLORS;
		Beatmap.COLORS = coloursList;
		// console.log(coloursList);

		const breakPeriods = rawBeatmap
			.split("\n")
			.filter((line) => /^2,[0-9]+,[0-9]+$/g.test(line))
			.map((line) =>
				line
					.split(",")
					.slice(1)
					.map((time) => parseInt(time)),
			);
		// console.log(breakPeriods);
		Beatmap.breakPeriods = breakPeriods;
		ProgressBar.initBreakKiai();

		let objectLists = rawBeatmap
			.slice(hitObjectsPosition)
			.split("\n")
			.filter((s) => s !== "");

		let combo = 1;
		let colorIdx = 1;
		let colorHaxedIdx = 1;

		let start = performance.now();
		const parsedHitObjects = objectLists
			.map((object, idx) => {
				const params = object.split(",");
				const time = parseInt(params[2]);
				let currentSVMultiplier = Beatmap.findNearestTimingPoint(
					time,
					"timingPointsList",
				);

				let returnObject;
				let timelineObject = null;

				const typeBit = parseInt(params[3])
					.toString(2)
					.padStart(8, "0")
					.split("")
					.reverse()
					.map((bit) => (bit === "1" ? true : false));
				const colorHax = parseInt(
					parseInt(params[3])
						.toString(2)
						.padStart(8, "0")
						.split("")
						.reverse()
						.slice(4, 7)
						.reverse()
						.join(""),
					2,
				);

				if (typeBit[0]) {
					returnObject = Beatmap.constructHitCircle(
						params,
						currentSVMultiplier,
					);
					timelineObject = new TimelineHitCircle(returnObject.obj);
				}
				if (typeBit[1]) {
					returnObject = Beatmap.constructSlider(
						params,
						timingPointsList,
						beatStepsList,
						initialSliderVelocity,
						object,
					);
					timelineObject = new TimelineSlider(returnObject.obj);
				}
				if (typeBit[3]) {
					returnObject = Beatmap.constructSpinner(params, currentSVMultiplier);
					timelineObject = new TimelineSlider(returnObject.obj);
				}

				if (typeBit[2] && idx !== 0) {
					combo = 1;
					colorIdx++;
					colorHaxedIdx++;
				}

				if (colorHax !== 0 && typeBit[2]) {
					colorHaxedIdx += colorHax;
				}

				returnObject.obj.comboIdx = combo;
				returnObject.obj.colourIdx = colorIdx;
				returnObject.obj.colourHaxedIdx = colorHaxedIdx;

				if (returnObject.obj instanceof Slider) {
					returnObject.obj.hitCircle.comboIdx = combo;
					returnObject.obj.hitCircle.colourIdx = colorIdx;
					returnObject.obj.hitCircle.colourHaxedIdx = colorHaxedIdx;
				}

				if (returnObject.obj instanceof Spinner) {
					returnObject.obj.comboIdx = 1;
					returnObject.obj.colourIdx = -1;
					returnObject.obj.colourHaxedIdx = -1;
				}

				combo++;

				return {
					...returnObject,
					timelineObject,
				};
			})
			.filter((o) => o);
		console.log(
			`Took: ${performance.now() - start}ms to finish objects construction.`,
		);

		this.objectsController = new ObjectsController(
			parsedHitObjects,
			coloursList,
			breakPeriods,
		);
		// console.log(Game.WORKER)
		// Ported from Lazer
		Beatmap.updateStats();
		Beatmap.updateModdedStats();

		this.applyStacking();

		this.objectsController.objectsList.forEach((object, idx, arr) => {
			// Timeline.hitArea.obj.addChildAt(object.timelineObject.obj, 0);

			// Game.CONTAINER.addChild(object.obj.obj);
			// if (object.obj.approachCircleObj) {
			//     Game.CONTAINER.addChild(object.obj.approachCircleObj.obj);
			// }

			if (idx === this.objectsController.objectsList.length - 1) return;
			if (arr[idx + 1].obj.comboIdx === 1) return;
			if (object.obj instanceof Spinner) return;

			object.obj.followPoint = new FollowPoint({
				startObj: object.obj,
				endObj: arr[idx + 1].obj,
			});

			// Game.CONTAINER.addChild(object.obj.followPoint.container);
		});

		this.objectsController.slidersList.forEach((o) => {
			o.obj.hitCircle.stackHeight = o.obj.stackHeight;
		});

		Game.WORKER.postMessage({
			type: "objects",
			objects: parsedHitObjects.map((obj, idx) => {
				return {
					idx,
					time: obj.obj.time,
					endTime: obj.obj.endTime,
					startTime: obj.obj.startTime,
					killTime: obj.obj.killTime,
				};
			}),
		});

		const drainTime =
			(this.objectsController.objectsList.at(-1).obj.time -
				(breakPeriods.reduce(
					(accumulated, curr) => accumulated + (curr[1] - curr[0]),
					0,
				) +
					this.objectsController.objectsList.at(0).obj.time)) /
			1000;

		Beatmap.difficultyMultiplier = Math.round(
			((Beatmap.stats.HPDrainRate +
				Beatmap.stats.circleSize +
				Beatmap.stats.overallDifficulty +
				Clamp(
					(this.objectsController.objectsList.length / drainTime) * 8,
					0,
					16,
				)) /
				38) *
				5,
		);

		if (Beatmap.hasILLEGAL) {
			new Notification({
				message:
					"This beatmap contains illegal hitobjects. Therefore, Timeline will be disabled for this map",
				type: "warning",
				autoTimeout: false,
			}).notify();
		}
	}

	calculateDistance(vec1, vec2) {
		const xDistance = vec1[0] - vec2[0];
		const yDistance = vec1[1] - vec2[1];
		return Math.sqrt(xDistance ** 2 + yDistance ** 2);
	}

	render() {
		this.objectsController.render();
	}
}
