let vsSource = `
    precision highp float;

    uniform mat4 uMatrix;	//投影矩阵
    uniform float uHeight;	//投影矩阵
    attribute vec4 aVertexPosition;  //点
    varying float alpha;

    void main() {
        gl_Position=uMatrix*vec4(aVertexPosition.xy,uHeight,1.0);
        gl_PointSize=aVertexPosition.z;
        alpha=aVertexPosition.w;
	}
`

let fsSource = `
    precision highp float;
    uniform float uPitch;
    varying float alpha;

    void main() {
        float d=length((gl_PointCoord.xy-vec2(0.5))/vec2(1.,uPitch));
        gl_FragColor=vec4(alpha)*smoothstep(0.5,0.01,d);
    }
`



export default {vsSource, fsSource}
