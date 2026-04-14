import shader from "./shader"
import GLRenderTarget from "../../engine/webgl/GLRenderTarget"
import GLProject from "../../engine/webgl/GLProject"
import GLBuffer from "../../engine/webgl/GLBuffer"
import ObjectUtil from "../../engine/utils/ObjectUtil"

export default class BlurFilterElement {
    props: { blurX: number, blurY: number, quality: number }
    inited: boolean
    commonBuffer: GLBuffer | null
    renderTarget: GLRenderTarget | null
    renderTarget1: GLRenderTarget | null
    project: GLProject | null

    constructor(props?: any) {
        this.props = {
            blurX: 0.5,
            blurY: 2,
            quality: 0.5
        }
        this.setProps(props)
        this.inited = false
        this.commonBuffer = null
        this.renderTarget = null
        this.renderTarget1 = null
        this.project = null
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
    }

    init(gl: WebGLRenderingContext, texture: any) {
        this.commonBuffer = new GLBuffer(gl as WebGL2RenderingContext, gl.ARRAY_BUFFER,
            gl.STATIC_DRAW,
            new Float32Array([
                0, 1,
                1, 1,
                0, 0,
                1, 0]))
        this.renderTarget = new GLRenderTarget(gl as WebGL2RenderingContext, texture.width, texture.height, {premultiplyAlpha: true})
        this.renderTarget1 = new GLRenderTarget(gl as WebGL2RenderingContext, texture.width, texture.height, {premultiplyAlpha: true})
        this.project = new GLProject(gl as WebGL2RenderingContext, shader)
        this.project.setAttributes({
            aVertexPosition: {
                data: this.commonBuffer,
                size: 2
            }
        })
    }

    doFilter(gl: WebGLRenderingContext, texture: any) {
        if (!texture) return null
        if (!this.inited) {
            this.inited = true
            this.init(gl, texture)
        }

        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        let beforeViewPort = gl.getParameter(gl.VIEWPORT)
        this.project!.use()
        this.project!.setAttributes({
            aVertexPosition: {
                data: this.commonBuffer!,
                size: 2
            }
        })
        this.renderTarget!.setSize(texture.width / 2, texture.height / 2)
        this.renderTarget1!.setSize(texture.width / 2, texture.height / 2)
        this.renderTarget1!.use()
        this.renderTarget1!.clear()
        this.renderTarget!.use()
        this.renderTarget!.clear()
        texture.use(0)
        let blurXSize = this.props.blurX, blurYSize = this.props.blurY
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        let target = this.renderTarget, target1 = this.renderTarget1
        for (let i = 0; i < 2 + 10 * this.props.quality; i++) {
            target1!.use()
            target1!.clear()
            target!.getTexture().use(0)
            this.project!.setUniforms({
                uDirection: {
                    data: [0, blurYSize / texture.height]
                }
            })
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            let temp = target
            target = target1
            target1 = temp

            target1!.use()
            target1!.clear()
            target!.getTexture().use(0)
            this.project!.setUniforms({
                uDirection: {
                    data: [blurXSize / texture.width, 0]
                }
            })
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            temp = target
            target = target1
            target1 = temp
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(beforeViewPort[0], beforeViewPort[1], beforeViewPort[2], beforeViewPort[3])

        return target!.getTexture()
    }

    destroy() {
        if (!this.inited) return
        if (this.commonBuffer) {
            this.commonBuffer.destroy()
            this.commonBuffer = null
        }
        if (this.renderTarget) {
            this.renderTarget.destroy()
            this.renderTarget = null
        }
        if (this.renderTarget1) {
            this.renderTarget1.destroy()
            this.renderTarget1 = null
        }
        if (this.project) {
            this.project.destroy()
            this.project = null
        }
    }
}
