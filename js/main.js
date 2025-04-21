import { ShaderHandler } from "./ShaderHandler.js";

const SHADERS = new Map([
	["water-1", {
		label: "Water 1",
		desc: "First ever attempt at making shaders.",
		date: "20th Apr 2025"
	}]
]);

let currentShader;


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

async function switchShader(shaderName) {
	if (currentShader) await currentShader.kill();

	const shaderData = SHADERS.get(shaderName);

	currentShader = new ShaderHandler(shaderName, shaderData);
	currentShader.initialize();
}

function navbarButtonClickHandler(event) {
	const clickedButton = event.target.closest("[data-shader]");
	if (!clickedButton) return;

	const shaderName = clickedButton.dataset.shader;
	if (!SHADERS.has(shaderName)) {
		console.error(`Unknown target shader: '${shaderName}'`);
		return;
	}

	const newUrl = new URL(document.location.href);
	newUrl.searchParams.set("shader", encodeURIComponent(shaderName));
	history.pushState({}, "", newUrl);

	switchShader(shaderName);
}

function applySearchParameters() {
	const searchParams = new URLSearchParams(window.location.search);
	if (!searchParams.has("shader")) return;

	const shaderName = decodeURIComponent(searchParams.get("shader"));
	if (SHADERS.has(shaderName)) switchShader(shaderName);
}

function init() {
	setupNavbar();
	applySearchParameters();
}

init();
