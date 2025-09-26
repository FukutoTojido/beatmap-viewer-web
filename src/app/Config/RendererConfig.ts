import ConfigSection from "./ConfigSection";

export type RENDERER = "WEBGL2" | "WEBGPU" | "AUTO";
export type RendererProps = {
	renderer?: RENDERER;
	resolution?: number;
	antialiasing?: boolean;
};

export default class RendererConfig extends ConfigSection {
	constructor(defaultOptions?: RendererProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const { renderer, resolution, antialiasing } = defaultOptions;
		this.renderer = renderer ?? "WEBGL2";
		this.resolution = resolution ?? 1;
		this.antialiasing = antialiasing ?? true;
	}

	private _renderer: RENDERER = "WEBGL2";
	get renderer() {
		return this._renderer;
	}
	set renderer(val: RENDERER) {
		this._renderer = val;
		this.emitChange("renderer", val);
	}

	private _resolution = 1;
	get resolution() {
		return this._resolution;
	}
	set resolution(val: number) {
		this._resolution = val;
		this.emitChange("resolution", val);
	}

	private _antialiasing = true;
	get antialiasing() {
		return this._antialiasing;
	}
	set antialiasing(val: boolean) {
		const ele = document.querySelector<HTMLInputElement>("#antialiasing");
		if (!ele) return;
		ele.checked = val;

		if (this._antialiasing === val) return;
		this._antialiasing = val;
		this.emitChange("antialiasing", val);
	}

	async emitChange(key: keyof RendererProps, newValue: unknown) {
		super.emitChange(key, newValue);
	}

	onChange(key: keyof RendererProps, callback: (newValue: unknown) => void) {
		super.onChange(key, callback);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#antialiasing")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.antialiasing = value;
			});
	}

	jsonify(): RendererProps {
		return {
			renderer: this.renderer,
			resolution: this.resolution,
			antialiasing: this.antialiasing,
		};
	}
}
