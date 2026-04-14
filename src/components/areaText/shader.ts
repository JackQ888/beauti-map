let vsSource = `
    precision highp float;

    attribute vec2 aVertices;
    varying vec2 vUv;
    void main() {
	    gl_Position=vec4(aVertices.x*2.-1.,aVertices.y*2.-1.,0.,1.);
	    vUv=aVertices.xy;
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
