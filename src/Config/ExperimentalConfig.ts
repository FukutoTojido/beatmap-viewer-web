import ConfigSection from "./ConfigSection";

export type ExperimentalProps = {
	asyncLoading: boolean;
};

export default class ExperimentalConfig extends ConfigSection {
	constructor(defaultOptions?: ExperimentalProps) {
		super();

        this.loadEventListeners();

		if (!defaultOptions) return;

		const { asyncLoading } = defaultOptions;
		this.asyncLoading = asyncLoading;
	}

	private _asyncLoading = true;
	get asyncLoading() {
		return this._asyncLoading;
	}
	set asyncLoading(val: boolean) {
		this._asyncLoading = val;
        
		const ele = document.querySelector<HTMLInputElement>("#asyncLoading");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("asyncLoading", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#asyncLoading")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.asyncLoading = value;
			});
	}

    jsonify(): ExperimentalProps {
        return {
            asyncLoading: this.asyncLoading
        }
    }
}
