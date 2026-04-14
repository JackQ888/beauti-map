let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    attribute vec4 aVerticesColor;
    uniform mat4 uMatrix;
    uniform float uHeight;
    varying vec2 vUv;
    varying vec4 vColor;


    void main() {
	    gl_Position=uMatrix*vec4(aVertices.xy,uHeight,1.);
	    vColor=aVerticesColor;
	    vUv=aVertices.zw;
	}
`

let fsSource = `
    precision highp float;
    uniform float uNumber;
    uniform float uPercent;
    varying vec2 vUv;
    varying vec4 vColor;

    float inRange(float s,float e,float x){
        return smoothstep(e+0.1,e,x)*smoothstep(s,e,x);
    }

    void main() {
        float distance=length(vUv-0.5)*2.;
        float p=smoothstep(0.,1.,mod((distance-uPercent)*uNumber,1.0));
        gl_FragColor=vColor*(0.1+inRange(0.,1.-distance,p)*0.8)*smoothstep(1.,0.3,distance);
    }
`



export default {vsSource, fsSource}
