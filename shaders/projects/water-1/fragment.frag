#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

out vec4 outColor;

void main() {

	// Note to self: The letters "UV" are axes/coords of the 2D texture because "XYZ" are already in use.
	// Results in range of 0 - 1
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;

	// Shift UV to range of 0 - 2 then -1 - 1
	uv = uv * 2.0 - 1.0;

	float waveHeight = 0.0;
	waveHeight += sin(uv.x * 20.0 + u_time * 1.0) * 0.03; // Horizontal, small, frequent and slow waves
	waveHeight += sin(uv.x * 10.0 + u_time * 1.2) * 0.03; // Horizontal, large, less frequent and fast waves
	waveHeight += sin(uv.y *  2.0 + u_time * 0.3) * 0.09; // Vertical, top to bottom

	vec3 color = vec3(0.02f, 0.28f, 0.44f) + waveHeight;

	outColor = vec4(color, 1.0);
}
