let vsSource = `
    precision highp float;

    attribute vec3 aVertices;
    uniform mat4 uMatrix;
    uniform vec2 uView;
    uniform float uHeight;
    void main() {
        gl_PointSize=aVertices.z;
	    gl_Position=uMatrix*vec4(aVertices.xy,uHeight, 1);
	    gl_Position.xy+=uView*aVertices.z*gl_Position.w;
	}
`

let fsSource = `
    precision highp float;

    uniform sampler2D uTexture;
    uniform vec2 uRatio;
    void main() {
        vec2 uv=(gl_PointCoord-0.5)/uRatio+0.5;
        gl_FragColor=texture2D(uTexture,uv)*step(0.,min(uv.x,uv.y))*step(max(uv.x,uv.y),1.);
    }
`



export default {vsSource, fsSource}
