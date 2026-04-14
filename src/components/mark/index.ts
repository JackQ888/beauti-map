import GL3DLayer from "../../core/layers/GL3DLayer";
import GLTexture from "../../engine/webgl/GLTexture";
import GLBuffer from "../../engine/webgl/GLBuffer";
import GLProject from "../../engine/webgl/GLProject";
import drawShader from "./drawShader";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import ArrayUtils from "../../engine/utils/ArrayUtils";
import Matrix3D from "../../engine/math/Matrix3D";
import MathUtil from "../../engine/math/MathUtil";

export default class Mark extends GL3DLayer {
    markIndex: any = null
    needUpdateCache: boolean = true
    marks: any = []
    drawProject: any = null
    screenPoints: any = []
    renderMatrix: any = null
    needUpdateBuffer: boolean = false

    constructor() {
        super()

        this.on('destroy', () => {
            this.clearMarks()
            if (this.drawProject) this.drawProject.destroy()
        })

        this.on('mouseout', () => {
            if (this.markIndex !== null) {
                this.fire("markOut", this.markIndex)
                this.markIndex = null
            }
        })
        this.on('click', () => {
            this.fire("markClick", this.markIndex)
        })
    }

    contain(ray: any): boolean {
        if (this.needUpdateCache || !this.renderMatrix || !ArrayUtils.itemEqual(ray.matrix, this.renderMatrix)) {
            this.renderMatrix = ray.matrix
            this.needUpdateCache = false
            this.computeCache(this.renderMatrix, ray.size)
        }
        for (let p of this.screenPoints) {
            let size = p[2]
            let mark = p[3]
            let offset = [-mark.anchor[0], -mark.anchor[1]]
            if (!mark.texture || !mark.texture.data) continue
            let width = size, height = size
            if (mark.texture.width > mark.texture.height) {
                height *= mark.texture.height / mark.texture.width
            } else {
                width *= mark.texture.width / mark.texture.height
            }
            let rect = [p[0] + width * offset[0], p[1] + height * offset[1], width, height]
            if (MathUtil.pointInRect(rect, ray.mouse)) {
                if (this.markIndex !== p[4]) {
                    if (this.markIndex !== null) {
                        this.fire("markOut", this.markIndex)
                    }
                    this.markIndex = p[4]
                    if (this.markIndex !== null) {
                        this.fire("markOver", this.markIndex)
                    }
                }
                return true
            }
        }
        return false
    }

    //计算元素屏幕位置
    computeCache(matrix: any, size: any) {
        let points: any = []
        let h = this.mapData.convertSize(this.height)
        for (let mark of this.marks) {
            if (!mark) continue
            for (let markPoint of mark.points) {
                let point = this.mapData.getPositionByAny(markPoint.p)
                if (!point) continue
                let screenPoints = Matrix3D.transformPoint(matrix, [point[0], point[1], h])
                points.push([(screenPoints[0] + 1) / 2 * size[0], (1 - screenPoints[1]) / 2 * size[1], markPoint.size, mark, markPoint.dataIndex])
            }
        }
        this.screenPoints = points
    }

    setProps(props: any) {
        ObjectUtil.setProps((this as any).props, props)
        this.updateSelf()
    }

    clearMarks() {
        if (this.marks && this.marks.length) {
            for (let row of this.marks) {
                if (!row) continue
                if (row.texture) {
                    row.texture.destroy()
                }
                if (row.buffer) {
                    row.buffer.destroy()
                }
            }
        }
        this.marks = []
    }

    setData(datas: any) {
        this.clearMarks()
        for (let i = 0, l = datas.length; i < l; i++) {
            let item = datas[i]
            if (!item.url) continue
            let row = this.marks[i]
            if (!row) {
                this.marks[i] = row = {
                    url: item.url,
                    points: [],
                    anchor: item.anchor || [0.5, 0.5]
                }
            }
            for (let j = 0, k = item.marks.length; j < k; j++) {
                let mark = item.marks[j]
                row.points.push({
                    p: mark.point,
                    size: mark.size,
                    dataIndex: mark.id
                })
            }
        }
        this.refresh()
    }

    updateHeight() {
        this.needUpdateCache = true
        this.updateSelf()
    }

    refresh() {
        this.needUpdateBuffer = true
        this.needUpdateCache = true
        this.updateSelf()
    }

    refreshBuffer(gl: any) {
        for (let mark of this.marks) {
            if (!mark) continue
            if (!mark.texture) {
                mark.texture = new (GLTexture as any)(gl)
                mark.texture.setDataUrl(mark.url).then(this.updateSelf)
            }
            let points: any = []
            for (let markPoint of mark.points) {
                let point = this.mapData.getPositionByAny(markPoint.p)
                if (!point) continue
                points.push(point[0], point[1], markPoint.size)
            }
            if (!mark.buffer) {
                mark.buffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(points))
            } else {
                mark.buffer.setData(new Float32Array(points))
            }
        }
    }


    render(gl: any, matrix: any) {
        if (!this.mapData || this.mapData.isEmpty() || !this.marks) return;
        if (this.needUpdateBuffer) {
            this.needUpdateBuffer = false
            this.refreshBuffer(gl)
        }
        if (!this.drawProject) {
            this.drawProject = new GLProject(gl, drawShader)
        }
        this.drawProject.use()
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)


        this.drawProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uHeight: {
                data: this.mapData.convertSize(this.height)
            }
        })
        for (let mark of this.marks) {
            if (!mark.texture.data) continue
            mark.texture.use(0)


            let ratio: any = null
            if (mark.texture.width > mark.texture.height) {
                ratio = [1, mark.texture.height / mark.texture.width]
            } else {
                ratio = [mark.texture.width / mark.texture.height, 1]
            }
            this.drawProject.setUniforms({
                uRatio: {
                    data: ratio
                },
                uView: {
                    data: [(0.5 - mark.anchor[0]) * 2 / gl.canvas.width, (mark.anchor[1] - 0.5) * 2 / gl.canvas.height]
                }
            })
            this.drawProject.setAttributes({
                aVertices: {
                    data: mark.buffer,
                    size: 3
                }
            })
            gl.drawArrays(gl.POINTS, 0, mark.buffer.length / 3)
        }
    }
}
