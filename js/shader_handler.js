import { SHADERS } from "./shaders.js";

let isCurrentlyBusy = false;

function fetchShaderData(path, index, targetArray) {
	return new Promise((resolve, reject) => {
		fetch(path)
			.then(response => response.text())
			.then(text => {
				targetArray[index] = text;
				resolve(true);
			})
			.catch(error => reject(error));
	});
}

/**
 * Fetch all data related to a shader
 * @param {String} shaderName Name of the shader to load
 * @returns {Promise} Promise resolving with `{vertexSource, fragmentSource}`
 */
function getShaderData(shaderName) {
	return new Promise((resolve, reject) => {

		// Abort if busy
		if (isCurrentlyBusy) {
			reject(`Attempted loading new shader (${shaderName}) while not done loading previous one!`);
			return;
		}
		isCurrentlyBusy = true;

		// Get data on target shader
		const shaderData = SHADERS.get(shaderName);
		if (!shaderData) {
			reject(`Attempted loading unknown shader (${shaderName})!`);
			return;
		}

		// Fetch all vertex and fragment data
		const promises = [];
		const vertexData = [];
		const fragmentData = [];
		let nVertex = 0;
		let nFragment = 0;

		// Order matters
		for (const fileName of shaderData.sharedVertex) {
			promises.push(fetchShaderData(
				`../shaders/shared/vertex/${fileName}.glsl`,
				nVertex++,
				vertexData
			));
		}

		for (const fileName of shaderData.vertex) {
			promises.push(fetchShaderData(
				`../shaders/${shaderName}/${fileName}.glsl`,
				nVertex++,
				vertexData
			));
		}

		for (const fileName of shaderData.sharedFragment) {
			promises.push(fetchShaderData(
				`../shaders/shared/fragment/${fileName}.glsl`,
				nFragment++,
				fragmentData
			));
		}

		for (const fileName of shaderData.fragment) {
			promises.push(fetchShaderData(
				`../shaders/${shaderName}/${fileName}.glsl`,
				nFragment++,
				fragmentData
			));
		}

		// Wait for all fetches to complete
		Promise.all(promises)
			.then(() => {
				const vertexSource = vertexData.join("\n");
				const fragmentSource = fragmentData.join("\n");

				resolve({vertexSource, fragmentSource});
			})
			.catch(error => {
				reject(error);
			});
	});
}

export function changeShader(shaderName) {
	getShaderData(shaderName)
		.then(({vertexSource, fragmentSource}) => {
			// TODO: Compile
		});
}
