export default class GLShader {
  gl: WebGL2RenderingContext;
  shader: WebGLShader | null;

  constructor(gl: WebGL2RenderingContext, type: number, source: string) {
    this.gl = gl;
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    this.shader = shader;
  }

  destroy(): void {
    this.gl.deleteShader(this.shader);
  }
}
