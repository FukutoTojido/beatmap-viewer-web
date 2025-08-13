import {
	StandardBeatmap,
	type StandardHitObject,
	type Circle,
	type Slider,
	type SliderRepeat,
} from "osu-standard-stable";
import type { HitSample as Sample, SamplePoint } from "osu-classes";
import { Container, Graphics, Sprite } from "pixi.js";
import DrawableHitObject from "./DrawableHitObject";
import type { Context } from "../../../Context";
import type DrawableApproachCircle from "./DrawableApproachCircle";
import HitSample from "../../../Audio/HitSample";
import type Beatmap from "..";
import DrawableSliderHead from "./DrawableSliderHead";
import { update as argonUpdate } from "@/Skinning/Argon/ArgonReverseArrow";
import { update as legacyUpdate } from "@/Skinning/Legacy/LegacyReverseArrow";
import type Skin from "@/Skinning/Skin";
import { BLANK_TEXTURE } from "@/Skinning/Skin";
import DrawableSliderTail from "./DrawableSliderTail";

export default class DrawableSliderRepeat extends DrawableSliderTail {
	reverseArrow = new Sprite({
		anchor: 0.5,
	});

	ringPiece = new Sprite({
		anchor: 0.5
	})

	rotation!: number;

	arrowContainer = new Container();

	constructor(
		public object: SliderRepeat,
		parent: Slider,
		samples: Sample[],
	) {
		super(object, parent, samples);

		this.arrowContainer.interactive = false;
		this.arrowContainer.interactiveChildren = false;

		this.arrowContainer.addChild(this.reverseArrow, this.ringPiece);

		this.container.addChild(this.arrowContainer);
		this.refreshSprite();
		this.updateRotation();
	}

	arrowUpdateFn = legacyUpdate;

	refreshSprite(): void {
		super.refreshSprite();

		if (!this.reverseArrow) return;

		const skin = this.skinManager?.getCurrentSkin();
		if (!skin) return;

		this.arrowUpdateFn = skin?.config.General.Argon ? argonUpdate : legacyUpdate;

		const reverseArrow = skin.getTexture(
			"reversearrow",
			this.context.consume<Skin>("beatmapSkin"),
		);
		if (reverseArrow) this.reverseArrow.texture = reverseArrow;

		const ringPiece = skin.getTexture(
			"repeat-edge-piece",
			this.context.consume<Skin>("beatmapSkin"),
		);
		if (ringPiece) this.ringPiece.texture = skin?.config.General.Argon ? ringPiece : BLANK_TEXTURE;
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
		this.arrowContainer.rotation = rotation;
	}

	update(time: number) {
		super.update(time);
		this.arrowUpdateFn(this, time);
	}
}
