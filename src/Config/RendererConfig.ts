import ConfigSection from "./ConfigSection";

export type RENDERER = "WEBGL2" | "WEBGPU" | "AUTO";
type RendererConfigEvents = "renderer" | "resolution" | "antialiasing";

export type RendererProps = {
	renderer?: RENDERER;
	resolution?: number;
	antialiasing?: boolean;
};

export default class RendererConfig extends ConfigSection {
	constructor(defaultOptions?: RendererProps) {
		super();
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
		this._antialiasing = val;
		this.emitChange("antialiasing", val);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected emitChange(key: RendererConfigEvents, newValue: any): void {
		super.emitChange(key, newValue);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onChange(key: RendererConfigEvents, callback: (newValue: any) => void): void {
		super.onChange(key, callback);
	}

	jsonify(): RendererProps {
		return {
			renderer: this.renderer,
			resolution: this.resolution,
			antialiasing: this.antialiasing,
		};
	}
}
