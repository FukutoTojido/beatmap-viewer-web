precision mediump float;
attribute vec4 aPosition;
attribute float isCirc;

out float dist;

uniform float dx, ox, dy, oy, dt, ot;
uniform float inverse;
uniform vec2 ballPosition;
// uniform float stackOffset;

// uniform mat3 uProjectionMatrix;
// uniform mat3 uWorldTransformMatrix;
// uniform mat3 uTransformMatrix;

void main() {
    dist = aPosition[3];

    float t = dt;
    float offset = ot;

    if (isCirc == 1.0) {
        t = 0.0;
        offset = 1.0;
    };

    float distance_var = 0.0;
    if (aPosition[2] * t > offset) distance_var = 1.0;

    // float y;
    // mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;

    // if (isCirc == 1.0) {
    //     y = inverse == 0.0 ? (ballPosition.y + aPosition.y) : 384.0 - (ballPosition.y + aPosition.y);
    //     // gl_Position = vec4(-1.0 + (ballPosition.x + aPosition.x) * dx + ox, (y * dy + 1.0) + oy, aPosition[3] + 2.0 * distance_var, 1.0);
    //     gl_Position = vec4((mvp * (vec3(ballPosition.x + aPosition.x + stackOffset, y + stackOffset, 1.0))).xy, aPosition[3] + 2.0 * distance_var, 1.0);
    // } else {
    //     y = inverse == 0.0 ? aPosition[1] : 384.0 - aPosition[1];
    //     // gl_Position = vec4(-1.0 + aPosition.x * dx + ox, (y * dy + 1.0) + oy, aPosition[3] + 2.0 * distance_var, 1.0);
    //     gl_Position = vec4((mvp * (vec3(aPosition.x + stackOffset, y + stackOffset, 1.0))).xy, aPosition[3] + 2.0 * distance_var, 1.0);
    // }
    float x = aPosition[0];
    float y = aPosition[1];

    if (isCirc == 1.0) {
        x += ballPosition[0];
        y += ballPosition[1];
    }

    y = inverse == 0.0 ? y : 384.0 - y;

    gl_Position = vec4(x, y, aPosition[3] + 2.0 * distance_var, 1.0);
    gl_Position.x = -1.0 + x * dx + ox;
    gl_Position.y = (y * dy + 1.0) + oy;
}