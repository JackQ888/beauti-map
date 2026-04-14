let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    uniform mat4 uMatrix;
    varying vec2 vUv;
    varying float vY;
    void main() {
      gl_PointSize=6.;
	    gl_Position=uMatrix*vec4(aVertices.xy,0.,1.);
	    vUv=aVertices.zw;
	    vY=gl_Position.y/gl_Position.w;
	}
`

let fsSource = `
    precision highp float;
    uniform vec4 uColor;
    varying vec2 vUv;
    varying float vY;
    uniform float uPercent;

    void main() {
        float distance=length(vUv-0.5);
        gl_FragColor=uColor*smoothstep(0.5,0.2,length(gl_PointCoord-0.5))*smoothstep(0.5,0.,distance)*smoothstep(3.,-1.,vY);
    }
`

export default {vsSource, fsSource}
