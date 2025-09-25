import ConfigSection from "./ConfigSection";

export type GameplayProps = {
	showGrid?: boolean;
};

export default class GameplayConfig extends ConfigSection {
	constructor(defaultOptions?: GameplayProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const { showGrid } = defaultOptions;
		this.showGrid = showGrid ?? true;
	}

	private _showGrid = true;
	get showGrid() {
		return this._showGrid;
	}
	set showGrid(val: boolean) {
		this._showGrid = val;

		const ele = document.querySelector<HTMLInputElement>("#grid");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("showGrid", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#grid")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.showGrid = value;
			});
	}

	jsonify(): GameplayProps {
		return {
			showGrid: this.showGrid,
		};
	}
}
