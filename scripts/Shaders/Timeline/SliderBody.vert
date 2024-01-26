precision mediump float;
attribute vec2 position;
attribute float dist;

varying float colorDist;

uniform mat3 projectionMatrix;
uniform mat3 worldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
    colorDist = dist;
    gl_Position = vec4((projectionMatrix * worldTransformMatrix * uTransformMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}