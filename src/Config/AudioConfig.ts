import ConfigSection from "./ConfigSection";

export type AudioProps = {
	masterVolume?: number;
	musicVolume?: number;
	effectVolume?: number;
	hitsound?: boolean;
};

export default class AudioConfig extends ConfigSection {
	constructor(defaultOptions?: AudioProps) {
		super();
		this.loadEventListeners();

		if (!defaultOptions) return;

		const { masterVolume, musicVolume, effectVolume, hitsound } =
			defaultOptions;
		this.masterVolume = masterVolume ?? 0.8;
		this.musicVolume = musicVolume ?? 0.5;
		this.effectVolume = effectVolume ?? 0.5;
		this.hitsound = hitsound ?? true;
	}

	private _masterVolume = 0.8;
	get masterVolume() {
		return this._masterVolume;
	}
	set masterVolume(val: number) {
		this._masterVolume = val;

		const label = document.querySelector<HTMLLabelElement>(
			"label[for=masterVolume]",
		);
		if (label) label.textContent = `${Math.round(val * 100)}%`;

		const ele = document.querySelector<HTMLInputElement>("#masterVolume");
		if (ele) ele.value = `${val}`;

		this.emitChange("masterVolume", val);
	}

	private _musicVolume = 0.5;
	get musicVolume() {
		return this._musicVolume;
	}
	set musicVolume(val: number) {
		this._musicVolume = val;

		const label = document.querySelector<HTMLLabelElement>(
			"label[for=musicVolume]",
		);
		if (label) label.textContent = `${Math.round(val * 100)}%`;

		const ele = document.querySelector<HTMLInputElement>("#musicVolume");
		if (ele) ele.value = `${val}`;

		this.emitChange("musicVolume", val);
	}

	private _effectVolume = 0.5;
	get effectVolume() {
		return this._effectVolume;
	}
	set effectVolume(val: number) {
		this._effectVolume = val;

		const label = document.querySelector<HTMLLabelElement>(
			"label[for=effectVolume]",
		);
		if (label) label.textContent = `${Math.round(val * 100)}%`;

		const ele = document.querySelector<HTMLInputElement>("#effectVolume");
		if (ele) ele.value = `${val}`;

		this.emitChange("effectVolume", val);
	}

	private _hitsound = false;
	get hitsound() {
		return this._hitsound;
	}
	set hitsound(val: boolean) {
		this._hitsound = val;

		const ele = document.querySelector<HTMLInputElement>("#hitsound");
		if (ele) ele.checked = val;

		this.emitChange("hitsound", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#masterVolume")
			?.addEventListener("input", (event) => {
				const value = +((event.target as HTMLInputElement)?.value ?? 0.8);
				this.masterVolume = value;
			});

		document
			.querySelector<HTMLInputElement>("#musicVolume")
			?.addEventListener("input", (event) => {
				const value = +((event.target as HTMLInputElement)?.value ?? 0.5);
				this.musicVolume = value;
			});

		document
			.querySelector<HTMLInputElement>("#effectVolume")
			?.addEventListener("input", (event) => {
				const value = +((event.target as HTMLInputElement)?.value ?? 0.5);
				this.effectVolume = value;
			});

		document
			.querySelector<HTMLInputElement>("#hitsound")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.hitsound = value;
			});
	}
	jsonify(): AudioProps {
		return {
			masterVolume: this.masterVolume,
			musicVolume: this.musicVolume,
			effectVolume: this.effectVolume,
			hitsound: this.hitsound,
		};
	}
}
