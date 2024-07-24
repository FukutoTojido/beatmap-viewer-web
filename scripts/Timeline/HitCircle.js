import { Beatmap } from "../Beatmap.js";
import { Texture } from "../Texture.js";
import { Timeline } from "./Timeline.js";
import { TintedNumberSprite } from "./NumberSprite.js";
import { Skinning } from "../Skinning.js";
import { Game } from "../Game.js";
import gpuShader from "../Shaders/Timeline/SliderBody.wgsl?raw";
import glVertexShader from "../Shaders/Timeline/SliderBody.vert?raw";
import glFragmentShader from "../Shaders/Timeline/SliderBody.frag?raw";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as PIXI from "pixi.js";

export class TimelineHitCircle {
    obj;
    hitCircle;
    hitCircleOverlay;
    selected;
    meshHead;
    meshTail;
    theThing;
    numberSprite;
    hitObject;
    isSlider = false;

    cache = {
        tint: null,
        x: null,
        selected: null,
        skinType: null,
        baseHeight: null,
    };

    constructor(hitObject, isSlider = false) {
        this.isSlider = isSlider;
        this.obj = new PIXI.Container();
        // this.obj.interactive = true;
        this.obj.eventMode = "static";
        this.hitObject = hitObject;

        const gpu = PIXI.GpuProgram.from({
            vertex: {
                source: gpuShader,
                entryPoint: "vsMain",
            },
            fragment: {
                source: gpuShader,
                entryPoint: "fsMain",
            },
        });
        gpu.autoAssignGlobalUniforms = true;
        gpu.autoAssignLocalUniforms = true;

        const gl = PIXI.GlProgram.from({
            name: "timeline-shader",
            vertex: glVertexShader,
            fragment: glFragmentShader,
        });

        const shader = PIXI.Shader.from({
            gl,
            gpu,
            resources: {
                customUniforms: {
                    tint: {
                        value: [0.0, 0.0, 0.0, 1.0],
                        type: "vec4<f32>",
                    },
                    selected: {
                        value: 0,
                        type: "f32",
                    },
                    skinType: {
                        value: Game.SKINNING.type,
                        type: "f32",
                    },
                    isReverse: {
                        value: 0,
                        type: "f32",
                    },
                    nodeTint: {
                        value: [0.0, 0.0, 0.0, 1.0],
                        type: "vec4<f32>",
                    },
                },
            },
        });

        const headGeometry = TimelineHitCircle.createArc(-1, 30.0 * (118 / 128));
        const tailGeometry = TimelineHitCircle.createArc(1, 30.0 * (118 / 128));

        const meshHead = new PIXI.Mesh({ geometry: headGeometry, shader: shader });
        const meshTail = new PIXI.Mesh({ geometry: tailGeometry, shader: shader });

        this.meshHead = meshHead;
        this.meshTail = meshTail;

        this.theThing = new PIXI.Container();
        this.theThing.addChild(meshHead, meshTail);

        const hitCircle = new PIXI.Sprite(Texture.LEGACY.HIT_CIRCLE.texture);
        const hitCircleOverlay = new PIXI.Sprite(Texture.LEGACY.HIT_CIRCLE_OVERLAY.texture);
        const selected = new PIXI.Sprite(Texture.SELECTED.texture);
        const numberSprite = new TintedNumberSprite(hitObject);

        hitCircle.anchor.set(0.5, 0.5);

        hitCircleOverlay.anchor.set(0.5, 0.5);

        selected.anchor.set(0.5, 0.5);
        selected.scale.set(0.5);

        this.hitCircle = hitCircle;
        this.hitCircle.tint = 0xffffff;

        this.hitCircleOverlay = hitCircleOverlay;
        this.selected = selected;

        this.numberSprite = numberSprite;

        this.obj.addChild(this.theThing);
        this.obj.addChild(hitCircle);
        this.obj.addChild(hitCircleOverlay);
        this.obj.addChild(numberSprite.obj);
        this.obj.addChild(selected);

        this.obj.scale.set(Timeline.HEIGHT / 1.5 / this.hitCircle.height);
        this.obj.x = 0;
        this.obj.y = Timeline.HEIGHT / 2;

        const handleClickEvent = (e) => {
            const { x, y } = this.obj.toLocal(e.global);
            if (Game.SELECTED.includes(this.hitObject.time)) return;
            if (Math.abs(x) > Timeline.HEIGHT) return;

            if (!e.ctrlKey) Game.SELECTED = [];
            if (!Game.SELECTED.includes(this.hitObject.time)) Game.SELECTED.push(this.hitObject.time);
            Timeline.hitArea.isObjectSelecting = true;
        };

        // this.obj.visible = false;

        this.obj.on("mousedown", handleClickEvent);
        this.obj.on("touchstart", handleClickEvent);
    }

    addSelfToContainer(container) {
        container.addChild(this.obj);
    }

    removeSelfFromContainer(container) {
        container.removeChild(this.obj);
    }

    static createArc(side, radius, length) {
        side /= Math.abs(side);

        const indices = [];
        const dist = [];

        const center = [0.0, 0.0];
        const RESOLUTION = 400;

        for (let i = 0; i < RESOLUTION; i++) {
            const angle = (i / RESOLUTION) * Math.PI * side;
            const angleNext = ((i + 1) / RESOLUTION) * Math.PI * side;
            indices.push(...center, radius * Math.sin(angle), radius * Math.cos(angle), radius * Math.sin(angleNext), radius * Math.cos(angleNext));
            dist.push(0.0, 1.0, 1.0);
        }

        const geometry = new PIXI.Geometry({
            attributes: {
                position: indices,
                dist: dist,
            },
        });
        return geometry;
    }

    updatePosition(timestamp) {
        const time = this.hitObject.time;
        const delta = timestamp - time;

        const center = Timeline.WIDTH / 2;
        const x = center - (delta / 500) * Timeline.ZOOM_DISTANCE;

        if (x === this.cache.x) return;

        this.cache.x = x;
        this.obj.x = x;
    }

    updateSelected() {
        const time = this.hitObject.time;
        const selected = Game.SELECTED.includes(time);

        if (selected === this.cache.selected) return;
        this.cache.selected = selected;

        this.meshHead.shader.resources.customUniforms.uniforms.selected = selected ? 1 : 0;
        this.meshTail.shader.resources.customUniforms.uniforms.selected = selected ? 1 : 0;

        if (Game.SKINNING.type === "0") {
            this.selected.visible = false;
            return;
        }
        this.selected.visible = selected;
    }

    updateVisible(isSliderTail) {
        if (Game.SKINNING.type === this.cache.skinType) return;
        this.cache.skinType = Game.SKINNING.type;

        const skinType = Game.SKINNING.type;
        const skinType_t = Skinning.SKIN_ENUM[Game.SKINNING.type];
        const textures = skinType_t !== "CUSTOM" ? Texture.LEGACY : Texture.CUSTOM[Skinning.SKIN_IDX];

        this.theThing.visible = skinType === "0" && !(this.isSlider && !isSliderTail);
        this.hitCircle.visible = !(skinType === "0");
        this.hitCircleOverlay.visible = !(skinType === "0");

        this.meshHead.shader.resources.customUniforms.uniforms.skinType = Game.SKINNING.type;
        this.meshTail.shader.resources.customUniforms.uniforms.skinType = Game.SKINNING.type;

        this.hitCircle.texture = textures.HIT_CIRCLE.texture;
        this.hitCircle.scale.set(textures.HIT_CIRCLE.isHD ? 0.5 : 1);

        this.hitCircleOverlay.texture = textures.HIT_CIRCLE_OVERLAY.texture;
        this.hitCircleOverlay.scale.set(textures.HIT_CIRCLE_OVERLAY.isHD ? 0.5 : 1);

        if (isSliderTail) {
            this.meshHead.shader.resources.customUniforms.uniforms.isReverse = true;
            this.meshTail.shader.resources.customUniforms.uniforms.isReverse = true;
        }
    }

    updateTint(isSliderTail) {
        const colors = Game.SLIDER_APPEARANCE.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
        const idx = Game.SLIDER_APPEARANCE.ignoreSkin ? this.hitObject.colourIdx : this.hitObject.colourHaxedIdx;

        if (colors[idx % colors.length] === undefined) return;
        if (colors[idx % colors.length] === this.cache.tint) return;
        this.cache.tint = colors[idx % colors.length];

        this.hitCircle.tint = colors[idx % colors.length];

        const tint =
            idx === -1
                ? [1.0, 1.0, 1.0, 1.0]
                : [...Object.values(d3.rgb(`#${this.cache.tint.toString(16).padStart(6, "0")}`)).map((val) => val / 255), 1.0];

        if (isSliderTail) {
            const [R, G, B] = tint;
            const lumi = 0.299 * R + 0.587 * G + 0.114 * B;

            if (lumi > 0.5) {
                this.meshHead.shader.resources.customUniforms.uniforms.nodeTint = [0.2, 0.2, 0.2, 1.0];
                this.meshTail.shader.resources.customUniforms.uniforms.nodeTint = [0.2, 0.2, 0.2, 1.0];
                return;
            }

            this.meshHead.shader.resources.customUniforms.uniforms.nodeTint = [0.9, 0.9, 0.9, 1.0];
            this.meshTail.shader.resources.customUniforms.uniforms.nodeTint = [0.9, 0.9, 0.9, 1.0];
            return;
        }

        this.meshHead.shader.resources.customUniforms.uniforms.tint = tint;
        this.meshTail.shader.resources.customUniforms.uniforms.tint = tint;
    }

    updateScale(isSliderTail) {
        if (this.cache.baseHeight === Timeline.HEIGHT - (Timeline.SHOW_GREENLINE ? 30 : 0)) return;
        this.cache.baseHeight = Timeline.HEIGHT - (Timeline.SHOW_GREENLINE ? 30 : 0);

        this.obj.scale.set(this.cache.baseHeight / this.hitCircle.height * 0.9);
        this.obj.y = Timeline.HEIGHT / 2;

        if (isSliderTail) {
            this.meshHead.scale.set(this.cache.baseHeight / 60);
            this.meshTail.scale.set(this.cache.baseHeight / 60);
            return;
        }

        this.meshHead.scale.set((this.cache.baseHeight / 60) * 2);
        this.meshTail.scale.set((this.cache.baseHeight / 60) * 2);
    }

    draw(timestamp, isSliderTail) {
        this.updatePosition(timestamp);
        this.updateSelected();
        this.updateVisible(isSliderTail);
        this.updateScale(isSliderTail);
        this.updateTint(isSliderTail);

        if (isSliderTail) return;
        this.numberSprite.draw(timestamp, this.hitObject.comboIdx);
    }
}
