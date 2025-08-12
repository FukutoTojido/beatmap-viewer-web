import ConfigSection from "./ConfigSection";

export type SkinningProps = {
	skinningIdx?: number;
	disableBeatmapSkin?: boolean;
};

export default class SkinningConfig extends ConfigSection {
	constructor(defaultOptions?: SkinningProps) {
		super();

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
        this.emitChange("disableBeatmapSkin", val);
    }
}
