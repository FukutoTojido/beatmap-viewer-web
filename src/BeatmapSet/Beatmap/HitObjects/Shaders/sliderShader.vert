in vec4 aPosition;
// in float isCirc;
out float dist;
// out float progress;
// out float isCircle;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
    dist = aPosition.z;
    // progress = aPosition.w;
    // isCircle = isCirc;

    float x = aPosition.x;
    float y = aPosition.y;

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;

    gl_Position = vec4((mvp * vec3(x, y, 1.0)).xy, dist, 1.0);
}