precision mediump float;
attribute vec4 aPosition;
attribute float isCirc;

out float dist;

uniform float dx, ox, dy, oy;
uniform float inverse;
uniform vec2 ballPosition;
uniform float startt;
uniform float endt;

void main() {
    dist = aPosition[3];

    float distance_var = 0.0;
    if (aPosition[2] < startt || aPosition[2] > endt) distance_var = 1.0;

    float x = aPosition[0];
    float y = aPosition[1];

    if (isCirc == 1.0) {
        x += ballPosition[0];
        y += ballPosition[1];
    }

    y = inverse == 0.0 ? y : 384.0 - y;

    if (isCirc == 1.0) {
        gl_Position = vec4(x, y, aPosition[3], 1.0);
    } else {
        gl_Position = vec4(x, y, aPosition[3] + 2.0 * distance_var, 1.0);
    }
    gl_Position.x = -1.0 + x * dx + ox;
    gl_Position.y = (y * dy + 1.0) + oy;
}