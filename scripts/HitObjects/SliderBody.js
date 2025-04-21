import * as PIXI from "pixi.js";
import vertexSrc from "../Shaders/SliderBody.vert?raw";
import fragmentSrc from "../Shaders/SliderBody.frag?raw";
import fragFilter from "../Shaders/Alpha.frag?raw";
import gpuSrc from "../Shaders/SliderBody.wgsl?raw";
import gpuFilter from "../Shaders/Alpha.wgsl?raw";
import { Game } from "../Game";
import { Skinning } from "../Skinning";
import { Beatmap } from "../Beatmap";
import { SliderMeshContainer } from "./SliderMeshContainer";

const DIVIDES = 64;

export class SliderBody {
    container;
    filter;

    bodyMesh;
    circleMesh;
    shader;

    angleList;
    slider;

    startt = 0.0;
    endt = 1.0;

    scaleRate = 1;

    static RADIUS = 54.4 * (236 / 256);

    transform = {
        ox: 0,
        oy: 0,
        dx: 0,
        dy: 0,
    };

    ballPosition = {
        x: 0,
        y: 0,
    };

    constructor(angleList, curveGeometry, circleGeometry, slider, isSelected) {
        this.angleList = angleList;
        this.isSelected = isSelected;
        this.slider = slider;

        const gl = PIXI.GlProgram.from({
            vertex: vertexSrc,
            fragment: fragmentSrc,
        });

        const gpu = PIXI.GpuProgram.from({
            vertex: {
                source: gpuSrc,
                entryPoint: "vsMain",
            },
            fragment: {
                source: gpuSrc,
                entryPoint: "fsMain",
            },
        });
        gpu.autoAssignGlobalUniforms = true;
        gpu.autoAssignLocalUniforms = true;

        this.shader = PIXI.Shader.from({
            gl,
            gpu,
            resources: {
                customUniforms: {
                    // Vertex Uniforms
                    dx: { value: 0, type: "f32" },
                    ox: { value: 0, type: "f32" },
                    dy: { value: 0, type: "f32" },
                    oy: { value: 0, type: "f32" },
                    inverse: { value: 0, type: "f32" },
                    startt: { value: 0, type: "f32" },
                    endt: { value: 0, type: "f32" },
                    stackOffset: { value: 0, type: "f32" },
                    ballPosition: { value: [0, 0], type: "vec2<f32>" },
                    // Fragment Uniforms
                    circleBaseScale: { value: 1, type: "f32" },
                    alpha: { value: 1.0, type: "f32" },
                    bodyAlpha: { value: 1, type: "f32" },
                    borderColor: { value: [1.0, 1.0, 1.0, 1.0], type: "vec4<f32>" },
                    innerColor: { value: [0.0, 0.0, 0.0, 0.0], type: "vec4<f32>" },
                    outerColor: { value: [0.0, 0.0, 0.0, 0.0], type: "vec4<f32>" },
                    borderWidth: { value: 0.128, type: "f32" },
                },
            },
        });

        this.geometry = curveGeometry;
        this.circleGeometry = circleGeometry;

        // console.log(curveGeometry);

        this.container = new SliderMeshContainer(this);

        this.tint = [0.0, 0.0, 0.0, 1.0];
    }

    update() {
        const SKIN_TYPE = parseInt(Game.SKINNING.type);
        const IS_SELECTED = this.isSelected;

        const sliderTrackOverride = Skinning.SLIDER_TRACK_OVERRIDE;
        const tint = this.tint;
        const borderColor =
            SKIN_TYPE === 0 || SKIN_TYPE === 1 || IS_SELECTED
                ? tint
                : SKIN_TYPE === 2 || SKIN_TYPE === 3
                ? [1, 1, 1, 1]
                : Skinning.SLIDER_BORDER ?? [1, 1, 1, 1];
        const bodyColor = SKIN_TYPE === 0 || SKIN_TYPE === 1 ? tint : sliderTrackOverride ?? this.tint;
        const circleBaseScale = (Beatmap.moddedStats.radius / 54.4) * (SKIN_TYPE !== 0 || IS_SELECTED ? 1 : 0.95);
        const bodyAlpha = IS_SELECTED ? 0 : SKIN_TYPE !== 0 ? 0.7 : 1;
        const borderWidth = SKIN_TYPE === 0 ? 0.128 * 1.65 : 0.115;

        let innerColor, outerColor;

        switch (SKIN_TYPE) {
            case 0: {
                outerColor = SliderBody.darken(bodyColor, 4.0);
                innerColor = SliderBody.darken(bodyColor, 4.0);
                break;
            }
            case 1: {
                outerColor = SliderBody.darken(bodyColor, 2.0);
                innerColor = SliderBody.darken(bodyColor, 0.5);
                break;
            }
            case 3: {
                outerColor = SliderBody.lighten(bodyColor, 0.1);
                innerColor = SliderBody.darken(bodyColor, 0.5);
                break;
            }
            default: {
                outerColor = SliderBody.darken(bodyColor, 0.1);
                innerColor = SliderBody.lighten(bodyColor, 0.5);
                break;
            }
        }

        const currentStackOffset = Beatmap.moddedStats.stackOffset;
        const dx = (2 * (Game.WIDTH / 512)) / Game.APP.renderer.width;
        const dy = (-2 * Game.HEIGHT) / Game.APP.renderer.height / 384;

        const offsetX = this.slider.stackHeight * currentStackOffset * dx;
        const offsetY = this.slider.stackHeight * currentStackOffset * dy;

        const transform = {
            dx: dx,
            ox: (2 * (Game.MASTER_CONTAINER.x + Game.OFFSET_X)) / Game.APP.renderer.width + offsetX,
            dy: dy,
            oy: (-2 * (Game.MASTER_CONTAINER.y + Game.OFFSET_Y + Game.WRAPPER.y)) / Game.APP.renderer.height + offsetY,
        };

        this.transform = transform;

        this.shader.resources.customUniforms.uniforms.dx = transform.dx;
        this.shader.resources.customUniforms.uniforms.ox = transform.ox;
        this.shader.resources.customUniforms.uniforms.dy = transform.dy;
        this.shader.resources.customUniforms.uniforms.oy = transform.oy;
        this.shader.resources.customUniforms.uniforms.inverse = Game.MODS.HR ? 1 : 0;
        this.shader.resources.customUniforms.uniforms.stackOffset = this.slider.stackHeight * currentStackOffset;

        const point = SliderBody.getPointAtT(this.angleList, this.startt, this.endt);
        this.ballPosition = point;
        this.shader.resources.customUniforms.uniforms.ballPosition = [point.x, point.y];

        this.shader.resources.customUniforms.uniforms.circleBaseScale = circleBaseScale;

        this.shader.resources.customUniforms.uniforms.bodyAlpha = bodyAlpha;
        this.shader.resources.customUniforms.uniforms.borderColor = borderColor;
        this.shader.resources.customUniforms.uniforms.innerColor = innerColor;
        this.shader.resources.customUniforms.uniforms.outerColor = outerColor;
        this.shader.resources.customUniforms.uniforms.borderWidth = borderWidth;
    }

    get alpha() {
        // return this.filter.alpha;
    }

    set alpha(val) {
        this.shader.resources.customUniforms.uniforms.alpha = val;
    }

    static curveGeometry(curve0, radius) {
        // returning PIXI.Geometry object
        // osu relative coordinate -> osu pixels
        // console.log(curve0);
        const curve = new Array();
        // filter out coinciding points
        for (let i = 0; i < curve0.length; ++i)
            if (i == 0 || Math.abs(curve0[i].x - curve0[i - 1].x) > 0.00001 || Math.abs(curve0[i].y - curve0[i - 1].y) > 0.00001)
                curve.push(curve0[i]);

        let vert = new Array();
        let index = new Array();
        const vertUnserialized = new Array();

        vert.push(curve[0].x, curve[0].y, curve[0].t, 0.0); // first point on curve
        vertUnserialized.push({ x: curve[0].x, y: curve[0].y, z: curve[0].t, t: 0.0 }); // first point on curve

        // add rectangles around each segment of curve
        for (let i = 1; i < curve.length; ++i) {
            // Current point
            let x = curve[i].x;
            let y = curve[i].y;
            let t = curve[i].t;

            // Previous point
            let lx = curve[i - 1].x;
            let ly = curve[i - 1].y;
            let lt = curve[i - 1].t;

            // Delta x, y
            let dx = x - lx;
            let dy = y - ly;
            let length = Math.hypot(dx, dy);

            let ox = (radius * -dy) / length;
            let oy = (radius * dx) / length;

            vert.push(lx + ox, ly + oy, lt, 1.0);
            vert.push(lx - ox, ly - oy, lt, 1.0);
            vert.push(x + ox, y + oy, t, 1.0);
            vert.push(x - ox, y - oy, t, 1.0);
            vert.push(x, y, t, 0.0);

            vertUnserialized.push({ x: lx + ox, y: ly + oy, z: lt, t: 1.0 });
            vertUnserialized.push({ x: lx - ox, y: ly - oy, z: lt, t: 1.0 });
            vertUnserialized.push({ x: x + ox, y: y + oy, z: t, t: 1.0 });
            vertUnserialized.push({ x: x - ox, y: y - oy, z: t, t: 1.0 });
            vertUnserialized.push({ x: x, y: y, z: t, t: 0.0 });

            let n = 5 * i + 1;
            // indices for 4 triangles composing 2 rectangles
            index.push(n - 6, n - 5, n - 1, n - 5, n - 1, n - 3);
            index.push(n - 6, n - 4, n - 1, n - 4, n - 1, n - 2);
        }

        function addArc(c, p1, p2, t) {
            // c as center, sector from c-p1 to c-p2 counterclockwise
            let theta_1 = Math.atan2(vert[4 * p1 + 1] - vert[4 * c + 1], vert[4 * p1] - vert[4 * c]);
            let theta_2 = Math.atan2(vert[4 * p2 + 1] - vert[4 * c + 1], vert[4 * p2] - vert[4 * c]);
            if (theta_1 > theta_2) theta_2 += 2 * Math.PI;
            let theta = theta_2 - theta_1;
            let divs = Math.ceil((DIVIDES * Math.abs(theta)) / (2 * Math.PI));
            theta /= divs;
            let last = p1;
            for (let i = 1; i < divs; ++i) {
                vert.push(vert[4 * c] + radius * Math.cos(theta_1 + i * theta), vert[4 * c + 1] + radius * Math.sin(theta_1 + i * theta), t, 1.0);
                vertUnserialized.push({
                    x: vert[4 * c] + radius * Math.cos(theta_1 + i * theta),
                    y: vert[4 * c + 1] + radius * Math.sin(theta_1 + i * theta),
                    z: t,
                    t: 1.0,
                });
                let newv = vert.length / 4 - 1;
                index.push(c, last, newv);
                last = newv;
            }
            index.push(c, last, p2);
        }

        // add sectors for turning points of curve
        for (let i = 1; i < curve.length - 1; ++i) {
            let dx1 = curve[i].x - curve[i - 1].x;
            let dy1 = curve[i].y - curve[i - 1].y;
            let dx2 = curve[i + 1].x - curve[i].x;
            let dy2 = curve[i + 1].y - curve[i].y;
            let t = dx1 * dy2 - dx2 * dy1; // d1 x d2
            if (t > 0) {
                // turning counterclockwise
                addArc(5 * i, 5 * i - 1, 5 * i + 2, curve[i].t);
            } else {
                // turning clockwise or straight back
                addArc(5 * i, 5 * i + 1, 5 * i - 2, curve[i].t);
            }
        }

        // add half-circle for head & tail of curve
        addArc(0, 1, 2, curve[0].t);
        addArc(5 * curve.length - 5, 5 * curve.length - 6, 5 * curve.length - 7, curve.at(-1).t);

        return new PIXI.Geometry({
            attributes: {
                aPosition: new Float32Array(vert),
                isCirc: new Float32Array(new Array(vert.length / 4).fill(0.0)),
            },
            indexBuffer: index,
        });
    }

    static circleGeometry(radius) {
        let vert = new Array();
        let index = new Array();
        vert.push(0.0, 0.0, 0.0, 0.0); // center
        // radius *= 0.978;xx
        for (let i = 0; i < DIVIDES; ++i) {
            let theta = ((2 * Math.PI) / DIVIDES) * i;
            vert.push(radius * Math.cos(theta), radius * Math.sin(theta), 0.0, 1.0);
            index.push(0, i + 1, ((i + 1) % DIVIDES) + 1);
        }
        return new PIXI.Geometry({
            attributes: {
                aPosition: new Float32Array(vert),
                isCirc: new Float32Array(new Array(vert.length / 4).fill(1.0)),
            },
            indexBuffer: index,
        });
    }

    static getPointAtT(list, startt, endt) {
        let t = 0;
        if (startt == 0.0 && endt == 1.0) {
            t = startt;
        } else if (startt == 0.0) {
            t = endt;
        } else if (endt == 1.0) {
            t = startt;
        }

        if (isNaN(t)) t = 0;
        if (t <= 0) return list.at(0);
        if (t >= 1) return list.at(-1);

        const startIdx = Math.floor(t * (list.length - 1));
        const endIdx = Math.ceil(t * (list.length - 1));
        const rawIdx = t * (list.length - 1);

        const lerpValue = (rawIdx - startIdx) / (endIdx - startIdx);

        // console.log(t, startIdx, endIdx)

        const x = list[startIdx].x + lerpValue * (list[endIdx].x - list[startIdx].x);
        const y = list[startIdx].y + lerpValue * (list[endIdx].y - list[startIdx].y);
        // const angle = list[startIdx].angle + lerpValue * (list[endIdx].angle - list[startIdx].angle);
        const angle = lerpValue >= 0.5 ? list[endIdx].angle : list[startIdx].angle;
        // const t = (time - this.time) / (this.endTime - this.time);

        return {
            x,
            y,
            t,
            angle,
        };
    }

    static lighten(color, amount) {
        amount *= 0.5;

        const ret = [];
        ret[0] = Math.min(1.0, color[0] * (1.0 + 0.5 * amount) + 1.0 * amount);
        ret[1] = Math.min(1.0, color[1] * (1.0 + 0.5 * amount) + 1.0 * amount);
        ret[2] = Math.min(1.0, color[2] * (1.0 + 0.5 * amount) + 1.0 * amount);

        return ret;
    }

    static darken(color, amount) {
        const scalar = Math.max(1.0, 1.0 + amount);
        const ret = [];
        ret[0] = Math.min(1.0, color[0] / scalar);
        ret[1] = Math.min(1.0, color[1] / scalar);
        ret[2] = Math.min(1.0, color[2] / scalar);

        return ret;
    }
}
