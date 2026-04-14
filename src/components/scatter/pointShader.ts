let vsSource = `
    precision highp float;

    uniform mat4 uMatrix;	//投影矩阵
    uniform float uHeight;	//投影矩阵
    attribute vec4 aVertexPosition;  //点
    attribute vec4 aVertexColor;  //颜色
    varying vec4 color;
    varying float vBreath;
    void main() {
        gl_PointSize=aVertexPosition.z;
        vBreath=aVertexPosition.w;
        gl_Position=uMatrix*vec4(aVertexPosition.xy,uHeight,1.0);
        color=aVertexColor;
	}
`

let fsSource = `
    precision highp float;
    uniform float uBlur;
    uniform float uTime;
    uniform float uPitch;
    varying vec4 color;
    varying float vBreath;

    void main() {
        float d=length((gl_PointCoord.xy-vec2(0.5))/vec2(1.,uPitch));
        gl_FragColor=color*smoothstep(0.5,uBlur,d);
        gl_FragColor*=0.5+max(step(vBreath,0.00001),smoothstep(0.,0.5,abs((mod(uTime,vBreath)/vBreath)-0.5)))*0.5;
    }
`



export default {vsSource, fsSource}
