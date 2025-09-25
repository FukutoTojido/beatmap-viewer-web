import ConfigSection from "./ConfigSection";

export type FullscreenProps = {
	fullscreen: boolean;
};

export default class FullscreenConfig extends ConfigSection {
	constructor(defaultOptions?: FullscreenProps) {
		super();

		if (!defaultOptions) return;

		const { fullscreen } = defaultOptions;
		this.fullscreen = fullscreen;
	}

	private _fullscreen = false;
	get fullscreen() {
		return this._fullscreen;
	}
	set fullscreen(val: boolean) {
		this._fullscreen = val;
		this.emitChange("fullscreen", val);
	}

	jsonify() {
		return {};
	}
}
