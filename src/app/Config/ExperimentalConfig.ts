import ConfigSection from "./ConfigSection";

export type ExperimentalProps = {
	asyncLoading?: boolean;
	overlapGameplays?: boolean;
	hidden?: boolean;
	hardRock?: boolean;
	doubleTime?: boolean;
	easy?: boolean;
};

export default class ExperimentalConfig extends ConfigSection {
	constructor(defaultOptions?: ExperimentalProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const {
			asyncLoading,
			overlapGameplays,
			hidden,
			hardRock,
			doubleTime,
			easy,
		} = defaultOptions;
		this.asyncLoading = asyncLoading ?? true;
		this.overlapGameplays = overlapGameplays ?? false;

		const searchParams = new URLSearchParams(window.location.search).get("m");

		this.hidden = hidden ?? searchParams?.includes("HD") ?? false;
		this.hardRock = hardRock ?? searchParams?.includes("HR") ?? false;
		this.doubleTime = doubleTime ?? searchParams?.includes("DT") ?? false;
		this.easy = easy ?? searchParams?.includes("EZ") ?? false;
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
		
		const EZ = document.querySelector<HTMLInputElement>("#modsEZ");
		if (!EZ) return;
		EZ.checked = false;
		this._easy = false;

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

	private _easy = true;
	get easy() {
		return this._easy;
	}
	set easy(val: boolean) {
		this._easy = val;

		const ele = document.querySelector<HTMLInputElement>("#modsEZ");
		if (!ele) return;
		ele.checked = val;

		const HR = document.querySelector<HTMLInputElement>("#modsHR");
		if (!HR) return;
		HR.checked = false;
		this._hardRock = false;

		this.emitChange("mods", {
			shouldRecalculate: true,
			shouldPlaybackChange: false,
			mods: this.getModsString(),
		});
	}

	getModsString() {
		const HD = this.hidden ? "HD" : "";
		const HR = this.hardRock ? "HR" : "";
		const DT = this.doubleTime ? "DT" : "";
		const EZ = this.easy ? "EZ" : "";

		return `${HD}${HR}${DT}${EZ}`;
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
		document
			.querySelector<HTMLInputElement>("#modsEZ")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.easy = value;
			});
	}

	jsonify(): ExperimentalProps {
		return {
			asyncLoading: this.asyncLoading,
			overlapGameplays: this.overlapGameplays,
		};
	}
}
