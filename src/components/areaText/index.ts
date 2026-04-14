import GLPanelLayer from "../../core/layers/GLPanelLayer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import GLTexture from "../../engine/webgl/GLTexture";
import GLBuffer from "../../engine/webgl/GLBuffer";
import FontFaceObserver from "fontfaceobserver";
import Matrix3D from "../../engine/math/Matrix3D";
import MathUtil from "../../engine/math/MathUtil";
import DrawUtil from "../../engine/utils/DrawUtil";
import ObjectUtil from "../../engine/utils/ObjectUtil";

import ArrayUtils from "../../engine/utils/ArrayUtils"

export default class PanelAreaText extends GLPanelLayer {
    props: any = {
        nameFilter: null as any,
        offset:{
            x:0,
            y:0
        },
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
        backdrop: {
            enable: true,
            padding: 10,
            borderRadius: 0,
            image: {
                enable: false,
                url: '',
                opacity: 1
            },
            style: {
                border: {
                    enable: false,
                    color: "#fff",
                    width: 1
                },
                background: {
                    enable: true,
                    color: "rgba(0,0,0,0.4)",
                    shadow: {
                        enable: true,
                        shadowBlur: 5,
                        shadowColor: "#000",
                        shadowOffsetX: 0,
                        shadowOffsetY: 5,
                    }
                }
            }
        },
        height:50
    }
    textImage: HTMLImageElement | null = null
    $ignoreEvent: boolean = true
    textCanvas: HTMLCanvasElement | null = null
    vertexBuffer: any
    drawProject: any
    mapTexture: any
    renderMatrix: any
    needUpdateMap: boolean = false

    constructor() {
        super();

        this.on("destroy",()=>{
            if(this.textCanvas)this.textCanvas.remove()
            if(this.vertexBuffer)this.vertexBuffer.destroy()
            if(this.drawProject)this.drawProject.destroy()
            if(this.mapTexture)this.mapTexture.destroy()
        })
    }

    setProps(props: any) {
        let beforeImageSrc = this.props.backdrop.enable && this.props.backdrop.image.enable ? this.props.backdrop.image.url : ''
        ObjectUtil.setProps(this.props, props)
        new FontFaceObserver(this.props.text.font.fontFamily).load().then(this.refresh).catch(()=>{})
        this.refresh()
        if (this.props.backdrop.enable && this.props.backdrop.image.enable && this.props.backdrop.image.url) {
            if (beforeImageSrc !== this.props.backdrop.image.url) {
                let textImage = new Image()
                textImage.setAttribute('crossOrigin', '');

                textImage.src = this.props.backdrop.image.url
                textImage.onload = () => {
                    this.textImage = textImage
                    this.refresh()
                }
            }
        } else {
            this.textImage = null
        }
    }

    setMapData(mapData: any){
        if (this.mapData) {
            this.mapData.off('change', this.refresh)
            this.mapData.off('areaPositionChange', this.refresh)
        }
        this.mapData=mapData
        if (this.mapData) {
            this.mapData.on('change', this.refresh)
            this.mapData.on('areaPositionChange', this.refresh)
        }
        this.refresh()
    }

    refresh() {
        this.needUpdateMap=true
        this.updateSelf()
    }


    refreshCanvas(gl: any, matrix: any) {
        if(!this.textCanvas){
            this.textCanvas=document.createElement("canvas")
            this.textCanvas.style.position="absolute"
            this.textCanvas.style.left="0"
            this.textCanvas.style.top="0"
            this.textCanvas.style.width="100%"
            this.textCanvas.style.height="100%"
            this.textCanvas.style.pointerEvents="none"
        }

        if(this.textCanvas.width!==gl.canvas.width||this.textCanvas.height!==gl.canvas.height){
            this.textCanvas.width=gl.canvas.width
            this.textCanvas.height=gl.canvas.height
        }
        let scaleX=this.textCanvas.width/2/window.devicePixelRatio,scaleY=this.textCanvas.height/2/window.devicePixelRatio
        let ctx=this.textCanvas.getContext("2d")!
        ctx.clearRect(0,0,this.textCanvas.width,this.textCanvas.height)
        ctx.save()
        ctx.scale(window.devicePixelRatio,window.devicePixelRatio)
        let areas = this.mapData.getData()
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        DrawUtil.setFontStyle(ctx, this.props.text.font)

        let fontHeight = this.props.text.font.fontSize
        let paddingLeft = 0, paddingRight = 0, paddingTop = 0, paddingBottom = 0
        if (this.props.backdrop.padding instanceof Array) {
            if (this.props.backdrop.padding.length === 2) {
                paddingTop = paddingBottom = this.props.backdrop.padding[0]
                paddingLeft = paddingRight = this.props.backdrop.padding[1]
            } else if (this.props.backdrop.padding.length === 4) {
                paddingTop = this.props.backdrop.padding[0]
                paddingRight = this.props.backdrop.padding[1]
                paddingBottom = this.props.backdrop.padding[2]
                paddingLeft = this.props.backdrop.padding[3]
            } else {
                console.error("padding是数组时,长度必须为2或者4")
            }
        } else {
            paddingLeft = paddingRight = paddingTop = paddingBottom = this.props.backdrop.padding - 0
        }

        let hasRadius: any
        if (this.props.backdrop.borderRadius instanceof Array) {
            hasRadius = MathUtil.arraySum(this.props.backdrop.borderRadius, 0, 4)
        } else {
            hasRadius = this.props.backdrop.borderRadius > 0
        }

        for (let i = 0, l = areas.length; i < l; i++) {
            let b = areas[i]
            let name = b.properties.name
            let p: any = null
            if (!b.properties.adcode) {
                p = this.mapData.getPositionByCoordinate(b.properties.centroid || b.properties.center)
            } else {
                p = this.mapData.getPositionByAdcode(b.properties.adcode)
            }
            if (!name || !p) continue
            Matrix3D.transformPoint(matrix,[...p,this.mapData.convertSize(this.height)],p)
            if(!MathUtil.inRange(-1,1,p[2]))continue

            p[0]=(p[0]+1)*scaleX
            p[1]=(1-p[1])*scaleY
            let width = ctx.measureText(name).width
            let height = fontHeight
            if (this.props.nameFilter) {
                name = this.props.nameFilter(name) || ""
            }
            if (!name) continue
            let x = MathUtil.deal(p[0]), y = MathUtil.deal(p[1])

            switch (this.props.text.align.horizontal) {
                case "left": {
                    x += width / 2
                    break
                }
                case "right": {
                    x -= width / 2
                    break
                }
                default: {
                    break
                }
            }
            switch (this.props.text.align.vertical) {
                case "top": {
                    y += height / 2
                    break
                }
                case "bottom": {
                    y -= height / 2
                    break
                }
                default: {
                    break
                }
            }
            ctx.save()
            ctx.translate(this.props.offset.x+x,this.props.offset.y+y)
            if (this.props.backdrop.enable) {
                let dw = width + paddingLeft + paddingRight,
                    dh = height + paddingTop + paddingBottom,
                    dx =  - width / 2 - paddingLeft,
                    dy =  - height / 2 - paddingTop
                if (hasRadius) {
                    DrawUtil.drawRoundRectPath(ctx, this.props.backdrop.borderRadius, dw, dh, dx, dy)
                } else {
                    ctx.beginPath();
                    ctx.rect(dx, dy, dw, dh);
                }
                if (this.props.backdrop.style.background.enable) {
                    ctx.save()
                    if (this.props.backdrop.style.background.shadow.enable) {
                        ctx.shadowBlur = this.props.backdrop.style.background.shadow.shadowBlur
                        ctx.shadowOffsetX = this.props.backdrop.style.background.shadow.shadowOffsetX
                        ctx.shadowOffsetY = this.props.backdrop.style.background.shadow.shadowOffsetY
                        ctx.shadowColor = this.props.backdrop.style.background.shadow.shadowColor
                    }
                    ctx.fillStyle = this.props.backdrop.style.background.color
                    ctx.fill()
                    ctx.restore()
                }

                if (this.props.backdrop.image.enable && this.textImage) {
                    ctx.save();
                    if (hasRadius) {
                        ctx.clip()
                    }
                    ctx.globalAlpha *= this.props.backdrop.image.opacity;
                    ctx.drawImage(this.textImage, dx,
                        dy, dw, dh);
                    ctx.restore();
                }

                if (this.props.backdrop.style.border.enable) {
                    ctx.lineWidth = this.props.backdrop.style.border.width
                    ctx.strokeStyle = this.props.backdrop.style.border.color
                    ctx.stroke()
                }

            }
            ctx.save()
            if (this.props.text.shadow.enable) {
                ctx.shadowBlur = this.props.text.shadow.shadowBlur
                ctx.shadowOffsetX = this.props.text.shadow.shadowOffsetX
                ctx.shadowOffsetY = this.props.text.shadow.shadowOffsetY
                ctx.shadowColor = this.props.text.shadow.shadowColor
            }
            if (typeof (this.props.text.font.color) === 'string') {
                ctx.fillStyle = this.props.text.font.color
            } else {
                ctx.fillStyle = this.props.text.font.color(ctx, {
                    adcode: b.properties.adcode,
                    name,
                    x:  - width / 2,
                    y:  - height / 2,
                    width,
                    height
                })
            }
            ctx.fillText(name, 0,0)
            ctx.restore()

            ctx.restore()
        }
        ctx.restore()


        if(!this.mapTexture){
            this.mapTexture=new GLTexture(gl,this.textCanvas,{flipY:true,premultiplyAlpha:true})
        }else{
            this.mapTexture.setData(this.textCanvas)
        }
    }

    render(gl: any, matrix: any){
        if (!this.mapData||this.mapData.isEmpty()) return;
        if(!ArrayUtils.itemEqual(matrix,this.renderMatrix)||this.needUpdateMap) {
            this.renderMatrix=matrix
            this.needUpdateMap=false
            this.refreshCanvas(gl, matrix)
        }

        if(!this.drawProject){
            this.drawProject=new GLProject(gl,shader)
        }
        this.drawProject.use()

        if(!this.vertexBuffer){
            this.vertexBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER,gl.STATIC_DRAW,
                new Float32Array([
                    0, 1,
                    1, 1,
                    0, 0,
                    1, 0,
                ]));
        }

        this.drawProject.setAttributes({
            aVertices:{
                data:this.vertexBuffer,
                size:2
            }
        })
        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        this.mapTexture.use(0)
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
    }
}
