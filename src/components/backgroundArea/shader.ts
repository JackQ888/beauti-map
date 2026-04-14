let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    uniform mat4 uMatrix;
    uniform float uHeight;
    varying vec2 vUv;
    void main() {
	    gl_Position=uMatrix*vec4(aVertices.x,aVertices.y,uHeight,1.);
	    vUv=aVertices.zw;
	}
`

let fsSource = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uUvOffset;
    uniform vec4 uColor;
    uniform vec2 uColorType;
    uniform vec3 uImageUvA;
    uniform sampler2D uColorTexture;
    uniform sampler2D uImageTexture;

     vec4 blend(vec4 color,vec4 color1){
            float a=1.0-color1.a;
            return color*a+color1;
        }

    void main() {
        gl_FragColor=uColorType.x==1.?texture2D(uColorTexture,vUv):uColor;
        if(uColorType.y==1.){
            gl_FragColor=blend(gl_FragColor,texture2D(uImageTexture,mod((vUv+uUvOffset)*uImageUvA.xy,1.))*uImageUvA.z);
        }
    }
`



export default {vsSource, fsSource}