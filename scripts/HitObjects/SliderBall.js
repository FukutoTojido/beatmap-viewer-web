import { Game } from "../Game.js";
import { Texture } from "../Texture.js";
import { Beatmap } from "../Beatmap.js";
import { Clamp, easeOutQuint, easeOutSine } from "../Utils.js";
import { Skinning } from "../Skinning.js";
import * as PIXI from "pixi.js";
import vertex from "../Shaders/SliderBall/SliderBall.vert?raw";
import fragment from "../Shaders/SliderBall/SliderBall.frag?raw";
import gpu from "../Shaders/SliderBall/SliderBall.wgsl?raw";

export class SliderBall {
	baseSlider;

	obj;
	arrow;
	ring;
	bg;
	followCircle;
	sliderB;

	constructor(baseSlider) {
		this.baseSlider = baseSlider;
		this.obj = new PIXI.Container();

		const sliderFollowCircle = new PIXI.Sprite(
			Texture.ARGON.SLIDER_FOLLOW_CIRCLE.texture,
		);
		const sprite = new PIXI.Sprite(Texture.ARGON.SLIDER_B.arrow.texture);
		const outerRing = new PIXI.Sprite(Texture.ARGON.SLIDER_B.ring.texture);
		const bgMask = new PIXI.Graphics().circle(0, 0, 59).fill(0xffffff);
		const bgSprite = new PIXI.Sprite(Texture.ARGON.SLIDER_B.gradient.texture);
		bgSprite.mask = bgMask;

		const defaultBallGeometry = new PIXI.Geometry({
			attributes: {
				aPosition: new Float32Array([
					-59, -59, 59, -59, -59, 59, -59, 59, 59, -59, 59, 59,
				]),
				aUV: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
			},
		});

		const defaultBallShader = PIXI.Shader.from({
			gl: {
				vertex,
				fragment,
			},
			gpu: {
				vertex: {
					source: gpu,
					entryPoint: "vsMain",
				},
				fragment: {
					source: gpu,
					entryPoint: "fsMain",
				},
			},
			resources: {
				customUniforms: {
					t: { value: 0, type: "f32" },
					a: { value: 0, type: "f32" },
					color: { value: [1.0, 1.0, 1.0, 1.0], type: "vec4<f32>" },
				},
			},
		});

		const defaultBall = new PIXI.Mesh({
			geometry: defaultBallGeometry,
			shader: defaultBallShader,
		});

		const defaultSpec = new PIXI.Sprite({
			texture: Texture.BALL_SPEC.texture,
			blendMode: "add",
		});

		const defaultNd = new PIXI.Sprite({
			texture: Texture.BALL_ND.texture,
			blendMode: "multiply",
		});

		defaultSpec.anchor.set(0.5);
		// defaultSpec.scale.set(0.5);
		defaultNd.anchor.set(0.5);
		// defaultNd.scale.set(0.5);

		const defaultContainer = new PIXI.Container();
		defaultContainer.addChild(defaultBall);
		defaultContainer.addChild(defaultNd);
		defaultContainer.addChild(defaultSpec);

		sliderFollowCircle.anchor.set(0.5);
		sprite.anchor.set(0.5);
		outerRing.anchor.set(0.5);
		bgSprite.anchor.set(0.5);

		outerRing.scale.set(Texture.ARGON.SLIDER_B.ring.isHD ? 0.5 : 1);

		const sliderB = new PIXI.Container();
		sliderB.addChild(bgMask);
		sliderB.addChild(bgSprite);
		sliderB.addChild(sprite);
		sliderB.addChild(outerRing);
		sliderB.addChild(defaultContainer);

		this.obj.addChild(sliderFollowCircle);
		this.obj.addChild(sliderB);

		this.arrow = sprite;
		this.ring = outerRing;
		this.bg = bgSprite;
		this.followCircle = sliderFollowCircle;
		this.sliderB = sliderB;
		this.shader = defaultBallShader;
		this.defaultContainer = defaultContainer;
		this.defaultB = defaultBall;
	}

	draw(timestamp) {
		const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];
		const textures =
			skinType !== "CUSTOM"
				? Texture[skinType]
				: Texture.CUSTOM[Skinning.SKIN_IDX];

		const circleBaseScale =
			(Beatmap.moddedStats.radius / 54.4) * (skinType === "ARGON" ? 0.95 : 1);
		const sliderFollowSkinScale = textures.SLIDER_FOLLOW_CIRCLE.isHD
			? 0.25
			: 0.5;

		this.followCircle.texture = textures.SLIDER_FOLLOW_CIRCLE.texture;
		this.arrow.texture = textures.SLIDER_B.arrow.texture;
		this.ring.texture = textures.SLIDER_B.ring.texture;
		this.bg.texture = textures.SLIDER_B.gradient.texture;

		this.followCircle.scale.set(sliderFollowSkinScale);
		this.ring.scale.set(textures.SLIDER_B.ring.isHD ? 0.5 : 1);

		this.obj.alpha = 1;
		this.sliderB.alpha = 1;
		this.shader.resources.customUniforms.uniforms.a = 1.0;
		this.followCircle.alpha = 1;
		this.followCircle.scale.set(2.4 * sliderFollowSkinScale);

		if (
			timestamp < this.baseSlider.time ||
			timestamp >= this.baseSlider.endTime + 200
		)
			this.obj.alpha = 0;
		if (
			timestamp >= this.baseSlider.time &&
			timestamp < this.baseSlider.time + 300
		) {
			const alphaB = Clamp(
				(timestamp - this.baseSlider.time) /
					Math.min(200, this.baseSlider.sliderTime),
				0,
				1,
			);
			const alphaF = Clamp(
				(timestamp - this.baseSlider.time) /
					Math.min(180, this.baseSlider.sliderTime),
				0,
				1,
			);

			this.sliderB.alpha = easeOutQuint(alphaB);
			this.shader.resources.customUniforms.uniforms.a = easeOutQuint(alphaB);
			this.followCircle.alpha = easeOutQuint(alphaF);
			this.followCircle.scale.set(
				(1.5 + easeOutSine(alphaF) * 0.9) * sliderFollowSkinScale,
			);
		}

		this.arrow.scale.set(0.7, 0.8);

		let point =
			this.baseSlider.getPointAtTime(timestamp) ??
			this.baseSlider.realTrackPoints.at(-1);

		// if (this.baseSlider.time === 2031) {
		// 	console.log(point.angle)
		// }

		if (timestamp < this.baseSlider.time)
			point = this.baseSlider.realTrackPoints.at(0);

		this.arrow.angle = !Game.MODS.HR ? point.angle : -point.angle;
		this.defaultB.angle = !Game.MODS.HR ? point.angle : -point.angle;

		const currentStackOffset = Beatmap.moddedStats.stackOffset;

		let { x, y } = point;
		if (Game.MODS.HR) y = 384 - y;

		this.obj.scale.set(circleBaseScale * Game.SCALE_RATE * (236 / 256) ** 2);

		this.obj.x =
			(x + this.baseSlider.stackHeight * currentStackOffset) *
			(Game.WIDTH / 512);
		this.obj.y =
			(y + this.baseSlider.stackHeight * currentStackOffset) *
			(Game.WIDTH / 512);

		const colors = Game.SLIDER_APPEARANCE.ignoreSkin
			? Skinning.DEFAULT_COLORS
			: Beatmap.COLORS;
		const idx = Game.SLIDER_APPEARANCE.ignoreSkin
			? this.baseSlider.colourIdx
			: this.baseSlider.colourHaxedIdx;

		this.bg.tint = colors[idx % colors.length];
		this.bg.angle = -this.obj.angle;
		this.ring.visible = true;
		this.defaultContainer.visible = false;

		this.followCircle.tint = 0xffffff;
		if (skinType === "ARGON")
			this.followCircle.tint = colors[idx % colors.length];

		if (skinType === "LEGACY") {
			this.ring.visible = false;
			this.defaultContainer.visible = true;
		}

		if (timestamp > this.baseSlider.endTime) {
			const alphaB = Clamp((timestamp - this.baseSlider.endTime) / 100, 0, 1);
			this.sliderB.alpha = 1 - easeOutQuint(alphaB);
			this.shader.resources.customUniforms.uniforms.a =
				1 - easeOutQuint(alphaB);

			const alphaF = Clamp((timestamp - this.baseSlider.endTime) / 100, 0, 1);
			this.followCircle.alpha = 1 - easeOutQuint(alphaF);
			this.followCircle.scale.set(
				(1.0 + easeOutSine(1 - alphaF) * 1.4) * sliderFollowSkinScale,
			);
		}

		const duration = (0.15 / this.baseSlider.velocity) * (100 / 6);
		const t =
			(Math.min(
				timestamp - this.baseSlider.time,
				this.baseSlider.endTime - this.baseSlider.time,
			) %
				duration) /
			duration;

		this.shader.resources.customUniforms.uniforms.t = t;
		this.shader.resources.customUniforms.uniforms.color = [
			((colors[idx % colors.length] & 0xff0000) >> 16) / 255,
			((colors[idx % colors.length] & 0x00ff00) >> 8) / 255,
			(colors[idx % colors.length] & 0x0000ff) / 255,
			1.0,
		];
	}
}
