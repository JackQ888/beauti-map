import GL3DLayer from "../../core/layers/GL3DLayer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import GLTexture from "../../engine/webgl/GLTexture";
import GLBuffer from "../../engine/webgl/GLBuffer";
import FontFaceObserver from "fontfaceobserver";
import DrawUtil from "../../engine/utils/DrawUtil";
import ObjectUtil from "../../engine/utils/ObjectUtil";

export default class PanelText extends GL3DLayer {
    props: any = {
        offset:{
            x:0,
            y:0
        },
        nameFilter: null as any,
        text: {
            align: {
                vertical: "middle",
                horizontal: "center"
            },
            font: {
                fontSize: 24,
                fontStyle: "normal",
                fontWeight: "normal",
                fontFamily: "Arial",
                color: "#fff"
            },
            shadow: {
                enable: true,
                shadowBlur: 5,
                shadowColor: "#000",
                shadowOffsetX: 0,
                shadowOffsetY: 5,
            }
        },
    }
    needUpdate: boolean = true
    $ignoreEvent: boolean = true
    drawProject: any
    vertexBuffer: any
    mapTexture: any
    textCanvas: HTMLCanvasElement | null = null
    blocks: any[] = []
    canvasWidth: number = 0
    canvasHeight: number = 0

    constructor() {
        super();
        this.on('destroy',()=>{
            if(this.drawProject)this.drawProject.destroy()
            if(this.vertexBuffer)this.vertexBuffer.destroy()
            if(this.mapTexture)this.mapTexture.destroy()
        })
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        new FontFaceObserver(this.props.text.font.fontFamily).load().then(this.refresh).catch(()=>{})
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
        this.updateSelf()
    }


    refreshBuffer(gl: any) {
        if (!this.textCanvas) {
            this.textCanvas = document.createElement("canvas")
        }
        let ctx = this.textCanvas.getContext("2d")!
        ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height)

        const MARGIN=20

        let maxTextHeight = 0,
            drawCanvasStartX = 0,
            drawCanvasStartY = 0

        let blocks: any[] = [],maxWidth=0
        let font={
            ...this.props.text.font,
            fontSize:this.props.text.font.fontSize*3
        }
        DrawUtil.setFontStyle(ctx, font)

        let offsetX=this.mapData.convertSize(this.props.offset.x)
        let offsetY=this.mapData.convertSize(this.props.offset.y)
        for (let row of this.mapData.getData()) {
            let name = row.properties.name
            if (name&&this.props.nameFilter) {
                name = this.props.nameFilter(name) || ""
            }
            if(!name)continue
            let position: any
            if (!row.properties.adcode) {
                position = this.mapData.getPositionByCoordinate(row.properties.centroid || row.properties.center)
            } else {
                position = this.mapData.getPositionByAdcode(row.properties.adcode)
            }
            let rect = ctx.measureText(name.toString())
            let textWidth = rect.width+MARGIN
            let textHeight = rect.fontBoundingBoxAscent + rect.fontBoundingBoxDescent+MARGIN

            if(drawCanvasStartX>2560){
                maxWidth=Math.max(drawCanvasStartX,maxWidth)
                drawCanvasStartX=0
                drawCanvasStartY+=maxTextHeight
                maxTextHeight=0
            }

            maxTextHeight=Math.max(textHeight, maxTextHeight)
            let endX = drawCanvasStartX + textWidth
            let endY = drawCanvasStartY + textHeight

            blocks.push({
                adcode:row.properties.adcode,
                name,
                position,
                startX: drawCanvasStartX,
                endX,
                startY:drawCanvasStartY,
                endY,
                width: textWidth,
                height: textHeight
            })
            drawCanvasStartX = endX
            maxWidth=Math.max(drawCanvasStartX,maxWidth)
        }

        this.blocks = blocks
        this.canvasWidth = maxWidth
        this.canvasHeight = drawCanvasStartY+maxTextHeight
        this.textCanvas.width = this.canvasWidth * window.devicePixelRatio
        this.textCanvas.height = this.canvasHeight * window.devicePixelRatio
        this.textCanvas.style.height = this.canvasWidth + "px"
        this.textCanvas.style.height = this.canvasHeight + "px"
        ctx.save()
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        DrawUtil.setFontStyle(ctx, font)

        if(this.props.text.shadow&&this.props.text.shadow.enable){
            DrawUtil.setShadowStyle(ctx, this.props.text.shadow)
        }

        ctx.textAlign = "left"
        ctx.textBaseline = "top"

        let buffers: number[] = []

        for (let block of blocks) {
            ctx.save()
            if (typeof (this.props.text.font.color) === 'string') {
                ctx.fillStyle = this.props.text.font.color
            } else {
                ctx.fillStyle = this.props.text.font.color(ctx, {
                    adcode: block.adcode,
                    name:block.name,
                    x:  block.startX+MARGIN/2,
                    y:  block.startY+MARGIN/2,
                    width:block.width-MARGIN,
                    height:block.height-MARGIN
                })
            }

            ctx.fillText(block.name, block.startX+MARGIN/2, block.startY+MARGIN/2)

            let su = block.startX / this.canvasWidth
            let eu = block.endX / this.canvasWidth
            let sv = block.startY / this.canvasHeight
            let ev = block.endY / this.canvasHeight

            let pointWidth=this.mapData.convertSize(block.width)/4, pointHeight=this.mapData.convertSize(block.height)/4

            if(buffers.length){
                buffers.push(buffers[buffers.length-4],buffers[buffers.length-3],buffers[buffers.length-2],buffers[buffers.length-1])
                buffers.push(block.position[0]-pointWidth, block.position[1]-pointHeight,su,sv)
            }

            let x=block.position[0]+ offsetX,y=block.position[1]+offsetY
            switch (this.props.text.align.horizontal) {
                case "left": {
                    x += pointWidth
                    break
                }
                case "right": {
                    x -= pointWidth
                    break
                }
                default: {
                    break
                }
            }
            switch (this.props.text.align.vertical) {
                case "top": {
                    y += pointHeight
                    break
                }
                case "bottom": {
                    y -= pointHeight
                    break
                }
                default: {
                    break
                }
            }



            buffers.push(x-pointWidth, y-pointHeight,su,sv)
            buffers.push(x-pointWidth, y+pointHeight,su,ev)
            buffers.push(x+pointWidth, y-pointHeight,eu,sv)
            buffers.push(x+pointWidth, y+pointHeight,eu,ev)
        }
        ctx.restore()
        if (!this.mapTexture) {
            this.mapTexture = new GLTexture(gl, this.textCanvas, {premultiplyAlpha: true, flipY: false})
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
        if (!this.mapData || this.mapData.isEmpty()) return;

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
                size: 4
            }
        })
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        this.mapTexture.use(0)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexBuffer.length/4)
    }
}
