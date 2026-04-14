let vsSource = `
    precision highp float;

    attribute vec2 aVertexPosition;
    varying vec2 uv;
    void main() {
	    gl_Position=vec4(aVertexPosition.x*2.0-1.0,-aVertexPosition.y*2.0+1.0, 0, 1);
        uv=vec2(aVertexPosition.x,1.0-aVertexPosition.y);
	}
`

let fsSource = `
    precision highp float;

    uniform sampler2D uTexture;
    varying vec2 uv;

    void main() {
        gl_FragColor=texture2D(uTexture,uv);
    }
`



export default {vsSource, fsSource}
