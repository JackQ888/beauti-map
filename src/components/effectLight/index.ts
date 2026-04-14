import source from "./source";
import GLPanelLayer from "../../core/layers/GLPanelLayer";
import GLProject from "../../engine/webgl/GLProject";
import GLBuffer from "../../engine/webgl/GLBuffer";

import AnimationUtil from "../../engine/animation/AnimationUtil"
import LineUtil from "../../engine/utils/LineUtil"
import Ease from "../../engine/animation/EaseFunctions"
import ColorUtil from "../../engine/color/ColorUtil";
import ObjectUtil from "../../engine/utils/ObjectUtil";

export default class EffectLight extends GLPanelLayer {
    props: any = {
        color:"#fff",
        lineWidth: 30,
        lightNumber: 3,
        lightLength: 0.5,
        duration: 2000,
        ease:"linear"
    }
    needRefresh: boolean = true
    ticker: any
    timer: number = 0
    percent: number = 0
    lineBuffer: any
    project: any
    linePoints: any[] = []

    constructor() {
        super();
        this.on('destroy', () => {
            AnimationUtil.cancelTick(this.ticker)
            if(this.lineBuffer)this.lineBuffer.destroy()
            if(this.project)this.project.destroy()
        })

        this.reset()
    }

    refresh(){
        this.needRefresh=true
        this.updateSelf()
    }

    reset() {
        this.timer = 0
        this.percent = 0
        AnimationUtil.cancelTick(this.ticker)
        this.ticker = AnimationUtil.tick((delta: number) => {
            this.percent = Ease[this.props.ease](this.timer / this.props.duration)
            this.timer += delta
            this.timer = this.timer % this.props.duration
            this.updateSelf()
        })
    }


    setProps(props: any) {
        let oldWidth = this.props.lineWidth
        ObjectUtil.setProps(this.props, props)
        if (oldWidth !== this.props.lineWidth) {
            this.needRefresh = true
        }
        this.reset()
        this.updateSelf()
    }

    buildLines(gl: any) {
        this.linePoints = []
        let maxPointList: any[]=[]
        let mapData=this.mapData.getData()
        for (let areaData of mapData){
            switch(areaData.geometry.type){
                case "polygon":{
                    for (let j=0,k=areaData.geometry.polygon.pointsList.length;j<k;j++){
                        let points=areaData.geometry.polygon.pointsList[j]
                        if (points.length > maxPointList.length) {
                            maxPointList=points
                        }
                    }

                    break
                }
                case "polygons":{
                    for (let j=0,k=areaData.geometry.polygons.length;j<k;j++){
                        let points=areaData.geometry.polygons[j].pointsList
                        for (let n=0,m=points.length;n<m;n++){
                            let ps=points[n]
                            if (ps.length > maxPointList.length) {
                                maxPointList=ps
                            }
                        }
                    }
                    break
                }
            }
        }
        let simple=LineUtil.simplifyPoints(maxPointList,{tolerance:this.mapData.convertSize(this.props.lineWidth/3)})
        this.linePoints = LineUtil.getLineByPoints(simple, this.mapData.convertSize(this.props.lineWidth), 1,true)

        if (!this.lineBuffer) {
            this.lineBuffer = new GLBuffer(gl,gl.ARRAY_BUFFER, gl.STREAM_DRAW, new Float32Array(this.linePoints))
        } else {
            this.lineBuffer.setData(new Float32Array(this.linePoints))
        }
    }


    render(gl: any, matrix: any) {
        if(!this.mapData||this.mapData.isEmpty())return
        if(!this.project){
            this.project=new GLProject(gl,source)
        }
        if(this.needRefresh){
            this.needRefresh=false
            this.buildLines(gl)
        }
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
        this.project.use()

        this.project.setUniforms({
            uMatrix:{
                data:matrix
            },
            uPercent:{
                data:this.percent
            },
            uNumber:{
                data:this.props.lightNumber
            },
            uLength:{
                data:this.props.lightLength
            },
            uColor:{
                data:ColorUtil.toOneRGBA(this.props.color)
            },
            uHeight:{
                data:this.mapData.convertSize(this.height)
            }
        })

        this.project.setAttributes({
            aVertices:{
                data:this.lineBuffer,
                size:4
            }
        })
        gl.drawArrays(gl.TRIANGLE_STRIP,0,this.lineBuffer.length/4)
    }
}
