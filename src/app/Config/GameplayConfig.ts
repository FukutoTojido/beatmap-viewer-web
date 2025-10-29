import ConfigSection from "./ConfigSection";

export type GameplayProps = {
	showGrid?: boolean;
	hitAnimation?: boolean;
	snakeInSlider?: boolean;
	snakeOutSlider?: boolean;
};

export default class GameplayConfig extends ConfigSection {
	constructor(defaultOptions?: GameplayProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const { showGrid, hitAnimation, snakeInSlider, snakeOutSlider } =
			defaultOptions;
		this.showGrid = showGrid ?? true;
		this.hitAnimation = hitAnimation ?? true;
		this.snakeInSlider = snakeInSlider ?? true;
		this.snakeOutSlider = snakeOutSlider ?? true;
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

	private _hitAnimation = true;
	get hitAnimation() {
		return this._hitAnimation;
	}
	set hitAnimation(val: boolean) {
		this._hitAnimation = val;

		const ele = document.querySelector<HTMLInputElement>("#hitAnim");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("hitAnimation", val);
	}

	private _snakeInSlider = true;
	get snakeInSlider() {
		return this._snakeInSlider;
	}
	set snakeInSlider(val: boolean) {
		this._snakeInSlider = val;

		const ele = document.querySelector<HTMLInputElement>("#snakeIn");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("snakeIn", val);
	}

	private _snakeOutSlider = true;
	get snakeOutSlider() {
		return this._snakeOutSlider;
	}
	set snakeOutSlider(val: boolean) {
		this._snakeOutSlider = val;

		const ele = document.querySelector<HTMLInputElement>("#snakeOut");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("snakeOut", val);
	}

	loadEventListeners() {
		document
			.querySelector<HTMLInputElement>("#grid")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.showGrid = value;
			});

		document
			.querySelector<HTMLInputElement>("#hitAnim")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.hitAnimation = value;
			});

		document
			.querySelector<HTMLInputElement>("#snakeIn")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.snakeInSlider = value;
			});

		document
			.querySelector<HTMLInputElement>("#snakeOut")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.snakeOutSlider = value;
			});
	}

	jsonify(): GameplayProps {
		return {
			showGrid: this.showGrid,
			hitAnimation: this.hitAnimation,
			snakeInSlider: this.snakeInSlider,
			snakeOutSlider: this.snakeOutSlider,
		};
	}
}
