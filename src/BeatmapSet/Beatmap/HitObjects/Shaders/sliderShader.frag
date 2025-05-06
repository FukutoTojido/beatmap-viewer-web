in float dist;
out vec4 finalColor;

uniform vec4 borderColor;
uniform vec4 innerColor;
uniform vec4 outerColor;
uniform float borderWidth;

void main() {
    float position = dist;

    float a = 1.0;
    float innerWidth = 1.0 - borderWidth;
    float blurRate = 0.02;
    float bodyAlpha = 0.7;

    // Set body color
    vec4 color = mix(innerColor, outerColor, position);

    // Set border color
    if (position >= innerWidth + blurRate) {
        color = borderColor;
    }

    // Set body alpha
    if (position < innerWidth) {
        a = bodyAlpha;
    }

    // Anti-aliasing at outer edge
    if (1.0 - position < blurRate) {
        a = (1.0 - position) / blurRate; 
    }

    // Anti-aliasing at inner edge
    if (position >= innerWidth && position < innerWidth + blurRate) {
        float mu = (position - innerWidth) / blurRate;
        color = borderColor * mu + (1.0 - mu) * color;

        // a = 1.0;
        // if (skinning != 0.0) a = 1.0 * mu + (1.0 - mu) * 0.7;
        a = 1.0 * mu + (1.0 - mu) * 1.0 * bodyAlpha;
    }

    color.a = 1.0;
    finalColor = vec4(color.rgb, 1.0) * a;
}