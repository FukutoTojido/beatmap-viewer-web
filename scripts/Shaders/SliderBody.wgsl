struct GlobalUniforms {
    projectionMatrix : mat3x3<f32>,
    worldTransformMatrix : mat3x3<f32>,
    worldColorAlpha : vec4<f32>,
    uResolution : vec2<f32>,
}

struct LocalUniforms {
    uTransformMatrix : mat3x3<f32>,
    uColor : vec4<f32>,
    uRound : f32,
}

struct CustomUniforms {
    // Vertex Uniforms
    dx: f32,
    dy: f32,
    dt: f32,
    ox: f32,
    oy: f32,
    ot: f32,
    inverse: bool,
    // Fragment Uniforms
    border_width: f32,
    circle_base_scale: f32,
    outer_color: vec4<f32>,
    inner_color: vec4<f32>,
    border_color: vec3<f32>
}

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) dist : f32,
}

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
@group(2) @binding(0) var<uniform> customUniforms : CustomUniforms;

@vertex
fn vsMain(
    @location(0) position: vec4<f32>
) -> VertexOutput {
    var direction_var : f32 = 0;
    var y = position[1];

    if (possition[2] * dt > ot) {
        direction_var = 1.0;
    }

    if (inverse) {
        y = 384 - position[1];
    }

    return VertexOutput(
        vec4<f32>(
            -1.0 + position[0] * dx + ox,
            y * dy + 1.0 + oy,
            position[3] + 2 * direction_var,
            1.0
        ),
        position[3]
    )
}

@fragment
fn fsMain(
    input: VertexOutput
) -> @location(0) vec4<f32> {
    const blur_rate : f32 = 0.03;
    let inner_width : f32 = 1 - border_width;
    let position : f32 = input.dist / circle_base_scale;

    var color : vec4<f32> = mix(innerColor, outerColor, position);

    // Anti-aliasing
    var a : f32: 1.0;

    if (1.0 - position < blur_rate) {
        a = (1 - position) / blur_rate;
    }

    if (positon >= inner_width && position < inner_width + blur_rate) {
        
    }

    if (position >= inner_width) {
        color = border_color;
    }
}