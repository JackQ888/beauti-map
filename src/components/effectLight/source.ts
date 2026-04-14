let vsSource = `
    precision highp float;

    attribute vec4 aVertices;
    uniform mat4 uMatrix;
    uniform float uHeight;
    varying float percent;
    varying float ratio;

    void main() {
	    gl_Position=uMatrix*vec4(aVertices.xy,uHeight,1.);
        percent=aVertices.z;
        ratio=aVertices.w;
	}
`

let fsSource = `
    precision highp float;
    varying float percent;
    varying float ratio;

    uniform float uPercent;
    uniform float uNumber;
    uniform float uLength;
    uniform vec4 uColor;

    float inRange(float s,float e,float x){
        return step(x,e)*smoothstep(s,e,x)*smoothstep(e,e-uLength*0.1,x);
    }



    void main() {
        float linePercent=mod(percent*uNumber-uPercent,1.0);
        float alpha1=step(abs(ratio-0.5),0.05);
        float alpha2=smoothstep(0.5,0.,abs(ratio-0.5));
        float a=inRange(0.0,uLength,linePercent)*(alpha1*0.8+alpha2*0.6)*smoothstep(0.8,0.,abs(uPercent-0.5))*2.;
        gl_FragColor=uColor*a;
    }
`



export default {vsSource, fsSource}
