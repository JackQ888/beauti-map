import earcut from "earcut"
import GLPanelLayer from "../../core/layers/GLPanelLayer"
import GLBuffer from "../../engine/webgl/GLBuffer"
import GLProject from "../../engine/webgl/GLProject"
import shader from "./shader"
import lineShader from "./lineShader"
import ObjectUtil from "../../engine/utils/ObjectUtil"
import MathUtil from "../../engine/math/MathUtil"
import ColorUtil from "../../engine/color/ColorUtil"
import GLTexture from "../../engine/webgl/GLTexture"

export default class BackgroundArea extends GLPanelLayer {
    props: any;
    polygnProject: any;
    lineProject: any;
    vertexBuffer: any;
    indexesBuffer: any;
    linesBuffer: any;
    colorTexture: any;
    imageTexture: any;
    colorCanvas: any;
    colorCtx: any;
    needUpdateColor: boolean;
    needUpdateImage: boolean;
    needUpdateBuffer: boolean;
    downX: number;
    downY: number;
    canClick: boolean;
    activeArea: any;
    vertices: any;
    indexes: any;
    textureImage: any;

    constructor() {
        super();

        this.props = {
            border: {
                enable: true,
                color: "#fff"
            },
            background: {
                enable: true,
                color: "#445",
                texture: {
                    enable: false,
                    url: "",
                    opacity: 1,
                    uv: 100,
                    offsetX:0,
                    offsetY:0
                }
            }
        };

        this.on('destroy', () => {
            if (this.polygnProject) this.polygnProject.destroy()
            if (this.lineProject) this.lineProject.destroy()
            if (this.vertexBuffer) this.vertexBuffer.destroy()
            if (this.indexesBuffer) this.indexesBuffer.destroy()
            if (this.linesBuffer) this.linesBuffer.destroy()
            if (this.colorTexture) this.colorTexture.destroy()
            if (this.imageTexture) this.imageTexture.destroy()
        })

        this.on('mousedown', (e: any) => {
            this.downX = e.primitiveEvent.clientX
            this.downY = e.primitiveEvent.clientY
            this.canClick = true
        })
        this.on('mousemove', (e: any) => {
            if (this.canClick) {
                this.canClick = MathUtil.distancexy(e.primitiveEvent.clientX - this.downX, e.primitiveEvent.clientY - this.downY) < 2
            }
        })
        this.on('mouseout', (e: any) => {
            this.__setActiveArea__(null)
        })
        this.on('click', () => {
            if (!this.canClick) return
            this.fire('areaClick', this.activeArea)
        })
        this.on('dblclick', () => {
            if (!this.canClick) return
            this.fire('areaDblClick', this.activeArea)
        })

        this.needUpdateColor = true
    }

    setProps(props: any) {
        let oldColor = this.props.background.color
        let oldTexture = this.props.background.texture.enable ? this.props.background.texture.url : ''
        ObjectUtil.setProps(this.props, props)
        let newTexture = this.props.background.texture.enable ? this.props.background.texture.url : ''
        if (oldTexture !== newTexture) {
            this.needUpdateImage = true
        }
        if (oldColor !== this.props.background.color) {
            this.needUpdateColor = true
        }
        this.updateSelf()
    }

    contain(p: any) {
        let data = this.mapData.getData()
        for (let areaData of data) {
            switch (areaData.geometry.type) {
                case "polygon": {
                    let count = 0
                    for (let j = 0, k = areaData.geometry.polygon.pointsList.length; j < k; j++) {
                        let points = areaData.geometry.polygon.pointsList[j]
                        if (MathUtil.isCollisionArea(points, p)) {
                            count++
                        }
                    }
                    if (count % 2 && areaData.properties && areaData.properties.adcode) {
                        this.__setActiveArea__(areaData)
                        return true;
                    }
                    break
                }
                case "polygons": {
                    for (let j = 0, k = areaData.geometry.polygons.length; j < k; j++) {
                        let count = 0
                        let pointsList = areaData.geometry.polygons[j].pointsList
                        for (let n = 0, m = pointsList.length; n < m; n++) {
                            let ps = pointsList[n]
                            if (MathUtil.isCollisionArea(ps, p)) {
                                count++
                            }
                        }
                        if (count % 2 && areaData.properties && areaData.properties.adcode) {
                            this.__setActiveArea__(areaData)
                            return true;
                        }
                    }
                    break
                }
            }

        }
        this.__setActiveArea__(null)
        return false
    }

    __setActiveArea__(area: any) {
        if (this.activeArea === area) return
        this.activeArea = area
        this.fire('areaChange', area)
    }

    refresh() {
        this.updateSelf()
        this.needUpdateBuffer = true
    }

    refreshBuffer(gl: any) {
        let data = this.mapData.getData()
        let bounding = this.mapData.getBounding()
        let vertices: number[] = [], indexes: number[] = [], lines: number[] = []
        for (let areaData of data) {
            switch (areaData.geometry.type) {
                case "polygon": {
                    let vs: number[] = [], holes: number[] = [], holeIndex = 0
                    for (let i = 0, l = areaData.geometry.polygon.pointsList.length; i < l; i++) {
                        let polygon = areaData.geometry.polygon
                        let points = polygon.pointsList[i]
                        if(!points.length)continue

                        //多组线段之间过度处理，透明度为0
                        lines.push(points[0][0], points[0][1], 0)
                        for (let p of points) {
                            vs.push(p[0], p[1],
                                (p[0] - bounding[0]) / (bounding[2] - bounding[0]),
                                (p[1] - bounding[1]) / (bounding[3] - bounding[1])
                            )
                            lines.push(p[0], p[1], 1)
                        }
                        //多组线段之间过度处理，透明度为0
                        lines.push(lines[lines.length - 3], lines[lines.length - 2], 0)
                        if (i > 0) {
                            holeIndex += areaData.geometry.polygon.pointsList[i - 1].length;
                            holes.push(holeIndex);
                        }
                    }
                    let base = vertices.length / 4
                    vertices = vertices.concat(vs)
                    let res = earcut(vs, holes, 4)

                    for (let index of res) {
                        indexes.push(base + index)
                    }

                    break
                }
                case "polygons": {
                    for (let i = 0, l = areaData.geometry.polygons.length; i < l; i++) {
                        let polygon = areaData.geometry.polygons[i]
                        let vs: number[] = [], holes: number[] = [], holeIndex = 0
                        for (let j = 0, k = polygon.pointsList.length; j < k; j++) {
                            let points = polygon.pointsList[j]
                            if(!points.length)continue
                            //多组线段之间过度处理，透明度为0
                            lines.push(points[0][0], points[0][1], 0)
                            for (let p of points) {
                                vs.push(p[0], p[1],
                                    (p[0] - bounding[0]) / (bounding[2] - bounding[0]),
                                    (p[1] - bounding[1]) / (bounding[3] - bounding[1])
                                )
                                lines.push(p[0], p[1], 1)
                            }
                            //多组线段之间过度处理，透明度为0
                            lines.push(lines[lines.length - 3], lines[lines.length - 2], 0)
                            if (j > 0) {
                                holeIndex += polygon.pointsList[j - 1].length;
                                holes.push(holeIndex);
                            }
                        }
                        let base = vertices.length / 4
                        vertices = vertices.concat(vs)


                        let res = earcut(vs, holes, 4)

                        for (let index of res) {
                            indexes.push(base + index)
                        }
                    }
                    break
                }
                case "line": {
                    let points = areaData.geometry.line.pointsList
                    //多组线段之间过度处理，透明度为0
                    lines.push(points[0][0], points[0][1], 0)
                    for (let p of points) {
                        lines.push(p[0], p[1], 1)
                    }
                    //多组线段之间过度处理，透明度为0
                    lines.push(lines[lines.length - 3], lines[lines.length - 2], 0)
                    break
                }
                case "lines": {
                    for (let j = 0, k = areaData.geometry.line.length; j < k; j++) {
                        let points = areaData.geometry.line[j].pointsList
                        //多组线段之间过度处理，透明度为0
                        lines.push(points[0][0], points[0][1], 0)
                        for (let p of points) {
                            lines.push(p[0], p[1], 1)
                        }
                        //多组线段之间过度处理，透明度为0
                        lines.push(lines[lines.length - 3], lines[lines.length - 2], 0)
                    }
                    break
                }
            }
        }
        this.vertices = vertices
        this.indexes = indexes
        if (!this.vertexBuffer) {
            this.vertexBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(vertices))
        } else {
            this.vertexBuffer.setData(new Float32Array(vertices))
        }

        if (!this.indexesBuffer) {
            this.indexesBuffer = new GLBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, new Uint16Array(indexes))
        } else {
            this.indexesBuffer.setData(new Uint16Array(indexes))
        }

        if (!this.linesBuffer) {
            this.linesBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(lines))
        } else {
            this.linesBuffer.setData(new Float32Array(lines))
        }
    }

    refreshColorTexture(gl: any) {
        if (typeof this.props.background.color === 'string') {
            if (this.colorTexture) this.colorTexture.destroy()
            this.colorTexture = null
            this.colorCanvas = null
            return
        }
        if (!this.colorCanvas) {
            this.colorCanvas = document.createElement("canvas")
            this.colorCtx = this.colorCanvas.getContext("2d")
        }
        const SIZE = 512
        let ratio = this.mapData.getRatio()
        this.colorCanvas.width = SIZE
        this.colorCanvas.height = SIZE * ratio
        this.colorCtx.clearRect(0, 0, this.colorCanvas.width, this.colorCanvas.height)
        this.props.background.color(this.colorCtx, this.colorCanvas.width, this.colorCanvas.height)

        if (!this.colorTexture) {
            this.colorTexture = new GLTexture(gl, this.colorCanvas, {
                premultiplyAlpha: true
            })
        } else {
            this.colorTexture.setData(this.colorCanvas)
        }
    }

    render(gl: any, matrix: any) {
        if (!this.mapData || this.mapData.isEmpty()) return
        if (!this.props.border.enable && !this.props.background.enable) return;
        if (this.needUpdateBuffer) {
            this.needUpdateBuffer = false
            this.refreshBuffer(gl)
        }
        let height = this.mapData.convertSize(this.height)

        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        if (this.props.background.enable) {
            if (this.needUpdateColor) {
                this.needUpdateColor = false
                this.refreshColorTexture(gl)
            }
            let uv = [1, 1, this.props.background.texture.opacity]
            let uvOffset = [0, 0]
            if (this.needUpdateImage) {
                this.needUpdateImage = false
                if (this.props.background.texture.enable && this.props.background.texture.url) {
                    if (!this.imageTexture) {
                        this.imageTexture = new GLTexture(gl, this.textureImage, {
                            premultiplyAlpha: true
                        })
                    }
                    this.imageTexture.setDataUrl(this.props.background.texture.url).then(this.updateSelf)
                } else if (this.imageTexture) {
                    this.imageTexture.destroy()
                    this.imageTexture = null
                }
            }
            if (this.imageTexture) {

                let scaleX = this.mapData.getWidth() / this.imageTexture.width
                let scaleY = this.mapData.getHeight() / this.imageTexture.height

                //横向更大缩放
                if (scaleX > scaleY) {
                    uv[0] = 1*this.props.background.texture.uv
                    uv[1] = scaleY / scaleX*this.props.background.texture.uv
                }else{
                    uv[0] = scaleX/scaleY*this.props.background.texture.uv
                    uv[1] = 1*this.props.background.texture.uv
                }
                uvOffset[0]=0.5-uv[0]/2+this.props.background.texture.offsetX
                uvOffset[1]=0.5-uv[1]/2+this.props.background.texture.offsetY
            }

            if (!this.polygnProject) {
                this.polygnProject = new GLProject(gl, shader)
            }
            this.polygnProject.use()


            this.polygnProject.setUniforms({
                uMatrix: {
                    data: matrix
                },
                uHeight: {
                    data: height
                },
                uColorType: {
                    data: [this.colorTexture ? 1 : 0, this.imageTexture&&this.imageTexture.complete ? 1 : 0]
                },
                uColor: {
                    data: ColorUtil.toOnePreMultiplyAlphaRGBA(this.props.background.color)
                },
                uImageTexture: {
                    data: 1
                },
                uImageUvA: {
                    data: uv
                },
                uUvOffset: {
                    data: uvOffset
                }
            })
            this.polygnProject.setAttributes({
                aVertices: {
                    data: this.vertexBuffer,
                    size: 4
                }
            })
            this.indexesBuffer.use()
            if (this.colorTexture) {
                this.colorTexture.use(0)
            }
            if (this.imageTexture) {
                this.imageTexture.use(1)
            }
            gl.drawElements(gl.TRIANGLES, this.indexesBuffer.length, gl.UNSIGNED_SHORT, 0)
        }
        if (!this.props.border.enable) return;
        if (!this.lineProject) {
            this.lineProject = new GLProject(gl, lineShader)
        }
        this.lineProject.use()
        this.lineProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uHeight: {
                data: height
            },
            uColor: {
                data: ColorUtil.toOneRGBA(this.props.border.color)
            }
        })
        this.lineProject.setAttributes({
            aVertices: {
                data: this.linesBuffer,
                size: 3
            }
        })
        gl.drawArrays(gl.LINE_STRIP, 0, this.linesBuffer.length / 3)
    }
}
