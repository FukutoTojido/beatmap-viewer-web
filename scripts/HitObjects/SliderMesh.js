import { Game } from "../Game.js";
import { Beatmap } from "../Beatmap.js";
import { Skinning } from "../Skinning.js";
import { Texture } from "../Texture.js";
import { binarySearchNearest } from "../Utils.js";
import * as PIXI from "pixi.js";

// Ported from https://github.com/111116/webosu/blob/master/scripts/SliderMesh.js
// Also have a visit at http://osugame.online/ , very cool tbh

const vertexSrc = `
precision mediump float;
attribute vec4 position;
varying float dist;
uniform float dx,dy,dt,ox,oy,ot,circleBaseScale;
uniform bool inverse;

void main() {
    dist = position[3];
    float test = 0.0;

    if (position[2] * dt > ot)
        test = 1.0;

    float y = !inverse ? position[1] : 384.0 - position[1];

    gl_Position = vec4(position[0], position[1], position[3] + 2.0 * test, 1.0);
    gl_Position.x = -1.0 + gl_Position.x * dx + ox;
    gl_Position.y = (y * dy + 1.0) + oy;
}`;

// fragment shader source
const fragmentSrc = `
precision mediump float;
varying float dist;
uniform float alpha;
uniform vec4 tint;
uniform bool select;
uniform float circleBaseScale;
uniform vec4 sliderBorder;
uniform vec4 sliderTrackOverride;
uniform float skinning;

vec4 lighten(vec4 color, float amount) {
    amount *= 0.5;
    color.r = min(1.0, color.r * (1.0 + 0.5 * amount) + 1.0 * amount);
    color.g = min(1.0, color.g * (1.0 + 0.5 * amount) + 1.0 * amount);
    color.b = min(1.0, color.b * (1.0 + 0.5 * amount) + 1.0 * amount);

    return color;
}

vec4 darken(vec4 color, float amount) {
    float scalar = max(1.0, 1.0 + amount);
    color.r = min(1.0, color.r / scalar);
    color.g = min(1.0, color.g / scalar);
    color.b = min(1.0, color.b / scalar);
    return color;
}

void main() {
    float borderWidth = 0.128;
    float a = 1.0;

    if (skinning == 0.0 && !select) borderWidth *= 1.65;

    float innerWidth = 1.0 - borderWidth;
    float outBlurRate = 0.03;
    float inBlurRate = 0.03;

    vec4 borderColor = sliderBorder;

    vec4 baseColor = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 color_mixed = sliderTrackOverride;

    if (skinning != 2.0 && skinning != 3.0 && skinning != 4.0) color_mixed = tint;

    float scale = circleBaseScale;
    if (skinning == 0.0 && !select) scale *= 0.95;

    float position = dist / scale;

    vec4 outerColor = darken(color_mixed, 0.1);
    vec4 innerColor = lighten(color_mixed, 0.5);

    if (skinning == 1.0) {
        outerColor = darken(color_mixed, 2.0);
        innerColor = darken(color_mixed, 0.5);
    }
    
    vec4 color = mix(innerColor, outerColor, position);
    if (skinning == 3.0) color = mix(outerColor, innerColor, position);
    if ((skinning != 2.0 && skinning != 3.0 && skinning != 4.0) || select) borderColor = tint;
    if (skinning == 0.0) color = darken(color_mixed, 4.0);

    // Anti-aliasing at outer edge
    if (1.0 - position < outBlurRate) {
        color = borderColor * (1.0 - position) / outBlurRate;
        a = (1.0 - position) / outBlurRate; 
    }

    // Set border color
    if (position >= innerWidth + inBlurRate) {
        color = borderColor;
    }

    // Anti-aliasing at inner edge
    if (position >= innerWidth && position < innerWidth + inBlurRate) {
        float mu = (position - innerWidth) / inBlurRate;
        color = borderColor * mu + (1.0 - mu) * color;

        a = 1.0;
        if (skinning != 0.0) a = 1.0 * mu + (1.0 - mu) * 0.7;
        if (select) a = 1.0 * mu + (1.0 - mu) * 0.0;
        
    }

    // Set body color
    if (position < innerWidth) {
        if (skinning != 0.0) a = 0.7;
        if (select) a = 0.0;
    }

    color.a = 1.0;

    gl_FragColor = min(alpha * a, 1.0) * color;
}`;

export function newTexture() {
    const width = 400;

    let buff = new Uint8Array(width * 4);

    for (let i = 0; i < width; i++) {
        buff[i * 4] = 0;
        buff[i * 4 + 1] = 0;
        buff[i * 4 + 2] = 0;
        buff[i * 4 + 3] = 1.0;
    }

    return PIXI.Texture.fromBuffer(buff, width, 1);
}

const DIVIDES = 64;

function curveGeometry(curve0, radius) {
    // returning PIXI.Geometry object
    // osu relative coordinate -> osu pixels
    // console.log(curve0);
    const curve = new Array();
    // filter out coinciding points
    for (let i = 0; i < curve0.length; ++i)
        if (i == 0 || Math.abs(curve0[i].x - curve0[i - 1].x) > 0.00001 || Math.abs(curve0[i].y - curve0[i - 1].y) > 0.00001) curve.push(curve0[i]);

    let vert = new Array();
    let index = new Array();

    vert.push(curve[0].x, curve[0].y, curve[0].t, 0.0); // first point on curve

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
            let newv = vert.length / 4 - 1;
            index.push(c, last, newv);
            last = newv;
        }
        index.push(c, last, p2);
    }

    // add half-circle for head & tail of curve
    addArc(0, 1, 2, curve[0].t);
    addArc(5 * curve.length - 5, 5 * curve.length - 6, 5 * curve.length - 7, curve[curve.length - 1].t);

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
    return new PIXI.Geometry().addAttribute("position", vert, 4).addIndex(index);
}

function circleGeometry(radius) {
    let vert = new Array();
    let index = new Array();
    vert.push(0.0, 0.0, 0.0, 0.0); // center
    // radius *= 0.978;xx
    for (let i = 0; i < DIVIDES; ++i) {
        let theta = ((2 * Math.PI) / DIVIDES) * i;
        vert.push(radius * Math.cos(theta), radius * Math.sin(theta), 0.0, 1.0);
        index.push(0, i + 1, ((i + 1) % DIVIDES) + 1);
    }
    return new PIXI.Geometry().addAttribute("position", vert, 4).addIndex(index);
}

function getPointAtT(list, t) {
    if (t <= 0) return list.at(0);
    if (t >= 1) return list.at(-1);

    const startIdx = Math.floor(t * (list.length - 1));
    const endIdx = Math.ceil(t * (list.length - 1));
    const rawIdx = t * (list.length - 1);

    const lerpValue = rawIdx % startIdx;

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

export class SliderGeometryContainers {
    curve;
    geometry;

    sliderContainer;
    selSliderContainer;

    constructor(curve, slider) {
        this.curve = curve;

        this.sliderContainer = new SliderMesh(curve, slider);
        this.selSliderContainer = new SliderMesh(curve, slider);
    }

    initiallize(radius) {
        this.geometry = curveGeometry(this.curve, radius);
        this.circle = circleGeometry(radius);

        this.sliderContainer.initiallize(this.geometry, this.circle, false);
        this.selSliderContainer.initiallize(this.geometry, this.circle, true);
    }
}

class SliderMesh extends PIXI.Container {
    tint = [1.0, 1.0, 1.0, 1.0];
    select = false;

    constructor(curve, slider) {
        super();
        this.curve = curve;
        this.alpha = 1.0;
        this.startt = 0.0;
        this.endt = 1.0;
        this.slider = slider;

        // blend mode, culling, depth testing, direction of rendering triangles, backface, etc.
        this.state = PIXI.State.for2d();
        this.drawMode = PIXI.DRAW_MODES.TRIANGLES;
        // Inherited from DisplayMode, set defaults
        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this._roundPixels = PIXI.settings.ROUND_PIXELS;
    }

    initiallize(geometry, circle, isSelected) {
        const inverse = Game.MODS.HR ? -1 : 1;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

        const dx = (1 * Game.WIDTH) / Game.MASTER_CONTAINER.w / 512;
        const dy = (inverse * (-1 * Game.HEIGHT)) / Game.MASTER_CONTAINER.h / 384;

        const transform = {
            dx: dx,
            ox: -1 * (Game.WIDTH / Game.APP.renderer.width) + dx * this.slider.stackHeight * currentStackOffset,
            dy: dy,
            oy: inverse * 1 * (Game.HEIGHT / Game.APP.renderer.height) + inverse * dy * this.slider.stackHeight * currentStackOffset,
        };

        const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];

        this.ncolors = 1;
        this.uSampler2 = Texture.SLIDER_TEXTURE;
        this.select = isSelected;
        this.circle = circle;
        this.geometry = geometry;
        this.uniforms = {
            uSampler2: this.uSampler2,
            alpha: 1.0,
            dx: transform.dx,
            dy: transform.dy,
            ox: transform.ox,
            oy: transform.oy,
            inverse: false,
            texturepos: 0,
            tint: this.tint,
            select: this.select,
            circleBaseScale,
            sliderBorder: skinType === "CUSTOM" ? Skinning.SLIDER_BORDER : [1.0, 1.0, 1.0, 1.0] ?? [1.0, 1.0, 1.0, 1.0],
            sliderTrackOverride: skinType === "CUSTOM" ? Skinning.SLIDER_TRACK_OVERRIDE : this.tint ?? this.tint,
            skinning: parseFloat(Game.SKINNING.type),
        };
        this.shader = PIXI.Shader.from(vertexSrc, fragmentSrc, this.uniforms);
        // console.log(this.shader)
    }

    _render(renderer) {
        this._renderDefault(renderer);
    }

    _renderDefault(renderer) {
        const inverse = Game.MODS.HR ? -1 : 1;
        const currentStackOffset = Beatmap.moddedStats.stackOffset;
        const circleBaseScale = Beatmap.moddedStats.radius / 54.4;

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

        var shader = this.shader;
        shader.alpha = this.worldAlpha;
        if (shader.update) {
            shader.update();
        }
        renderer.batch.flush();

        const skinType = Skinning.SKIN_ENUM[Game.SKINNING.type];

        // upload color info to shared shader uniform
        this.uniforms.alpha = this.alpha;
        this.uniforms.texturepos = 0;
        this.uniforms.dx = transform.dx;
        this.uniforms.ox = transform.ox;
        this.uniforms.dy = transform.dy;
        this.uniforms.oy = transform.oy;
        this.uniforms.inverse = Game.MODS.HR;
        this.uniforms.dt = 0;
        this.uniforms.ot = 0.5;
        this.uniforms.tint = this.tint;
        this.uniforms.skinning = parseFloat(Game.SKINNING.type);
        this.uniforms.select = this.select;
        this.uniforms.circleBaseScale = circleBaseScale;
        this.uniforms.sliderBorder = (skinType === "CUSTOM" ? Skinning.SLIDER_BORDER : [1.0, 1.0, 1.0, 1.0]) ?? [1.0, 1.0, 1.0, 1.0];
        this.uniforms.sliderTrackOverride = (skinType === "CUSTOM" ? Skinning.SLIDER_TRACK_OVERRIDE : this.tint) ?? this.tint;

        let ox0 = this.uniforms.ox;
        let oy0 = this.uniforms.oy;

        const gl = renderer.gl;
        gl.clearDepth(1.0); // setting depth of clear
        gl.clear(gl.DEPTH_BUFFER_BIT); // this really clears the depth buffer

        // first render: to store min depth in depth buffer, but not actually drawing anything
        gl.colorMask(false, false, false, false);
        // gl.colorMask(true, true, true, true);

        // translation is not supported
        renderer.state.set(this.state); // set state
        renderer.state.setDepthTest(true); // enable depth testing

        let glType;
        let indexLength;

        function bind(geometry) {
            renderer.shader.bind(shader); // bind shader & sync uniforms
            renderer.geometry.bind(geometry, shader); // bind the geometry
            let byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT; // size of each index
            glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT; // type of each index
            indexLength = geometry.indexBuffer.data.length; // number of indices
        }

        if (this.startt == 0.0 && this.endt == 1.0) {
            // display whole slider
            this.uniforms.dt = 0;
            this.uniforms.ot = 1;
            bind(this.geometry);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        } else if (this.endt == 1.0) {
            // snaking out
            if (this.startt != 1.0) {
                // we want portion: t > this.startt
                this.uniforms.dt = -1;
                this.uniforms.ot = -this.startt;
                bind(this.geometry);
                gl.drawElements(this.drawMode, indexLength, glType, 0);
            }
            this.uniforms.dt = 0;
            this.uniforms.ot = 1;

            let p = getPointAtT(this.curve, this.startt);
            this.uniforms.ox += p.x * this.uniforms.dx;

            if (Game.MODS.HR) {
                p.y = 384 - p.y;
                this.uniforms.oy += p.y * this.uniforms.dy + (2 * Game.HEIGHT) / Game.APP.renderer.height;
            } else {
                this.uniforms.oy += p.y * this.uniforms.dy;
            }

            bind(this.circle);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        } else if (this.startt == 0.0) {
            // snaking in
            if (this.endt != 0.0) {
                // we want portion: t < this.endt
                this.uniforms.dt = 1;
                this.uniforms.ot = this.endt;
                bind(this.geometry);
                gl.drawElements(this.drawMode, indexLength, glType, 0);
            }
            this.uniforms.dt = 0;
            this.uniforms.ot = 1;

            let p = getPointAtT(this.curve, this.endt);
            this.uniforms.ox += p.x * this.uniforms.dx;

            if (Game.MODS.HR) {
                p.y = 384 - p.y;
                this.uniforms.oy += p.y * this.uniforms.dy + (2 * Game.HEIGHT) / Game.APP.renderer.height;
            } else {
                this.uniforms.oy += p.y * this.uniforms.dy;
            }

            bind(this.circle);
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        } else {
            console.error("can't snake both end of slider");
        }

        // second render: draw at previously calculated min depth
        gl.depthFunc(gl.EQUAL);
        gl.colorMask(true, true, true, true);

        if (this.startt == 0.0 && this.endt == 1.0) {
            // display whole slider
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        } else if (this.endt == 1.0) {
            // snaking out
            if (this.startt != 1.0) {
                gl.drawElements(this.drawMode, indexLength, glType, 0);
                this.uniforms.ox = ox0;
                this.uniforms.oy = oy0;
                this.uniforms.dt = -1;
                this.uniforms.ot = -this.startt;
                bind(this.geometry);
            }
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        } else if (this.startt == 0.0) {
            // snaking in
            if (this.endt != 0.0) {
                gl.drawElements(this.drawMode, indexLength, glType, 0);
                this.uniforms.ox = ox0;
                this.uniforms.oy = oy0;
                this.uniforms.dt = 1;
                this.uniforms.ot = this.endt;
                bind(this.geometry);
            }
            gl.drawElements(this.drawMode, indexLength, glType, 0);
        }

        // restore state
        // TODO: We don't know the previous state. THIS MIGHT CAUSE BUGS
        gl.depthFunc(gl.LESS); // restore to default depth func
        renderer.state.setDepthTest(false); // restore depth test to disabled
        // restore uniform
        this.uniforms.ox = ox0;
        this.uniforms.oy = oy0;
    }
}
