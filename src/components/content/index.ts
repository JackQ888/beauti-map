import GLPanelLayer from "../../core/layers/GLPanelLayer";
import ObjectUtil from "../../engine/utils/ObjectUtil";

import ArrayUtils from "../../engine/utils/ArrayUtils"
import LineUtil from "../../engine/utils/LineUtil"
import Matrix3D from "../../engine/math/Matrix3D";
import DrawUtil from "../../engine/utils/DrawUtil";

export default class Content extends GLPanelLayer {
    domElement: HTMLDivElement = document.createElement("div")
    props: any = {
        line: {
            type: "dashed",
            color: "#fff",
            cap: "round",
            join: "round",
            width: 2,
            shadow: {
                enable: false,
                shadowColor: "#000",
                shadowBlur: 5,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        },
        point: {
            enable: false,
            color: "#fff",
            radius: 5,
            shadow: {
                enable: true,
                shadowColor: "#000",
                shadowBlur: 5,
                shadowOffsetX: 0,
                shadowOffsetY: 0
            }
        }
    }
    contentBlocks: (ContentBlock | null)[] = []
    needUpdateMap: boolean = true
    datas: any
    lineCanvas: HTMLCanvasElement | null = null
    renderMatrix: any

    constructor() {
        super()
        this.domElement.style.position = "absolute"
        this.domElement.style.pointerEvents = "none"
        this.domElement.style.width = "100%"
        this.domElement.style.height = "100%"
        this.domElement.style.left = "0"
        this.domElement.style.top = "0"
        this.domElement.style.overflow = "hidden"

        this.on('destroy', () => {
            this.clearContents()
            if(this.domElement)this.domElement.remove()
        })
    }

    contain(p: any) {
        return false
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.needUpdateMap=true
        this.updateSelf()
    }

    updateHeight(){
        this.needUpdateMap=true
    }

    clearContents() {
        for (let content of this.contentBlocks) {
            if (!content) continue
            content.destroy()
        }
        this.contentBlocks.length = 0
    }



    setData(datas: any) {
        this.datas = datas
        this.clearContents()
        this.refresh()
    }

    refresh() {
        this.needUpdateMap=true
        this.updateSelf()
    }

    refreshCanvas(gl: any, matrix: any) {
        if (!this.lineCanvas) {
            this.lineCanvas = document.createElement("canvas")
            this.lineCanvas.style.position="absolute"
            this.lineCanvas.style.left="0"
            this.lineCanvas.style.top="0"
            this.lineCanvas.style.width="100%"
            this.lineCanvas.style.height="100%"
            this.lineCanvas.style.pointerEvents="none"
        }

        if (this.lineCanvas.width !== gl.canvas.width || this.lineCanvas.height !== gl.canvas.height) {
            this.lineCanvas.width = gl.canvas.width
            this.lineCanvas.height = gl.canvas.height
        }
        let width = this.lineCanvas.width / window.devicePixelRatio
        let height = this.lineCanvas.height / window.devicePixelRatio

        let ctx = this.lineCanvas.getContext("2d")!
        ctx.clearRect(0, 0, this.lineCanvas.width, this.lineCanvas.height)
        ctx.save()
        ctx.fillStyle = "#f00"
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

        let pointPath: Path2D | null = null
        if (this.props.point.enable) {
            pointPath = new Path2D()
        }

        ctx.beginPath()

        let offsetHeight=this.mapData.convertSize(this.height)
        for (let i = 0, l = this.datas.length; i < l; i++) {
            let row = this.datas[i]
            let position = this.mapData.getPositionByAny(row.point)
            let block = this.contentBlocks[i]
            if(!position){
                if (block) {
                    block.destroy()
                    this.contentBlocks[i] = null
                }
                continue
            }
            let tp = Matrix3D.transformPoint(matrix, [position[0], position[1],offsetHeight+this.mapData.convertSize(row.height||0) ])
            let x = (tp[0] + 1) / 2 * width, y = (1-tp[1]) / 2 * height
            let inRange = x >= 0 && y >= 0 && x <= width && y <= height
            if (!inRange) {
                if (block) {
                    block.destroy()
                    this.contentBlocks[i] = null
                }
                continue
            }
            if (!block) {
                this.contentBlocks[i] = block = new ContentBlock(row, this)
            }
            block.setStyle(x, y)
            block.render(ctx)
            if (pointPath) {
                pointPath.moveTo(x + block.offsetX + this.props.point.radius, y + block.offsetY)
                pointPath.arc(x + block.offsetX, y + block.offsetY, this.props.point.radius, 0, Math.PI * 2)
            }
        }
        DrawUtil.setStrokeStyle(ctx, this.props.line)
        ctx.stroke()
        if (pointPath) {
            DrawUtil.setFillStyle(ctx, this.props.point)
            ctx.fill(pointPath)
        }
        ctx.restore()
    }


    render(gl: any, matrix: any) {
        if (!this.mapData || this.mapData.isEmpty()||!this.datas) return;
        if(!this.domElement.parentNode){
            gl.canvas.parentNode.appendChild(this.domElement)
        }
        if (!ArrayUtils.itemEqual(matrix, this.renderMatrix) || this.needUpdateMap) {
            this.renderMatrix = matrix
            this.needUpdateMap = false
            this.refreshCanvas(gl, matrix)
        }
        if(!this.lineCanvas!.parentNode)this.domElement.appendChild(this.lineCanvas!)
    }
}


class ContentBlock {
    data: any
    domElement: HTMLDivElement
    offsetX: number = 0
    offsetY: number = 0
    direction: any
    endX: number = 0
    endY: number = 0
    content: any
    showLine: boolean = false
    x: number = 0
    y: number = 0

    constructor(data: any, content: Content) {
        this.data = data
        this.domElement = document.createElement("div")
        this.domElement.style.pointerEvents = "none"
        this.domElement.style.position = "absolute"

        if(data.offset){
            this.offsetX = data.offset[0]
            this.offsetY = data.offset[1]
        }else{
            this.offsetX = 0
            this.offsetY = 0
        }

        this.direction = data.direction

        if(data.end){
            this.endX = data.end[0]
            this.endY = data.end[1]
        }else{
            this.endX = 0
            this.endY = 0
        }

        this.content = data.content
        let popDirection = "top"
        if (this.endX || this.endY) {
            this.showLine = true
            if (this.direction === 'row') {
                popDirection = this.endX >= 0 ? "right" : "left"
            } else {
                popDirection = this.endY >= 0 ? "bottom" : "top"
            }
        }
        switch (popDirection) {
            case "left": {
                this.domElement.style.transform = "translate(-100%,-50%)"
                break
            }
            case "right": {
                this.domElement.style.transform = "translate(0,-50%)"
                break
            }
            case "top": {
                this.domElement.style.transform = "translate(-50%,-100%)"
                break
            }
            case "bottom": {
                this.domElement.style.transform = "translate(-50%,0)"
                break
            }
        }

        content.domElement.appendChild(this.domElement)

        if(this.data.mount)this.data.mount(this)
    }

    setStyle(x: number, y: number) {
        this.x = x
        this.y = y
        this.domElement.style.left = this.offsetX + this.endX + x + "px"
        this.domElement.style.top = this.offsetY + this.endY + y + "px"
    }

    destroy() {
        if(this.data.destroy)this.data.destroy(this)
        this.domElement.remove()
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.showLine) {
            let p = [this.x + this.offsetX, this.y + this.offsetY]
            let lines: number[][] = [p]
            if (this.direction === 'row') {
                lines.push([p[0] + this.endX * 0.2, p[1] + this.endY])
            } else {
                lines.push([p[0] + this.endX, p[1] + this.endY * 0.2])
            }
            lines.push([p[0] + this.endX, p[1] + this.endY])

            let ps = LineUtil.clipLine(lines as any, 0, 1)

            ctx.moveTo(...ps[0])
            for (let i = 1, l = ps.length; i < l; i++) {
                ctx.lineTo(...ps[i])
            }
        }
    }
}
