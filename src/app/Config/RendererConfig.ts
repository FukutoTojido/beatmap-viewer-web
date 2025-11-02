import ConfigSection from "./ConfigSection";

export type RENDERER = "webgl" | "webgpu";
export type RendererProps = {
	renderer?: RENDERER;
	resolution?: number;
	antialiasing?: boolean;
};

enum RENDERER_VAL {
	"webgl" = "WebGL",
	"webgpu" = "WebGPU"
}

export default class RendererConfig extends ConfigSection {
	constructor(defaultOptions?: RendererProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const { renderer, resolution, antialiasing } = defaultOptions;
		this.renderer =
			(renderer as string) === "WEBGL2" ? "webgl" : (renderer ?? "webgl");
		this.resolution = resolution ?? 1;
		this.antialiasing = antialiasing ?? true;
	}

	private _renderer: RENDERER = "webgl";
	get renderer() {
		return this._renderer;
	}
	set renderer(val: RENDERER) {
		this._renderer = val;

		const ele = document.querySelector<HTMLSpanElement>("#currentRenderer");
		if (!ele) return;
		ele.innerText = RENDERER_VAL[val];

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

		for (const ele of document.querySelectorAll<HTMLButtonElement>(
			".renderer-select",
		)) {
			ele.addEventListener("click", (event) => {
				const value =
					((event.target as HTMLButtonElement)?.dataset.renderer as RENDERER) ??
					"webgl";
				this.renderer = value;
			});
		}
	}

	jsonify(): RendererProps {
		return {
			renderer: this.renderer,
			resolution: this.resolution,
			antialiasing: this.antialiasing,
		};
	}
}
