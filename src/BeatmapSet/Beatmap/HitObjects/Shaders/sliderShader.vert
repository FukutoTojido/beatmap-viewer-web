in vec3 aPosition;
out float dist;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
    dist = aPosition.z;

    float x = aPosition.x;
    float y = aPosition.y;

    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;

    gl_Position = vec4((mvp * vec3(x, y, 1.0)).xy, dist, 1.0);
}