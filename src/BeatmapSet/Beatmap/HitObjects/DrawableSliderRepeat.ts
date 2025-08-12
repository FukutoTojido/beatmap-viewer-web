import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type Slider,
	type SliderRepeat,
} from "osu-standard-stable";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import { Graphics, Sprite } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "../../../Context";
import type DrawableApproachCircle from "./DrawableApproachCircle";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableSliderHead from "./DrawableSliderHead";
import { update } from "@/Skinning/Legacy/LegacyReverseArrow";
import type Skin from "@/Skinning/Skin";

export default class DrawableSliderRepeat extends DrawableSliderHead {
	reverseArrow = new Sprite({
		anchor: 0.5,
	});

	rotation!: number

	constructor(
		public object: SliderRepeat,
		parent: Slider,
		samples: Sample[],
	) {
		super(object, parent, samples, false);

		this.reverseArrow.interactive = false;
		this.reverseArrow.interactiveChildren = false;

		this.container.addChild(this.reverseArrow);
		this.refreshSprite();
		this.updateRotation();
	}

	refreshSprite(): void {
		super.refreshSprite();

		if (!this.reverseArrow) return;

		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;
		const reverseArrow = skin.getTexture("reversearrow", this.context.consume<Skin>("beatmapSkin"));
		if (reverseArrow) this.reverseArrow.texture = reverseArrow;
	}

	updateRotation() {
		const isAtEnd = this.object.repeatIndex % 2 === 0;

		const first = isAtEnd ? this.parent.path.calculatedPath.length - 1 : 0;
		let next = first;

		while (
			this.parent.path.calculatedPath[first].distance(
				this.parent.path.calculatedPath[next],
			) < 0.01
		) {
			if (isAtEnd) {
				next--;
				continue;
			}

			next++;
		}

		const startVec = this.parent.path.calculatedPath[first];
		const endVec = this.parent.path.calculatedPath[next];

		const rotation = Math.atan2(endVec.y - startVec.y, endVec.x - startVec.x);
		this.rotation = rotation;
		this.reverseArrow.rotation = rotation;
	}

	update(time: number) {
		super.update(time);
		update(this, time);
	}
}
