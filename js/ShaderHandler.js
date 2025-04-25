import { gl, SHADERS } from "./main.js";

export class ShaderHandler {
	#shaderId;
	#program;
	#geometryModules;
	#uniforms = {};

	constructor(shaderId) {
		this.#shaderId = shaderId;
	}

	/**
	 * Load all shader files from a specific directory and get their text contents
	 * @param {String} path Path to the files to be fetched
	 * @param {String[]} files Array of file names to fetch
	 * @returns {Promise<Array>} Awaitable promise
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
	 * @returns {Promise<Object>} Awaitable promise
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
	 * @returns {Promise<Array>} Awaitable promise
	 */
	static async #getGeometryModules(shaderId) {
		const shaderData = SHADERS.get(shaderId);

		try {
			const modules = await Promise.all([
				...(shaderData.sharedGeometry ?? []).map(fileName => import(`../shaders/shared/geometry/${fileName}`)),
			 	...(shaderData.geometry ?? []).map(fileName => import(`../shaders/projects/${shaderId}/${fileName}`))
			]);

			return modules.flatMap(mod => Object.values(mod));
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Get draw count required to display all vertices
	 * @param {Number} numVertices Number of total vertices in an array
	 * @param {Boolean} isTwoDimensional True if 2D, false if 3D
	 * @param {GLenum} drawMode A `WebGL2RenderingContext` constant
	 * @returns {Number} Amount of draw counts required to draw shape
	 */
	static #getDrawCount(numVertices, isTwoDimensional, drawMode) {
		const vertexCount = numVertices / (isTwoDimensional ? 2 : 3);

		switch (drawMode) {
			case WebGL2RenderingContext.POINTS:
				return vertexCount;

			case WebGL2RenderingContext.LINE_STRIP:
				return Math.max(vertexCount - 1, 0);

			case WebGL2RenderingContext.LINE_LOOP:
				return Math.max(vertexCount, 0);

			case WebGL2RenderingContext.LINES:
				return Math.floor(vertexCount / 2) * 2;

			case WebGL2RenderingContext.TRIANGLE_STRIP:
			case WebGL2RenderingContext.TRIANGLE_FAN:
				return Math.max(vertexCount - 2, 0);

			case WebGL2RenderingContext.TRIANGLES:
				return Math.floor(vertexCount / 3) * 3;
		
			default:
				throw new Error(`Unsupported draw-mode '${drawMode}'!`);
		}
	}

	/**
	 * Setting up geometry modules with VAO/VBO and miscellaneous fields
	 * @param {Array} geometryModules All geometry modules as an array
	 * @param {WebGLShader} program Shader program to use
	 */
	static #setupGeometryModules(geometryModules, program) {
		geometryModules.forEach((geometryData, index) => {

			// Vertex Array Object
			const vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			geometryModules[index].vao = vao;

			// Vertex Buffer Object
			const vbo = gl.createBuffer();
			gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, vbo);
			gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, geometryData.attributes.a_position, WebGL2RenderingContext.STATIC_DRAW);

			// Location
			const loc = gl.getAttribLocation(program, "a_position");
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(loc, 2, WebGL2RenderingContext.FLOAT, false, 0, 0);

			// Does this have to be called iteratively?
			gl.bindVertexArray(null);
			gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null);

			// Calculate vertex count
			geometryModules[index].drawCount = ShaderHandler.#getDrawCount(
				geometryData.attributes.a_position.length,
				geometryData.twoDimensional,
				geometryData.drawMode
			);
		});
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

			this.#program = ShaderHandler.#createShaderProgram(vertexShader, fragmentShader);

			gl.useProgram(this.#program);

			this.#uniforms.u_time = gl.getUniformLocation(this.#program, "u_time");
			this.#uniforms.u_resolution = gl.getUniformLocation(this.#program, "u_resolution");

			this.#geometryModules = await ShaderHandler.#getGeometryModules(this.#shaderId);
			ShaderHandler.#setupGeometryModules(this.#geometryModules, this.#program);

			requestAnimationFrame(this.#render.bind(this));
		} catch (error) {
			console.error("An error occurred during shader initialization:\n", error);
		}
	}
}
