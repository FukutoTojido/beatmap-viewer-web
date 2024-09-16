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
    t: f32,
    a: f32,
    color: vec4<f32>
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vUV: vec2<f32>
}

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
@group(2) @binding(0) var<uniform> customUniforms : CustomUniforms;

fn modulo(x: f32, y: f32) -> f32 {
    return x % y;
}

@vertex
fn vsMain(
    @location(0) aPosition: vec2<f32>,
    @location(1) aUV: vec2<f32>
) -> VertexOutput {
    var mvp = globalUniforms.projectionMatrix * globalUniforms.worldTransformMatrix * localUniforms.uTransformMatrix;
    return VertexOutput(
        vec4<f32>(mvp * vec3<f32>(aPosition, 1.0), 1.0),
        aUV
    );
}

fn getColor(x: f32) -> vec4<f32> {
    var x_ = modulo(x - customUniforms.t, 1.0) * 4.0;

    var blurRate = 0.02;

    if (modulo(x_, 1.0) >= 0.0 && modulo(x_, 1.0) < blurRate) {
        if (modulo(floor(x_), 2.0) == 0.0) {
            return vec4<f32>(customUniforms.color.rgb * (modulo(x_, 1.0) / blurRate), 1.0);
        }
        
        return vec4<f32>(customUniforms.color.rgb * (1.0 - modulo(x_, 1.0) / blurRate), 1.0);
    }

    if (modulo(floor(x_), 2.0) == 0.0) {
        return customUniforms.color;
    }

    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}

@fragment
fn fsMain(
    input : VertexOutput
) -> @location(0) vec4<f32> {
    var x = (input.vUV.x - 0.5) * 2.0;
    var y = (input.vUV.y - 0.5) * 2.0;
    var dist = sqrt(x * x + y * y);
    var blurRate = 0.02;

    if (dist >= 1.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }

    var max_x = sqrt(1.0 - y * y) * 0.8 + 0.2;

    var virt_x = 0.0; 
    if (max_x != 0.0) {
        virt_x = x / max_x;
    }

    var dest_x = asin(virt_x) / (3.14159265358 / 2.0);
    var fcolor = getColor(dest_x / 2.0 + 0.5);

    if (dist < 1.0 && dist >= 1.0 - blurRate) {
        var diff = 1.0 - dist;
        return fcolor * (diff / blurRate) * customUniforms.a;
    }

    return fcolor * customUniforms.a;
}