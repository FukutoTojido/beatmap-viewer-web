import ConfigSection from "./ConfigSection";

export type SkinningProps = {
	skinningIdx?: number;
	disableBeatmapSkin?: boolean;
	cursorSize?: number;
};

export default class SkinningConfig extends ConfigSection {
	constructor(defaultOptions?: SkinningProps) {
		super();
		this.loadEventListeners();

		if (!defaultOptions) return;

		const { skinningIdx, disableBeatmapSkin, cursorSize } = defaultOptions;
		this.skinningIdx = skinningIdx ?? 0;
		this.disableBeatmapSkin = disableBeatmapSkin ?? false;
		this.cursorSize = cursorSize ?? 1;
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

	private _cursorSize = 1;
	get cursorSize() {
		return this._cursorSize;
	}
	set cursorSize(val: number) {
		this._cursorSize = val;

		const label = document.querySelector<HTMLLabelElement>(
			"label[for=cursorSize]",
		);
		if (!label) return;
		label.textContent = `${val.toFixed(2)}x`;

		const ele = document.querySelector<HTMLInputElement>("#cursorSize");
		if (ele) {
			ele.value = `${val}`;
			ele.dataset.modified = val !== 1 ? "true" : "false";
		}

		this.emitChange("cursorSize", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#disableBeatmapSkin")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.disableBeatmapSkin = value;
			});
		document
			.querySelector<HTMLInputElement>("#cursorSize")
			?.addEventListener("input", (event) => {
				const value = +((event.target as HTMLInputElement)?.value ?? 1);
				this.cursorSize = value;
			});
		document
			.querySelector<HTMLInputElement>("button.reset[data-for=cursorSize]")
			?.addEventListener("click", () => {
				this.cursorSize = 1;
			});
	}

	jsonify(): SkinningProps {
		return {
			skinningIdx: this.skinningIdx,
			disableBeatmapSkin: this.disableBeatmapSkin,
			cursorSize: this.cursorSize,
		};
	}
}
