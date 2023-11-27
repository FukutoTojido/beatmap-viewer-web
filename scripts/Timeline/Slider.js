const vertexShader = `
precision mediump float;
attribute vec2 position;
attribute float dist;

varying float colorDist;

// uniform float dx, dy, ox, oy;
uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

void main() {
    colorDist = dist;
    // gl_Position = vec4(position.xy, 0.0, 1.0);
    // gl_Position.x = position.x * dx + ox;
    // gl_Position.y = position.y * dy + oy;

    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform vec4 tint;
uniform bool selected;
varying float colorDist;

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
    float blurRate = 0.1;
    float alpha = 1.0;
    float totalAlpha = 0.7;

    vec4 outerColor = darken(tint, 0.1);
    vec4 innerColor = tint;

    vec4 color = mix(outerColor, innerColor, colorDist);
    if (selected) {
        color = tint;
        totalAlpha = 1.0;
    }

    color.a = 1.0;

    if (colorDist > 1.0 - blurRate)
        alpha = (1.0 - colorDist) / blurRate;

    gl_FragColor = totalAlpha * alpha * color;
}
`;

class TimelineSlider {
    obj;
    hitObject;
    sliderHead;
    sliderTail;
    sliderReverses = [];

    meshHead;
    meshTail;
    meshBody;

    ratio = 1;
    headPosition = 0;

    constructor(hitObject) {
        this.obj = new PIXI.Container();
        this.obj.interactive = true;

        this.x = 0;
        this.radius = 30.0 * (118 / 128);
        this.hitObject = hitObject;
        this.length = 1;

        this.hitArea = new PIXI.Graphics().drawRect(0, 0, 0, 0);
        this.obj.addChild(this.hitArea);

        const headGeometry = this.createArc(-1, 0);
        const tailGeometry = this.createArc(1, 0);
        const bodyGeometry = this.createLine(1);

        const uniforms = {
            tint: [0.0, 0.0, 0.0, 1.0],
        };

        const shader = PIXI.Shader.from(vertexShader, fragmentShader, uniforms);

        const meshHead = new PIXI.Mesh(headGeometry, shader);
        const meshBody = new PIXI.Mesh(bodyGeometry, shader);
        const meshTail = new PIXI.Mesh(tailGeometry, shader);

        this.meshHead = meshHead;
        this.meshBody = meshBody;
        this.meshTail = meshTail;

        this.meshHead.hitArea = new PIXI.Rectangle(0, 0, 0, 0);
        this.meshBody.hitArea = new PIXI.Rectangle(0, 0, 0, 0);
        this.meshTail.hitArea = new PIXI.Rectangle(0, 0, 0, 0);

        this.obj.addChild(meshHead);
        this.obj.addChild(meshTail);
        this.obj.addChild(meshBody);

        const sliderHead = new TimelineHitCircle(hitObject);
        const sliderTail = new TimelineHitCircle(hitObject);
        this.sliderHead = sliderHead;
        this.sliderTail = sliderTail;

        this.sliderReverses = this.hitObject.revArrows?.map((arrow) => new TimelineReverseArrow(arrow, this.hitObject)) ?? [];

        this.obj.addChild(sliderTail.obj);
        this.sliderReverses.toReversed().forEach((arrow) => this.obj.addChild(arrow.obj));
        this.obj.addChild(sliderHead.obj);

        const handleClickEvent = (e) => {
            const { x, y } = this.obj.toLocal(e.global);
            if (selectedHitObject.includes(this.hitObject.time)) return;

            if (x < this.headPosition - Timeline.HEIGHT / 2 || x > this.headPosition + this.length * this.ratio + Timeline.HEIGHT / 2) return;

            if (!e.ctrlKey) selectedHitObject = [];
            if (!selectedHitObject.includes(this.hitObject.time)) selectedHitObject.push(this.hitObject.time);

            Timeline.hitArea.isObjectSelecting = true;
            // console.log(this.obj.x, this.obj.y, x, y);
        };

        this.obj.on("mousedown", handleClickEvent);

        this.obj.on("touchstart", handleClickEvent);
    }

    addSelfToContainer(container) {
        container.addChild(this.obj);
    }

    removeSelfFromContainer(container) {
        container.removeChild(this.obj);
    }

    draw(timestamp) {
        const time = this.hitObject.time;
        const delta = timestamp - time;

        const selected = selectedHitObject.includes(time);

        const center = Timeline.WIDTH / 2;

        this.length = ((this.hitObject.endTime - this.hitObject.time) / 500) * Timeline.ZOOM_DISTANCE;

        const colors = sliderAppearance.ignoreSkin ? Skinning.DEFAULT_COLORS : Beatmap.COLORS;
        const idx = sliderAppearance.ignoreSkin ? this.hitObject.colourIdx : this.hitObject.colourHaxedIdx;
        const tint =
            idx === -1
                ? [1.0, 1.0, 1.0]
                : Object.values(d3.rgb(`#${colors[idx % colors.length].toString(16).padStart(6, "0")}`)).map((val) => val / 255);

        let headPosition = Math.max(center - (delta / 500) * Timeline.ZOOM_DISTANCE, 0);
        this.headPosition = headPosition;
        // let headPosition = center - (delta / 500) * Timeline.ZOOM_DISTANCE;
        let endPosition = center - (delta / 500) * Timeline.ZOOM_DISTANCE + this.length;

        if (endPosition < 0) headPosition = endPosition;
        const ratio = Clamp((endPosition - headPosition) / this.length, 0, 1);
        this.ratio = ratio;
        // const ratio = 1;

        this.meshHead.position.set(headPosition, Timeline.HEIGHT / 2);
        this.meshHead.scale.set(Timeline.HEIGHT / 60);
        this.meshHead.shader.uniforms.tint = tint;
        this.meshHead.shader.uniforms.selected = selected;

        this.meshBody.position.set(headPosition, Timeline.HEIGHT / 2);
        this.meshBody.scale.set(this.length * ratio, Timeline.HEIGHT / 60);
        this.meshBody.shader.uniforms.tint = tint;
        this.meshHead.shader.uniforms.selected = selected;

        this.meshTail.position.set(endPosition, Timeline.HEIGHT / 2);
        this.meshTail.scale.set(Timeline.HEIGHT / 60);
        this.meshTail.shader.uniforms.tint = tint;
        this.meshHead.shader.uniforms.selected = selected;

        this.sliderHead.draw(timestamp);
        this.sliderTail.draw(timestamp, true);

        this.sliderHead.obj.x = headPosition;
        this.sliderTail.obj.x = endPosition;

        this.hitArea.clear();
        this.hitArea.beginFill(0xffff00, 0.0001).drawRect(headPosition, 0, this.length * ratio, Timeline.HEIGHT);

        this.sliderReverses.forEach((arrow) => arrow.draw(timestamp));

        if (idx === -1) {
            this.sliderHead.hitCircle.tint = 0xdedede;
            this.sliderTail.hitCircle.tint = 0xdedede;
        }

        // this.sliderHead.hitCircle.tint = colors[idx % colors.length];
        // this.sliderTail.hitCircle.tint = colors[idx % colors.length];
    }

    createArc(side, length) {
        side /= Math.abs(side);

        const indices = [];
        const dist = [];

        const center = [0.0, 0.0];
        const RESOLUTION = 400;

        for (let i = 0; i < RESOLUTION; i++) {
            const angle = (i / RESOLUTION) * Math.PI * side;
            const angleNext = ((i + 1) / RESOLUTION) * Math.PI * side;
            indices.push(
                ...center,
                this.radius * Math.sin(angle),
                this.radius * Math.cos(angle),
                this.radius * Math.sin(angleNext),
                this.radius * Math.cos(angleNext)
            );
            dist.push(0.0, 1.0, 1.0);
        }

        const geometry = new PIXI.Geometry().addAttribute("position", indices, 2).addAttribute("dist", dist, 1);
        return geometry;
    }

    createLine(length) {
        const indices = [
            this.x,
            this.radius,
            this.x + length,
            this.radius,
            this.x,
            0.0,
            this.x,
            0.0,
            this.x + length,
            this.radius,
            this.x + length,
            0.0,
            this.x,
            0.0,
            this.x + length,
            0.0,
            this.x,
            -this.radius,
            this.x,
            -this.radius,
            this.x + length,
            0.0,
            this.x + length,
            -this.radius,
        ];

        const dist = [1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0];

        const geometry = new PIXI.Geometry().addAttribute("position", indices, 2).addAttribute("dist", dist, 1);
        return geometry;
    }
}
