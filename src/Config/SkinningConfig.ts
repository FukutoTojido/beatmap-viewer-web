import ConfigSection from "./ConfigSection";

export type SkinningProps = {
	skinningIdx?: number;
	disableBeatmapSkin?: boolean;
};

export default class SkinningConfig extends ConfigSection {
	constructor(defaultOptions?: SkinningProps) {
		super();
		this.loadEventListeners();

		if (!defaultOptions) return;

		const { skinningIdx, disableBeatmapSkin } = defaultOptions;
		this.skinningIdx = skinningIdx ?? 0;
		this.disableBeatmapSkin = disableBeatmapSkin ?? false;
	}

	private _skinningIdx = 0;
	get skinningIdx() {
		return this._skinningIdx;
	}
	set skinningIdx(val: number) {
		this._skinningIdx = val;
		this.emitChange("skin", val);
	}

	private _disableBeatmapSkin = false;
	get disableBeatmapSkin() {
		return this._disableBeatmapSkin;
	}
	set disableBeatmapSkin(val: boolean) {
		this._disableBeatmapSkin = val;

		const ele = document.querySelector<HTMLInputElement>("#disableBeatmapSkin");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("disableBeatmapSkin", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#disableBeatmapSkin")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.disableBeatmapSkin = value;
			});
	}

	jsonify(): SkinningProps {
		return {
			skinningIdx: this.skinningIdx,
			disableBeatmapSkin: this.disableBeatmapSkin,
		};
	}
}
