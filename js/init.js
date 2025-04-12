import { changeShader } from "./shader_handler.js";
import { setupPage } from "./ui.js";

function init() {

	// Set up page
	setupPage();

	// Get search parameters if any
	const targetShader = new URLSearchParams(document.location.search).get("s");

	// Load specific shader
	if (targetShader) changeShader(targetShader);
}

init();
