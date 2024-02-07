import * as PIXI from "pixi.js";
import { Game } from "../Game";

export class SliderMeshContainer extends PIXI.RenderContainer {
    constructor(body) {
        super({
            render: (renderer) => {
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
                    let byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
                    glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
                    indexLength = geometry.indexBuffer.data.length;
                }

                function drawCircle() {
                    body.shader.resources.customUniforms.uniforms.dt = 0;
                    body.shader.resources.customUniforms.uniforms.ot = 1;

                    const p = body.ballPosition;
                    body.shader.resources.customUniforms.uniforms.ox += p.x * body.transform.dx;

                    if (Game.MODS.HR) {
                        p.y = 384 - p.y;
                        body.shader.resources.customUniforms.uniforms.oy += p.y * body.transform.dy + (2 * Game.HEIGHT) / Game.APP.renderer.height;
                    } else {
                        body.shader.resources.customUniforms.uniforms.oy += p.y * body.transform.dy;
                    }
     
                    bind(body.circleGeometry, body.shader);
                    gl.drawElements(drawMode, indexLength, glType, 0);
                }

                if (body.startt === 0.0 && body.endt === 1.0) {
                    body.shader.resources.customUniforms.uniforms.dt = 0;
                    body.shader.resources.customUniforms.uniforms.ot = 1;
                    bind(body.geometry, body.shader);
                    gl.drawElements(drawMode, indexLength, glType, 0);
                } else if (body.endt === 1.0) {
                    if (body.startt !== 1.0) {
                        body.shader.resources.customUniforms.uniforms.dt = -1;
                        body.shader.resources.customUniforms.uniforms.ot = -body.startt;
                        bind(body.geometry, body.shader);
                        gl.drawElements(drawMode, indexLength, glType, 0);
                    }

                    drawCircle();
                } else if (body.startt == 0.0) {
                    if (body.endt != 0.0) {
                        body.shader.resources.customUniforms.uniforms.dt = 1;
                        body.shader.resources.customUniforms.uniforms.ot = body.endt;
                        bind(body.geometry, body.shader);
                        gl.drawElements(drawMode, indexLength, glType, 0);
                    }

                    drawCircle();
                } else {
                    console.error("Can't snake both end of a slider!");
                }

                gl.depthFunc(gl.EQUAL);
                gl.colorMask(true, true, true, true);

                if (body.startt == 0.0 && body.endt == 1.0) {
                    gl.drawElements(drawMode, indexLength, glType, 0);
                } else if (body.endt == 1.0) {
                    if (body.startt != 1.0) {
                        gl.drawElements(drawMode, indexLength, glType, 0);
                        body.shader.resources.customUniforms.uniforms.ox = base_ox;
                        body.shader.resources.customUniforms.uniforms.oy = base_oy;
                        body.shader.resources.customUniforms.uniforms.dt = -1;
                        body.shader.resources.customUniforms.uniforms.ot = -body.startt;
                        bind(body.geometry, body.shader);
                    }
                    gl.drawElements(drawMode, indexLength, glType, 0);
                } else if (body.startt == 0.0) {
                    if (body.endt != 0.0) {
                        gl.drawElements(drawMode, indexLength, glType, 0);
                        body.shader.resources.customUniforms.uniforms.ox = base_ox;
                        body.shader.resources.customUniforms.uniforms.oy = base_oy;
                        body.shader.resources.customUniforms.uniforms.dt = 1;
                        body.shader.resources.customUniforms.uniforms.ot = body.endt;
                        bind(body.geometry, body.shader);
                    }
                    gl.drawElements(drawMode, indexLength, glType, 0);
                }

                gl.depthFunc(gl.LESS);
                renderer.state.setDepthTest(false);

                body.shader.resources.customUniforms.uniforms.ox = base_ox;
                body.shader.resources.customUniforms.uniforms.oy = base_oy;
            },
        });
    }
}
