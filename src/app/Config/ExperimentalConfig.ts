import ConfigSection from "./ConfigSection";

export type ExperimentalProps = {
	asyncLoading?: boolean;
	overlapGameplays?: boolean;
	hidden?: boolean;
	hardRock?: boolean;
	doubleTime?: boolean;
};

export default class ExperimentalConfig extends ConfigSection {
	constructor(defaultOptions?: ExperimentalProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const { asyncLoading, overlapGameplays, hidden, hardRock, doubleTime } =
			defaultOptions;
		this.asyncLoading = asyncLoading ?? true;
		this.overlapGameplays = overlapGameplays ?? false;
		this.hidden =
			hidden ??
			new URLSearchParams(window.location.search).get("m")?.includes("HD") ??
			false;
		this.hardRock =
			hardRock ??
			new URLSearchParams(window.location.search).get("m")?.includes("HR") ??
			false;
		this.doubleTime =
			doubleTime ??
			new URLSearchParams(window.location.search).get("m")?.includes("DT") ??
			false;
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

	private _hardRock = true;
	get hardRock() {
		return this._hardRock;
	}
	set hardRock(val: boolean) {
		this._hardRock = val;

		const ele = document.querySelector<HTMLInputElement>("#modsHR");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("mods", {
			shouldRecalculate: true,
			shouldPlaybackChange: false,
			mods: this.getModsString(),
		});
	}

	private _doubleTime = true;
	get doubleTime() {
		return this._doubleTime;
	}
	set doubleTime(val: boolean) {
		this._doubleTime = val;

		const ele = document.querySelector<HTMLInputElement>("#modsDT");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("mods", {
			shouldRecalculate: false,
			shouldPlaybackChange: true,
			mods: this.getModsString(),
		});
	}

	private _hidden = true;
	get hidden() {
		return this._hidden;
	}
	set hidden(val: boolean) {
		this._hidden = val;

		const ele = document.querySelector<HTMLInputElement>("#modsHD");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("mods", {
			shouldRecalculate: false,
			shouldPlaybackChange: false,
			mods: this.getModsString(),
		});
	}

	getModsString() {
		const HD = this.hidden ? "HD" : "";
		const HR = this.hardRock ? "HR" : "";
		const DT = this.doubleTime ? "DT" : "";

		return `${HD}${HR}${DT}`;
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#overlapGameplays")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.overlapGameplays = value;
			});
		document
			.querySelector<HTMLInputElement>("#modsHD")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.hidden = value;
			});
		document
			.querySelector<HTMLInputElement>("#modsHR")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.hardRock = value;
			});
		document
			.querySelector<HTMLInputElement>("#modsDT")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.doubleTime = value;
			});
	}

	jsonify(): ExperimentalProps {
		return {
			asyncLoading: this.asyncLoading,
			overlapGameplays: this.overlapGameplays,
		};
	}
}
