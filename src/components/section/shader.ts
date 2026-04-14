let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    uniform mat4 uMatrix;
    uniform float uHeight;
    uniform float uThickness;
    varying float normal;
    varying float v;
    void main() {
	    gl_Position=uMatrix*vec4(aVertices.xy,aVertices.z*uThickness+uHeight,1.);
	    normal=aVertices.w;
	    v=aVertices.z;
	}
`

let fsSource = `
    precision highp float;
    uniform sampler2D uColorTexture;
    uniform vec2 uParam;
    varying float normal;
    varying float v;
    void main() {
        gl_FragColor=texture2D(uColorTexture,vec2(0.5,abs(uParam.y-(1.-v))))*uParam.x*sqrt(smoothstep(-0.,uParam.y,v));
        gl_FragColor.rgb*=0.5+(1.-normal*0.5)*0.5;
    }
`



export default {vsSource, fsSource}
