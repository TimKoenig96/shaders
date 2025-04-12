import { SHADERS } from "./shaders.js";

let isCurrentlyBusy = false;

/**
 * Fetch a GLSL shader
 * @param {String} path Full path including file name
 * @param {Number} index Nth position in compile queue
 * @param {Array} targetArray Array to insert resulting code into
 * @returns {Promise}
 */
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

		// Get target shader data
		const shaderData = SHADERS.get(shaderName);

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

/**
 * Change the displayed shader
 * @param {String} shaderName Name of the shader
 */
export async function changeShader(shaderName) {

	// Abort if busy
	if (isCurrentlyBusy) {
		console.error(`Attempted loading new shader (${shaderName}) while not done loading previous one!`);
		return;
	}

	isCurrentlyBusy = true;

	// Abort if shader does not exist
	if (!SHADERS.has(shaderName)) {
		console.error(`Attempted loading unknown shader (${shaderName})!`);
		return;
	}

	try {

		// Attempt fetching shader source data
		const {vertexSource, fragmentSource} = await getShaderData(shaderName);
	} catch (error) {
		console.error(error);
	} finally {
		isCurrentlyBusy = false;
	}
}
