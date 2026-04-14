import Node from "../Node"
import Matrix3D from "../../engine/math/Matrix3D"
import Ray from "../Ray"
import MapData from "../data/MapData"

export default class GLPanelLayer extends Node {
    $ignoreEvent: boolean
    $cursor: string
    $zIndex: number
    $visible: boolean
    $height: number
    type: string
    renderingMode: string
    mapData: MapData | null

    constructor() {
        super()
        this.refresh = this.refresh.bind(this)
        this.updateSelf = this.updateSelf.bind(this)
        this.updateHeight = this.updateHeight.bind(this)
        this.$ignoreEvent = false
        this.$cursor = ""
        this.$zIndex = 0
        this.$visible = true
        this.$height = 0
        this.type = 'custom'
        this.renderingMode = '2d'
        this.mapData = null
        this.on('destroy', () => {
            if (this.mapData) {
                this.mapData.off('change', this.refresh)
                this.mapData = null
            }
        })
    }

    set height(val: number) {
        if (this.$height === val) return
        this.$height = val
        this.updateSelf()
        this.updateHeight()
    }

    get height(): number {
        return this.$height
    }

    updateHeight() {

    }

    updateSelf() {
        if (this.parentNode) (this.parentNode as any).updateSelf()
    }

    contain(p: Float32Array): boolean {
        return false
    }

    __contain__(ray: Ray): any {
        if (this.$ignoreEvent || !this.mapData) return false
        let height = this.mapData.convertSize(this.height)
        let l = (height - ray.position[2]) / ray.direction[2]
        let p = Matrix3D.addVectors(ray.position as unknown as number[], [ray.direction[0] * l, ray.direction[1] * l, ray.direction[2] * l])
        return this.contain(p as unknown as Float32Array) ? this : null
    }

    setMapData(mapData: MapData) {
        if (this.mapData) {
            this.mapData.off('change', this.refresh)
        }
        this.mapData = mapData
        if (this.mapData) {
            this.mapData.on('change', this.refresh)
        }
        this.refresh()
    }

    refresh() {

    }

    draw(...args: any[]) {
        if (!this.$visible) return
        this.render(...(args as [WebGLRenderingContext | WebGL2RenderingContext, Float32Array, any]))
    }

    render(gl: WebGLRenderingContext | WebGL2RenderingContext, matrix: Float32Array, options?: any) {

    }
}
