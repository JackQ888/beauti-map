import Node from "./Node"
import Ray from "./Ray"

export default class GLGroup extends Node {
    $ignoreEvent: boolean
    $zIndex: number
    $visible: boolean

    constructor() {
        super()
        this.updateSelf = this.updateSelf.bind(this)
        this.$ignoreEvent = false
        this.$zIndex = 0
        this.$visible = true
    }

    updateSelf() {
        if (this.parentNode) (this.parentNode as any).updateSelf()
    }

    draw(...args: any[]) {
        if (!this.$visible) return
        this.render(...(args as [WebGLRenderingContext | WebGL2RenderingContext, Float32Array, any]))
    }

    render(gl: WebGLRenderingContext | WebGL2RenderingContext, matrix: Float32Array, options?: any) {
        for (let child of this.getSortRenderChildren()) {
            child.draw(gl, matrix, options)
        }
    }

    __contain__(ray: Ray): any {
        if (this.$ignoreEvent) return false
        let children = this.getSortRenderChildren()
        for (let i = children.length - 1; i >= 0; i--) {
            let child = children[i] as any
            let evt = child.__contain__(ray)
            if (evt) return evt
        }
        return null
    }

    getSortRenderChildren(): GLGroup[] {
        let list: any[] = []
        for (let child of this.children) {
            let zIndex = Math.max(0, (child as any).$zIndex)
            let current = list[zIndex]
            if (!current) {
                list[zIndex] = current = []
            }
            current.push(child)
        }
        let sorts: any[] = []
        for (let current of list) {
            if (!current) continue
            for (let item of current) {
                sorts.push(item)
            }
        }
        return sorts
    }
}
