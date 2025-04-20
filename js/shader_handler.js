import { SHADERS } from "./shaders.js";
import { canvas, ctx, perfTimer } from "./ui.js";

let isBusy = false;
let isRendering = false;
let program;

let prevRenderTime;
let renderTimeDeltas = [];
let renderTimeIndex = 0;
const MAX_RENDER_TIMES = 100;

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
				`../shaders/shared/vertex/${fileName}.vert`,
				nVertex++,
				vertexData
			));
		}

		for (const fileName of shaderData.vertex) {
			promises.push(fetchShaderData(
				`../shaders/projects/${shaderName}/${fileName}.vert`,
				nVertex++,
				vertexData
			));
		}

		for (const fileName of shaderData.sharedFragment) {
			promises.push(fetchShaderData(
				`../shaders/shared/fragment/${fileName}.frag`,
				nFragment++,
				fragmentData
			));
		}

		for (const fileName of shaderData.fragment) {
			promises.push(fetchShaderData(
				`../shaders/projects/${shaderName}/${fileName}.frag`,
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
 * Compile a given shader
 * @param {Number} shaderType Shader type constant
 * @param {String} shaderSource Shader source code
 * @returns {WebGLShader} Compiled shader
 */
function compileShader(shaderType, shaderSource) {

	// Create the shader
	const shader = ctx.createShader(shaderType);

	// Set source and compile shader
	ctx.shaderSource(shader, shaderSource);
	ctx.compileShader(shader);

	// Error handling
	if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
		const info = ctx.getShaderInfoLog(shader);
		ctx.deleteShader(shader);
		throw new Error(`Unable to compile shader:\n${info}`);
	}

	return shader;
}

/**
 * Create a shader program to be used by the canvas
 * @param {String} vertexSource Source code of vertex shader
 * @param {String} fragmentSource Source code of fragment shader
 */
function createShaderProgram(vertexSource, fragmentSource) {

	// Compile shaders
	const vertexShader = compileShader(ctx.VERTEX_SHADER, vertexSource);
	const fragmentShader = compileShader(ctx.FRAGMENT_SHADER, fragmentSource);

	// Create shader program
	const program = ctx.createProgram();

	// Link canvas to program
	ctx.attachShader(program, vertexShader);
	ctx.attachShader(program, fragmentShader);
	ctx.linkProgram(program);

	// Error handling
	if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
		const info = ctx.getProgramInfoLog(program);
		ctx.deleteProgram(program);
		throw new Error(`Unable to link program:\n${info}`);
	}

	// Validation
	ctx.validateProgram(program);
	if (!ctx.getProgramParameter(program, ctx.VALIDATE_STATUS))
		console.warn("Program failed to validate:", ctx.getProgramInfoLog(program));

	return program;
}

function getAverageFps(newTime) {

	// If first time running
	if (prevRenderTime === undefined) {
		prevRenderTime = newTime;
		return "";
	}

	// Delta in milliseconds
	const delta = newTime - prevRenderTime;

	// Insert delta into render times
	renderTimeDeltas[renderTimeIndex] = delta;

	// Update render time index
	renderTimeIndex = (renderTimeIndex + 1) % MAX_RENDER_TIMES;

	// Update prev render time
	prevRenderTime = newTime;

	// Calculate average render time
	let sum = 0;
	const len = renderTimeDeltas.length;
	for (let i = 0; i < len; i++) sum += renderTimeDeltas[i];
	const avg = sum / len;

	// Convert render time to FPS
	const fps = 1000 / avg;

	return Math.ceil(fps);
}

function render(ms) {
	ctx.uniform1f(ctx.getUniformLocation(program, "u_time"), ms / 1000.0);
	ctx.uniform2f(ctx.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);

	ctx.useProgram(program);
	ctx.clear(ctx.COLOR_BUFFER_BIT);
	ctx.drawArrays(ctx.TRIANGLES, 0, 3);

	perfTimer.textContent = `${getAverageFps(ms)}fps`;

	requestAnimationFrame(render);
}

/**
 * Change the displayed shader
 * @param {String} shaderName Name of the shader
 */
export async function changeShader(shaderName) {

	// Abort if busy
	if (isBusy) {
		console.error(`Attempted loading new shader (${shaderName}) while not done loading previous one!`);
		return;
	}

	isBusy = true;

	try {

		// Attempt fetching shader source data
		const {vertexSource, fragmentSource} = await getShaderData(shaderName);

		// Stash old shader program
		const oldProgram = program;

		// Create new shader program
		const newProgram = createShaderProgram(vertexSource, fragmentSource);

		// Use new program
		ctx.useProgram(newProgram);

		// Switch variables
		program = newProgram;

		// Start rendering
		if (!isRendering) {
			isRendering = true;
			requestAnimationFrame(render);
		}

		// Delete old program
		if (oldProgram) ctx.deleteProgram(oldProgram);
	} catch (error) {
		console.error(error);
	} finally {
		isBusy = false;
	}
}
