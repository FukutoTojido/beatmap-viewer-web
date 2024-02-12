@vertex
fn vsMain(
    @location(0) aPosition: vec2f
) -> @builtin(position) vec4f {
    return vec4f(aPosition, 1.0, 1.0);
}

@fragment
fn fsMain(
    @builtin(position) position: vec4f
) -> @location(0) vec4f {
    return vec4f(0, 0, 0, 1);
}