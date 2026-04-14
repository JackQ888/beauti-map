import GLPanelLayer from "../../core/layers/GLPanelLayer";
import GLBuffer from "../../engine/webgl/GLBuffer";
import GLProject from "../../engine/webgl/GLProject";
import shader from "./shader";
import AnimationUtil from "../../engine/animation/AnimationUtil";
import MathUtil from "../../engine/math/MathUtil";
import ObjectUtil from "../../engine/utils/ObjectUtil";
import GLTexture from "../../engine/webgl/GLTexture";

export default class TexturePanel extends GLPanelLayer {
    props: any;
    timer: any;
    percent: any;
    ticker: any;
    vertexBuffer: any;
    drawProject: any;
    needUpdateBuffer: boolean;
    texture: any;

    constructor() {
        super();
        this.props={
            radius:1,
            duration: 4000,
            url:'',
            blur:1,
            opacity:1
        }

        this.timer = 0
        this.percent = 0

        this.on('destroy', () => {
            AnimationUtil.cancelTick(this.ticker)
            if(this.vertexBuffer)this.vertexBuffer.destroy()
            if(this.drawProject)this.drawProject.destroy()
        })

        this.reset()
    }

    setProps(props: any) {
        ObjectUtil.setProps(this.props, props)
        this.refresh()
    }

    refresh(){
        this.updateSelf()
        this.needUpdateBuffer=true
    }

    refreshBuffer(gl: any){
        let bounding=this.mapData.getBounding()
        let width=bounding[2]-bounding[0],height=bounding[3]-bounding[1],cx=(bounding[2]+bounding[0])/2,cy=(bounding[3]+bounding[1])/2
        let radius=MathUtil.distancexy(width/2,height/2)*this.props.radius
        let sx=cx-radius
        let sy=cy-radius
        let ex=cx+radius
        let ey=cy+radius

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
        if(!this.props.url)return;
        if(!this.texture){
            this.texture=new GLTexture(gl, null, {
                premultiplyAlpha:true
            })
            this.texture.setDataUrl(this.props.url)
        }else if(this.texture.dataUrl!==this.props.url){
            this.texture.setDataUrl(this.props.url)
        }
        if(!this.texture.complete)return;
        if(this.needUpdateBuffer){
            this.needUpdateBuffer=false
            this.refreshBuffer(gl)
        }
        gl.disable(gl.CULL_FACE)
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)
        if(!this.drawProject){
            this.drawProject=new GLProject(gl,shader)
        }


        this.drawProject.use()

        this.drawProject.setUniforms({
            uMatrix:{
                data:matrix
            },
            uPercent:{
                data:this.percent
            },
            uOpacity:{
                data:this.props.opacity
            },
            uBlur:{
                data:this.props.blur
            }
        })
        this.drawProject.setAttributes({
            aVertices:{
                data:this.vertexBuffer,
                size:4
            }
        })
        this.texture.use(0)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0,this.vertexBuffer.length/4)
    }

    reset() {
        this.timer = 0
        this.percent = 0
        AnimationUtil.cancelTick(this.ticker)
        this.ticker = AnimationUtil.tick((delta: any) => {
            if(this.props.duration<=0)return
            this.percent = this.timer / this.props.duration
            this.timer += delta
            this.timer = this.timer % this.props.duration
            this.updateSelf()
        })
    }
}
