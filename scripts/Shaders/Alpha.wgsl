struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

struct CustomUniforms {
    alpha: f32,
    bodyAlpha: f32,
    borderColor: vec4<f32>,
    innerColor: vec4<f32>,
    outerColor: vec4<f32>,
    borderWidth: f32
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vTextureCoord: vec2<f32>
}

@group(0) @binding(0) var<uniform> globalUniforms: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

@group(1) @binding(0) var<uniform> customUniforms: CustomUniforms;

fn filterTextureCoord(
    aPosition: vec2<f32>
) -> vec2<f32> {
    return aPosition * (globalUniforms.uOutputFrame.zw * globalUniforms.uInputSize.zw);
}

@vertex
fn vsMain(
    @location(0) aPosition: vec2<f32>
) -> VertexOutput {
    var position: vec2<f32> = aPosition * globalUniforms.uOutputFrame.zw + globalUniforms.uOutputFrame.xy;

    position[0] = position[0] * (2 / globalUniforms.uOutputTexture.x) - 1;
    position[1] = (position[1] * (2 * globalUniforms.uOutputTexture.z / globalUniforms.uOutputTexture.y) - globalUniforms.uOutputTexture.z);

    return VertexOutput(
        vec4<f32>(position, 0, 1),
        filterTextureCoord(aPosition)
    );
}

@fragment
fn fsMain(
    input : VertexOutput
) -> @location(0) vec4<f32> {
    let tex: vec4<f32> = textureSample(uTexture, uSampler, input.vTextureCoord);
    var dist: f32 = 1.0 - tex[0];

    var a: f32 = 1.0;
    var innerWidth: f32 = 1.0 - customUniforms.borderWidth;
    var blurRate: f32 = 0.02;

    var position = dist;

    // Set body color
    var color: vec4<f32> = mix(customUniforms.innerColor, customUniforms.outerColor, position);

    // Set border color
    if (position >= innerWidth + blurRate) {
        color = customUniforms.borderColor;
    }

    // Set body alpha
    if (position < innerWidth) {
        a = customUniforms.bodyAlpha;
    }

    // Anti-aliasing at outer edge
    if (1.0 - position < blurRate) {
        a = (1.0 - position) / blurRate; 
    }

    // Anti-aliasing at inner edge
    if (position >= innerWidth && position < innerWidth + blurRate) {
        var mu: f32 = (position - innerWidth) / blurRate;
        color = customUniforms.borderColor * mu + (1.0 - mu) * color;

        // a = 1.0;
        // if (skinning != 0.0) a = 1.0 * mu + (1.0 - mu) * 0.7;
        a = 1.0 * mu + (1.0 - mu) * customUniforms.bodyAlpha;
    }

    color[3] = 1.0;

    return color * a * customUniforms.alpha;
}