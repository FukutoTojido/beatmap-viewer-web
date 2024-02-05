precision mediump float;
attribute vec4 aPosition;
attribute float isCirc;

out float dist;

uniform float dx, ox, dy, oy, dt, ot;
uniform float inverse;
uniform vec2 ballPosition;

void main() {
    dist = aPosition[3];

    float t = 0.0;
    float offset = 1.0;

    if (isCirc == 0.0) {
        t = dt;
        offset = ot;
    };

    float distance_var = 0.0;
    if (aPosition[2] * t > offset) distance_var = 1.0;

    float y;

    if (isCirc == 1.0) {
        y = inverse == 0.0 ? (ballPosition.y + aPosition.y) : 384.0 - (ballPosition.y + aPosition.y);
        gl_Position = vec4(-1.0 + (ballPosition.x + aPosition.x) * dx + ox, (y * dy + 1.0) + oy, aPosition[3] + 2.0 * distance_var, 1.0);
    } else {
        y = inverse == 0.0 ? aPosition[1] : 384.0 - aPosition[1];
        gl_Position = vec4(-1.0 + aPosition.x * dx + ox, (y * dy + 1.0) + oy, aPosition[3] + 2.0 * distance_var, 1.0);
    }
}