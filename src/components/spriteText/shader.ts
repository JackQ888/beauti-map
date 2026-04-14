let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    attribute vec4 aVerticesUv;
    attribute vec2 aVerticesOffset;
    uniform mat4 uMatrix;
    uniform float uHeight;
    uniform vec2 uSize;
    varying vec2 vScale;
    varying vec4 vUv;



    void main() {
      gl_PointSize=max(aVertices.z,aVertices.w);
	    gl_Position=uMatrix*vec4(aVertices.xy,uHeight,1.);
	    vec2 xy=(gl_Position.xy/gl_Position.w+1.)/2.;//获取屏幕坐标[0,1]
	    vec2 screenXy=xy*uSize;
	    vec2 floorScreenXy=floor(screenXy);
	    gl_Position.xy=((floorScreenXy/uSize*2.-1.)+aVerticesOffset*2./uSize)*gl_Position.w;
	    vScale=vec2(aVertices.z/gl_PointSize,-aVertices.w/gl_PointSize);
	    vUv=aVerticesUv;
	}
`

let fsSource = `
    precision highp float;
    uniform sampler2D uColorTexture;
    varying vec2 vScale;
    varying vec4 vUv;
    void main() {
        vec2 uv=(gl_PointCoord-0.5)/vScale+0.5;
        vec2 textUv=uv*vUv.zw+vUv.xy;
        textUv.y=1.-textUv.y;
        gl_FragColor=texture2D(uColorTexture,textUv)*step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
    }
`



export default {vsSource, fsSource}
