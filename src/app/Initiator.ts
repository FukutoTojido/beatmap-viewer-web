import ky from "ky";
import type { Resource } from "./ZipHandler";

export async function getArgon() {
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
		...defaults,
		...hitSounds.reduce((accm, curr) => {
			accm.push(...curr);
			return accm;
		}, []),
		"followpoint.png",
		"timelinehitcircle@2x.png",
		"hit300@2x.png",
		"hit100@2x.png",
		"hit50@2x.png",
		"hit0@2x.png",
		"hitcircle@2x.png",
		"hitcircleflash@2x.png",
		"hitcircleglow@2x.png",
		"hitcircleoverlay@2x.png",
		"hitcircleselect@2x.png",
		"sliderb@2x.png",
		"sliderb-nd@2x.png",
		"sliderfollowcircle@2x.png",
		"reversearrow@2x.png",
		"repeat-edge-piece@2x.png",
		"sliderendcircle.png",
		"sliderstartcircle@2x.png",
		"sliderscorepoint@2x.png",
		"spinner-approachcircle@2x.png",
		"spinner-bottom@2x.png",
		"skin.ini",
	];

	const resources = new Map<string, Resource>();
	await Promise.all(
		filenames.map(async (filename) => {
			try {
				const data = await ky.get<Blob>(`./skinning/argon/${filename}`).blob();
				resources.set(filename, data);
			} catch {
				return;
			}
		}),
	);

	return resources;
}

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
	const maniaNotes = ["1", "2", "S"].reduce<string[]>((accm, index) => {
		accm.push(
			...["", "H"].reduce<string[]>((accmType, type) => {
				accmType.push(`mania-note${index}${type}@2x.png`);
				return accmType;
			}, []),
		);
		return accm;
	}, []);
	const maniaAnimatedNotes = ["1", "2", "S"].reduce<string[]>((accm, index) => {
		accm.push(
			...["L"].reduce<string[]>((accmType, type) => {
				accmType.push(
					...[1, 2, 3, 4, 5].reduce<string[]>((accmFrame, frame) => {
						accmFrame.push(`mania-note${index}${type}-${frame}@2x.png`);
						return accmFrame;
					}, []),
				);
				return accmType;
			}, []),
		);
		return accm;
	}, []);
	const maniaKeys = ["1", "2", "S"].reduce<string[]>((accm, index) => {
		accm.push(
			...["", "D"].reduce<string[]>((accmType, type) => {
				accmType.push(`mania-key${index}${type}@2x.png`);
				return accmType;
			}, []),
		);
		return accm;
	}, []);

	const filenames = [
		"approachcircle@2x.png",
		...defaults,
		...hitSounds.reduce((accm, curr) => {
			accm.push(...curr);
			return accm;
		}, []),
		"cursor@2x.png",
		"cursortrail.png",
		"followpoint@2x.png",
		"hit300@2x.png",
		"hit100@2x.png",
		"hit50@2x.png",
		"hit0@2x.png",
		"hitcircle@2x.png",
		"hitcircleoverlay@2x.png",
		"hitcircleselect@2x.png",
		...maniaNotes,
		...maniaKeys,
		...maniaAnimatedNotes,
		"mania-stage-hint@2x.png",
		"skin.ini",
		"sliderb0@2x.png",
		"sliderb1@2x.png",
		"sliderb2@2x.png",
		"sliderb3@2x.png",
		"sliderb4@2x.png",
		"sliderb5@2x.png",
		"sliderb6@2x.png",
		"sliderb7@2x.png",
		"sliderb8@2x.png",
		"sliderb9@2x.png",
		"sliderb-nd@2x.png",
		"sliderb-spec@2x.png",
		"sliderfollowcircle@2x.png",
		"reversearrow@2x.png",
		"sliderscorepoint@2x.png",
		"spinner-approachcircle@2x.png",
		"spinner-bottom@2x.png",
	];

	const resources = new Map<string, Resource>();
	await Promise.all(
		filenames.map(async (filename) => {
			try {
				const data = await ky.get<Blob>(`./skinning/legacy/${filename}`).blob();
				resources.set(filename, data);
			} catch {
				return;
			}
		}),
	);

	return resources;
}

export async function getYugen() {
	const defaults = [...Array(10)].map((_, idx) => `default-${idx}@2x.png`);
	const maniaNotes = ["1", "2", "S"].reduce<string[]>((accm, index) => {
		accm.push(
			...["", "H", "L"].reduce<string[]>((accmType, type) => {
				accmType.push(`mania-note${index}${type}.png`);
				return accmType;
			}, []),
		);
		return accm;
	}, []);
	const maniaKeys = ["1", "2", "S"].reduce<string[]>((accm, index) => {
		accm.push(
			...["", "D"].reduce<string[]>((accmType, type) => {
				accmType.push(`mania-key${index}${type}.png`);
				return accmType;
			}, []),
		);
		return accm;
	}, []);
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
		"approachcircle.png",
		"cursor@2x.png",
		"cursortrail.png",
		...defaults,
		...hitSounds.reduce((accm, curr) => {
			accm.push(...curr);
			return accm;
		}, []),
		"followpoint@2x.png",
		"followpoint-0.png",
		"followpoint-1.png",
		"followpoint-2.png",
		"hit300.png",
		"hit100.png",
		"hit50.png",
		"hit0.png",
		"hitcircle@2x.png",
		"hitcircleoverlay@2x.png",
		...maniaNotes,
		...maniaKeys,
		"mania-stage-hint.png",
		"skin.ini",
		"sliderb0@2x.png",
		"sliderfollowcircle@2x.png",
		"reversearrow@2x.png",
		"sliderscorepoint.png",
		"spinner-approachcircle@2x.png",
		"spinner-bottom@2x.png",
	];

	const resources = new Map<string, Resource>();
	await Promise.all(
		filenames.map(async (filename) => {
			try {
				const data = await ky.get<Blob>(`./skinning/yugen/${filename}`).blob();
				resources.set(filename, data);
			} catch {
				return;
			}
		}),
	);

	return resources;
}
