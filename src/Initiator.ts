import axios from "axios";
import type { Resource } from "./ZipHandler";

export async function getDefaultLegacy() {
	const defaults = [...Array(10)].map((_, idx) => `default-${idx}@2x.png`);
	const hitSounds = ["drum", "normal", "soft"].map((hitSample) =>
		[
			"hitclap",
			"hitfinish",
			"hitnormal",
			"hitwhistle",
			"sliderslide",
			"slidertick",
			"sliderwhistle",
		].map((hitSound) => `${hitSample}-${hitSound}.wav`),
	);

	const filenames = [
		"approachcircle@2x.png",
		...defaults,
		...hitSounds.reduce((accm, curr) => {
			accm.push(...curr);
			return accm;
		}, []),
		"followpoint@2x.png",
		"hitcircle@2x.png",
		"hitcircleoverlay@2x.png",
        "skin.ini",
		"sliderb0@2x.png",
		"sliderfollowcircle@2x.png",
		"sliderscorepoint@2x.png",
	];

	const resources = new Map<string, Resource>();
	await Promise.all(
		filenames.map(async (filename) => {
			try {
				const { data } = await axios.get<Blob>(`./skinning/legacy/${filename}`, {
					responseType: "blob",
				});

				resources.set(filename, data);
			} catch (e) {
				return;
			}
		}),
	);

    return resources;
}


export async function getYugen() {
	const defaults = [...Array(10)].map((_, idx) => `default-${idx}@2x.png`);
	const hitSounds = ["drum", "normal", "soft"].map((hitSample) =>
		[
			"hitclap",
			"hitfinish",
			"hitnormal",
			"hitwhistle",
			"sliderslide",
			"slidertick",
			"sliderwhistle",
		].map((hitSound) => `${hitSample}-${hitSound}.wav`),
	);

	const filenames = [
		"approachcircle@2x.png",
		...defaults,
		...hitSounds.reduce((accm, curr) => {
			accm.push(...curr);
			return accm;
		}, []),
		"followpoint@2x.png",
		"hitcircle@2x.png",
		"hitcircleoverlay@2x.png",
        "skin.ini",
		"sliderb0@2x.png",
		"sliderfollowcircle@2x.png",
		"sliderscorepoint.png",
	];

	const resources = new Map<string, Resource>();
	await Promise.all(
		filenames.map(async (filename) => {
			try {
				const { data } = await axios.get<Blob>(`./skinning/yugen/${filename}`, {
					responseType: "blob",
				});

				resources.set(filename, data);
			} catch (e) {
				return;
			}
		}),
	);

    return resources;
}