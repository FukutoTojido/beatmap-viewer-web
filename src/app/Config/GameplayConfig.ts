import ConfigSection from "./ConfigSection";

export type GameplayProps = {
	showGrid?: boolean;
	hitAnimation?: boolean;
	snakeInSlider?: boolean;
	snakeOutSlider?: boolean;
	tintSliderBall?: boolean;
	scrollSpeed?: number;
};

export default class GameplayConfig extends ConfigSection {
	constructor(defaultOptions?: GameplayProps) {
		super();

		this.loadEventListeners();

		if (!defaultOptions) return;

		const {
			showGrid,
			hitAnimation,
			snakeInSlider,
			snakeOutSlider,
			tintSliderBall,
			scrollSpeed,
		} = defaultOptions;
		this.showGrid = showGrid ?? true;
		this.hitAnimation = hitAnimation ?? true;
		this.snakeInSlider = snakeInSlider ?? true;
		this.snakeOutSlider = snakeOutSlider ?? true;
		this.tintSliderBall = tintSliderBall ?? false;
		this.scrollSpeed = scrollSpeed ?? 25;
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

	private _tintSliderBall = false;
	get tintSliderBall() {
		return this._tintSliderBall;
	}
	set tintSliderBall(val: boolean) {
		this._tintSliderBall = val;

		const ele = document.querySelector<HTMLInputElement>("#tintSliderBall");
		if (!ele) return;
		ele.checked = val;

		this.emitChange("tintSliderBall", val);
	}

	private _scrollSpeed = 1;
	get scrollSpeed() {
		return this._scrollSpeed;
	}
	set scrollSpeed(val: number) {
		this._scrollSpeed = val;

		const label = document.querySelector<HTMLLabelElement>(
			"label[for=scrollSpeed]",
		);
		if (!label) return;
		label.textContent = `${val}`;

		const ele = document.querySelector<HTMLInputElement>("#scrollSpeed");
		if (ele) {
			ele.value = `${val}`;
			ele.dataset.modified = val !== 25 ? "true" : "false";
		}

		this.emitChange("scrollSpeed", val);
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

		document
			.querySelector<HTMLInputElement>("#tintSliderBall")
			?.addEventListener("change", (event) => {
				const value = (event.target as HTMLInputElement)?.checked ?? true;
				this.tintSliderBall = value;
			});
		
		document
			.querySelector<HTMLInputElement>("#scrollSpeed")
			?.addEventListener("input", (event) => {
				const value = +((event.target as HTMLInputElement)?.value ?? 1);
				this.scrollSpeed = value;
			});
		
		document
			.querySelector<HTMLInputElement>("button.reset[data-for=scrollSpeed]")
			?.addEventListener("click", () => {
				this.scrollSpeed = 25;
			});
	}

	jsonify(): GameplayProps {
		return {
			showGrid: this.showGrid,
			hitAnimation: this.hitAnimation,
			snakeInSlider: this.snakeInSlider,
			snakeOutSlider: this.snakeOutSlider,
			tintSliderBall: this.tintSliderBall,
			scrollSpeed: this.scrollSpeed,
		};
	}
}
