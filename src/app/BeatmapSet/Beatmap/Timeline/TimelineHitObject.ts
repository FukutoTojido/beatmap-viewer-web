import type { StandardHitObject } from "osu-standard-stable";
import { Container } from "pixi.js";
import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import { DEFAULT_SCALE } from "@/UI/main/viewer/Timeline";
import SkinnableElement from "../HitObjects/SkinnableElement";

export default abstract class TimelineHitObject extends SkinnableElement {
	container: Container = new Container({
		visible: false,
	});
	abstract select: Container;
	constructor(object: StandardHitObject) {
		super();
		this.object = object;
		this.container.y = 40;

		inject<TimelineConfig>("config/timeline")?.onChange("scale", (newValue) => {
			this.container.x = this.object.startTime / (DEFAULT_SCALE / newValue);
		});
	}

	protected _object!: StandardHitObject;
	get object() {
		return this._object;
	}
	set object(val: StandardHitObject) {
		this._object = val;

		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;
		this.container.x = val.startTime / (DEFAULT_SCALE / scale);
	}

	protected _isSelected = false;
	get isSelected() {
		return this._isSelected;
	}
	set isSelected(val: boolean) {
		this._isSelected = val;
	}

	abstract getTimeRange(): { start: number; end: number };
	abstract refreshSprite(): void;

	destroy() {
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
