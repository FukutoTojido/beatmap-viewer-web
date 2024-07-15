precision mediump float;

uniform vec4 tint;
uniform vec4 nodeTint;
uniform float selected;
uniform float skinType;
uniform float isReverse;

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
    float blurRate = 0.05;
    float alpha = 1.0;
    float totalAlpha = skinType == 0.0 ? 1.0 : 0.7;

    vec4 outerColor = darken(tint, 0.1);
    vec4 innerColor = tint;

    if (colorDist > 1.0 - blurRate)
        alpha = (1.0 - colorDist) / blurRate;

    if (skinType != 0.0) {
        vec4 color = mix(outerColor, innerColor, colorDist);
        if (selected > 0.0) {
            color = tint;
            totalAlpha = 1.0;
        }

        color.a = 1.0;
        gl_FragColor = totalAlpha * alpha * color;
    } else {
        outerColor = darken(tint, 0.4);
        vec4 color = colorDist > 0.8 ? outerColor : innerColor;
        if (selected > 0.0) {
            color = tint;

            if (colorDist > 0.8) {
                color = vec4(0.93, 0.67, 0.0, 1.0);
            }

            totalAlpha = 1.0;
        }

        if (isReverse > 0.0) {
            color = nodeTint;
        }

        color.a = 1.0;
        gl_FragColor = totalAlpha * alpha * color;
    }
}