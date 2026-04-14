import MathUtil from "../engine/math/MathUtil"
import Node from "./Node"

function preContext(e: Event) {
    e.preventDefault()
}

export default class GLRenderer extends Node {
    autoRender: boolean
    style: {width: number, height: number}
    domElement: HTMLDivElement
    dom: HTMLDivElement
    canvas: HTMLCanvasElement
    gl: WebGLRenderingContext | WebGL2RenderingContext
    container: HTMLElement
    __ticker__: number
    __needUpdate__: boolean
    __needResizeCanvas__: boolean
    stats: any
    fpsDom: HTMLDivElement

    constructor({el, fps, autoRender = true}: {el: string | HTMLElement, fps?: boolean, autoRender?: boolean}) {
        super()
        this.autoRender = autoRender
        this.style = {
            width: 0,
            height: 0
        }
        this.domElement = document.createElement('div')
        this.domElement.style.cssText = 'width: 100%;height: 100%;position: relative;user-select:none;'
        this.dom = document.createElement('div')
        this.dom.style.cssText = 'position: absolute;overflow:hidden;left:0;right:0;top:0;bottom:0'
        this.domElement.appendChild(this.dom)
        this.canvas = document.createElement('canvas')
        this.canvas.addEventListener("contextmenu", preContext)
        this.gl = this.canvas.getContext('webgl2', {
            antialias: true,
            preserveDrawingBuffer: true
        }) || this.canvas.getContext('webgl', {
            antialias: true,
            preserveDrawingBuffer: true
        }) as WebGLRenderingContext

        this.dom.appendChild(this.canvas)

        this.container = this.convertDom(el)
        this.container.appendChild(this.domElement)

        this.updateSelf = this.updateSelf.bind(this)
        this.__tick__ = this.__tick__.bind(this)
        this.__needUpdate__ = true
        this.__needResizeCanvas__ = true
        if (this.autoRender) this.__ticker__ = requestAnimationFrame(this.__tick__)

        if (fps) {
            this.fpsDom = document.createElement('div')
            this.fpsDom.style.cssText = 'position:absolute;top:10px;left:10px;'
            this.domElement.appendChild(this.fpsDom)
        }
        this.__checkSize__()
    }

    convertDom(selectorOrDom: string | HTMLElement) {
        if (!selectorOrDom) throw new Error('需要传入一个dom元素或者dom选择器')
        let container: HTMLElement
        if (typeof selectorOrDom === 'string') {
            container = document.querySelector(selectorOrDom) as HTMLElement
            if (!container) {
                throw new Error('dom元素不存在:' + selectorOrDom)
            }
        } else if (selectorOrDom instanceof HTMLElement) {
            container = selectorOrDom
        } else {
            throw new Error('需要传入一个dom元素或者dom选择器')
        }
        return container
    }

    __checkSize__() {
        let width = MathUtil.deal(this.domElement.clientWidth)
        let height = MathUtil.deal(this.domElement.clientHeight)
        if (this.style.width === width && this.style.height === height) return
        const oldWidth = this.style.width
        const oldHeight = this.style.height
        this.style.width = width
        this.style.height = height
        this.fire('resize', {newWidth: width, newHeight: height, oldWidth, oldHeight})
        this.__needResizeCanvas__ = true
        this.__needUpdate__ = true
    }

    __tick__() {
        this.__ticker__ = requestAnimationFrame(this.__tick__)
        this.draw()
    }

    updateSelf() {
        this.__needUpdate__ = true
    }

    draw() {
        this.__checkSize__()
        if (!this.__needUpdate__) {
            return
        }
        this.__needUpdate__ = false
        if (this.__needResizeCanvas__) {
            this.canvas.width = this.style.width * window.devicePixelRatio
            this.canvas.height = this.style.height * window.devicePixelRatio
            this.canvas.style.width = this.style.width + 'px'
            this.canvas.style.height = this.style.height + 'px'
            this.__needResizeCanvas__ = false
        }
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        this.render(this.gl)
    }

    render(gl: WebGLRenderingContext | WebGL2RenderingContext) {

    }

    destroy() {
        this.domElement.remove()
        cancelAnimationFrame(this.__ticker__)
        this.canvas.removeEventListener("contextmenu", preContext)
        super.destroy()
    }
}
