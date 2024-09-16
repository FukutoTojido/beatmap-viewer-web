in vec2 vUV;
uniform float t;
uniform float a;
uniform vec4 color;

vec4 getColor(float x) {
    x = mod(x - t, 1.0) * 4.0;

    float blurRate = 0.02;

    if (mod(x, 1.0) >= 0.0 && mod(x, 1.0) < blurRate) {
        if (mod(floor(x), 2.0) == 0.0)
            return vec4(color.rgb * (mod(x, 1.0) / blurRate), 1.0);
        
        return vec4(color.rgb * (1.0 - mod(x, 1.0) / blurRate), 1.0);
    }

    if (mod(floor(x), 2.0) == 0.0) {
        return color;
    }

    return vec4(0.0, 0.0, 0.0, 1.0);
}

void main() {
    float x = (vUV.x - 0.5) * 2.0;
    float y = (vUV.y - 0.5) * 2.0;
    float dist = sqrt(x * x + y * y);
    float blurRate = 0.02;

    if (dist >= 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    float max_x = sqrt(1.0 - y * y) * 0.8 + 0.2;
    float virt_x = max_x == 0.0 ? 0.0 : x / max_x; 
    float dest_x = asin(virt_x) / (3.14159265358 / 2.0);
    vec4 fcolor = getColor(dest_x / 2.0 + 0.5);

    if (dist < 1.0 && dist >= 1.0 - blurRate) {
        float diff = 1.0 - dist;
        gl_FragColor = fcolor * (diff / blurRate) * a;
        return;
    }

    gl_FragColor = fcolor * a;
}