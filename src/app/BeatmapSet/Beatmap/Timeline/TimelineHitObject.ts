import type TimelineConfig from "@/Config/TimelineConfig";
import { inject } from "@/Context";
import type Timeline from "@/UI/main/viewer/Timeline";
import { DEFAULT_SCALE } from "@/UI/main/viewer/Timeline";
import type { Circle, StandardHitObject } from "osu-standard-stable";
import { Container } from "pixi.js";
import SkinnableElement from "../HitObjects/SkinnableElement";

export default abstract class TimelineHitObject extends SkinnableElement {
	container: Container = new Container({
		visible: false,
	});
	constructor(public object: StandardHitObject) {
		super();

		const scale = inject<TimelineConfig>("config/timeline")?.scale ?? 1;

		this.container.x = this.object.startTime / (DEFAULT_SCALE / scale);
		this.container.y = 40;

		inject<TimelineConfig>("config/timeline")?.onChange("scale", (newValue) => {
			this.container.x = this.object.startTime / (DEFAULT_SCALE / newValue);
		});
	}

	abstract getTimeRange(): { start: number; end: number };
	abstract refreshSprite(): void;

	destroy() {
		if (this.skinEventCallback)
			this.skinManager?.removeSkinChangeListener(this.skinEventCallback);
	}
}
