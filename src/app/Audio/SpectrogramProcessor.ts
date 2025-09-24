import { Assets } from "pixi.js";
import WaveSurfer from "wavesurfer.js";
import Spectrogram from "wavesurfer.js/dist/plugins/spectrogram.esm.js";
import { inject } from "@/Context";
import type SpectrogramContainer from "@/UI/sidepanel/Modding/Spectrogram";

export default class SpectrogramProcessor {
	private waveSurfer: WaveSurfer;

	constructor() {
		const waveSurfer = WaveSurfer.create({
			container: "#a",
			sampleRate: 44100,
			width: 400,
		});

		const spectrogram = Spectrogram.create({
			labels: false,
			splitChannels: false,
			scale: "linear",
			frequencyMax: 22050,
			frequencyMin: 0,
			fftSamples: 512,
			gainDB: 0,
			useWebWorker: true,
			maxCanvasWidth: 2000,
			height: 400,
		});

		waveSurfer.registerPlugin(spectrogram);

		spectrogram.on("ready", () => {
			const canvas: HTMLCanvasElement | null | undefined = document
				.querySelector("#a > div")
				?.shadowRoot?.querySelector(".wrapper > div:last-child canvas");

			if (!canvas) return;

			console.log("Spectrogram Ready");

			setTimeout(() => {
				canvas.toBlob(async (blob) => {
					if (!blob) return;

					const url = URL.createObjectURL(blob);
					const texture = await Assets.load({ src: url, parser: "texture" });

					const spectro = inject<SpectrogramContainer>(
						"ui/sidepanel/modding/spectrogram",
					);

					if (!spectro) return;

					spectro.setTexture(texture);
				});
			}, 2000);
		});

		this.waveSurfer = waveSurfer;
	}
	initSpectrogram(url: string) {
		this.waveSurfer.load(url);
	}
}
