precision mediump float;
attribute vec4 position;
attribute float isCirc;

out float dist;

uniform float dx, ox, dy, oy, dt, ot;
uniform float inverse;
uniform vec2 ballPosition;

void main() {
    dist = position[3];

    float t = 0.0;
    float offset = 1.0;

    if (isCirc == 0.0) {
        t = dt;
        offset = ot;
    };

    float distance_var = 0.0;
    if (position[2] * t > offset) distance_var = 1.0;

    float y;

    if (isCirc == 1.0) {
        y = inverse == 0.0 ? (ballPosition.y + position.y) : 384.0 - (ballPosition.y + position.y);
        gl_Position = vec4(-1.0 + (ballPosition.x + position.x) * dx + ox, (y * dy + 1.0) + oy, position[3] + 2.0 * distance_var, 1.0);
    } else {
        y = inverse == 0.0 ? position[1] : 384.0 - position[1];
        gl_Position = vec4(-1.0 + position.x * dx + ox, (y * dy + 1.0) + oy, position[3] + 2.0 * distance_var, 1.0);
    }
}