import { SHADERS } from "./shaders.js";
import { changeShader } from "./shader_handler.js";

let navbar, canvas, perfTimer;
export let ctx;

/**
 * Get all required HTML elements
 */
function getElements() {
	navbar = document.getElementById("navbar");
	canvas = document.getElementById("canvas");
	perfTimer = document.getElementById("perfTimer");
}

/**
 * Setup listeners, get elements, etc.
 */
export function setupPage() {
	getElements();
	ctx = canvas.getContext("webgl2");

	// Add all buttons to navbar
	for (const [identifier, { label }] of SHADERS) {
		const button = document.createElement("input");

		button.type = "button";
		button.value = label;
		button.dataset.targetShader = identifier;

		button.addEventListener("click", (event) => changeShader(event.target.dataset.targetShader));

		navbar.appendChild(button);
	}
}
