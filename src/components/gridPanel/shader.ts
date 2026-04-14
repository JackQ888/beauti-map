let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    uniform mat4 uMatrix;
    varying vec2 vUv;
    void main() {
	    gl_Position=uMatrix*vec4(aVertices.xy,0.,1.);
	    vUv=aVertices.zw;
	}
`

let fsSource = `
    precision highp float;
    varying vec2 vUv;
    uniform vec4 uColor;

    void main() {
        float distance=length(vUv-0.5);
        gl_FragColor=uColor*smoothstep(0.5,0.,distance);
    }
`



export default {vsSource, fsSource}
