import * as PIXI from "pixi.js";
import vertexSrc from "../Shaders/SliderBody2.vert?raw";
import fragmentSrc from "../Shaders/SliderBody2.frag?raw";
import fragFilter from "../Shaders/Alpha.frag?raw";
import gpuSrc from "../Shaders/SliderBody2.wgsl?raw";
import gpuFilter from "../Shaders/Alpha.wgsl?raw";
import { Game } from "../Game";
import { Skinning } from "../Skinning";
import { Beatmap } from "../Beatmap";

const DIVIDES = 64;

PIXI.defaultFilterVert;

class ShaderFilter {
    filter;

    constructor() {
        const gl = PIXI.GlProgram.from({
            vertex: `
            in vec2 aPosition;
            out vec2 vTextureCoord;

            uniform vec4 uInputSize;
            uniform vec4 uOutputFrame;
            uniform vec4 uOutputTexture;

            vec4 filterVertexPosition( void )
            {
                vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
                position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
                position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
            
                return vec4(position, 0.0, 1.0);
            }

            vec2 filterTextureCoord( void )
            {
                return aPosition * (uOutputFrame.zw * uInputSize.zw);
            }

            void main(void)
            {
                gl_Position = filterVertexPosition();
                vTextureCoord = filterTextureCoord();
            }
            `,
            fragment: fragFilter,
        });

        const gpu = PIXI.GpuProgram.from({
            vertex: {
                source: gpuFilter,
                entryPoint: "vsMain",
            },
            fragment: {
                source: gpuFilter,
                entryPoint: "fsMain",
            },
        });

        this.filter = new PIXI.Filter({
            glProgram: gl,
            gpuProgram: gpu,
            resources: {
                customUniforms: {
                    alpha: { value: 1.0, type: "f32" },
                    bodyAlpha: { value: 1, type: "f32" },
                    borderColor: { value: [1.0, 1.0, 1.0, 1.0], type: "vec4<f32>" },
                    innerColor: { value: [0.0, 0.0, 0.0, 0.0], type: "vec4<f32>" },
                    outerColor: { value: [0.0, 0.0, 0.0, 0.0], type: "vec4<f32>" },
                    borderWidth: { value: 0.128, type: "f32" },
                },
            },
        });
    }

    get alpha() {
        return this.filter.resources.customUniforms.uniforms.alpha;
    }

    set alpha(val) {
        this.filter.resources.customUniforms.uniforms.alpha = val;
    }
}

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

    constructor(angleList, curveGeometryObj, circleGeometry, slider, isSelected) {
        this.angleList = angleList;
        this.isSelected = isSelected;
        this.slider = slider;

        this.bounds = {
            minX: null,
            minY: null,
            maxX: null,
            maxY: null,
        };

        curveGeometryObj.points.forEach((point) => {
            if (!this.bounds.minX || point.x < this.bounds.minX) this.bounds.minX = point.x;
            if (!this.bounds.minY || point.y < this.bounds.minY) this.bounds.minY = point.y;
            if (!this.bounds.maxX || point.x > this.bounds.maxX) this.bounds.maxX = point.x;
            if (!this.bounds.maxY || point.y > this.bounds.maxY) this.bounds.maxY = point.y;
        });

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
                    dt: { value: 0, type: "f32" },
                    ot: { value: 1, type: "f32" },
                    inverse: { value: 0, type: "f32" },
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

        // console.log(this.shader);

        this.bodyMesh = new PIXI.Mesh({
            geometry: curveGeometryObj.geometry,
            shader: this.shader,
            roundPixels: true,
        });
        this.bodyMesh.state.depthTest = true;
        this.bodyMesh.scale.set(this.scaleRate);

        this.circleMesh = new PIXI.Mesh({
            geometry: circleGeometry,
            shader: this.shader,
            roundPixels: true,
        });
        this.circleMesh.state.depthTest = true;
        this.circleMesh.scale.set(this.scaleRate);

        this.graphics = new PIXI.Graphics()
            .rect(-Game.OFFSET_X, -Game.OFFSET_Y, Game.WRAPPER.w, Game.WRAPPER.h)
            .fill({ color: "black", alpha: 0.001 });

        // this.filter = new PIXI.AlphaFilter({ alpha: 1 });
        this.filter = new ShaderFilter();

        this.container = new PIXI.Container();
        // this.container.x = -Game.WIDTH * 10 / 8 * 0.031;
        // this.container.y = -Game.HEIGHT * 10 / 8 * 0.04;

        this.container.addChild(this.graphics, this.circleMesh, this.bodyMesh);
        this.container.filters = [this.filter.filter];

        this.tint = [0.0, 0.0, 0.0, 1.0];
    }

    update() {
        if (Game.EMIT_STACK.length !== 0) {
            // this.container.x = -Game.WIDTH * 10 / 8 * 0.031;
            // this.container.y = -Game.HEIGHT * 10 / 8 * 0.04;
        }

        if (this.scaleRate !== Game.SCALE_RATE) {
            this.scaleRate = Game.SCALE_RATE;
            this.bodyMesh.scale.set(this.scaleRate);
            this.circleMesh.scale.set(this.scaleRate);
        }

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
            // ox: 0,
            dy: dy,
            oy: (-2 * (Game.MASTER_CONTAINER.y + Game.OFFSET_Y + Game.WRAPPER.y)) / Game.APP.renderer.height + offsetY,
            // oy: 0
        };

        this.shader.resources.customUniforms.uniforms.dx = transform.dx;
        this.shader.resources.customUniforms.uniforms.ox = transform.ox;
        this.shader.resources.customUniforms.uniforms.dy = transform.dy;
        this.shader.resources.customUniforms.uniforms.oy = transform.oy;
        this.shader.resources.customUniforms.uniforms.inverse = Game.MODS.HR ? 1 : 0;
        this.shader.resources.customUniforms.uniforms.stackOffset = this.slider.stackHeight * currentStackOffset;

        if (this.startt == 0.0 && this.endt == 1.0) {
            this.shader.resources.customUniforms.uniforms.dt = 0;
            this.shader.resources.customUniforms.uniforms.ot = 1;

            const point = SliderBody.getPointAtT(this.angleList, this.startt, this.endt);
            this.shader.resources.customUniforms.uniforms.ballPosition[0] = point.x;
            this.shader.resources.customUniforms.uniforms.ballPosition[1] = point.y;
        } else if (this.startt == 0.0) {
            this.shader.resources.customUniforms.uniforms.dt = 1;
            this.shader.resources.customUniforms.uniforms.ot = this.endt;

            const point = SliderBody.getPointAtT(this.angleList, this.startt, this.endt);
            this.shader.resources.customUniforms.uniforms.ballPosition[0] = point.x;
            this.shader.resources.customUniforms.uniforms.ballPosition[1] = point.y;
        } else if (this.endt == 1.0) {
            this.shader.resources.customUniforms.uniforms.dt = -1;
            this.shader.resources.customUniforms.uniforms.ot = -this.startt;

            const point = SliderBody.getPointAtT(this.angleList, this.startt, this.endt);
            this.shader.resources.customUniforms.uniforms.ballPosition[0] = point.x;
            this.shader.resources.customUniforms.uniforms.ballPosition[1] = point.y;
        }

        this.shader.resources.customUniforms.uniforms.circleBaseScale = circleBaseScale;

        // this.shader.resources.customUniforms.uniforms.bodyAlpha = bodyAlpha;
        // this.shader.resources.customUniforms.uniforms.borderColor = borderColor;
        // this.shader.resources.customUniforms.uniforms.innerColor = innerColor;
        // this.shader.resources.customUniforms.uniforms.outerColor = outerColor;
        // this.shader.resources.customUniforms.uniforms.borderWidth = borderWidth;

        this.filter.filter.resources.customUniforms.uniforms.bodyAlpha = bodyAlpha;
        this.filter.filter.resources.customUniforms.uniforms.borderColor = borderColor;
        this.filter.filter.resources.customUniforms.uniforms.innerColor = innerColor;
        this.filter.filter.resources.customUniforms.uniforms.outerColor = outerColor;
        this.filter.filter.resources.customUniforms.uniforms.borderWidth = borderWidth;
        // this.shader.resources.customUniforms.uniforms.scaleRate = Game.SCALE_RATE;
    }

    get alpha() {
        // return this.filter.alpha;
    }

    set alpha(val) {
        this.filter.alpha = val;
        // this.shader.resources.customUniforms.uniforms.alpha = val;
        // this.shader.resources.customUniforms.uniforms.alpha = val;
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

        return {
            geometry: new PIXI.Geometry({
                attributes: {
                    aPosition: vert,
                    isCirc: new Array(vert.length / 4).fill(0.0),
                },
                indexBuffer: index,
            }),
            points: vertUnserialized,
        };
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
                aPosition: vert,
                isCirc: new Array(vert.length / 4).fill(1.0),
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
        const angle = list[startIdx].angle + lerpValue * (list[endIdx].angle - list[startIdx].angle);
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