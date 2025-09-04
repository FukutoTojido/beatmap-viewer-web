import ConfigSection from "./ConfigSection";

export type Mirror = {
	name: string;
	urlTemplate: string;
};

export type MirrorProps = {
	mirror?: Mirror;
};

export default class MirrorConfig extends ConfigSection {
	constructor(defaultOptions?: MirrorProps) {
		super();

		this.loadEventListeners();

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

		for (const element of document.querySelectorAll<HTMLInputElement>(
			"[name=beatmapMirror]",
		)) {
			element.checked = element.value === val.name;
		}

		this.emitChange("mirror", val);
	}

	loadEventListeners() {
		for (const element of document.querySelectorAll<HTMLInputElement>(
			"[name=beatmapMirror]",
		)) {
			element.addEventListener("change", (event) => {
				const name = (event.target as HTMLInputElement).value;
				const url = (event.target as HTMLInputElement).dataset.url;

				if (!url) return;
				this.mirror = {
					name,
					urlTemplate: url,
				};
			});
		}
	}

	jsonify(): MirrorProps {
		return {
			mirror: this.mirror,
		};
	}
}
