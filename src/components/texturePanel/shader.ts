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
    uniform float uPercent;
    uniform sampler2D uColorTexture;
    uniform float uOpacity;
    uniform float uBlur;

    vec2 rotate(vec2 p, float theta) {
        return vec2(p.x * cos(theta) - p.y * sin(theta),p.x * sin(theta) + p.y * cos(theta));
    }

    const float PI2=3.1415926*2.;

    void main() {
        vec2 p=0.5-vUv;
        float radius=length(p) ;
        vec2 n=rotate(vUv-0.5,uPercent*PI2)+0.5;
        gl_FragColor=texture2D(uColorTexture,n);
        gl_FragColor.rgb*=gl_FragColor.a*smoothstep(0.5,0.49,radius);
        gl_FragColor*=uOpacity*smoothstep(0.5,0.5-(uBlur/2.)*0.4999999,radius);
    }
`



export default {vsSource, fsSource}
