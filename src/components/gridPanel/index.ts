import GLPanelLayer from "../../core/layers/GLPanelLayer"
import GLBuffer from "../../engine/webgl/GLBuffer"
import GLProject from "../../engine/webgl/GLProject"
import shader from "./shader"
import pointShader from "./pointShader"
import ColorUtil from "../../engine/color/ColorUtil"
import ObjectUtil from "../../engine/utils/ObjectUtil"

export default class GridPanel extends GLPanelLayer {
    props: any;
    vertexBuffer: any;
    pointBuffer: any;
    pointProject: any;
    drawProject: any;
    needUpdateBuffer: boolean;

    constructor() {
        super();
        this.props = {
            radius:1,
            number: 50,
            lineColor: "rgba(255,255,255,0.1)",
            pointColor: "#acc"
        }

        this.on('destroy', () => {
            if (this.vertexBuffer) this.vertexBuffer.destroy()
            if (this.pointBuffer) this.pointBuffer.destroy()
            if (this.pointProject) this.pointProject.destroy()
            if (this.drawProject) this.drawProject.destroy()
        })

    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.refresh()
    }

    refresh() {
        this.updateSelf()
        this.needUpdateBuffer = true
    }

    refreshBuffer(gl: any) {
        let bounding = this.mapData.getBounding()
        let size = Math.max(bounding[2] - bounding[0], bounding[3] - bounding[1]) * this.props.radius
        let num = this.props.number
        let step = size / num
        let cx = (bounding[0] + bounding[2]) / 2, cy = (bounding[1] + bounding[3]) / 2

        let vertices: number[] = []
        for (let i = 0, l = num * 2; i <= l; i++) {
            vertices.push(
                cx + (i - num) * step, cy - size, i / l, 0,
                cx + (i - num) * step, cy + size, i / l, 1
            )
        }
        for (let i = 0, l = num * 2; i <= l; i++) {
            vertices.push(
                cx - size, cy + (i - num) * step, 0, i / l,
                cx + size, cy + (i - num) * step, 1, i / l
            )
        }
        if (!this.vertexBuffer) {
            this.vertexBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(vertices))
        } else {
            this.vertexBuffer.setData(new Float32Array(vertices));
        }

        let points: number[] = []
        for (let i = 0, l = num; i <= l; i++) {
            for (let j = 0, k = num; j <= k; j++) {
                points.push(
                    cx + (i - num / 2) * step, cy + (j - num / 2) * step, i / l, j / k
                )
            }
        }
        if (!this.pointBuffer) {
            this.pointBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(points))
        } else {
            this.pointBuffer.setData(new Float32Array(points));
        }
    }

    render(gl: any, matrix: any) {
        if (!this.mapData || this.mapData.isEmpty()) return
        if (this.needUpdateBuffer) {
            this.needUpdateBuffer = false
            this.refreshBuffer(gl)
        }
        gl.disable(gl.CULL_FACE)
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        if (!this.drawProject) {
            this.drawProject = new GLProject(gl, shader)
        }

        this.drawProject.use()

        this.drawProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uColor: {
                data: ColorUtil.toOneRGBA(this.props.lineColor)
            }
        })
        this.drawProject.setAttributes({
            aVertices: {
                data: this.vertexBuffer,
                size: 4
            }
        })
        gl.drawArrays(gl.LINES, 0, this.vertexBuffer.length / 4)

        if (!this.pointProject) {
            this.pointProject = new GLProject(gl, pointShader)
        }

        this.pointProject.use()

        this.pointProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uColor: {
                data: ColorUtil.toOneRGBA(this.props.pointColor)
            }
        })
        this.pointProject.setAttributes({
            aVertices: {
                data: this.pointBuffer,
                size: 4
            }
        })

        gl.drawArrays(gl.POINTS, 0, this.pointBuffer.length / 4)
    }

}
