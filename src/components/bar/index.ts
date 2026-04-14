import GL3DLayer from "../../core/layers/GL3DLayer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import GLBuffer from "../../engine/webgl/GLBuffer";
import topShader from "./topShader";
import GLTexture from "../../engine/webgl/GLTexture";
import drawShader from "./drawShader";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import GeometryUtil from "../../engine/geometry/GeometryUtil";

export default class Bar extends GL3DLayer {
    needUpdateBuffer: boolean = true
    needUpdateShadow: boolean = true
    props: any = {
        lightDirection: 120
    }
    sectionBuffer: any
    sectionColorBuffer: any
    topBuffer: any
    topColorBuffer: any
    shadowTexture: any
    vertexBuffer: any
    shadowProject: any
    sectionProject: any
    topProject: any
    datas: any
    clipMapData: any
    mapCanvas: HTMLCanvasElement | null = null
    mapCtx: CanvasRenderingContext2D | null = null
    ticker: any

    constructor() {
        super()

        this.refreshShadow=this.refreshShadow.bind(this)
        this.on('destroy',()=>{
            if(this.sectionBuffer)this.sectionBuffer.destroy()
            if(this.sectionColorBuffer)this.sectionColorBuffer.destroy()
            if(this.topBuffer)this.topBuffer.destroy()
            if(this.topColorBuffer)this.sectionBuffer.destroy()
            if(this.shadowTexture)this.shadowTexture.destroy()
            if(this.vertexBuffer)this.vertexBuffer.destroy()
            if(this.shadowProject)this.shadowProject.destroy()
            if(this.sectionProject)this.sectionProject.destroy()
            if(this.topProject)this.topProject.destroy()
        })
    }

    setProps(props: any){
        ObjectUtil.setProps(this.props,props)
        this.refresh()
    }

    refresh() {
        this.needUpdateShadow=true
        this.needUpdateBuffer=true
        this.updateSelf()
    }

    refreshShadow(){
        this.needUpdateShadow=true
        this.updateSelf()
    }

    setData(data: any){
        this.datas=data
        this.refresh()
    }

    setClipMapData(mapData: any){
        if (this.clipMapData) {
            this.clipMapData.off('change', this.refreshShadow)
        }
        this.clipMapData=mapData
        if (this.clipMapData) {
            this.clipMapData.on('change', this.refreshShadow)
        }
        this.refreshShadow()
    }

    refreshBuffer(gl: any){
        let sections: number[]=[],tops: number[]=[],sectionColors: number[]=[],topColors: number[]=[]
        for (let item of this.datas){
            let position=this.mapData.getPositionByAny(item.point)
            if(!position)continue
            let data=GeometryUtil.createBar(position[0],position[1],this.mapData.convertSize(item.radius),this.mapData.convertSize(item.height),item.topColor,item.bottomColor,item.splitNum||4)
            sections=sections.concat(data.sections)
            tops=tops.concat(data.tops)
            sectionColors=sectionColors.concat(data.sectionColors)
            topColors=topColors.concat(data.topColors)
        }

        if(!this.sectionBuffer){
            this.sectionBuffer=new GLBuffer(gl,gl.ARRAY_BUFFER,gl.STATIC_DRAW,new Float32Array(sections))
        }else{
            this.sectionBuffer.setData(new Float32Array(sections))
        }

        if(!this.sectionColorBuffer){
            this.sectionColorBuffer=new GLBuffer(gl,gl.ARRAY_BUFFER,gl.STATIC_DRAW,new Float32Array(sectionColors))
        }else{
            this.sectionColorBuffer.setData(new Float32Array(sectionColors))
        }

        if(!this.topBuffer){
            this.topBuffer=new GLBuffer(gl,gl.ARRAY_BUFFER,gl.STATIC_DRAW,new Float32Array(tops))
        }else{
            this.topBuffer.setData(new Float32Array(tops))
        }

        if(!this.topColorBuffer){
            this.topColorBuffer=new GLBuffer(gl,gl.ARRAY_BUFFER,gl.STATIC_DRAW,new Float32Array(topColors))
        }else{
            this.topColorBuffer.setData(new Float32Array(topColors))
        }
    }

    refreshShadowTexture(gl: any){
       let clipMapData=this.clipMapData||this.mapData
        if(!this.mapCanvas){
            this.mapCanvas=document.createElement("canvas")
            this.mapCtx=this.mapCanvas.getContext("2d")
        }
        let bounding=this.mapData.getBounding()
        let mapWidth=this.mapData.getWidth()
        let mapHeight=this.mapData.getHeight()
        this.mapCanvas.width=1024
        this.mapCanvas.height=1024*mapHeight/mapWidth
        this.mapCtx!.save()
        this.mapCtx!.clearRect(0,0,this.mapCanvas.width,this.mapCanvas.height)
        let scaleX=this.mapCanvas.width/mapWidth*0.6,scaleY=this.mapCanvas.height/mapHeight*0.6
        let offsetX=-bounding[0]+mapWidth*0.2,offsetY=-bounding[1]+mapHeight*0.2
        this.mapCtx!.beginPath()
        let data=clipMapData.getData()
        for (let areaData of data) {
            switch (areaData.geometry.type) {
                case "polygon": {
                    for (let i = 0, l = areaData.geometry.polygon.pointsList.length; i < l; i++) {
                        let polygon=areaData.geometry.polygon
                        let points = polygon.pointsList[i]
                        for (let x=0,y=points.length;x<y;x++) {
                            let p = points[x]
                            if (!x) this.mapCtx!.moveTo((p[0]+offsetX)*scaleX, (p[1]+offsetY)*scaleY)
                            else this.mapCtx!.lineTo((p[0]+offsetX)*scaleX, (p[1]+offsetY)*scaleY)
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
                                if(!x)this.mapCtx!.moveTo((p[0]+offsetX)*scaleX, (p[1]+offsetY)*scaleY)
                                else this.mapCtx!.lineTo((p[0]+offsetX)*scaleX, (p[1]+offsetY)*scaleY)
                            }
                        }
                    }
                    break
                }
            }
        }
        this.mapCtx!.clip()
        this.mapCtx!.shadowBlur=10
        this.mapCtx!.shadowColor="#000"
        this.mapCtx!.shadowOffsetX=10000

        this.mapCtx!.beginPath()
        const t=this.props.lightDirection/180*Math.PI
        const vx=Math.cos(t)
        const vy=Math.sin(t)

        for (let item of this.datas){
            let position=this.mapData.getPositionByAny(item.point)
            if(!position)continue
            this.mapCtx!.beginPath()
            let px=position[0]+offsetX,py=position[1]+offsetY
            let bx=px*scaleX,by=py*scaleY

            const tx=vx*item.radius/3,ty=vy*item.radius/3
            let vhx=vx*item.height/2,vhy=+vy*item.height/2

            let sx1=bx-ty-10000,sy1=by+tx
            let sx2=bx+ty-10000,sy2=by-tx
            let ex1=sx1+vhx,ey1=sy1+vhy
            let ex2=sx2+vhx,ey2=sy2+vhy

            let grd=this.mapCtx!.createLinearGradient(sx1,sy1,ex1,ey1)
            grd.addColorStop(0,"#000")
            grd.addColorStop(0.5,"rgba(0,0,0,0.7)")
            grd.addColorStop(1,"rgba(0,0,0,0)")
            this.mapCtx!.fillStyle=grd

            this.mapCtx!.moveTo(sx1,sy1)
            this.mapCtx!.lineTo(sx2,sy2)
            this.mapCtx!.lineTo(ex2,ey2)
            this.mapCtx!.lineTo(ex1,ey1)
            this.mapCtx!.fill()

        }
        this.mapCtx!.restore()

        if(!this.shadowTexture){
            this.shadowTexture=new GLTexture(gl,this.mapCanvas)
        }else{
            this.shadowTexture.setData(this.mapCanvas)
        }

        let cx=(bounding[2]+bounding[0])/2,cy=(bounding[3]+bounding[1])/2

        let sx=cx-mapWidth*0.5
        let sy=cy-mapHeight*0.5
        let ex=cx+mapWidth*0.5
        let ey=cy+mapHeight*0.5

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
    }

    render(gl: any, matrix: any){
        if(!this.mapData||this.mapData.isEmpty())return

        if(this.needUpdateBuffer){
            this.needUpdateBuffer=false
            this.refreshBuffer(gl)
        }

        if(this.needUpdateShadow){
            this.needUpdateShadow=false
            this.refreshShadowTexture(gl)
        }

        if(!this.shadowProject){
            this.shadowProject=new GLProject(gl,drawShader)
        }

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)

        this.shadowProject.use()
        this.shadowProject.setUniforms({
            uMatrix:{
                data:matrix
            },
            uHeight:{
                data:this.mapData.convertSize(this.height)
            }
        })

        this.shadowProject.setAttributes({
            aVertices:{
                data:this.vertexBuffer,
                size:4
            }
        })
        this.shadowTexture.use(0)
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)

        gl.enable(gl.DEPTH_TEST)


        if(!this.sectionProject){
            this.sectionProject=new GLProject(gl,shader)
        }
        this.sectionProject.use()
        this.sectionProject.setUniforms({
            uMatrix:{
                data:matrix
            },
            uHeight:{
                data:this.mapData.convertSize(this.height)
            },
            uDirection:{
                data:this.props.lightDirection/180*Math.PI+Math.PI
            }
        })
        this.sectionProject.setAttributes({
            aVertices:{
                data:this.sectionBuffer,
                size:3,
                stride:20,
                offset:0
            },
            aVerticesUv:{
                data:this.sectionBuffer,
                size:2,
                stride:20,
                offset:12
            },
            aVerticesColor:{
                data:this.sectionColorBuffer,
                size:4
            }
        })
        gl.drawArrays(gl.TRIANGLES,0,this.sectionBuffer.length/5)

        if(!this.topProject){
            this.topProject=new GLProject(gl,topShader)
        }
        this.topProject.use()
        this.topProject.setUniforms({
            uMatrix:{
                data:matrix
            },
            uHeight:{
                data:this.mapData.convertSize(this.height)
            }
        })

        this.topProject.setAttributes({
            aVertices:{
                data:this.topBuffer,
                size:4
            },
            aVerticesColor:{
                data:this.topColorBuffer,
                size:4
            }
        })
        gl.drawArrays(gl.TRIANGLES,0,this.topBuffer.length/4)
        gl.disable(gl.CULL_FACE)
    }
}
