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
    // Fragment Uniforms
    borderColor: vec4<f32>,
    innerColor: vec4<f32>,
    outerColor: vec4<f32>,
    borderWidth: f32,
    bodyAlpha: f32,
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
    @location(0) aPosition: vec4<f32>,
) -> VertexOutput {
    var mvp: mat3x3<f32> = globalUniforms.projectionMatrix * globalUniforms.worldTransformMatrix * localUniforms.uTransformMatrix;
    var x: f32 = aPosition.x;
    var y: f32 = aPosition.y;
    var z: f32 = aPosition.z;

    return VertexOutput(
        vec4<f32>(
            (mvp * vec3<f32>(x, y, 1.0)).xy,
            z,
            1.0
        ),
        z
    );
}

@fragment
fn fsMain(
    input: VertexOutput
) -> @location(0) vec4<f32> {
    var position = input.dist;

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

    color.a = 1.0;    
    return vec4<f32>(color.xyz, 1.0) * a;
}