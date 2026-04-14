import GL3DLayer from "../../core/layers/GL3DLayer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import GLTexture from "../../engine/webgl/GLTexture";
import GLBuffer from "../../engine/webgl/GLBuffer";
import FontFaceObserver from "fontfaceobserver";
import DrawUtil from "../../engine/utils/DrawUtil";

export default class Text extends GL3DLayer {
    needUpdate: boolean = true
    textImage: any = null
    datas: any = []
    drawProject: any = null
    vertexBuffer: any = null
    mapTexture: any = null
    textCanvas: any = null
    blocks: any = []
    canvasWidth: number = 0
    canvasHeight: number = 0

    constructor() {
        super();

        this.on('destroy', () => {
            if (this.drawProject) this.drawProject.destroy()
            if (this.vertexBuffer) this.vertexBuffer.destroy()
            if (this.mapTexture) this.mapTexture.destroy()
        })
    }

    setProps(props: any) {

    }

    setData(datas: any) {
        this.datas = datas
        this.refresh()
    }

    setMapData(mapData: any) {
        if (this.mapData) {
            this.mapData.off('change', this.refresh)
            this.mapData.off('areaPositionChange', this.refresh)
        }
        this.mapData = mapData
        if (this.mapData) {
            this.mapData.on('change', this.refresh)
            this.mapData.on('areaPositionChange', this.refresh)
        }
        this.refresh()
    }

    refresh() {
        this.needUpdate = true

        let fontSet = new Set<string>()
        for (let row of this.datas) {
            let name = row.label
            let position = row.point
            if (!position || !name) continue
            fontSet.add(row.font.fontFamily)
        }

        let tasks: any = []
        for (let fontFamily of fontSet) {
            tasks.push(new FontFaceObserver(fontFamily).load())
        }
        Promise.allSettled(tasks).then(() => {
            this.needUpdate = true
            this.updateSelf()
        }).catch(() => { })
        this.updateSelf()
    }


    refreshBuffer(gl: any) {
        if (!this.textCanvas) {
            this.textCanvas = document.createElement("canvas")
        }
        let ctx = this.textCanvas.getContext("2d")
        ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height)

        const MARGIN = 20

        let maxTextHeight = 0,
            drawCanvasStartX = 0,
            drawCanvasStartY = 0

        let blocks: any = [], maxWidth = 0
        for (let row of this.datas) {
            let name = row.label
            let position = this.mapData.getPositionByAny(row.point)
            if (!position) continue
            DrawUtil.setFontStyle(ctx, row.font)
            let rect = ctx.measureText(name.toString())
            let textWidth = rect.width + MARGIN
            let textHeight = rect.fontBoundingBoxAscent + rect.fontBoundingBoxDescent + MARGIN


            if (drawCanvasStartX > 16000) {
                maxWidth = Math.max(drawCanvasStartX, maxWidth)
                drawCanvasStartX = 0
                drawCanvasStartY += maxTextHeight
                maxTextHeight = 0
            }

            maxTextHeight = Math.max(textHeight, maxTextHeight)
            let endX = drawCanvasStartX + textWidth
            let endY = drawCanvasStartY + textHeight


            blocks.push({
                name,
                position,
                startX: drawCanvasStartX,//绘制x
                endX,//绘制结束x
                startY: drawCanvasStartY,
                endY,
                width: textWidth,
                height: textHeight,
                font: row.font,
                offsetX: row.offsetX || 0,
                offsetY: row.offsetY || 0,
                shadow: row.shadow,
                offset: row.offset || [0, 0],
                anchor: row.anchor || [0.5, 0.5]
            })
            drawCanvasStartX = endX
            maxWidth = Math.max(drawCanvasStartX, maxWidth)
        }


        this.blocks = blocks
        this.canvasWidth = maxWidth
        this.canvasHeight = drawCanvasStartY + maxTextHeight
        this.textCanvas.width = this.canvasWidth * window.devicePixelRatio
        this.textCanvas.height = this.canvasHeight * window.devicePixelRatio
        this.textCanvas.style.height = this.canvasWidth + "px"
        this.textCanvas.style.height = this.canvasHeight + "px"
        ctx.save()
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)


        ctx.textAlign = "left"
        ctx.textBaseline = "top"

        let buffers: any = []

        for (let block of blocks) {
            ctx.save()
            ctx.fillStyle = block.font.color
            DrawUtil.setFontStyle(ctx, block.font)
            if (block.shadow && block.shadow.enable) {
                DrawUtil.setShadowStyle(ctx, block.shadow)
            }

            ctx.fillText(block.name, block.startX + MARGIN / 2, block.startY + MARGIN / 2)

            let su = block.startX / this.canvasWidth
            let eu = block.endX / this.canvasWidth
            let sv = block.startY / this.canvasHeight
            let ev = block.endY / this.canvasHeight
            let pointWidth = block.width * window.devicePixelRatio, pointHeight = block.height * window.devicePixelRatio

            let anchor = [(0.5 - block.anchor[0]) * 2, (block.anchor[1] - 0.5) * 2]
            buffers.push(
                block.position[0], block.position[1], pointWidth, pointHeight,
                su, ev, eu - su, sv - ev,
                block.offset[0] + pointWidth / 2 * anchor[0] + block.offsetX, block.offset[1] + pointHeight / 2 * anchor[1] + block.offsetY
            )
        }
        ctx.restore()
        if (!this.mapTexture) {
            this.mapTexture = new GLTexture(gl, this.textCanvas, { premultiplyAlpha: true, flipY: true })
        } else {
            this.mapTexture.setData(this.textCanvas)
        }
        if (!this.vertexBuffer) {
            this.vertexBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(buffers))
        } else {
            this.vertexBuffer.setData(new Float32Array(buffers))
        }
    }

    render(gl: any, matrix: any) {
        if (!this.mapData || this.mapData.isEmpty() || !this.datas) return;

        if (this.needUpdate) {
            this.needUpdate = false
            this.refreshBuffer(gl)
        }

        if (!this.blocks.length) return;

        if (!this.drawProject) {
            this.drawProject = new GLProject(gl, shader)
        }

        this.drawProject.use()

        this.drawProject.setUniforms({
            uMatrix: {
                data: matrix
            },
            uHeight: {
                data: this.mapData.convertSize(this.height)
            },
            uSize: {
                data: [gl.canvas.width, gl.canvas.height]
            }
        })
        this.drawProject.setAttributes({
            aVertices: {
                data: this.vertexBuffer,
                size: 4,
                stride: 40,
                offset: 0
            },
            aVerticesUv: {
                data: this.vertexBuffer,
                size: 4,
                stride: 40,
                offset: 16
            },
            aVerticesOffset: {
                data: this.vertexBuffer,
                size: 2,
                stride: 40,
                offset: 32
            }
        })
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        this.mapTexture.use(0)
        gl.drawArrays(gl.POINTS, 0, this.blocks.length)
    }
}
