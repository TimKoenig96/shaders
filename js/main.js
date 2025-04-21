import { ShaderHandler } from "./ShaderHandler.js";

export const SHADERS = new Map([
	["water-1", {
		label: "Water 1",
		desc: "First ever attempt at making shaders.",
		date: "20th Apr 2025"
	}]
]);

let currentShader;
let canvas, gl, perfTimer, canvasWidth, canvasHeight;


function setupNavbar() {
	const navbar = document.getElementById("navbar");

	for (const [identifier, { label, desc, date }] of SHADERS) {
		const button = document.createElement("div");
		button.classList.add("button");

		button.innerHTML = `
			<p class="label">${label ?? "MISSING LABEL: " + identifier}</p><hr>
			<p class="desc">${desc ?? "MISSING DESC: " + identifier}</p><hr>
			<p class="date">${date ?? "MISSING DATE: " + identifier}</p>
		`;

		button.dataset.shader = identifier;
		navbar.appendChild(button);
	}

	navbar.addEventListener("click", navbarButtonClickHandler);
}

async function switchShader(shaderId) {
	if (currentShader) await currentShader.kill();

	currentShader = new ShaderHandler(shaderId);
	currentShader.initializeAndStart();
}

function navbarButtonClickHandler(event) {
	const clickedButton = event.target.closest("[data-shader]");
	if (!clickedButton) return;

	const shaderId = clickedButton.dataset.shader;
	if (!SHADERS.has(shaderId)) {
		console.error(`Unknown target shader: '${shaderId}'`);
		return;
	}

	const newUrl = new URL(document.location.href);
	newUrl.searchParams.set("shader", encodeURIComponent(shaderId));
	history.pushState({}, "", newUrl);

	switchShader(shaderId);
}

function applySearchParameters() {
	const searchParams = new URLSearchParams(window.location.search);
	if (!searchParams.has("shader")) return;

	const shaderId = decodeURIComponent(searchParams.get("shader"));
	if (SHADERS.has(shaderId)) switchShader(shaderId);
}

function resizeCanvasToFit() {
	canvasWidth  = canvas.clientWidth;
	canvasHeight = canvas.clientHeight;

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	gl.viewport(0, 0, canvasWidth, canvasHeight);
}

function init() {
	canvas = document.getElementById("canvas");
	gl = canvas.getContext("webgl2");
	perfTimer = document.getElementById("perfTimer");

	window.addEventListener("resize", resizeCanvasToFit);
	resizeCanvasToFit();

	setupNavbar();
	applySearchParameters();
}

init();
