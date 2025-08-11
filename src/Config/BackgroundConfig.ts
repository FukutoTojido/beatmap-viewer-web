import ConfigSection from "./ConfigSection";

export default class BackgroundConfig extends ConfigSection {
	constructor(defaultOptions?: {
		backgroundDim?: number;
		backgroundBlur?: number;
	}) {
		super();
        if (!defaultOptions) return;

		const { backgroundDim, backgroundBlur } = defaultOptions;
		this._backgroundDim = backgroundDim ?? 70;
		this._backgroundBlur = backgroundBlur ?? 0;
	}

	private _backgroundDim = 70;
	get backgroundDim() {
		return this._backgroundDim;
	}

	set backgroundDim(val: number) {
		this._backgroundDim = val;
		this.emitChange("backgroundDim", val);
	}

	private _backgroundBlur = 0;
	get backgroundBlur() {
		return this._backgroundBlur;
	}

	set backgroundBlur(val: number) {
		this._backgroundBlur = val;
		this.emitChange("backgroundDim", val);
	}
}
