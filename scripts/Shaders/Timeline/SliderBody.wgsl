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
    tint: vec4<f32>,
}

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
@group(2) @binding(0) var<uniform> customUniforms : CustomUniforms;


struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) dist : f32,
}

@vertex
fn vsMain(
    @location(0) position : vec2<f32>,
    @location(1) dist : f32,
) -> VertexOutput {
    var mvp = globalUniforms.projectionMatrix * globalUniforms.worldTransformMatrix * localUniforms.uTransformMatrix;

    return VertexOutput(
        vec4<f32>(mvp * vec3<f32>(position, 1.0), 1.0), 
        dist
    );
};

@fragment
fn fsMain(input : VertexOutput) -> @location(0) vec4<f32>{
    return customUniforms.tint * globalUniforms.worldColorAlpha;
}
