import GL3DLayer from "../../core/layers/GL3DLayer";
import GLBuffer from "../../engine/webgl/GLBuffer";
import MapUtil from "../../core/data/MapUtil";
import GLProject from "../../engine/webgl/GLProject";
import pointShader from "./pointShader";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import ArrayUtils from "../../engine/utils/ArrayUtils";
import Matrix3D from "../../engine/math/Matrix3D";
import MathUtil from "../../engine/math/MathUtil";
import AnimationUtil from "../../engine/animation/AnimationUtil";

export default class Scatter extends GL3DLayer {
    props: any = {
        blur: 0.8,
        lighter: true
    }
    pointIndex: any = null
    time: number = 0
    needRefresh: boolean = true
    needUpdateCache: boolean = true
    renderMatrix: any = null
    screenPoints: any = []
    datas: any = []
    ticker: any = null
    pointProject: any = null
    colorsBuffer: any = null
    pointsBuffer: any = null

    constructor() {
        super()
        this.on('destroy', () => {
            this.setBreathEnable(false)
            if (this.pointProject) this.pointProject.destroy()
            if (this.colorsBuffer) this.colorsBuffer.destroy()
            if (this.pointsBuffer) this.pointsBuffer.destroy()
        })

        this.on('mouseout', () => {
            if (this.pointIndex !== null) {
                this.fire("pointOut", this.pointIndex)
                this.pointIndex = null
            }
        })
        this.on('click', () => {
            this.fire("pointClick", this.pointIndex)
        })
    }

    contain(ray: any): boolean {
        if (!this.pointsBuffer || !this.pointsBuffer.length) return false
        if (this.needUpdateCache || !this.renderMatrix || !ArrayUtils.itemEqual(ray.matrix, this.renderMatrix)) {
            this.renderMatrix = ray.matrix
            this.needUpdateCache = false
            this.computeCache(this.renderMatrix, ray.size)
        }
        for (let i = 0, l = this.screenPoints.length; i < l; i++) {
            let p = this.screenPoints[i]
            let size = p[2] / 2
            let distance = MathUtil.distance(ray.mouse[0], ray.mouse[1], p[0], p[1])
            if (distance <= size) {
                if (this.pointIndex !== i) {
                    if (this.pointIndex !== null) {
                        this.fire("pointOut", this.pointIndex)
                    }
                    this.pointIndex = i
                    if (this.pointIndex !== null) {
                        this.fire("pointOver", this.pointIndex)
                    }
                }
                return true
            }
        }
        return false
    }

    computeCache(matrix: any, size: any) {
        let points: any = []
        let h = this.mapData.convertSize(this.height)

        for (let i = 0, l = this.pointsBuffer.length; i < l; i += 3) {
            let x = this.pointsBuffer.array[i]
            let y = this.pointsBuffer.array[i + 1]
            let pointSize = this.pointsBuffer.array[i + 2]
            let screenPoint = Matrix3D.transformPoint(matrix, [x, y, h])
            points.push([(screenPoint[0] + 1) / 2 * size[0], (1 - screenPoint[1]) / 2 * size[1], pointSize])

        }
        this.screenPoints = points
    }

    refresh() {
        this.needRefresh = true
        this.needUpdateCache = true
        this.updateSelf()
    }

    setBreathEnable(enable: boolean) {
        this.time = 0
        AnimationUtil.cancelTick(this.ticker)
        if (!enable) return
        this.ticker = AnimationUtil.tick((delta: number) => {
            this.time += delta
            this.updateSelf()
        })
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.updateSelf()
    }

    setData(datas: any) {
        this.datas = datas || []
        let hasBreath = false
        for (let row of this.datas) {
            if (row.breath > 0) {
                hasBreath = true
                break
            }
        }
        this.setBreathEnable(hasBreath)
        this.refresh()
    }

    refreshBuffer(gl: any) {
        if (!this.needRefresh) return
        this.needRefresh = false
        let points = new Float32Array(this.datas.length * 4)
        let colors = new Float32Array(this.datas.length * 4)
        for (let i = 0, l = this.datas.length; i < l; i++) {
            let data = this.datas[i]
            let offset = i * 4
            let p = MapUtil.convert([data.lng, data.lat])
            if (!p) continue
            points[offset] = p[0]
            points[offset + 1] = p[1]
            points[offset + 2] = data.size
            points[offset + 3] = data.breath || 0
            let color = data.color || [1, 1, 1, 1]
            colors[offset] = color[0]
            colors[offset + 1] = color[1]
            colors[offset + 2] = color[2]
            colors[offset + 3] = color[3]
        }
        if (!this.pointsBuffer) {
            this.pointsBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, points)
        } else {
            this.pointsBuffer.setData(points)
        }
        if (!this.colorsBuffer) {
            this.colorsBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, colors)
        } else {
            this.colorsBuffer.setData(colors)
        }
    }

    render(gl: any, matrix: any, { pitch = 0 }: any) {
        if (!this.datas || !this.datas.length || !this.mapData) return
        if (!this.pointProject) {
            this.pointProject = new GLProject(gl, pointShader)
        }

        this.refreshBuffer(gl)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        this.pointProject.use()
        this.pointProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uBlur: {
                data: 0.49 - this.props.blur * 0.48
            },
            uHeight: {
                data: this.mapData.convertSize(this.height)
            },
            uTime: {
                data: this.time
            },
            uPitch: {
                data: Math.cos(pitch)
            }
        })
        this.pointProject.setAttributes({
            aVertexPosition: {
                data: this.pointsBuffer,
                size: 4
            },
            aVertexColor: {
                data: this.colorsBuffer,
                size: 4
            }
        })
        if (this.props.lighter) {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        } else {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        }
        gl.drawArrays(gl.POINTS, 0, this.datas.length)
    }
}
