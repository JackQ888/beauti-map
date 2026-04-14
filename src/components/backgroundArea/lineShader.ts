let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    uniform mat4 uMatrix;
    uniform float uHeight;
    varying float vShow;
    void main() {
	    gl_Position=uMatrix*vec4(aVertices.x,aVertices.y,uHeight,1.);
	    vShow=aVertices.z;
	}
`

let fsSource = `
    precision highp float;
    varying float vShow;
    uniform vec4 uColor;
    void main() {
        gl_FragColor=uColor*vShow;
    }
`



export default {vsSource, fsSource}
