
let vsSource = `
    precision highp float;

	attribute vec2 aVertexPosition;

	varying vec2 uv;

	void main() {
	    gl_Position=vec4(aVertexPosition.x*2.0-1.0,-aVertexPosition.y*2.0+1.0, 0, 1);
	    uv=vec2(aVertexPosition.x,1.0-aVertexPosition.y)*1.4-.2;
	    uv+=0.05;
	    uv*=0.9;
	}
`

let fsSource = `
    precision highp float;

    varying vec2 uv;

    uniform sampler2D uSampler;

    uniform vec3 uDirection;
    uniform vec4 uShadowColor;
    uniform float uClip;

    const float amount = 100.0;

    vec4 blend(vec4 color,vec4 color1){
        float a=1.0-color1.a;
        return color*a+color1;
    }

    float arrayFn() {
        vec2 x=vec2(1.0);
        return x[0];
    }

    void main() {
        vec2 dir=uDirection.xy - uv;
        vec2 direction = normalize(dir) * min(uDirection.z,length(dir)/amount) ;
        float self=texture2D( uSampler,uv).a;
        float total = 0.0;
        for( int i = 1; i <= int( amount); i++ )
        {
            float result = texture2D( uSampler,uv+direction*float(i)).a*(amount-float(i))/amount;
            total += result;
        }
        total /= amount/1.5;
        gl_FragColor=uShadowColor*smoothstep(0.,1.,sqrt(total))*step(self,uClip);
    }
`



export default {vsSource, fsSource}
