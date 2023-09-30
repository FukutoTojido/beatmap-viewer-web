function lighten(color, amount) {
    amount *= 0.25;
    return Math.min(1, color * (1 + 0.5 * amount) + 1 * amount);
}

function darken(color, amount) {
    // amount = 1 - amount;
    return (color * (47 + (100 - 47) * amount)) / 255;
}

// Ported from https://github.com/111116/webosu/blob/master/scripts/SliderMesh.js
// Also have a visit at http://osugame.online/ , very cool tbh

const vertexSrc = `
precision mediump float;
attribute vec4 position;
varying float dist;
uniform float dx,dy,dt,ox,oy,ot;
void main() {
    dist = position[3];
    gl_Position = vec4(position[0], position[1], position[3] + 2.0 * float(position[2]*dt>ot), 1.0);
    gl_Position.x = gl_Position.x * dx + ox;
    gl_Position.y = gl_Position.y * dy + oy;
}`;

// fragment shader source
const fragmentSrc = `
precision mediump float;
varying float dist;
uniform sampler2D uSampler2;
uniform float alpha;
uniform float texturepos;
void main() {
    gl_FragColor = alpha * texture2D(uSampler2, vec2(dist, texturepos));
}`;

function selectedTexture() {
    // console.log(colors);
    const borderwidth = 0.128;
    const blurrate = 0.03;
    const width = 200;

    let buff = new Uint8Array(width * 4);

    const innerPortion = 1 - borderwidth * 1.65;
    let tint = 0xf2cc0f;
    let bordertint = 0xf2cc0f;
    let borderR = (bordertint >> 16) / 255;
    let borderG = ((bordertint >> 8) & 255) / 255;
    let borderB = (bordertint & 255) / 255;
    let borderA = 1.0;
    let innerR = (tint >> 16) / 255;
    let innerG = ((tint >> 8) & 255) / 255;
    let innerB = (tint & 255) / 255;
    let innerA = 1.0;
    for (let i = 0; i < width; i++) {
        let position = i / width;
        let R, G, B, A;
        if (position >= innerPortion) {
            // draw border color
            R = borderR;
            G = borderG;
            B = borderB;
            A = borderA;
        } // draw inner color
        else {
            R = innerR;
            G = innerG;
            B = innerB;
            // TODO: tune this to make opacity transition smoother at center
            A = 0;
        }
        // pre-multiply alpha
        R *= A;
        G *= A;
        B *= A;
        // blur at edge for "antialiasing" without supersampling
        if (1 - position < blurrate) {
            // outer edge
            R *= (1 - position) / blurrate;
            G *= (1 - position) / blurrate;
            B *= (1 - position) / blurrate;
            A *= (1 - position) / blurrate;
        }
        if (innerPortion - position > 0 && innerPortion - position < blurrate) {
            let mu = (innerPortion - position) / blurrate;
            R = mu * R + (1 - mu) * borderR * borderA;
            G = mu * G + (1 - mu) * borderG * borderA;
            B = mu * B + (1 - mu) * borderB * borderA;
            A = mu * innerA + (1 - mu) * borderA;
        }
        buff[i * 4] = R * 255;
        buff[i * 4 + 1] = G * 255;
        buff[i * 4 + 2] = B * 255;
        buff[i * 4 + 3] = A * 255;
    }

    return PIXI.Texture.fromBuffer(buff, width, 1);
}

function newTexture(colors, SliderTrackOverride, SliderBorder) {
    // console.log(colors);
    // const startTime = performance.now();

    const borderwidth = 0.128;
    const edgeOpacity = 1;
    const centerOpacity = 1;
    const blurrate = 0.03;
    const width = 200;

    const roundedLength = 2 ** Math.ceil(Math.log2(colors.length));

    let buff = new Uint8Array(roundedLength * width * 4 * 2);

    for (let s = 0; s < 2; s++)
        for (let k = 0; k < roundedLength; ++k) {
            if (k < colors.length) {
                const innerPortion = 1 - (s === 0 ? borderwidth * 1.65 : borderwidth);
                let tint = typeof SliderTrackOverride != "undefined" ? SliderTrackOverride : colors[k];
                let bordertint = typeof SliderBorder != "undefined" ? SliderBorder : colors[k];
                let borderR = (bordertint >> 16) / 255;
                let borderG = ((bordertint >> 8) & 255) / 255;
                let borderB = (bordertint & 255) / 255;
                let borderA = 1.0;

                let innerR = (tint >> 16) / 255;
                let innerG = ((tint >> 8) & 255) / 255;
                let innerB = (tint & 255) / 255;
                let innerA = 1.0;

                for (let i = 0; i < width; i++) {
                    let position = i / width;
                    let R, G, B, A;
                    if (position >= innerPortion) {
                        // draw border color
                        R = borderR;
                        G = borderG;
                        B = borderB;

                        // if (k === colors.length - 1) {
                        //     R = 60 / 255;
                        //     G = 60 / 255;
                        //     B = 60 / 255;
                        // }

                        A = borderA;
                    } // draw inner color
                    else {
                        // if (k === colors.length - 1) {
                        //     R = lighten(innerR, s === 0 ? 0 : (1 - position) / innerPortion);
                        //     G = lighten(innerG, s === 0 ? 0 : (1 - position) / innerPortion);
                        //     B = lighten(innerB, s === 0 ? 0 : (1 - position) / innerPortion);
                        // } else {
                        R = darken(innerR, s === 0 ? 0 : (1 - position) / innerPortion);
                        G = darken(innerG, s === 0 ? 0 : (1 - position) / innerPortion);
                        B = darken(innerB, s === 0 ? 0 : (1 - position) / innerPortion);
                        // }

                        // TODO: tune this to make opacity transition smoother at center
                        A = innerA * (((edgeOpacity - centerOpacity) * position) / innerPortion + centerOpacity) * (s === 0 ? 1 : 0.7);
                    }
                    // pre-multiply alpha
                    R *= A;
                    G *= A;
                    B *= A;
                    // blur at edge for "antialiasing" without supersampling
                    if (1 - position < blurrate) {
                        // outer edge
                        R *= (1 - position) / blurrate;
                        G *= (1 - position) / blurrate;
                        B *= (1 - position) / blurrate;
                        A *= (1 - position) / blurrate;
                    }
                    if (innerPortion - position > 0 && innerPortion - position < blurrate) {
                        let mu = (innerPortion - position) / blurrate;
                        R = mu * R + (1 - mu) * borderR * borderA;
                        G = mu * G + (1 - mu) * borderG * borderA;
                        B = mu * B + (1 - mu) * borderB * borderA;
                        A = mu * innerA + (1 - mu) * borderA;
                    }
                    buff[(k * width + i) * 4 + s * roundedLength * width * 4] = R * 255;
                    buff[(k * width + i) * 4 + 1 + s * roundedLength * width * 4] = G * 255;
                    buff[(k * width + i) * 4 + 2 + s * roundedLength * width * 4] = B * 255;
                    buff[(k * width + i) * 4 + 3 + s * roundedLength * width * 4] = A * 255;
                }
            } else {
                for (let i = 0; i < width; i++) {
                    buff[(k * width + i) * 4 + s * roundedLength * width * 4] = 0;
                    buff[(k * width + i) * 4 + 1 + s * roundedLength * width * 4] = 0;
                    buff[(k * width + i) * 4 + 2 + s * roundedLength * width * 4] = 0;
                    buff[(k * width + i) * 4 + 3 + s * roundedLength * width * 4] = 0;
                }
            }

            // console.log(
            //     buff[k * width * 4 + s * roundedLength * width * 4],
            //     buff[k * width * 4 + 1 + s * roundedLength * width * 4],
            //     buff[k * width * 4 + 2 + s * roundedLength * width * 4],
            //     buff[k * width * 4 + 3 + s * roundedLength * width * 4]
            // );
        }

    // for (let i = 0; i < buff.length; i += 4) {
    //     console.log(buff[i], buff[i + 1], buff[i + 2], buff[i + 3]);
    // }
    // console.log(buff);

    // console.log(`Created texture in: ${performance.now() - startTime}ms`)
    return PIXI.Texture.fromBuffer(buff, width, roundedLength * 2);
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
        let x = curve[i].x;
        let y = curve[i].y;
        let t = curve[i].t;
        let lx = curve[i - 1].x;
        let ly = curve[i - 1].y;
        let lt = curve[i - 1].t;
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
            addArc(5 * i, 5 * i - 1, 5 * i + 2);
        } else {
            // turning clockwise or straight back
            addArc(5 * i, 5 * i + 1, 5 * i - 2);
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

class SliderGeometryContainers {
    curve;
    geometry;
    tintid;

    sliderContainer;
    selSliderContainer;

    constructor(curve, tintid) {
        this.curve = curve;
        this.tintid = tintid;

        this.sliderContainer = new SliderMesh(curve, tintid);
        this.selSliderContainer = new SliderMesh(curve, tintid);
    }

    initiallize(radius, transform) {
        this.geometry = curveGeometry(this.curve, radius);
        this.circle = circleGeometry(radius);

        this.sliderContainer.initiallize(this.geometry, this.circle, transform, false);
        this.selSliderContainer.initiallize(this.geometry, this.circle, transform, true);
    }
}

class SliderMesh extends PIXI.Container {
    constructor(curve, tintid) {
        super();
        this.curve = curve;
        this.tintid = tintid;
        this.alpha = 1.0;
        this.startt = 0.0;
        this.endt = 1.0;

        // blend mode, culling, depth testing, direction of rendering triangles, backface, etc.
        this.state = PIXI.State.for2d();
        this.drawMode = PIXI.DRAW_MODES.TRIANGLES;
        // Inherited from DisplayMode, set defaults
        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this._roundPixels = PIXI.settings.ROUND_PIXELS;
    }

    initiallize(geometry, circle, transform, isSelected) {
        // this.ncolors = colors.length;
        // this.uSampler2 = newTexture(colors, SliderTrackOverride, SliderBorder);
        this.ncolors = isSelected ? 1 : 2 ** Math.ceil(Math.log2(colorsLength)) * 2;
        this.uSampler2 = isSelected ? SelectedTexture : SliderTexture;
        this.circle = circle;
        this.geometry = geometry;
        this.uniforms = {
            uSampler2: this.uSampler2,
            alpha: 1.0,
            dx: transform.dx,
            dy: transform.dy,
            ox: transform.ox,
            oy: transform.oy,
            texturepos: 0,
        };
        this.shader = PIXI.Shader.from(vertexSrc, fragmentSrc, this.uniforms);
        // console.log(this.shader)
    }

    _render(renderer) {
        this._renderDefault(renderer);
    }

    _renderDefault(renderer) {
        var shader = this.shader;
        shader.alpha = this.worldAlpha;
        if (shader.update) {
            shader.update();
        }
        renderer.batch.flush();

        // upload color info to shared shader uniform
        // console.log(this.tintid / this.ncolors);
        this.uniforms.alpha = this.alpha;
        this.uniforms.texturepos = this.tintid / this.ncolors;
        this.uniforms.dt = 0;
        this.uniforms.ot = 0.5;

        let ox0 = this.uniforms.ox;
        let oy0 = this.uniforms.oy;

        const gl = renderer.gl;
        gl.clearDepth(1.0); // setting depth of clear
        gl.clear(gl.DEPTH_BUFFER_BIT); // this really clears the depth buffer

        // first render: to store min depth in depth buffer, but not actually drawing anything
        gl.colorMask(false, false, false, false);

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
            let p = this.curve.find((point) => point.t >= this.startt);
            this.uniforms.ox += p.x * this.uniforms.dx;
            this.uniforms.oy += p.y * this.uniforms.dy;
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
            let p = this.curve.findLast((point) => point.t <= this.endt);
            this.uniforms.ox += p.x * this.uniforms.dx;
            this.uniforms.oy += p.y * this.uniforms.dy;
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

            bind(this.circle);
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

            bind(this.circle);
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
