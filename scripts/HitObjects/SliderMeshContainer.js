import * as PIXI from "pixi.js";
import { Game } from "../Game";

import clearSrc from "../Shaders/Clear/Clear.wgsl?raw";
import clearVert from "../Shaders/Clear/Clear.vert?raw";
import clearFrag from "../Shaders/Clear/Clear.frag?raw";

const topologyStringToId = {
	"point-list": 0,
	"line-list": 1,
	"line-strip": 2,
	"triangle-list": 3,
	"triangle-strip": 4,
};

function getGraphicsStateKey(
	geometryLayout,
	shaderKey,
	state,
	blendMode,
	topology,
) {
	return (
		(geometryLayout << 24) | // Allocate the 8 bits for geometryLayouts at the top
		(shaderKey << 16) | // Next 8 bits for shaderKeys
		(state << 10) | // 6 bits for state
		(blendMode << 5) | // 5 bits for blendMode
		topology
	); // And 3 bits for topology at the least significant position
}

const clearGeometry = new PIXI.Geometry({
	attributes: {
		aPosition: new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
	},
	indexBuffer: new Uint16Array([0, 1, 2, 0, 2, 3]),
});

const clearGl = PIXI.GlProgram.from({
	vertex: clearVert,
	fragment: clearFrag,
});

const clearGpu = PIXI.GpuProgram.from({
	vertex: {
		source: clearSrc,
		entryPoint: "vsMain",
	},
	fragment: {
		source: clearSrc,
		entryPoint: "fsMain",
	},
});

const clearShader = PIXI.Shader.from({
	gl: clearGl,
	gpu: clearGpu,
});

const depthFunc = {
	"-1": "always",
	0: "less",
	1: "equal",
};

export class SliderMeshContainer extends PIXI.RenderContainer {
	passCount = 0;

	constructor(body) {
		super({
			render: (renderer) => {
				if (renderer.gpu) {
					this.webGPURender(renderer, body);
				}
				if (renderer.gl) {
					this.webGLRender(renderer, body);
				}
			},
		});
	}

	createPipeline(renderer, geometry, program, state, topology) {
		const device = renderer.gpu.device;
		const buffers = renderer.pipeline._createVertexBufferLayouts(geometry, program);
		const blendModes = renderer.state.getColorTargets(state);

		blendModes[0].writeMask = renderer.pipeline._colorMask;

		const layout = renderer.shader.getProgramData(program).pipeline;
		const descriptor = {
			vertex: {
				module: renderer.pipeline._getModule(program.vertex.source),
				entryPoint: program.vertex.entryPoint,
				buffers,
			},
			fragment: {
				module: renderer.pipeline._getModule(program.fragment.source),
				entryPoint: program.fragment.entryPoint,
				targets: blendModes,
			},
			primitive: {
				topology,
				cullMode: state.cullMode,
			},
			layout,
			multisample: {
				count: renderer.pipeline._multisampleCount,
			},
			// depthStencil,
			label: `PIXI Pipeline`,
		};

		// only apply if the texture has stencil or depth
		if (renderer.pipeline._depthStencilAttachment) {
			// mask states..
			descriptor.depthStencil = {
				...renderer.pipeline._stencilState,
				format: "depth24plus-stencil8",
				depthWriteEnabled: state.depthTest,
				depthCompare: depthFunc[this.passCount],
			};
		}

		const pipeline = device.createRenderPipeline(descriptor);
		return pipeline;
	}

	getPipeline(renderer, geometry, program, state) {
		if (!geometry._layoutKey) {
			PIXI.ensureAttributes(geometry, program.attributeData);

			// prepare the geometry for the pipeline
			renderer.pipeline._generateBufferKey(geometry);
		}

		const topology = geometry.topology;

		const key = getGraphicsStateKey(
			geometry._layoutKey,
			program._layoutKey,
			state.data,
			state._blendModeId,
			topologyStringToId[topology],
		);

		if (renderer.pipeline._pipeCache[key])
			return renderer.pipeline._pipeCache[key];

		renderer.pipeline._pipeCache[key] = this.createPipeline(
			renderer,
			geometry,
			program,
			state,
			topology,
		);
		return renderer.pipeline._pipeCache[key];
	}

	setPipeline(renderer, geometry, program, state) {
		const pipeline = this.getPipeline(renderer, geometry, program, state);
		renderer.encoder.setPipeline(pipeline);
	}

	draw(renderer, geometry, shader, state) {
		renderer.renderTarget.renderTarget.depth = true;
		this.setPipeline(renderer, geometry, shader.gpuProgram, state);
		renderer.encoder.setGeometry(geometry, shader.gpuProgram);
		renderer.encoder._setShaderBindGroups(shader, undefined);

		renderer.encoder.renderPassEncoder.drawIndexed(
			geometry.indexBuffer.data.length,
			geometry.instanceCount,
			0,
		);
	}

	drawGPUSlider(renderer, body, state) {
		const base_ox = body.transform.ox;
		const base_oy = body.transform.oy;

		body.shader.resources.customUniforms.uniforms.ox = base_ox;
		body.shader.resources.customUniforms.uniforms.oy = base_oy;

		this.draw(renderer, body.geometry, body.shader, state);
	}

	drawGPUCircle(renderer, body, state) {
		this.draw(renderer, body.circleGeometry, body.shader, state);
	}

	webGPURender(renderer, body) {
		const state = PIXI.State.for2d();
		state.depthTest = true;

        const base_ox = body.transform.ox;
		const base_oy = body.transform.oy;

		// Clear Depth
		// VERY IMPORTANT
		this.passCount = -1;
		renderer.pipeline.setColorMask(0b0000);
		this.draw(renderer, clearGeometry, clearShader, state);

		// Set min depth
		// ALSO VERY IMPORTANT
		this.passCount = 0;
		renderer.pipeline.setColorMask(0b0000);

		body.shader.resources.customUniforms.uniforms.startt = body.startt;
		body.shader.resources.customUniforms.uniforms.endt = body.endt;

		this.drawGPUSlider(renderer, body, state);
		if (!(body.startt === 0.0 && body.endt === 1.0))
			this.drawGPUCircle(renderer, body, state);

		// le draw
		// IMPORTANT
		this.passCount = 1;
		renderer.pipeline.setColorMask(0b1111);

		this.drawGPUSlider(renderer, body, state);
		if (!(body.startt === 0.0 && body.endt === 1.0))
			this.drawGPUCircle(renderer, body, state);

		state.depthTest = false;
		body.shader.resources.customUniforms.uniforms.ox = base_ox;
		body.shader.resources.customUniforms.uniforms.oy = base_oy;
	}

	webGLRender(renderer, body) {
		const state = PIXI.State.for2d();
		const drawMode = 4;

		const gl = renderer.gl;
		gl.clearDepth(1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		gl.colorMask(false, false, false, false);

		renderer.state.set(state);
		renderer.state.setDepthTest(true);

		let glType;
		let indexLength;

		const base_ox = body.transform.ox;
		const base_oy = body.transform.oy;

		function bind(geometry, shader) {
			renderer.shader.bind(shader);
			renderer.geometry.bind(geometry, shader.glProgram);
			const byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
			glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
			indexLength = geometry.indexBuffer.data.length;
		}

		function drawCircle() {
			bind(body.circleGeometry, body.shader);
			gl.drawElements(drawMode, indexLength, glType, 0);
		}

		function drawSlider() {
			body.shader.resources.customUniforms.uniforms.ox = base_ox;
			body.shader.resources.customUniforms.uniforms.oy = base_oy;

			bind(body.geometry, body.shader);
			gl.drawElements(drawMode, indexLength, glType, 0);
		}

		body.shader.resources.customUniforms.uniforms.startt = body.startt;
		body.shader.resources.customUniforms.uniforms.endt = body.endt;

		// First pass
		if (!(body.startt === 0.0 && body.endt === 1.0)) drawCircle();
		drawSlider();

		gl.depthFunc(gl.EQUAL);
		gl.colorMask(true, true, true, true);

		// Second pass
		if (!(body.startt === 0.0 && body.endt === 1.0)) drawCircle();
		drawSlider();

		gl.depthFunc(gl.LESS);

		renderer.state.setDepthTest(false);

		body.shader.resources.customUniforms.uniforms.ox = base_ox;
		body.shader.resources.customUniforms.uniforms.oy = base_oy;
	}
}
