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
    uniform sampler2D uColor;
    uniform sampler2D uClip;
    uniform vec2 uParam;
    varying vec2 uv;

    void main() {
        float a=texture2D(uTexture,uv).a;
        gl_FragColor=texture2D(uColor,vec2(a,0.5))*smoothstep(0.,uParam.x,a);
        gl_FragColor.a*=smoothstep(0.0,1.,texture2D(uClip,uv).a);
    }
`



export default {vsSource, fsSource}
