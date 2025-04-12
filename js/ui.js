import { SHADERS } from "./shaders.js";

let navbar, canvas, perfTimer;
export let ctx;

export function setupPage() {

	// Get elements
	navbar = document.getElementById("navbar");
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("webgl")
	perfTimer = document.getElementById("perfTimer");

	// Add all buttons to navbar
	for (const [identifier, { label }] of SHADERS) {
		const button = document.createElement("input");

		button.type = "button";
		button.value = label;
		button.dataset.targetShader = identifier;


		navbar.appendChild(button);
	}
}
