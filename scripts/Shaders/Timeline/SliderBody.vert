precision mediump float;
attribute vec2 position;
attribute float dist;

varying float colorDist;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

void main() {
    colorDist = dist;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}