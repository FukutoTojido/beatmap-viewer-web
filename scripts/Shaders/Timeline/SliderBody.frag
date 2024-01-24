precision mediump float;

uniform vec4 tint;
uniform bool selected;

varying float colorDist;

vec4 lighten(vec4 color, float amount) {
    amount *= 0.5;
    color.r = min(1.0, color.r * (1.0 + 0.5 * amount) + 1.0 * amount);
    color.g = min(1.0, color.g * (1.0 + 0.5 * amount) + 1.0 * amount);
    color.b = min(1.0, color.b * (1.0 + 0.5 * amount) + 1.0 * amount);

    return color;
}

vec4 darken(vec4 color, float amount) {
    float scalar = max(1.0, 1.0 + amount);
    color.r = min(1.0, color.r / scalar);
    color.g = min(1.0, color.g / scalar);
    color.b = min(1.0, color.b / scalar);
    return color;
}

void main() {
    float blurRate = 0.1;
    float alpha = 1.0;
    float totalAlpha = 0.7;

    vec4 outerColor = darken(tint, 0.1);
    vec4 innerColor = tint;

    vec4 color = mix(outerColor, innerColor, colorDist);
    if (selected) {
        color = tint;
        totalAlpha = 1.0;
    }

    color.a = 1.0;

    if (colorDist > 1.0 - blurRate)
        alpha = (1.0 - colorDist) / blurRate;

    gl_FragColor = totalAlpha * alpha * color;
}