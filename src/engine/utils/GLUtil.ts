import GLProject from "../webgl/GLProject"
import GLBuffer from "../webgl/GLBuffer"
import GLTexture from "../webgl/GLTexture"
import GLRenderTarget from "../webgl/GLRenderTarget"

function createProject(gl: WebGLRenderingContext | WebGL2RenderingContext, source: any) {
    return new GLProject(gl as WebGL2RenderingContext, source)
}

function createBuffer(gl: WebGLRenderingContext | WebGL2RenderingContext, type: number, data: any, mode?: number) {
    if (!mode) {
        mode = gl.STATIC_DRAW
    }
    return new GLBuffer(gl as WebGL2RenderingContext, type, mode, data)
}

function createTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, data: any, options?: any) {
    return new GLTexture(gl as WebGL2RenderingContext, data, options)
}

function createGLRenderTarget(gl: WebGLRenderingContext | WebGL2RenderingContext, width: number, height: number, options?: any) {
    return new GLRenderTarget(gl as WebGL2RenderingContext, width, height, options)
}

export default {
    createProject, createBuffer, createTexture, createGLRenderTarget
}
