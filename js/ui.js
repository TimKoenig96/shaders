import { SHADERS } from "./shaders.js";
import { changeShader } from "./shader_handler.js";

let navbar;
export let ctx, perfTimer, canvas;

/**
 * Get all required HTML elements
 */
function getElements() {
	navbar = document.getElementById("navbar");
	canvas = document.getElementById("canvas");
	perfTimer = document.getElementById("perfTimer");
}

/**
 * Handle clicks on navbar buttons
 * @param {MouseEvent} event Event triggered by click
 */
function handleNavbarButtonClick(event) {
	const targetShader = event.target.dataset.targetShader;

	// Abort if shader does not exist
	if (!SHADERS.has(targetShader)) {
		console.error(`Attempted loading unknown shader (${targetShader})!`);
		return;
	}

	// Alter URL
	const newUrl = new URL(document.location.href);
	newUrl.searchParams.set("s", targetShader);
	history.pushState({}, "", newUrl);

	// Change the shader
	changeShader(targetShader);
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

		button.addEventListener("click", handleNavbarButtonClick);

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
