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

struct CustomUniforms {
    // Vertex Uniforms
    dx: f32,
    ox: f32,
    dy: f32,
    oy: f32,
    dt: f32,
    ot: f32,
    inverse: f32,
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

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
@group(2) @binding(0) var<uniform> customUniforms : CustomUniforms;

@vertex
fn vsMain(
    @location(0) aPosition: vec4<f32>,
    @location(1) isCirc: f32
) -> VertexOutput {
    var dist = aPosition[3];

    var t = 0.0;
    var offset = 1.0;

    if (isCirc == 0.0) {
        t = customUniforms.dt;
        offset = customUniforms.ot;
    };

    var distance_var = 0.0;
    if (aPosition[2] * t > offset) {
        distance_var = 1.0;
    }

    var y: f32 = 0;
    var mvp: mat3x3<f32> = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * localUniforms.uTransformMatrix;

    if (isCirc == 1.0) {
        if (customUniforms.inverse > 0) {
            y = 384.0 - (customUniforms.ballPosition[1] + aPosition[1]);
        } else {
            y = (customUniforms.ballPosition[1] + aPosition[1]);
        }

        var pos: vec3<f32> = mvp * vec3<f32>(
            customUniforms.ballPosition[0] + aPosition[0] + customUniforms.stackOffset,
            y + customUniforms.stackOffset,
            1.0
        );

        return VertexOutput(
            vec4<f32>(
                pos[0], 
                pos[1],
                aPosition[3] + 2.0 * distance_var,
                1.0
            ),
            dist
        );
    } else {
        if (customUniforms.inverse > 0) {
            y = 384.0 - aPosition[1];
        } else {
            y = aPosition[1];
        }

        
        var pos: vec3<f32> = mvp * vec3<f32>(
            aPosition[0] + customUniforms.stackOffset,
            y + customUniforms.stackOffset,
            1.0
        );

        return VertexOutput(
            vec4<f32>(
                pos[0], 
                pos[1],
                aPosition[3] + 2.0 * distance_var,
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

    // var a = 1.0;
    // var innerWidth = 1.0 - customUniforms.borderWidth;
    // var blurRate = 0.02;

    // var color: vec4<f32> = mix(customUniforms.innerColor, customUniforms.outerColor, position);

    // if (position >= innerWidth + blurRate) {
    //     color = customUniforms.borderColor;
    // }

    // if (position < innerWidth) {
    //     a = customUniforms.bodyAlpha;
    // }

    // if (1.0 - position < blurRate) {
    //     a = (1.0 - position) / blurRate; 
    // }

    // if (position >= innerWidth && position < innerWidth + blurRate) {
    //     var mu: f32 = (position - innerWidth) / blurRate;
    //     color = customUniforms.borderColor * mu + (1.0 - mu) * color;

    //     a = 1.0 * mu + (1.0 - mu) * customUniforms.bodyAlpha;
    // }

    // color[3] = 1.0;

    if (position > 1.0) {
        return vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }
    
    // return vec4<f32>(color[0], color[1], color[2], 1.0) * a * customUniforms.alpha;
    return vec4<f32>(vec3<f32>(1.0 - position), 1.0);
}