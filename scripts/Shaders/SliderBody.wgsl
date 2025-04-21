struct CustomUniforms {
    // Vertex Uniforms
    dx: f32,
    ox: f32,
    dy: f32,
    oy: f32,
    inverse: f32,
    startt: f32,
    endt: f32,
    stackOffset: f32,
    ballPosition: vec2<f32>,
    // Fragment Uniforms
    circleBaseScale: f32,
    alpha: f32,
    bodyAlpha: f32,
    borderColor: vec4<f32>,
    innerColor: vec4<f32>,
    outerColor: vec4<f32>,
    borderWidth: f32,
}

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) dist : f32,
}

@group(0) @binding(0) var<uniform> customUniforms : CustomUniforms;

@vertex
fn vsMain(
    @location(0) aPosition: vec4<f32>,
    @location(1) isCirc: f32,
) -> VertexOutput {
    var dist = aPosition[3];

    var distance_var = 0.0;
    if (aPosition[2] < customUniforms.startt || aPosition[2] > customUniforms.endt) {
        distance_var = 1.0;
    }

    var x: f32 = aPosition.x;
    var y: f32 = aPosition.y;

    if (isCirc == 1.0) {
        x += customUniforms.ballPosition.x;
        y += customUniforms.ballPosition.y;
    }

    if (customUniforms.inverse > 0) {
        y = 384.0 - y;
    }

    var z: f32 = aPosition[3] + 2.0 * distance_var;

    var offset_x = customUniforms.ox;
    var offset_y = customUniforms.oy;

    if (isCirc == 1.0) {
        return VertexOutput(
            vec4<f32>(
                -1.0 + x * customUniforms.dx + offset_x,
                (y * customUniforms.dy + 1.0) + offset_y,
                aPosition[3],
                1.0
            ),
            dist
        );
    }

    return VertexOutput(
        vec4<f32>(
            -1.0 + x * customUniforms.dx + offset_x,
            (y * customUniforms.dy + 1.0) + offset_y,
            z,
            1.0
        ),
        dist
    );
}

@fragment
fn fsMain(
    input: VertexOutput
) -> @location(0) vec4<f32> {
    var position = input.dist / customUniforms.circleBaseScale;

    var a = 1.0;
    var innerWidth = 1.0 - customUniforms.borderWidth;
    var blurRate = 0.02;

    var color: vec4<f32> = mix(customUniforms.innerColor, customUniforms.outerColor, position);

    if (position >= innerWidth + blurRate) {
        color = customUniforms.borderColor;
    }

    if (position < innerWidth) {
        a = customUniforms.bodyAlpha;
    }

    if (1.0 - position < blurRate) {
        a = (1.0 - position) / blurRate; 
    }

    if (position >= innerWidth && position < innerWidth + blurRate) {
        var mu: f32 = (position - innerWidth) / blurRate;
        color = customUniforms.borderColor * mu + (1.0 - mu) * color;

        a = 1.0 * mu + (1.0 - mu) * customUniforms.bodyAlpha;
    }

    color[3] = 1.0;

    if (position > 1.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }
    
    return vec4<f32>(color[0], color[1], color[2], 1.0) * a * customUniforms.alpha;
    // return vec4<f32>(vec3<f32>(1.0 - position), 1.0);
}