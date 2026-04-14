import pointShader from "./pointShader";
import drawShader from "./drawShader";
import GLPanelLayer from "../../core/layers/GLPanelLayer";
import MapUtil from "../../core/data/MapUtil";
import drawClipShader from "./drawClipShader";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import MathUtil from "../../engine/math/MathUtil";
import Matrix3D from "../../engine/math/Matrix3D";
import GLUtil from "../../engine/utils/GLUtil";

export default class Thermo extends GLPanelLayer {
    props: any = {
        clip: true,
        pointSize: 60,
        blur: 0.2,
        minValueAlpha: 0.5,
        maxValueAlpha: 0.8,
        colors: [
            [0., "rgba(0,60,255,0.8)"], [0.3, "rgba(17,245,197,0.8)"],
            [0.5, "rgba(248,231,28,0.8)"],
            [0.7, "rgba(252,177,54,0.8)"],
            [1, "rgba(255,50,74,0.8)"]
        ]
    }
    needRefresh: boolean = true
    needRefreshClip: boolean = true
    needRefreshColor: boolean = true
    clipCanvas: any = null
    clipCtx: any = null
    clipTexture: any = null
    colorTexture: any = null
    drawProject: any = null
    clipProject: any = null
    pointProject: any = null
    templateTarget: any = null
    clipTarget: any = null
    uiVertexBuffer: any = null
    pointsBuffer: any = null
    clipBuffer: any = null
    colorCanvas: any = null
    colorCtx: any = null
    datas: any = null
    dataLength: number = 0
    clipMapData: any = null
    center: any = null
    blocks: any = []
    canvasWidth: number = 0
    canvasHeight: number = 0

    constructor() {
        super();
        this.refreshColor = this.refreshColor.bind(this)
        this.refresh = this.refresh.bind(this)

        this.on("destroy", () => {
            if (this.clipCanvas) {
                this.clipCanvas.width = 0
                this.clipCanvas.height = 0
                this.clipCanvas = null
                this.clipCtx = null
            }

            if (this.clipTexture) this.clipTexture.destroy()
            if (this.colorTexture) this.colorTexture.destroy()

            if (this.drawProject) this.drawProject.destroy()
            if (this.clipProject) this.clipProject.destroy()
            if (this.pointProject) this.pointProject.destroy()

            if (this.templateTarget) this.templateTarget.destroy()
            if (this.clipTarget) this.clipTarget.destroy()

            if (this.uiVertexBuffer) this.uiVertexBuffer.destroy()
            if (this.pointsBuffer) this.pointsBuffer.destroy()
            if (this.clipBuffer) this.clipBuffer.destroy()
        })
        this.colorCanvas = document.createElement("canvas")
        this.colorCanvas.width = 200
        this.colorCanvas.height = 10
        this.colorCtx = this.colorCanvas.getContext("2d")

    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.refresh()
        this.refreshColor()
    }

    setClipMapData(mapData: any) {
        if (this.clipMapData === mapData) return
        if (this.clipMapData) {
            this.clipMapData.off('change', this.refresh)
        }
        this.clipMapData = mapData
        if (this.clipMapData) {
            this.clipMapData.on('change', this.refresh)
        }
        this.needRefreshClip = true
        this.refresh()
    }

    setData(datas: any) {
        datas = datas || []
        if (this.datas === datas && this.dataLength === datas.length) return
        this.datas = datas
        this.dataLength = datas.length
        this.refresh()
    }

    refresh() {
        this.needRefreshClip = true
        this.needRefresh = true
        this.updateSelf()
    }

    refreshColor() {
        this.needRefreshColor = true
        this.updateSelf()
    }

    refreshClipCanvas(gl: any) {
        if (!this.needRefreshClip) return
        this.needRefreshClip = false
        if (!this.clipCanvas) {
            this.clipCanvas = document.createElement("canvas")
            this.clipCtx = this.clipCanvas.getContext("2d")
        }
        this.clipCanvas.width = 512
        this.clipCanvas.height = 512
        this.clipCtx.save()
        this.clipCtx.clearRect(0, 0, this.clipCanvas.width, this.clipCanvas.height)
        this.clipCtx.fillStyle = "#000"
        let bounding = this.mapData.getBounding()
        let mapWidth = this.mapData.getWidth()
        let mapHeight = this.mapData.getHeight()

        this.clipCtx.scale(this.clipCanvas.width / mapWidth, this.clipCanvas.height / mapHeight)
        this.clipCtx.translate(-bounding[0], -bounding[1])
        this.clipCtx.beginPath()
        let data = this.mapData.getData()

        for (let areaData of data) {
            switch (areaData.geometry.type) {
                case "polygon": {
                    for (let i = 0, l = areaData.geometry.polygon.pointsList.length; i < l; i++) {
                        let polygon = areaData.geometry.polygon
                        let points = polygon.pointsList[i]
                        for (let x = 0, y = points.length; x < y; x++) {
                            let p = points[x]
                            if (!x) this.clipCtx.moveTo(p[0], p[1])
                            else this.clipCtx.lineTo(p[0], p[1])
                        }
                    }

                    break
                }
                case "polygons": {
                    for (let i = 0, l = areaData.geometry.polygons.length; i < l; i++) {
                        let polygon = areaData.geometry.polygons[i]
                        for (let j = 0, k = polygon.pointsList.length; j < k; j++) {
                            let points = polygon.pointsList[j]
                            for (let x = 0, y = points.length; x < y; x++) {
                                let p = points[x]
                                if (!x) this.clipCtx.moveTo(p[0], p[1])
                                else this.clipCtx.lineTo(p[0], p[1])
                            }
                        }
                    }
                    break
                }
            }
        }
        this.clipCtx.fill()

        this.clipCtx.restore()
        if (!this.clipTexture) {
            this.clipTexture = GLUtil.createTexture(gl, this.clipCanvas, {
                premultiplyAlpha: true
            })
        } else {
            this.clipTexture.setData(this.clipCanvas)
        }

        let cx = (bounding[2] + bounding[0]) / 2, cy = (bounding[3] + bounding[1]) / 2
        this.center = [cx, cy]
        let sx = -mapWidth / 2
        let sy = -mapHeight / 2
        let ex = mapWidth / 2
        let ey = mapHeight / 2

        if (!this.clipBuffer) {
            this.clipBuffer = GLUtil.createBuffer(gl, gl.ARRAY_BUFFER,
                new Float32Array([
                    sx, ey, 0, 1,
                    ex, ey, 1, 1,
                    sx, sy, 0, 0,
                    ex, sy, 1, 0,
                ]));
        } else {
            this.clipBuffer.setData(
                new Float32Array([
                    sx, ey, 0, 1,
                    ex, ey, 1, 1,
                    sx, sy, 0, 0,
                    ex, sy, 1, 0,
                ])
            )
        }
    }

    refreshBuffer(gl: any) {
        if (!this.datas) return
        if (!this.needRefresh) return;
        this.needRefresh = false
        let points: any = []
        let pointSize = this.props.pointSize

        let minValue: any = null, maxValue: any = null

        let pointIndex = 0

        for (let i = 0, l = this.datas.length; i < l; i++) {
            let data = this.datas[i]
            let p = MapUtil.convert([data.lng, data.lat])
            if (!p) continue
            let offset = pointIndex * 4
            points[offset] = p[0]
            points[offset + 1] = p[1]
            points[offset + 2] = data.pointSize || pointSize
            points[offset + 3] = data.value
            minValue = MathUtil.min(minValue, data.value)
            maxValue = MathUtil.max(maxValue, data.value)

            pointIndex++
        }
        let d = maxValue - minValue
        for (let i = 0, l = pointIndex; i < l; i++) {
            let offset = i * 4
            points[offset + 3] = MathUtil.mix(this.props.minValueAlpha, this.props.maxValueAlpha, d ? (points[offset + 3] - minValue) / d : 0)
        }


        if (!this.pointsBuffer) {
            this.pointsBuffer = GLUtil.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(points))
        } else {
            this.pointsBuffer.setData(new Float32Array(points))
        }
    }

    refreshColorTexture(gl: any) {
        if (!this.needRefreshColor) return
        this.needRefreshColor = false
        this.colorCtx.clearRect(0, 0, this.colorCanvas.width, this.colorCanvas.height)
        let grd = this.colorCtx.createLinearGradient(0, 0, this.colorCanvas.width, 0)
        for (let color of this.props.colors) {
            grd.addColorStop(color[0], color[1])
        }
        this.colorCtx.fillStyle = grd
        this.colorCtx.fillRect(0, 0, this.colorCanvas.width, this.colorCanvas.height)
        if (!this.colorTexture) {
            this.colorTexture = GLUtil.createTexture(gl, this.colorCanvas);
        } else {
            this.colorTexture.setData(this.colorCanvas)
        }
    }

    render(gl: any, matrix: any, { pitch = 0 }: any) {
        if (!this.mapData || !this.datas) return
        if (!this.pointProject) {
            this.clipProject = GLUtil.createProject(gl, drawClipShader)
            this.pointProject = GLUtil.createProject(gl, pointShader)
            this.drawProject = GLUtil.createProject(gl, drawShader)
            gl.enable(gl.BLEND)
            gl.clearColor(0, 0, 0, 0)
        }
        if (this.props.clip) {
            this.refreshClipCanvas(gl)

            if (!this.clipTarget) {
                this.clipTarget = GLUtil.createGLRenderTarget(gl, gl.canvas.width / 2, gl.canvas.height / 2) as any;
            } else {
                this.clipTarget.setSize(gl.canvas.width / 2, gl.canvas.height / 2)
            }
            this.clipTarget.use()
            this.clipTarget.clear()
            this.clipProject.use()
            this.clipProject.setUniforms({
                uMatrix: {
                    data: Matrix3D.translate(matrix, this.center[0], this.center[1], 0)
                },
                uHeight: {
                    data: this.mapData.convertSize(this.height)
                }
            })

            this.clipProject.setAttributes({
                aVertexPosition: {
                    data: this.clipBuffer,
                    size: 4
                }
            })
            gl.disable(gl.CULL_FACE)
            this.clipTexture.use(0)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            this.clipTarget.pop()
        } else {
            if (this.clipCanvas) {
                this.clipCanvas.width = 0
                this.clipCanvas.height = 0
                this.clipCanvas = null
                this.clipCtx = null
            }
            if (this.clipTarget) {
                this.clipTarget.destroy()
                this.clipTarget = null
            }
            if (this.clipBuffer) {
                this.clipBuffer.destroy()
                this.clipBuffer = null
            }
            if (this.clipTexture) {
                this.clipTexture.destroy()
                this.clipTexture = null
            }
        }
        this.refreshBuffer(gl)
        this.refreshColorTexture(gl)


        if (!this.colorTexture) return

        this.colorTexture.use()

        if (!this.uiVertexBuffer) {
            this.uiVertexBuffer = GLUtil.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array([
                0, 1,
                1, 1,
                0, 0,
                1, 0,
            ]))
        }

        if (!this.templateTarget) {
            this.templateTarget = GLUtil.createGLRenderTarget(gl, gl.canvas.width / 2, gl.canvas.height / 2) as any;
        } else {
            this.templateTarget.setSize(gl.canvas.width / 2, gl.canvas.height / 2)
        }
        this.templateTarget.use()
        this.templateTarget.clear()
        gl.disable(gl.DEPTH_TEST)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE)
        this.pointProject.use()

        this.pointProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uHeight: {
                data: this.mapData.convertSize(this.height)
            },
            uPitch: {
                data: Math.cos(pitch)
            }
        })

        this.pointProject.setAttributes({
            aVertexPosition: {
                data: this.pointsBuffer,
                size: 4
            }
        })

        gl.drawArrays(gl.POINTS, 0, this.pointsBuffer.length)

        this.templateTarget.pop()

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        this.drawProject.use()

        this.drawProject.setUniforms({
            uColor: {
                data: 1
            },
            uClip: {
                data: 2
            },
            uParam: {
                data: [this.props.blur, this.clipTarget ? 1 : 0]
            }
        })

        this.drawProject.setAttributes({
            aVertexPosition: {
                data: this.uiVertexBuffer,
                size: 2
            }
        })




        this.templateTarget.getTexture()?.use(0)
        this.colorTexture?.use(1)

        if (this.clipTarget) {
            this.clipTarget.getTexture()?.use(2)
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    }
}
