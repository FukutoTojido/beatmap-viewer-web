struct CustomUniforms {
    // Vertex Uniforms
    dx: f32,
    ox: f32,
    dy: f32,
    oy: f32,
    dt: f32,
    ot: f32,
    inverse: f32,
    ballPosition: vec2<f32>,
    // Fragment Uniforms
    circleBaseScale: f32,
}

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) dist : f32,
}

@group(0) @binding(0) var<uniform> customUniforms : CustomUniforms;

@vertex
fn vsMain(
    @location(0) position: vec4<f32>,
    @location(1) isCirc: f32
) -> VertexOutput {
    var dist = position[3];

    var t = 0.0;
    var offset = 1.0;

    if (isCirc == 0.0) {
        t = customUniforms.dt;
        offset = customUniforms.ot;
    };

    var distance_var = 0.0;
    if (position[2] * t > offset) {
        distance_var = 1.0;
    }

    var y: f32 = 0;

    if (isCirc == 1.0) {
        if (customUniforms.inverse > 0) {
            y = 384.0 - (customUniforms.ballPosition[1] + position[1]);
        } else {
            y = (customUniforms.ballPosition[1] + position[1]);
        }

        return VertexOutput(
            vec4<f32>(
                -1.0 + (customUniforms.ballPosition[0] + position[0]) * customUniforms.dx + customUniforms.ox, 
                (y * customUniforms.dy + 1.0) + customUniforms.oy,
                position[3] + 2.0 * distance_var,
                1.0
            ),
            dist
        );
    } else {
        if (customUniforms.inverse > 0) {
            y = 384.0 - position[1];
        } else {
            y = position[1];
        }

        return VertexOutput(
            vec4<f32>(
                -1.0 + position[0] * customUniforms.dx + customUniforms.ox, 
                (y * customUniforms.dy + 1.0) + customUniforms.oy,
                position[3] + 2.0 * distance_var,
                1.0
            ),
            dist
        );
    }

    // return VertexOutput(
    //     vec4<f32>(position[0], position[1], 0, 1),
    //     dist
    // );
}

@fragment
fn fsMain(
    input: VertexOutput
) -> @location(0) vec4<f32> {
    var position = input.dist / customUniforms.circleBaseScale;
    // var position = input.dist;
    var alpha = 1.0;

    if (position > 1.0) {
        alpha = 0.0;
    }

    return vec4<f32>(vec3<f32>(1.0 - position), 1.0) * alpha;
}