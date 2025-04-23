import { gl, SHADERS } from "./main.js";

export class ShaderHandler {
	#shaderId;
	#program;
	#geometryModules;

	constructor(shaderId) {
		this.#shaderId = shaderId;
	}

	/**
	 * Load all shader files from a specific directory and get their text contents
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
	 * Load all geometry modules from a specific directory
	 * @param {String} path Path to the modules to be imported
	 * @param {String[]} files Array of file names to import
	 * @returns {Promise} Awaitable promise
	 */
	static #loadGeometryModules(path, files) {
		return Promise.all(files.map(async (fileName) => {
			const module = await import(`${path}${fileName}`);
			return module;
		}));
	}

	/**
	 * Compile a shaders' source code into a usable WebGL shader
	 * @param {Number} shaderType Either `WebGL2RenderingContext.VERTEX_SHADER` or `.FRAGMENT_SHADER`
	 * @param {String} shaderSource Shader source code
	 * @returns {WebGLShader}
	 */
	static #compileShader(shaderType, shaderSource) {
		const shader = gl.createShader(shaderType);

		gl.shaderSource(shader, shaderSource);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, WebGL2RenderingContext.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(`Unable to compile shader:\n${info}`);
		}

		return shader;
	}

	/**
	 * Create and set up a program with provided shaders
	 * @param {WebGLShader} vertexShader Compiled vertex shader
	 * @param {WebGLShader} fragmentShader Compiled fragment shader
	 * @returns {WebGLProgram}
	 */
	static #createShaderProgram(vertexShader, fragmentShader) {
		const program = gl.createProgram();

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, WebGL2RenderingContext.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(`Unable to link program"\n${info}`);
		}

		gl.validateProgram(program);

		if (!gl.getProgramParameter(program, WebGL2RenderingContext.VALIDATE_STATUS)) {
			const info = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(`Failed to validate program:\n${info}`);
		}

		return program;
	}

	/**
	 * Get all vertex and fragment data for the current shader
	 * @param {String} shaderId Shader ID
	 * @returns {Object}
	 */
	static async #fetchShaderSourceCode(shaderId) {
		const shaderData = SHADERS.get(shaderId);

		try {
			const [sharedVertexSources, vertexSources, sharedFragmentSources, fragmentSources] = await Promise.all([
				ShaderHandler.#loadShaderFiles("../shaders/shared/vertex/", shaderData.sharedVertex ?? []),
				ShaderHandler.#loadShaderFiles(`../shaders/projects/${shaderId}/`, shaderData.vertex ?? []),
				ShaderHandler.#loadShaderFiles("../shaders/shared/fragment/", shaderData.sharedFragment ?? []),
				ShaderHandler.#loadShaderFiles(`../shaders/projects/${shaderId}/`, shaderData.fragment ?? [])
			]);

			const vertexSource = [...sharedVertexSources, ...vertexSources].join("\n");
			const fragmentSource = [...sharedFragmentSources, ...fragmentSources].join("\n");

			return { vertexSource, fragmentSource };
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Get all geometry modules for the current shader
	 * @param {String} shaderId Shader ID
	 * @returns {Array}
	 */
	static async #getGeometries(shaderId) {
		const shaderData = SHADERS.get(shaderId);

		try {
			const [rawSharedGeometry, rawGeometry] = await Promise.all([
				ShaderHandler.#loadGeometryModules("../shaders/shared/geometry/", shaderData.sharedGeometry ?? []),
				ShaderHandler.#loadGeometryModules(`../shaders/projects/${shaderId}/`, shaderData.geometry ?? [])
			]);

			return [...rawSharedGeometry, ...rawGeometry];
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Render a frame
	 * @param {Number} ms Automatically provided by `requestAnimationFrame`
	 */
	#render(ms) {
		gl.useProgram(this.#program);
		gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);

		// TODO: Drawing
		/* Note `gl.drawArrays(mode, first, count);`
			Since mode can be multiple GL enums, needs to be specified per shader, eg. via geometry JS file
			No reason in having first be anything other than 0 for now
			Count should be dynamically calculated based on amount of vertices and mode chosen
		*/

		// TODO: Performance timer measurement

		requestAnimationFrame(this.#render.bind(this));
	}

	/**
	 * Initialize and start rendering the shader
	 */
	async initializeAndStart() {
		try {
			const { vertexSource, fragmentSource } = await ShaderHandler.#fetchShaderSourceCode(this.#shaderId);

			const vertexShader = ShaderHandler.#compileShader(WebGL2RenderingContext.VERTEX_SHADER, vertexSource);
			const fragmentShader = ShaderHandler.#compileShader(WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource);

			this.#geometryModules = await ShaderHandler.#getGeometries(this.#shaderId);

			this.#program = ShaderHandler.#createShaderProgram(vertexShader, fragmentShader);

			gl.useProgram(this.#program);

			requestAnimationFrame(this.#render.bind(this));
		} catch (error) {
			console.error("An error occurred during shader initialization:\n", error);
		}
	}
}
