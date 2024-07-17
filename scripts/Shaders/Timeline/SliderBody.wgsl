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
    selected: f32,
    skinType: f32,
    isReverse: f32,
    nodeTint: vec4<f32>
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

fn darken(color: vec4<f32>, strength: f32) -> vec4<f32> {
    var scalar: f32 = max(1.0, 1.0 + strength);
    var ret: vec4<f32> = vec4<f32>(0, 0, 0, 1);

    ret[0] = min(1.0, color[0] / scalar);
    ret[1] = min(1.0, color[1] / scalar);
    ret[2] = min(1.0, color[2] / scalar);

    return ret;
}

@fragment
fn fsMain(input : VertexOutput) -> @location(0) vec4<f32>{
    var blurRate = 0.05;
    var alpha = 1.0;

    var totalAlpha = 0.7;

    var tint = customUniforms.tint;

    var outerColor = darken(tint, 0.1);
    var innerColor = tint;

    if (input.dist > 1.0 - blurRate) {
        alpha = (1.0 - input.dist) / blurRate;
    }

    if (customUniforms.skinType != 0.0) {
        var color = mix(outerColor, innerColor, input.dist);

        if (customUniforms.selected > 0.0) {
            color = tint;
            totalAlpha = 1.0;
        }

        color[3] = 1.0;

        return color * alpha * totalAlpha;
    } else {
        totalAlpha = 1.0;

        outerColor = darken(tint, 0.4);
        
        var color = outerColor;
        if (input.dist <= 0.8) {
            color = innerColor;
        }

        if (customUniforms.selected > 0.0) {
            color = tint;
            if (input.dist > 0.8) {
                color = vec4<f32>(0.93, 0.67, 0.0, 1.0);
            }

            totalAlpha = 1.0;
        }

        if (customUniforms.isReverse > 0.0) {
            color = customUniforms.nodeTint;
        }

        color[3] = 1.0;
        return color * alpha * totalAlpha;
    }

}
