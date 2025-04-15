import { Game } from "./Game.js";
import { Timeline } from "./Timeline/Timeline.js";
import { Beatmap } from "./Beatmap.js";
import {
	createDifficultyElement,
	round,
	getDiffColor,
	loadColorPalette,
	loadSampleSound,
	Clamp,
	getOS,
} from "./Utils.js";
import { go, playToggle } from "./ProgressBar.js";
import { openMenu, setBeatsnapDivisor } from "./Settings.js";
import { calculateCurrentSR } from "./Settings.js";
import { HitSample, PAudio } from "./Audio.js";
import { ScoreParser } from "./ScoreParser.js";
import { Notification } from "./Notification.js";
import { urlParams } from "./GlobalVariables.js";
import { handleCanvasDrag } from "./DragWindow.js";
import { closePopup } from "./Timestamp.js";
import osuPerformance from "../lib/osujs.js";
import axios from "axios";
import ky from "ky";
import md5 from "crypto-js/md5";
import * as d3 from "d3";
import { Background } from "./Background.js";
import { Spinner } from "./HitObjects/Spinner.js";
import { toggleMetadataPanel } from "./SidePanel.js";
import { toggleTimingPanel } from "./BPM.js";
import { Storyboard } from "./Storyboard/Storyboard.js";
import { User } from "./User.js";
import { Transcoder } from "./FFmpeg.js";

export class BeatmapFile {
	isFromFile = false;
	osuFile;
	mapId;
	audioBlobURL;
	backgroundBlobURL;
	audio;
	audioArrayBuffer;
	audioNode;
	beatmapRenderData;
	hitsoundList = [];
	title;
	artist;
	diff;
	md5Map;
	isLoaded = false;
	hasOgg = false;
	hasVideo = false;
	hasNonMp4 = false;

	static CURRENT_MAPID;
	static SIGNALER = new AbortController();

	constructor(mapId, isFromFile) {
		this.mapId = mapId;
		this.isFromFile = isFromFile;
		this.constructMap();
	}

	async getOsuFile() {
		const rawOsuFile = (
			await axios.get(`https://preview.tryz.id.vn/api/b/${this.mapId}/osu`)
		).data;
		this.md5Map = md5(rawOsuFile).toString();
		this.osuFile = rawOsuFile.replaceAll("\r", "");
	}

	async readBlobAsBuffer(blob) {
		const res = await new Promise((resolve) => {
			let fileReader = new FileReader();
			fileReader.onload = (event) => resolve(fileReader.result);
			fileReader.readAsArrayBuffer(blob);
		});

		// console.log(res);
		return res;
	}

	static async downloadCustom(url) {
		document.querySelector(".loading").style.display = "";
		document.querySelector(".loading").style.opacity = 1;

		document.querySelector("#loadingText").textContent =
			`Downloading map.\nMight take a while if your internet is slow`;

		try {
			const blob = (
				await axios.get(`https://preview.tryz.id.vn/download/${url}`, {
					signal: BeatmapFile.SIGNALER.signal,
					responseType: "blob",
					onDownloadProgress: (progressEvent) => {
						// document.querySelector("#loadingText").textContent = `Downloading map: ${(progressEvent.percent * 100).toFixed(2)}%`;
						document.querySelector("#loadingText").textContent =
							`Downloading map.\nUnknown size (${(
								isNaN(progressEvent.rate) ? 0 : progressEvent.rate / 1024 ** 2
							).toFixed(2)}MiB/s)\nMight take a while if your internet is slow`;
					},
					// headers: {
					//     "Access-Control-Allow-Origin": "*",
					//     "Access-Control-Allow-Methods": "GET, OPTIONS, POST, HEAD",
					// },
				})
			).data;

			return blob;
		} catch (e) {
			console.error(e);
			throw "Cannot download map from this URL";
		} finally {
			document.querySelector(".loading").style.opacity = 0;
			document.querySelector(".loading").style.display = "none";
		}
	}

	async downloadOsz(setId) {
		try {
			document.querySelector("#loadingText").textContent =
				`Downloading map.\nMight take a while if your internet is slow`;

			const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
			const selectedMirror = currentLocalStorage.mirror.val;
			const customURL = document.querySelector("#custom-mirror").value;

			const urls = {
				nerinyan: "https://api.nerinyan.moe/d/$setId",
				sayobot: "https://dl.sayobot.cn/beatmaps/download/$setId",
				chimu: "https://catboy.best/d/$setId",
			};

			if (!urls[selectedMirror] && customURL === "")
				throw "You need a beatmap mirror download link first!";

			const url = (urls[selectedMirror] ?? customURL).replace("$setId", setId);
			const response = await axios.get(url, {
				signal: BeatmapFile.SIGNALER.signal,
				responseType: "blob",
				headers: { Accept: "application/x-osu-beatmap-archive" },
				onDownloadProgress: (progressEvent) => {
					// console.log(progressEvent);
					document.querySelector("#loadingText").textContent =
						`Downloading map.\n${(progressEvent.progress * 100).toFixed(2)}% (${(
							isNaN(progressEvent.rate) ? 0 : progressEvent.rate / 1024 ** 2
						).toFixed(2)}MiB/s)\nMight take a while if your internet is slow`;
				},
			});

			const blob = response.data;

			Game.DROP_BLOB = blob;
			return blob;
		} catch (e) {
			// return;
			console.log(e);
			throw "This map is not available on the selected beatmap provider\nPlease open the settings to choose another one.";
		}
	}

	async getOsz() {
		let mapsetData;
		if (!this.isFromFile) {
			mapsetData = (
				await axios.get(`https://preview.tryz.id.vn/api/b/${this.mapId}`)
			).data;
			this.artist = mapsetData.artist_unicode;
			this.title = mapsetData.title_unicode;
			this.diff = mapsetData.beatmaps.filter(
				(diff) => diff.id === parseInt(this.mapId),
			)[0].version;

			document.title = `${this.artist} - ${this.title} [${this.diff}] | JoSu!`;

			// console.log(mapsetData.beatmaps.filter((diff) => diff.id === parseInt(this.mapId)));

			if (
				mapsetData.beatmaps.filter(
					(diff) => diff.id === parseInt(this.mapId),
				)[0].mode !== "osu"
			) {
				throw new Error("Not a standard map!");
			}

			// document.querySelector("#artistTitle").innerHTML = `${mapsetData.artist} - ${mapsetData.title}`;
			// document.querySelector("#versionCreator").innerHTML = `Difficulty: <span>${
			//     mapsetData.beatmaps.find((map) => map.id == this.mapId).version
			// }</span> - Mapset by <span>${mapsetData.creator}</span>`;

			Game.INFO.title = mapsetData.title;
			Game.INFO.artist = mapsetData.artist;
			Game.INFO.difficulty = mapsetData.beatmaps.find(
				(map) => map.id == this.mapId,
			).version;
			Game.INFO.mapper = mapsetData.creator;
		}

		const setId = mapsetData?.id;
		if (setId && !this.isFromFile)
			Beatmap.HREF = `https://osu.ppy.sh/beatmapsets/${setId}#osu/${this.mapId}`;
		else Beatmap.HREF = null;

		const mapFileBlob = !this.isFromFile
			? await this.downloadOsz(setId)
			: Game.DROP_BLOB;
		const mapFileBlobReader = new zip.BlobReader(mapFileBlob);
		const zipReader = new zip.ZipReader(mapFileBlobReader);
		const allEntries = await zipReader.getEntries();

		if (!this.isFromFile) {
			await this.getOsuFile();
			const diffList = document.querySelector(".difficultyList");
			diffList.innerHTML = "";
			// document.querySelector(".difficultySelector").style.display = "block";

			const diffs = [];

			for (const content of allEntries) {
				if (content.filename.split(".").at(-1) !== "osu") continue;
				const blob = await content.getData(new zip.BlobWriter("text/plain"));
				const rawFile = await blob.text();

				const mode = rawFile
					.split("\n")
					.filter((line) => /Mode:\s[0-9]+/g.test(line))
					.at(0)
					?.replace("Mode: ", "");
				if (parseInt(mode) !== 0) continue;

				const builderOptions = {
					addStacking: true,
					mods: [],
				};
				const blueprintData = osuPerformance.parseBlueprint(rawFile);
				const beatmapData = osuPerformance.buildBeatmap(
					blueprintData,
					builderOptions,
				);
				const difficultyAttributes =
					osuPerformance.calculateDifficultyAttributes(beatmapData, true)[0];

				const diffName = rawFile
					.split("\n")
					.filter((line) => /Version:.+/g.test(line))
					.at(0)
					?.replace("Version:", "");

				// console.log(osuPerformance.calculateDifficultyAttributes(beatmapData, true));

				const ele = createDifficultyElement({
					name: diffName,
					fileName: content.filename,
					starRating: difficultyAttributes?.starRating ?? 0,
				});

				diffs.push(ele);
			}

			diffs.sort((a, b) => {
				return -a.starRating + b.starRating;
			});

			for (const obj of diffs) diffList.appendChild(obj.ele);
		} else {
			const map = allEntries
				.filter((e) => e.filename === Game.DIFF_FILE_NAME)
				.at(0);
			const blob = await map.getData(new zip.BlobWriter("text/plain"));
			this.osuFile = await blob.text();

			const splitted = this.osuFile.split("\n");

			const artist = splitted
				.filter((line) => /Artist:.+/g.test(line))
				.at(0)
				?.replace("Artist:", "");
			const artistUnicode = splitted
				.filter((line) => /ArtistUnicode:.+/g.test(line))
				.at(0)
				?.replace("ArtistUnicode:", "");
			const title = splitted
				.filter((line) => /Title:.+/g.test(line))
				.at(0)
				?.replace("Title:", "");
			const titleUnicode = splitted
				.filter((line) => /TitleUnicode:.+/g.test(line))
				.at(0)
				?.replace("TitleUnicode:", "");
			const creator = splitted
				.filter((line) => /Creator:.+/g.test(line))
				.at(0)
				?.replace("Creator:", "");
			const version = splitted
				.filter((line) => /Version:.+/g.test(line))
				.at(0)
				?.replace("Version:", "");
			const beatmapID = splitted
				.filter((line) => /BeatmapID:.+/g.test(line))
				.at(0)
				?.replace("BeatmapID:", "");
			const beatmapSetID = splitted
				.filter((line) => /BeatmapSetID:.+/g.test(line))
				.at(0)
				?.replace("BeatmapSetID:", "");

			// document.querySelector("#artistTitle").innerHTML = `${artist} - ${title}`;
			// document.querySelector("#versionCreator").innerHTML = `Difficulty: <span>${version}</span> - Mapset by <span>${creator}</span>`;

			Game.INFO.title = title;
			Game.INFO.artist = artist;
			Game.INFO.difficulty = version;
			Game.INFO.mapper = creator;

			document.title = `${artistUnicode} - ${titleUnicode} [${version}] | JoSu!`;

			if (beatmapSetID && beatmapID && beatmapSetID > 0 && beatmapID > 0) {
				const searchTrim = window.location.search
					.replaceAll("?", "")
					.replaceAll(/b=[0-9]+/g, "")
					.split("&")
					.filter((word) => word !== "")
					.join("&");
				window.history.pushState(
					{},
					"JoSu!",
					`${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-web"}/?b=${beatmapID}${searchTrim !== "" ? `&${searchTrim}` : ""}${window.location.hash}`,
				);
				Beatmap.HREF = `https://osu.ppy.sh/beatmapsets/${beatmapSetID}#osu/${beatmapID}`;
			} else {
				const searchTrim = window.location.search
					.replaceAll("?", "")
					.replaceAll(/b=[0-9]+/g, "");
				window.history.pushState(
					{},
					"JoSu!",
					`${origin}${!origin.includes("github.io") ? "" : "/beatmap-viewer-web"}/?${searchTrim}${window.location.hash}`,
				);
				Beatmap.HREF = null;
			}
		}

		const modsTemplate = ["HARD_ROCK", "EASY", "DOUBLE_TIME", "HALF_TIME"];

		const modsFlag = [Game.MODS.HR, Game.MODS.EZ, Game.MODS.DT, Game.MODS.HT];

		const builderOptions = {
			addStacking: true,
			mods: modsTemplate.filter((mod, idx) => modsFlag[idx]),
		};
		const blueprintData = osuPerformance.parseBlueprint(this.osuFile);
		const beatmapData = osuPerformance.buildBeatmap(
			blueprintData,
			builderOptions,
		);
		const difficultyAttributes = osuPerformance.calculateDifficultyAttributes(
			beatmapData,
			true,
		)[0];

		// document.querySelector("#CS").textContent = round(beatmapData.difficulty.circleSize);
		// document.querySelector("#AR").textContent = round(beatmapData.difficulty.approachRate);
		// document.querySelector("#OD").textContent = round(beatmapData.difficulty.overallDifficulty);
		// document.querySelector("#HP").textContent = round(beatmapData.difficulty.drainRate);
		// document.querySelector("#SR").textContent = `${round(difficultyAttributes.starRating)}★`;
		// document.querySelector("#SR").style.backgroundColor = getDiffColor(difficultyAttributes.starRating);

		Game.STATS.CS = round(beatmapData.difficulty.circleSize);
		Game.STATS.AR = round(beatmapData.difficulty.approachRate);
		Game.STATS.OD = round(beatmapData.difficulty.overallDifficulty);
		Game.STATS.HP = round(beatmapData.difficulty.drainRate);
		Game.STATS.SR = round(difficultyAttributes?.starRating ?? 0);
		Game.STATS.srContainer.color = parseInt(
			d3
				.color(getDiffColor(difficultyAttributes?.starRating ?? 0))
				.formatHex()
				.slice(1),
			16,
		);

		if ((difficultyAttributes?.starRating ?? 0) >= 6.5)
			Game.STATS.SRSprite.style.fill = parseInt(
				d3.color("hsl(45, 100%, 70%)").formatHex().slice(1),
				16,
			);
		else Game.STATS.SRSprite.style.fill = 0x000000;

		Game.STATS.update();

		// console.log(beatmapData)
		// console.log(difficultyAttributes)

		const osuVersion = parseInt(this.osuFile.split("\n")[0].slice(-3));
		const audioFilename =
			osuVersion <= 3
				? this.osuFile.split("\n")[3]
				: this.osuFile
						.split("\n")
						.filter((line) => line.match(/AudioFilename: /g))[0]
						.replace("AudioFilename: ", "")
						.replace("\r", "")
						.replace("\n", "");
		const backgroundFilename = this.osuFile
			.split("\n")
			.filter((line) => line.match(/0,0,"*.*"/g))
			.at(0)
			?.match(/".*?\.[a-zA-Z0-9]+"/g)
			.at(0)
			?.replaceAll('"', "");
		const videoFilename = this.osuFile
			.split("\n")
			.filter((line) => line.match(/Video,-?[0-9]+,"*.*"/g))
			.at(0)
			?.match(/".*?\.[a-zA-Z0-9]+"/g)
			.at(0)
			?.replaceAll('"', "");
		const videoOffset = parseInt(
			this.osuFile
				.split("\n")
				.filter((line) => line.match(/Video,-?[0-9]+,"*.*"/g))
				.at(0)
				?.split(",")
				.at(1) ?? 0,
		);

		console.log(audioFilename, backgroundFilename, videoFilename ?? "");
		// console.log(allEntries);

		document.querySelector("#loadingText").innerHTML =
			`Setting up Audio<br>Might take long if the audio file is large`;
		const audioFile = allEntries.find((e) => e.filename === audioFilename);

		if (!audioFile) {
			throw "This map has no audio file";
		}

		let audioBlob = await audioFile.getData(
			new zip.BlobWriter(`audio/${audioFilename.split(".").at(-1)}`),
		);

		if (audioFilename.split(".").at(-1) === "ogg") {
			this.hasOgg = true;
			// audioBlob = await Transcoder.toMp3({
			// 	blob: audioBlob,
			// 	ext: audioFilename.split(".").at(-1),
			// });
		}

		// console.log("Audio Blob Generated");
		// const { dt, ht } = await Transcoder.changeRate({
		// 	blob: audioBlob,
		// 	ext: audioFilename.split(".").at(-1),
		// });
		this.audioBlobURL = URL.createObjectURL(audioBlob);
		const audioArrayBuffer = await this.readBlobAsBuffer(audioBlob);
		// const [dtBuffer, htBuffer] = await Promise.all([
		// 	this.readBlobAsBuffer(dt),
		// 	this.readBlobAsBuffer(ht),
		// ]);
		console.log("Audio Loaded");

		const backgroundFile = allEntries
			.filter((e) => e.filename === backgroundFilename)
			.at(0);
		if (backgroundFile) {
			document.querySelector("#loadingText").innerHTML =
				`Setting up Background`;
			const data = await backgroundFile.getData(
				new zip.BlobWriter(`image/${backgroundFilename.split(".").at(-1)}`),
			);
			// const base64 = await backgroundFile.getData(new zip.Data64URIWriter(`image/${backgroundFilename.split(".").at(-1)}`));

			// console.log(data);

			// console.log("Background Blob Generated");
			this.backgroundBlobURL = URL.createObjectURL(data);
			console.log("Background Loaded");
			Background.src = this.backgroundBlobURL;

			// document.querySelector(".mapBG").style.backgroundImage = `url(${this.backgroundBlobURL})`;
			document.body.style.backgroundImage = `url(${this.backgroundBlobURL})`;

			const bg = new Image();
			bg.src = this.backgroundBlobURL;

			if (bg.complete) {
				loadColorPalette(bg);
			} else {
				bg.addEventListener("load", () => loadColorPalette(bg));
			}
		}

		const videoFile = allEntries
			.filter((e) => e.filename === videoFilename)
			.at(0);
		if (videoFile) {
			const extension = videoFilename.split(".").at(-1);
			document.querySelector("#loadingText").innerHTML =
				`Setting up Background Video`;
			const data = await videoFile.getData(
				new zip.BlobWriter(`video/${extension}`),
			);

			if (extension !== "mp4") {
				this.videoBlobURL = await Transcoder.transcode({
					blob: data,
					ext: extension,
				});
				this.hasNonMp4 = true;
			} else {
				this.videoBlobURL = URL.createObjectURL(data);
			}
			console.log(this.videoBlobURL);
			console.log("Video Loaded");
			Background.videoSrc = this.videoBlobURL;
			Background.offset = videoOffset;

			console.log(videoOffset);
		}

		if (videoFile) {
			this.hasVideo = true;
		}

		Background.switch(Game.IS_VIDEO ? "VIDEO" : "STATIC");

		const osbFile = allEntries.find(
			(e) => e.filename.split(".").at(-1) === "osb",
		);
		if (osbFile) {
			document.querySelector("#loadingText").innerHTML =
				`Setting up Storyboard`;
			const blob = await osbFile.getData(new zip.BlobWriter("text/plain"));
			const osbContent = await blob.text();

			await Storyboard.parse(
				osbContent,
				this.osuFile,
				allEntries,
				backgroundFilename,
			);
		}

		const hitsoundFiles = allEntries.filter((file) => {
			// console.log(file.filename);
			return /(normal|soft|drum)-(hitnormal|hitwhistle|hitclap|hitfinish|slidertick|sliderwhistle|sliderslide)([1-9][0-9]*)?/.test(
				file.filename,
			);
		});

		// console.log(hitsoundFiles);

		const hitsoundArrayBuffer = [];
		document.querySelector("#loadingText").innerHTML =
			`Setting up Hitsounds<br>Might take long if there are many hitsound files`;
		for (const file of hitsoundFiles) {
			if (file.filename.split(".").at(-1) === "ogg") {
				this.hasOgg = true;
			}

			const writer = new zip.BlobWriter(
				`audio/${file.filename.split(".").at(-1)}`,
			);
			const fileBlob = await file.getData(writer);
			// console.log(`Hitsound ${file.filename} Blob Generated`);
			const fileArrayBuffer = await this.readBlobAsBuffer(fileBlob);
			// console.log(`Hitsound ${file.filename} ArrayBuffer Generated`);

			hitsoundArrayBuffer.push({
				filename: file.filename,
				buf: fileArrayBuffer,
			});
		}

		this.hitsoundList = hitsoundArrayBuffer;
		console.log("Hitsound Loaded");

		zipReader.close();
		document.querySelector("#loadingText").innerHTML = `Setting up HitObjects`;
		console.log("Get .osz completed");
		return {
			audioArrayBuffer,
			// dtBuffer,
			// htBuffer,
		};
	}

	async loadHitsounds() {
		HitSample.SAMPLES.MAP = {};
		for (const hs of this.hitsoundList) {
			const idx = hs.filename
				.replace(hs.filename.match(/normal|soft|drum/)[0], "")
				.replaceAll(
					hs.filename.match(
						/hitnormal|hitwhistle|hitfinish|hitclap|slidertick|sliderwhistle|sliderslide/,
					),
					"",
				)
				.replace("-", "")
				.split(".")[0];

			await loadSampleSound(
				hs.filename.split(".")[0].replaceAll(`${idx}`, ""),
				idx === "" ? 1 : parseInt(idx),
				hs.buf,
			);
		}
	}

	async constructMap() {
		try {
			if (this.mapId === "2087153") {
				throw "This beatmap should not be loaded under any circumstances. Please provide a different beatmap.";
			}

			Game.WORKER.postMessage({
				type: "clear",
			});

			const removedChildren = Game.CONTAINER.removeChildren();
			removedChildren.forEach((ele) => ele.destroy());

			Timeline.destruct();
			Background.reset();
			Storyboard.reset();

			Beatmap.CURRENT_MAPID = this.mapId;
			document.querySelector(".loading").style.display = "";
			document.querySelector(".loading").style.opacity = 1;
			const { audioArrayBuffer } = await this.getOsz();
			this.audioNode = new PAudio();
			await this.loadHitsounds();

			document.querySelector("#loadingText").textContent = `Setting up Audio`;
			await this.audioNode.createBufferNode({
				base: audioArrayBuffer,
				// dt: dtBuffer,
				// ht: htBuffer,
			});

			document.querySelector("#loadingText").textContent =
				`Setting up HitObjects`;
			this.beatmapRenderData = new Beatmap(this.osuFile, 0);

			document.querySelector(".loading").style.opacity = 0;
			document.querySelector(".loading").style.display = "none";

			document.querySelector("#loadingText").textContent = `Getting map data`;

			document.querySelector("#choose-diff").disabled = false;
			document.querySelector("#close").disabled = false;

			if (
				ScoreParser.REPLAY_DATA &&
				ScoreParser.REPLAY_DATA.md5map !== this.md5Map
			) {
				ScoreParser.reset();
			}

			// document.querySelector("#playButton").addEventListener("click", playToggle);

			if (ScoreParser.CURSOR_DATA) {
				ScoreParser.eval();
				document.querySelector("#HD").disabled = true;
				document.querySelector("#HR").disabled = true;
				document.querySelector("#DT").disabled = true;
				document.querySelector("#NC").disabled = true;
				document.querySelector("#EZ").disabled = true;
				document.querySelector("#HT").disabled = true;
				document.querySelector("#DC").disabled = true;

				calculateCurrentSR([
					Game.MODS.HR,
					Game.MODS.EZ,
					Game.MODS.DT,
					Game.MODS.HT,
				]);

				User.updateInfo({
					username: ScoreParser.REPLAY_DATA.player,
					mods: ScoreParser.MODS,
				});
			} else {
				User.updateInfo();

				const raw =
					urlParams.get("m") && /[A-Za-z]+/g.test(urlParams.get("m"))
						? urlParams.get("m").match(/.{2}/g)
						: [];
				const mods = raw
					.reduce((arr, mod) => {
						if (
							!["HD", "HR", "DT", "HT", "EZ", "DC", "NC"].includes(
								mod.toUpperCase(),
							)
						)
							return arr;
						return [...arr, mod.toUpperCase()];
					}, [])
					.map((e) => e.toUpperCase());

				document.querySelector("#HD").disabled = false;
				document.querySelector("#HR").disabled = false;
				document.querySelector("#DT").disabled = false;
				document.querySelector("#NC").disabled = false;
				document.querySelector("#EZ").disabled = false;
				document.querySelector("#HT").disabled = false;
				document.querySelector("#DC").disabled = false;

				Game.MODS.HR = mods.includes("HR");
				Game.MODS.DT = mods.includes("NC") ? false : mods.includes("DT");
				Game.MODS.NC = mods.includes("NC");
				Game.MODS.HD = mods.includes("HD");
				Game.MODS.EZ = mods.includes("EZ");
				Game.MODS.HT = mods.includes("DC") ? false : mods.includes("HT");
				Game.MODS.DC = mods.includes("DC");

				const DTMultiplier = !Game.MODS.DT && !Game.MODS.NC ? 1 : 1.5;
				const HTMultiplier = !Game.MODS.HT && !Game.MODS.DC ? 1 : 0.75;

				Game.PLAYBACK_RATE = 1 * DTMultiplier * HTMultiplier;
				Beatmap.updateModdedStats();

				document.querySelector("#HD").checked = Game.MODS.HD;
				document.querySelector("#HR").checked = Game.MODS.HR;
				document.querySelector("#DT").checked = Game.MODS.DT;
				document.querySelector("#NC").checked = Game.MODS.NC;
				document.querySelector("#EZ").checked = Game.MODS.EZ;
				document.querySelector("#HT").checked = Game.MODS.HT;
				document.querySelector("#DC").checked = Game.MODS.DC;

				calculateCurrentSR([
					Game.MODS.HR,
					Game.MODS.EZ,
					Game.MODS.DT || Game.MODS.NC,
					Game.MODS.HT || Game.MODS.DC,
				]);
			}

			Game.appResize();

			const isiOS = getOS() === "iOS";

			if (this.hasOgg && isiOS) {
				new Notification({
					message:
						"This beatmap contains .ogg files, which are not supported on iOS devices.",
					autoTimeout: false,
					type: "warning",
				}).notify();
				this.hasOgg = false;
			}

			if (this.hasVideo && isiOS) {
				new Notification({
					message:
						"This beatmap contains video, which is not supported on iOS devices.",
					autoTimeout: false,
					type: "warning",
				}).notify();
				this.hasVideo = false;
			}

			const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
			if (this.hasNonMp4 && !currentLocalStorage.background.transcodeVideo) {
				new Notification({
					message:
						'Check "Transcode Video" in settings if you have playback issues. (might take longer to load)',
					autoTimeout: false,
					type: "warning",
				}).notify();
				this.hasNonMp4 = false;
			}

			document.onkeydown = (e) => {
				e = e || window.event;
				switch (e.key) {
					case "ArrowLeft":
						// Left pressed
						go(e.shiftKey, false);
						break;
					case "ArrowRight":
						// Right pressed
						go(e.shiftKey, true);
						break;
					case " ":
						if (
							document.querySelector(".difficultySelector").style.display !==
								"block" &&
							document.activeElement !== document.querySelector("#jumpToTime")
						)
							playToggle();
						break;
				}

				if (e.key === "c" && e.ctrlKey) {
					// console.log("Copied");
					if (Game.SELECTED.length) {
						const objs =
							this.beatmapRenderData.objectsController.objectsList.filter((o) =>
								Game.SELECTED.includes(o.obj.time),
							);
						const obj = objs.reduce((prev, curr) =>
							prev.obj.time > curr.obj.time ? curr : prev,
						);
						const currentMiliseconds = Math.floor(obj.obj.time % 1000)
							.toString()
							.padStart(3, "0");
						const currentSeconds = Math.floor((obj.obj.time / 1000) % 60)
							.toString()
							.padStart(2, "0");
						const currentMinute = Math.floor(obj.obj.time / 1000 / 60)
							.toString()
							.padStart(2, "0");

						navigator.clipboard.writeText(
							`${currentMinute}:${currentSeconds}:${currentMiliseconds} (${objs.map((o) => o.obj.comboIdx).join(",")}) - `,
						);

						new Notification({
							message: "Object(s) timestamp copied",
						}).notify();
					}
				}

				if (e.key === "a" && e.ctrlKey) {
					if (document.activeElement === document.querySelector("#jumpToTime"))
						return;
					if (document.activeElement === document.querySelector("#mapInput"))
						return;
					e.preventDefault();
					Game.SELECTED = this.beatmapRenderData.objectsController.objectsList
						.filter((o) => !(o.obj instanceof Spinner))
						.map((o) => o.obj.time);
				}

				if (e.key === "Escape") {
					if (document.querySelector(".seekTo").open) closePopup();

					if (document.querySelector("#settingsPanel").style.opacity === "1") {
						openMenu();
						return;
					}

					if (Game.SHOW_METADATA) {
						toggleMetadataPanel();
						return;
					}

					if (Game.SHOW_TIMING_PANEL) {
						toggleTimingPanel();
						return;
					}

					Game.SELECTED = [];
				}
			};

			if (
				urlParams.get("b") === Beatmap.CURRENT_MAPID &&
				urlParams.get("t") &&
				/[0-9]+/g.test(urlParams.get("t"))
			) {
				Game.BEATMAP_FILE?.audioNode?.seekTo(parseInt(urlParams.get("t")));
				// updateTime(parseInt(urlParams.get("t")));
				// this.beatmapRenderData.objectsController.draw(parseInt(urlParams.get("t")), true);
			} else {
				// this.beatmapRenderData.objectsController.draw(this.audioNode.getCurrentTime(), true);
			}

			// Game.APP.ticker.add(this.beatmapRenderData.objectsController.render);

			// document.querySelector(".timelineContainer").addEventListener("wheel", scrollEventHandler, {
			//     capture: true,
			//     passive: false,
			// });

			this.isLoaded = true;
			// (new Notification(`Finished map setup`)).notify();
		} catch (err) {
			// alert(err);
			new Notification({
				message: err,
				autoTimeout: false,
				type: "error",
			}).notify();
			console.error(err);

			document.querySelector(".loading").style.opacity = 0;
			document.querySelector(".loading").style.display = "none";

			Game.BEATMAP_FILE = undefined;
		}
	}
}
