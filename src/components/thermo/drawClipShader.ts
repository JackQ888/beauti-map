let vsSource = `
    precision highp float;

    attribute vec4 aVertexPosition;
    uniform mat4 uMatrix;
    uniform float uHeight;
    varying vec2 vUv;
    void main() {
	    gl_Position=uMatrix*vec4(aVertexPosition.xy,uHeight,1.);
	    vUv=aVertexPosition.zw;
	}
`

let fsSource = `
    precision highp float;
    uniform sampler2D uColorTexture;
    varying vec2 vUv;
    void main() {
        gl_FragColor=texture2D(uColorTexture,vUv);
    }
`



export default {vsSource, fsSource}
