import { changeShader } from "./shader_handler.js";
import { SHADERS } from "./shaders.js";
import { setupPage } from "./ui.js";

/**
 * Initialize page
 */
function init() {

	// Set up page
	setupPage();

	// Get search parameters if any
	const targetShader = new URLSearchParams(document.location.search).get("s");

	// Load specific shader
	if (targetShader && SHADERS.has(targetShader)) changeShader(targetShader);
}

init();
