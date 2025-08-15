import ConfigSection from "./ConfigSection";

export type ExperimentalProps = {
	asyncLoading?: boolean;
	overlapGameplays?: boolean;
};

export default class ExperimentalConfig extends ConfigSection {
	constructor(defaultOptions?: ExperimentalProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const { asyncLoading, overlapGameplays } = defaultOptions;
		this.asyncLoading = asyncLoading ?? true;
		this.overlapGameplays = overlapGameplays ?? false;
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

	private _overlapGameplays = true;
	get overlapGameplays() {
		return this._overlapGameplays;
	}
	set overlapGameplays(val: boolean) {
		this._overlapGameplays = val;

		const ele = document.querySelector<HTMLInputElement>("#overlapGameplays");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("overlapGameplays", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#overlapGameplays")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.overlapGameplays = value;
			});
	}

	jsonify(): ExperimentalProps {
		return {
			asyncLoading: this.asyncLoading,
			overlapGameplays: this.overlapGameplays,
		};
	}
}
