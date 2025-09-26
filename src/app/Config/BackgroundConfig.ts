import ConfigSection from "./ConfigSection";

export type BackgroundProps = {
	backgroundDim?: number;
	backgroundBlur?: number;
	video?: boolean;
	storyboard?: boolean;
	breakSection?: boolean;
};

export default class BackgroundConfig extends ConfigSection {
	constructor(defaultOptions?: BackgroundProps) {
		super();
		this.loadEventListeners();

		if (!defaultOptions) return;

		const { backgroundDim, backgroundBlur, video, storyboard, breakSection } =
			defaultOptions;
		this.backgroundDim = backgroundDim ?? 70;
		this.backgroundBlur = backgroundBlur ?? 0;
		this.video = video ?? true;
		this.storyboard = storyboard ?? true;
		this.breakSection = breakSection ?? false;
	}

	private _backgroundDim = 60;
	get backgroundDim() {
		return this._backgroundDim;
	}
	set backgroundDim(val: number) {
		this._backgroundDim = val;

		const label = document.querySelector<HTMLLabelElement>(
			"label[for=backgroundDim]",
		);
		if (!label) return;
		label.textContent = `${val}%`;

		const ele = document.querySelector<HTMLInputElement>("#backgroundDim");
		if (ele) ele.value = `${val}`;

		this.emitChange("backgroundDim", val);
	}

	private _backgroundBlur = 0;
	get backgroundBlur() {
		return this._backgroundBlur;
	}
	set backgroundBlur(val: number) {
		this._backgroundBlur = val;

		const label = document.querySelector<HTMLLabelElement>(
			"label[for=backgroundBlur]",
		);
		if (!label) return;
		label.textContent = `${val}%`;

		const ele = document.querySelector<HTMLInputElement>("#backgroundBlur");
		if (ele) ele.value = `${val}`;

		this.emitChange("backgroundBlur", val);
	}

	private _breakSection = false;
	get breakSection() {
		return this._breakSection;
	}
	set breakSection(val: boolean) {
		if (val === this._breakSection) return;

		this._breakSection = val;
		this.emitChange("breakSection", val);
	}

	private _video = true;
	get video() {
		return this._video;
	}
	set video(val: boolean) {
		this._video = val;

		const ele = document.querySelector<HTMLInputElement>("#video");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("video", val);
	}

	private _storyboard = true;
	get storyboard() {
		return this._storyboard;
	}
	set storyboard(val: boolean) {
		this._storyboard = val;

		const ele = document.querySelector<HTMLInputElement>("#storyboard");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("storyboard", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#backgroundDim")
			?.addEventListener("input", (event) => {
				const value = +((event.target as HTMLInputElement)?.value ?? 60);
				this.backgroundDim = value;
			});

		document
			.querySelector<HTMLInputElement>("#backgroundBlur")
			?.addEventListener("input", (event) => {
				const value = +((event.target as HTMLInputElement)?.value ?? 0);
				this.backgroundBlur = value;
			});

		document
			.querySelector<HTMLInputElement>("#video")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.video = value;
			});

		document
			.querySelector<HTMLInputElement>("#storyboard")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.storyboard = value;
			});
	}

	jsonify(): BackgroundProps {
		return {
			backgroundDim: this.backgroundDim,
			backgroundBlur: this.backgroundBlur,
			video: this.video,
			storyboard: this.storyboard,
		};
	}
}
