export default {
    vsSource: `
        precision highp float;

        attribute vec2 aVertexPosition;
        varying vec2 vUv;

        void main() {
            gl_Position=vec4(aVertexPosition.x*2.-1.,aVertexPosition.y*2.-1., 0, 1);
            vUv=aVertexPosition;
        }
    `, fsSource: `
        precision highp float;

        varying vec2 vUv;
        uniform vec2 uDirection;
        uniform sampler2D uTexture;

        vec4 blur(sampler2D image, vec2 uv,vec2 direction) {
          vec4 color = vec4(0.0,0.0,0.0,0.0);
          vec2 off1 = vec2(1.3846153846) * direction;
          vec2 off2 = vec2(3.2307692308) * direction;

          vec4 c1=texture2D(image, uv);
          vec4 c2=texture2D(image, uv + off1);
          vec4 c3=texture2D(image, uv - off1);
          vec4 c4=texture2D(image, uv + off2);
          vec4 c5=texture2D(image, uv - off2);

          color += c1*0.2270270270;
          color += c2*0.3162162162;
          color += c3*0.3162162162;
          color += c4*0.0702702703;
          color += c5*0.0702702703;
          return color;
        }

        void main() {
            gl_FragColor=blur(uTexture, vUv,uDirection.xy);
        }
    `
}
