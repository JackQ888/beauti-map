import GL3DLayer from "../../core/layers/GL3DLayer";
import GLBuffer from "../../engine/webgl/GLBuffer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import TubeUtil from "../../utils/TubeUtil";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import MathUtil from "../../engine/math/MathUtil";
import Matrix3D from "../../engine/math/Matrix3D";
import ColorUtil from "../../engine/color/ColorUtil";
import AnimationUtil from "../../engine/animation/AnimationUtil";
import ArrayUtils from "../../engine/utils/ArrayUtils";

export default class FlyLine extends GL3DLayer {
    props: any = {
        duration: 3000,
        lightNumber: 5
    }
    needUpdateBuffer: boolean = false
    lineIndex: any = null
    lines: any = []
    ticker: any = null
    drawProject: any = null
    vertexesBuffer: any = null
    indexesBuffer: any = null
    lineColorsBuffer: any = null
    lightColorsBuffer: any = null
    timer: number = 0
    percent: number = 0
    data: any = null
    needUpdateCache: boolean = false
    renderMatrix: any = null
    screenLines: any = []

    constructor() {
        super();
        this.on('destroy', () => {
            AnimationUtil.cancelTick(this.ticker)
            if (this.drawProject) this.drawProject.destroy()
            if (this.vertexesBuffer) this.vertexesBuffer.destroy()
            if (this.indexesBuffer) this.indexesBuffer.destroy()
            if (this.lineColorsBuffer) this.lineColorsBuffer.destroy()
            if (this.lightColorsBuffer) this.lightColorsBuffer.destroy()
        })

        this.needUpdateBuffer = false
        this.lineIndex = null
        this.lines = []
        this.on('mouseout', () => {
            if (this.lineIndex !== null) {
                this.needUpdateBuffer = true
                this.fire("lineOut", this.lineIndex)
                this.lineIndex = null
            }
        })
        this.on('click', () => {
            this.fire("lineClick", this.lineIndex)
        })
    }

    reset() {
        this.timer = 0
        this.percent = 0
        AnimationUtil.cancelTick(this.ticker)
        this.ticker = AnimationUtil.tick((delta: number) => {
            this.percent = this.timer / this.props.duration
            this.timer += delta
            this.timer = this.timer % this.props.duration
            this.updateSelf()
        })
    }

    contain(ray: any): boolean {
        if (this.needUpdateCache || !this.renderMatrix || !ArrayUtils.itemEqual(ray.matrix, this.renderMatrix)) {
            this.renderMatrix = ray.matrix
            this.needUpdateCache = false
            this.computeCache(this.renderMatrix, ray.size)
        }
        for (let i = this.screenLines.length - 1; i >= 0; i--) {
            let linePoints = this.screenLines[i]
            for (let i = 0, l = linePoints.length - 1; i < l; i++) {
                let start = linePoints[i], end = linePoints[i + 1]
                if (MathUtil.pointToLineDistance(start, end, ray.mouse) <= linePoints.width) {
                    if (this.lineIndex !== linePoints.index) {
                        if (this.lineIndex !== null) {
                            this.needUpdateBuffer = true
                            this.fire("lineOut", this.lineIndex)
                        }
                        this.lineIndex = linePoints.index
                        if (this.lineIndex !== null) {
                            this.needUpdateBuffer = true
                            this.fire("lineOver", this.lineIndex)
                        }
                    }
                    return true
                }
            }
        }
        return false
    }

    //计算元素屏幕位置
    computeCache(matrix: any, size: any) {
        this.screenLines = []
        for (let line of this.lines) {
            let linePoints: any = []
            this.screenLines.push(linePoints)
            for (let i = 0, l = 32; i <= l; i++) {
                let p = MathUtil.quadratic3d(line.start, line.center, line.end, i / l)
                let pp = Matrix3D.transformPoint(matrix, p)
                if (pp[2] >= 1 || pp[2] <= -1) continue
                linePoints.push([(pp[0] + 1) / 2 * size[0], (1 - pp[1]) / 2 * size[1]])
                linePoints.index = line.index
                linePoints.width = line.radius
            }
        }
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.refresh()
    }

    refresh() {
        this.needUpdateBuffer = true
        this.needUpdateCache = true
        this.updateSelf()
        this.reset()
    }

    setData(data: any) {
        this.data = data
        this.refresh()
    }

    updateBuffer(gl: any) {
        let vertices: any = [], indices: any = [], lineColors: any = [], lightColors: any = []
        let minHeight = this.mapData.convertSize(5)
        let baseHeight = this.mapData.convertSize(this.height)
        this.lines = []
        for (let row of this.data) {
            if (!row.start || !row.end) return
            let start = this.mapData.getPositionByAny(row.start)
            let end = this.mapData.getPositionByAny(row.end)
            if (!start || !end) continue
            let distance = minHeight + MathUtil.distance(start[0], start[1], end[0], end[1])
            let center = MathUtil.mixPoint2D(start, end, 0.5)
            let height = distance * (row.tension || 1)
            let radius = this.mapData.convertSize(row.radius)
            let lineColor = ColorUtil.toOneRGBA(row.lineColor)
            let lightColor = ColorUtil.toOneRGBA(row.lightColor)
            if (this.lineIndex === row.index && row.hover) {
                lineColor = row.hover ? ColorUtil.toOneRGBA(row.hover.lineColor) : lineColor
                lightColor = row.hover ? ColorUtil.toOneRGBA(row.hover.lightColor) : lightColor
            }

            let data = TubeUtil.getDataByQuad({
                start: [start[0], start[1], 0],
                end: [end[0], end[1], 0],
                ctrl: [center[0], center[1], height],
                tubularSegments: 32,
                radialSegments: 8,
                radius
            })
            this.lines.push({
                start: [start[0], start[1], baseHeight],
                end: [end[0], end[1], baseHeight],
                center: [center[0], center[1], baseHeight + height],
                radius: row.radius,
                lineColor, lightColor,
                index: row.index
            })
            let base = vertices.length / 4
            vertices = vertices.concat(data.vertices)
            for (let i = 0, l = data.vertices.length / 4; i < l; i++) {
                lineColors.push(lineColor[0], lineColor[1], lineColor[2], lineColor[3])
                lightColors.push(lightColor[0], lightColor[1], lightColor[2], lightColor[3])
            }
            for (let index of data.indices) {
                indices.push(base + index)
            }
        }
        if (!this.vertexesBuffer) {
            this.vertexesBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(vertices))
        } else {
            this.vertexesBuffer.setData(new Float32Array(vertices))
        }
        if (!this.indexesBuffer) {
            this.indexesBuffer = new GLBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, new Uint16Array(indices))
        } else {
            this.indexesBuffer.setData(new Uint16Array(indices))
        }
        if (!this.lineColorsBuffer) {
            this.lineColorsBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(lineColors))
        } else {
            this.lineColorsBuffer.setData(new Float32Array(lineColors))
        }
        if (!this.lightColorsBuffer) {
            this.lightColorsBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(lightColors))
        } else {
            this.lightColorsBuffer.setData(new Float32Array(lightColors))
        }
    }

    render(gl: any, matrix: any, options: any) {
        if (!this.mapData || this.mapData.isEmpty() || !this.data) return
        if (!this.drawProject) {
            this.drawProject = new GLProject(gl, shader)
        }

        if (this.needUpdateBuffer) {
            this.needUpdateBuffer = false
            this.updateBuffer(gl)
        }

        this.drawProject.use()

        this.drawProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uHeight: {
                data: this.mapData.convertSize(this.height)
            },
            uPercent: {
                data: this.percent
            },
            uLightNumber: {
                data: this.props.lightNumber
            }
        })

        this.drawProject.setAttributes({
            aVertices: {
                data: this.vertexesBuffer,
                size: 4
            },
            aLineColor: {
                data: this.lineColorsBuffer,
                size: 4
            },
            aLightColor: {
                data: this.lightColorsBuffer,
                size: 4
            }
        })
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.FRONT)
        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        this.indexesBuffer.use()

        gl.drawElements(gl.TRIANGLES, this.indexesBuffer.length, gl.UNSIGNED_SHORT, 0)
    }
}
