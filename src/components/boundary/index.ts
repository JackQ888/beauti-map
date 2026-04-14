import GLPanelLayer from "../../core/layers/GLPanelLayer";
import GLBuffer from "../../engine/webgl/GLBuffer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import GLTexture from "../../engine/webgl/GLTexture";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import DrawUtil from "../../engine/utils/DrawUtil";
import MathUtil from "../../engine/math/MathUtil";
import Matrix3D from "../../engine/math/Matrix3D";

export default class Boundary extends GLPanelLayer {
    props: any;
    needUpdateMap: boolean;
    mapCanvas: any;
    mapCtx: any;
    drawProject: any;
    mapTexture: any;
    vertexBuffer: any;
    center: any;
    $ignoreEvent: boolean;

    constructor() {
        super();
        this.props = {
            quality:1,
            color: "#fff",
            lineWidth:1,
            lineJoin:"miter",
            lineStyle:"solid",
            area:{
                enable:false,
                color:"#567"
            },
            shadow:{
                enable:false,
                shadowOffsetX:0,
                shadowOffsetY:0,
                shadowBlur:0,
                shadowColor:"#0ff",
            },
            insetShadow:{
                enable:false,
                shadowBlur:0,
                shadowColor:"#0ff",
            }
        };
        //地图更新
        this.needUpdateMap=true
        this.$ignoreEvent=true
        this.on('destroy',()=>{
            if(this.drawProject)this.drawProject.destroy()
            if(this.mapTexture)this.mapTexture.destroy()
            if(this.vertexBuffer)this.vertexBuffer.destroy()
        })
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.refresh()
    }

    refresh(){
        this.needUpdateMap=true
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
                            return true;
                        }
                    }
                    break
                }
            }
        }
        return false
    }


    refreshCanvas(gl: any){
        if(!this.mapCanvas){
            this.mapCanvas=document.createElement("canvas")
            this.mapCtx=this.mapCanvas.getContext("2d")
        }
        this.mapCanvas.width=1024*this.props.quality
        this.mapCanvas.height=1024*this.props.quality
        this.mapCtx.save()
        this.mapCtx.clearRect(0,0,this.mapCanvas.width,this.mapCanvas.height)
        this.mapCtx.fillStyle="#000"
        let bounding=this.mapData.getBounding()
        let mapWidth=this.mapData.getWidth()
        let mapHeight=this.mapData.getHeight()
        const GAP=0.05,GAP_B=1-GAP*2,GAP_N=GAP/(1-GAP*2)
        this.mapCtx.translate(this.mapCanvas.width*GAP,this.mapCanvas.width*GAP)
        this.mapCtx.scale(this.mapCanvas.width/mapWidth*GAP_B,this.mapCanvas.height/mapHeight*GAP_B)
        this.mapCtx.translate(-bounding[0],-bounding[1])
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
        if(this.props.insetShadow.enable&&this.props.insetShadow.shadowBlur) {
            this.mapCtx.save()
            this.mapCtx.globalCompositeOperation = 'source-out';
            //这个颜色无用的,只要是不带透明的就行
            this.mapCtx.shadowColor = "#f00"
            this.mapCtx.shadowBlur = this.props.insetShadow.shadowBlur
            this.mapCtx.fillStyle = this.props.insetShadow.shadowColor
            this.mapCtx.fill()
            this.mapCtx.restore()
        }
        this.mapCtx.save()
        if(this.props.shadow.enable){
            this.mapCtx.shadowOffsetX = this.props.shadow.shadowOffsetX
            this.mapCtx.shadowOffsetY = this.props.shadow.shadowOffsetY
            this.mapCtx.shadowBlur = this.props.shadow.shadowBlur
            this.mapCtx.shadowColor = this.props.shadow.shadowColor
        }
        this.mapCtx.lineJoin=this.props.lineJoin
        this.mapCtx.lineWidth = this.props.quality*MathUtil.deal(this.props.lineWidth)/Math.max(this.mapCanvas.width/mapWidth*0.9,this.mapCanvas.height/mapHeight*0.9)
        this.mapCtx.strokeStyle = this.props.color
        this.mapCtx.setLineDash(DrawUtil.buildLineDash(this.props.lineStyle,5/Math.max(this.mapCanvas.width/mapWidth*GAP_B,this.mapCanvas.height/mapHeight*GAP_B)))
        this.mapCtx.stroke()
        this.mapCtx.restore()
        if(this.props.area.enable){
            this.mapCtx.globalCompositeOperation="destination-over"
            this.mapCtx.fillStyle=this.props.area.color
            this.mapCtx.fill()
        }
        this.mapCtx.restore()
        if(!this.mapTexture){
            this.mapTexture=new GLTexture(gl,this.mapCanvas,{
                premultiplyAlpha:true
            })
        }else{
            this.mapTexture.setData(this.mapCanvas)
        }


        let cx=(bounding[2]+bounding[0])/2,cy=(bounding[3]+bounding[1])/2
        this.center=[cx,cy]
        let sx=-mapWidth*(0.5+GAP_N)
        let sy=-mapHeight*(0.5+GAP_N)
        let ex=mapWidth*(0.5+GAP_N)
        let ey=mapHeight*(0.5+GAP_N)

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
        if(this.needUpdateMap){
            this.needUpdateMap=false
            this.refreshCanvas(gl)
        }

        if(!this.drawProject){
            this.drawProject=new GLProject(gl,shader)
        }

        this.drawProject.use()

        let m=Matrix3D.translate(matrix,this.center[0],this.center[1],0)
        this.drawProject.setUniforms({
            uMatrix:{
                data:m
            },
            uHeight:{
                data:this.mapData.convertSize(this.height)
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
        this.mapTexture.use(0)
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4)
    }
}
