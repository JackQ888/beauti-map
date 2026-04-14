import GLPanelLayer from "../../core/layers/GLPanelLayer";
import GLBuffer from "../../engine/webgl/GLBuffer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import traceShader from "./traceShader";
import GLTexture from "../../engine/webgl/GLTexture";
import GLRenderTarget from "../../engine/webgl/GLRenderTarget";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import ColorUtil from "../../engine/color/ColorUtil";

export default class Trace extends GLPanelLayer {
    props: any;
    needUpdateMap: boolean;
    needUpdateTrace: boolean;
    mapCanvas: any;
    mapCtx: any;
    mapTexture: any;
    traceTarget: any;
    traceProject: any;
    uiVertexBuffer: any;
    drawProject: any;
    vertexBuffer: any;

    constructor() {
        super();
        this.props = {
            shadowClip:true,
            shadowPositionX: 0.8,
            shadowPositionY: 0,
            shadowRadius: 1,
            shadowColor: "#000"
        };
        //地图更新
        this.needUpdateMap=true
        //斜影更新
        this.needUpdateTrace=true

        this.on('destroy',()=>{
            if(this.mapTexture)this.mapTexture.destroy()
            if(this.traceTarget)this.traceTarget.destroy()
            if(this.traceProject)this.traceProject.destroy()
            if(this.uiVertexBuffer)this.uiVertexBuffer.destroy()
            if(this.drawProject)this.drawProject.destroy()
            if(this.vertexBuffer)this.vertexBuffer.destroy()
        })
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.needUpdateTrace=true
        this.updateSelf()
    }

    refresh(){
        this.needUpdateTrace=true
        this.needUpdateMap=true
        this.updateSelf()
    }

    refreshCanvas(gl: any){
        if(!this.mapCanvas){
            this.mapCanvas=document.createElement("canvas")
            this.mapCanvas.width=512
            this.mapCanvas.height=512
            this.mapCtx=this.mapCanvas.getContext("2d")
        }
        this.mapCtx.save()
        this.mapCtx.clearRect(0,0,this.mapCanvas.width,this.mapCanvas.height)
        this.mapCtx.fillStyle="#000"
        let bounding=this.mapData.getBounding()
        let mapWidth=bounding[2]-bounding[0]
        let mapHeight=bounding[3]-bounding[1]
        this.mapCtx.scale(this.mapCanvas.width/mapWidth*0.9,this.mapCanvas.height/mapHeight*0.9)
        this.mapCtx.translate(-bounding[0]+mapWidth*0.05,-bounding[1]+mapHeight*0.05)
        this.mapCtx.beginPath()
        let data=this.mapData.getData()

        for (let areaData of data) {
            switch (areaData.geometry.type) {
                case "polygon": {
                    for (let i = 0, l = areaData.geometry.polygon.pointsList.length; i < l; i++) {
                        let polygon=areaData.geometry.polygon
                        let points = polygon.pointsList[i]
                        for (let x=0,y=points.length;x<y;x++) {
                            let p = points[x]
                            if (!x) this.mapCtx.moveTo(p[0], p[1])
                            else this.mapCtx.lineTo(p[0], p[1])
                        }
                    }

                    break
                }
                case "polygons": {
                    for (let i = 0, l = areaData.geometry.polygons.length; i < l; i++) {
                        let polygon = areaData.geometry.polygons[i]
                        for (let j = 0, k = polygon.pointsList.length; j < k; j++) {
                            let points = polygon.pointsList[j]
                            for (let x=0,y=points.length;x<y;x++){
                                let p=points[x]
                                if(!x)this.mapCtx.moveTo(p[0],p[1])
                                else this.mapCtx.lineTo(p[0],p[1])
                            }
                        }
                    }
                    break
                }
            }
        }
        this.mapCtx.fill("evenodd")
        this.mapCtx.restore()

        if(!this.mapTexture){
            this.mapTexture=new GLTexture(gl,this.mapCanvas)
        }else{
            this.mapTexture.setData(this.mapCanvas)
        }
    }

    refreshTrace(gl: any){
        if(!this.mapTexture) return
        if(!this.traceTarget){
            this.traceTarget=new GLRenderTarget(gl,512,512,{
                premultiplyAlpha:true
            })
        }
        this.traceTarget.use()
        this.traceTarget.clear()
        if(!this.traceProject){
            this.traceProject=new GLProject(gl,traceShader)
        }
        this.traceProject.use()
        this.mapTexture.use()
        this.traceProject.setAttributes({
            aVertexPosition:{
                data:this.uiVertexBuffer,
                size:2
            }
        })

        this.traceProject.setUniforms({
            uDirection:{
                data:[this.props.shadowPositionX, this.props.shadowPositionY, this.props.shadowRadius * 0.002]
            },
            uShadowColor:{
                data:ColorUtil.toOneRGBA(this.props.shadowColor)
            },
            uClip:{
                data:this.props.shadowClip?0.0001:1.0001
            }
        })
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
        this.traceTarget.pop()
    }


    render(gl: any, matrix: any){
        if(!this.mapData||this.mapData.isEmpty())return
        if(this.needUpdateMap){
            this.needUpdateMap=false
            this.refreshCanvas(gl)
        }
        if(!this.uiVertexBuffer){
            this.uiVertexBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER,gl.STATIC_DRAW,
                new Float32Array([
                    0, 1,
                    1, 1,
                    0, 0,
                    1, 0,
                ]));
        }

        if(this.needUpdateTrace){
            this.needUpdateTrace=false
            this.refreshTrace(gl)
        }
        if(!this.drawProject){
            this.drawProject=new GLProject(gl,shader)
        }

        this.drawProject.use()

        if(!this.traceTarget || !this.traceTarget.getTexture()) return

        let bounding=this.mapData.getBounding()
        let width=bounding[2]-bounding[0],height=bounding[3]-bounding[1],cx=(bounding[2]+bounding[0])/2,cy=(bounding[3]+bounding[1])/2
        let sx=cx-width*0.7
        let sy=cy-height*0.7
        let ex=cx+width*0.7
        let ey=cy+height*0.7

        if(!this.vertexBuffer){
            this.vertexBuffer = new GLBuffer(gl, gl.ARRAY_BUFFER,gl.STATIC_DRAW,
                new Float32Array([
                    sx,ey,0, 1,
                    ex,ey,1, 1,
                    sx,sy,0, 0,
                    ex,sy,1, 0,
                ]));
        }else{
            this.vertexBuffer.setData(
                new Float32Array([
                    sx,ey,0, 1,
                    ex,ey,1, 1,
                    sx,sy,0, 0,
                    ex,sy,1, 0,
                ])
            )
        }

        this.drawProject.setUniforms({
            uMatrix:{
                data:matrix
            }
        })

        this.drawProject.setAttributes({
            aVertices:{
                data:this.vertexBuffer,
                size:4
            }
        })
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
        this.traceTarget.getTexture().use(0)
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
    }
}
