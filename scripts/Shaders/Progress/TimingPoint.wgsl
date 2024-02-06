struct GlobalUniforms {
    uProjectionMatrix : mat3x3<f32>,
    uWorldTransformMatrix : mat3x3<f32>,
    uWorldColorAlpha : vec4<f32>,
    uResolution : vec2<f32>,
}

struct LocalUniforms {
    uTransformMatrix : mat3x3<f32>,
    uColor : vec4<f32>,
    uRound : f32,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vColor: vec3<f32>
}

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;

@vertex
fn vsMain(
    @location(0) aPosition: vec2<f32>,
    @location(1) aColor: vec3<f32>
) -> VertexOutput {
    var mvp: mat3x3<f32> = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * localUniforms.uTransformMatrix;
    var pos: vec3<f32> = mvp * vec3<f32>(
        aPosition[0],
        aPosition[1],
        1.0
    );

    var vColor: vec3<f32> = aColor;

    return VertexOutput(
        vec4<f32>(pos[0], pos[1], 0.0, 1.0),
        vColor
    );
}

@fragment
fn fsMain(
    input: VertexOutput
) -> @location(0) vec4<f32> {
    return vec4<f32>(
        input.vColor[0],
        input.vColor[1],
        input.vColor[2],
        1.0,
    ) * 0.6;
}