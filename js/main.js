const SHADERS = new Map([
	["water-1", {
		label: "Water 1",
		desc: "First ever attempt at making shaders.",
		date: "20th Apr 2025"
	}]
]);

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

function navbarButtonClickHandler(event) {
	const clickedButton = event.target.closest("[data-shader]");
	if (!clickedButton) return;

	const targetShaderName = clickedButton.dataset.shader;
	const targetShader = SHADERS.get(targetShaderName);
	if (!targetShader) {
		console.error(`Unknown target shader: '${targetShaderName}'`);
		return;
	}
}

function init() {
	setupNavbar();
}

init();
