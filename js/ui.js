import { SHADERS } from "./shaders.js";
import { changeShader } from "./shader_handler.js";

let navbar, canvas;
export let ctx, perfTimer;

/**
 * Get all required HTML elements
 */
function getElements() {
	navbar = document.getElementById("navbar");
	canvas = document.getElementById("canvas");
	perfTimer = document.getElementById("perfTimer");
}

/**
 * Setting up navbar buttons for each existing shader
 */
function setupNavbarButtons() {
	for (const [identifier, { label }] of SHADERS) {
		const button = document.createElement("input");

		button.type = "button";
		button.value = label;
		button.dataset.targetShader = identifier;

		button.addEventListener("click", (event) => changeShader(event.target.dataset.targetShader));

		navbar.appendChild(button);
	}
}

/**
 * Set canvas to actual size and refresh viewport
 */
function windowResizeHandler() {
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	ctx.viewport(0, 0, canvas.width, canvas.height);
}

/**
 * Setup listeners, get elements, etc.
 */
export function setupPage() {
	getElements();
	ctx = canvas.getContext("webgl2");

	setupNavbarButtons();

	window.addEventListener("resize", windowResizeHandler);
	windowResizeHandler();
}
