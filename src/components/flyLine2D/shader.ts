let vsSource = `
    precision highp float;

    uniform mat4 uMatrix;
    uniform float uHeight;

    attribute vec4 aVertices;
    attribute vec4 aLineColor;
    attribute vec4 aLightColor;

    varying float v;
    varying vec4 vLineColor;
    varying vec4 vLightColor;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 position=vec3(aVertices.xy,uHeight+aVertices.z);
	    gl_Position=uMatrix*vec4(position,1.);
	    v=aVertices.w;
	    vLineColor=aLineColor;
	    vLightColor=aLightColor;
	    vWorldPosition=position;
	}
`

let fsSource = `
    precision highp float;
    uniform float uLightNumber;
    uniform float uPercent;
    varying float v;
    varying vec4 vLineColor;
    varying vec4 vLightColor;

    float inRange(float s,float e,float x){
        return smoothstep(e+0.01,e,x)*smoothstep(s,e,x);
    }

    vec4 blend(vec4 color,vec4 color1){
        float a=1.0-color1.a;
        return color*a+color1;
    }

    void main() {
        float p=smoothstep(0.,1.,mod((v-uPercent)*uLightNumber,1.0));
        gl_FragColor=blend(vLineColor,vLightColor*inRange(0.,1.,p));
    }
`



export default {vsSource, fsSource}
