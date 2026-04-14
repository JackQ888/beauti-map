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
    uniform vec4 uCircleColor;

    float rangeStep(float s,float e,float r,float v){
        return smoothstep(s-r,s,v)*smoothstep(e+r,e,v);
    }

    vec4 multiplyColor(vec4 color,float a){
        return vec4(color.rgb,color.a*a);
    }

    vec2 rotate(vec2 p, float theta) {
        return vec2(p.x * cos(theta) - p.y * sin(theta),p.x * sin(theta) + p.y * cos(theta));
    }

    vec4 blend(vec4 color,vec4 color1){
        float a=1.0-color1.a;
        return color*a+color1;
    }

    const float PI2=3.1415926*2.;

    void main() {
        vec2 p=0.5-vUv;
        float radius=length(p) ;
        vec2 n=rotate(p/radius,uPercent*PI2);
        float s=0.49;;
        float width=0.0025;
        float e=s+width;
        float range=0.001;
        vec4 lightColor=uCircleColor*1.1;

        vec4 circleColor=blend(multiplyColor(uCircleColor,rangeStep(s,e,range,radius)),multiplyColor(uCircleColor,rangeStep(s,e,range*10.,radius)*0.5));

        gl_FragColor=(circleColor+lightColor*pow(smoothstep(0.3,0.5,radius)*step(radius,s)*0.8,5.));

        gl_FragColor*=smoothstep(1.,0.,abs(n.y));
    }
`



export default {vsSource, fsSource}
