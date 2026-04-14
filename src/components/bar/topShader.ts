let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    attribute vec4 aVerticesColor;

    uniform mat4 uMatrix;
    uniform float uHeight;
    varying float vRadius;
    varying vec4 vColor;
    void main() {
	    gl_Position=uMatrix*vec4(aVertices.x,aVertices.y,aVertices.z+uHeight,1.);
	    vRadius=aVertices.w;
	    vColor=aVerticesColor;
	}
`

let fsSource = `
    precision highp float;

    varying float vRadius;
    varying vec4 vColor;
    uniform vec4 uLight;

    void main() {
        gl_FragColor=vColor;
        gl_FragColor.rgb*=1.2;
        gl_FragColor.rgb+=vec3(0.05);
    }
`



export default {vsSource, fsSource}
