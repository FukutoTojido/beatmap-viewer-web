import ConfigSection from "./ConfigSection";

export type Mirror = {
	name: string;
	urlTemplate: string;
};
type MirrorConfigEvents = "mirror";

export type MirrorProps = {
	mirror?: Mirror
}

export default class MirrorConfig extends ConfigSection {
	constructor(defaultOptions?: MirrorProps) {
		super();
		if (!defaultOptions) return;

		const { mirror } = defaultOptions;
		this.mirror = mirror ?? {
			name: "Nerinyan",
			urlTemplate: "https://api.nerinyan.moe/d/$setId",
		};
	}

	private _mirror = {
		name: "Nerinyan",
		urlTemplate: "https://api.nerinyan.moe/d/$setId",
	};
	get mirror() {
		return this._mirror;
	}
	set mirror(val: Mirror) {
		this._mirror = val;
		this.emitChange("mirror", val);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected emitChange(key: MirrorConfigEvents, newValue: any): void {
		super.emitChange(key, newValue);
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onChange(key: MirrorConfigEvents, callback: (newValue: any) => void): void {
		super.onChange(key, callback);
	}

	jsonify(): MirrorProps {
		return {
			mirror: this.mirror
		}
	}
}
