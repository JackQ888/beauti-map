let vsSource = `
    precision highp float;

    attribute vec3 aVertices;
    attribute vec2 aVerticesUv;
    attribute vec4 aVerticesColor;
    uniform mat4 uMatrix;
    uniform float uHeight;
    varying vec2 vUv;
    varying vec4 vColor;
    void main() {
	    gl_Position=uMatrix*vec4(aVertices.x,aVertices.y,aVertices.z+uHeight,1.);
	    vUv=aVerticesUv;
	    vColor=aVerticesColor;
	}
`

let fsSource = `
    precision highp float;

    varying vec4 vColor;
    varying vec2 vUv;
    uniform vec4 uColor;
    uniform float uDirection;
    const float PI2=3.1415926*2.;
    void main() {
        gl_FragColor=vColor;
        gl_FragColor.rgb*=1.+cos(vUv.x*PI2-uDirection)*0.3;
    }
`



export default {vsSource, fsSource}
