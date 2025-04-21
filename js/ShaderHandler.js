import { SHADERS } from "./main.js";

export class ShaderHandler {
	#shaderId;
	#shaderData;

	constructor(shaderId) {
		this.#shaderId = shaderId;
		this.#shaderData = SHADERS.get(shaderId);
	}

	/**
	 * Load all files from a specific directory and get their text contents
	 * @param {String} path Path to the files to be fetched
	 * @param {String[]} files Array of file names to fetch
	 * @returns {Promise} Awaitable promise
	 */
	static #loadShaderFiles(path, files) {
		return Promise.all(files.map(async (fileName) => {
			const resp = await fetch(`${path}${fileName}`);

			if (resp.status !== 200) throw new Error(`Unable to fetch '${path}${fileName}' (${resp.statusText})`);

			const text = await resp.text();
			return text;
		}));
	}

	/**
	 * Get all vertex and fragment data for the current shader
	 * @returns {Object}
	 */
	async #getShaderData() {
		try {
			const [sharedVertexSources, vertexSources, sharedFragmentSources, fragmentSources] = await Promise.all([
				ShaderHandler.#loadShaderFiles("../shaders/shared/vertex/", this.#shaderData.sharedVertex ?? []),
				ShaderHandler.#loadShaderFiles(`../shaders/projects/${this.#shaderId}/`, this.#shaderData.vertex ?? []),
				ShaderHandler.#loadShaderFiles("../shaders/shared/fragment/", this.#shaderData.sharedFragment ?? []),
				ShaderHandler.#loadShaderFiles(`../shaders/projects/${this.#shaderId}/`, this.#shaderData.fragment ?? [])
			]);

			const vertexSource = [...sharedVertexSources, ...vertexSources].join("\n");
			const fragmentSource = [...sharedFragmentSources, ...fragmentSources].join("\n");

			return { vertexSource, fragmentSource };
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Initialize and start rendering the shader
	 */
	async initializeAndStart() {
		try {
			const { vertexSource, fragmentSource } = await this.#getShaderData();
		} catch (error) {
			console.error("An error occurred during shader initialization:\n", error);
		}
	}
}
