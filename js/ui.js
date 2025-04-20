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
	const targetElement = event.target.closest("[data-target-shader]");
	if (!targetElement) return;

	const targetShaderName = targetElement.dataset.targetShader;
	if (!SHADERS.has(targetShaderName)) {
		console.warn(`Attempted loading unknown shader: ${targetShaderName}`);
		return;
	}

	// Alter URL
	const newUrl = new URL(document.location.href);
	newUrl.searchParams.set("s", targetShaderName);
	history.pushState({}, "", newUrl);

	// Change the shader
	changeShader(targetShaderName);
}

/**
 * Setting up navbar buttons for each existing shader
 */
function setupNavbarButtons() {
	for (const [identifier, { label, desc, date }] of SHADERS) {
		const button = document.createElement("div");
		button.classList.add("button");

		button.innerHTML = `
			<p class="label">${label ?? "MISSING LABEL: " + identifier}</p><hr>
			<p class="desc">${desc ?? "MISSING DESC: " + identifier}</p><hr>
			<p class="date">${date ?? "MISSING DATE: " + identifier}</p>
		`;

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
