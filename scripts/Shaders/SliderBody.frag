in float dist;

out vec4 finalColor;

uniform float circleBaseScale;

void main() {
    float position = dist / circleBaseScale;
    finalColor = vec4(vec3(1.0 - position), 1.0) * (position > 1.0 ? 0.0 : 1.0);
}