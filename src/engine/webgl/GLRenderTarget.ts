import GLTexture from "./GLTexture";
import type { GLTextureOptions } from "./GLTexture";

export default class GLRenderTarget {
  gl: WebGL2RenderingContext;
  width: number;
  height: number;
  textureOptions: GLTextureOptions | undefined;
  frameBuffer: WebGLFramebuffer | null;
  texture: GLTexture | null;
  beforeFrameBuffer: WebGLFramebuffer | null;
  beforeViewPort: Int32Array | Float32Array | null;

  constructor(gl: WebGL2RenderingContext, width: number, height: number, textureOptions?: GLTextureOptions) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.textureOptions = textureOptions;
    this.frameBuffer = null;
    this.texture = null;
    this.beforeFrameBuffer = null;
    this.beforeViewPort = null;
  }

  use(): void {
    let beforeFrameBuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
    if (this.frameBuffer !== null && beforeFrameBuffer === this.frameBuffer) return;
    this.beforeFrameBuffer = beforeFrameBuffer;
    this.beforeViewPort = this.gl.getParameter(this.gl.VIEWPORT);
    if (!this.frameBuffer) {
      this.frameBuffer = this.gl.createFramebuffer();
      this.texture = new GLTexture(this.gl, [this.width, this.height], this.textureOptions);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          this.texture.get(), 0);
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);

    if (this.texture && this.texture.needUpdate) {
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          this.texture.get(), 0);
    }

    this.gl.viewport(0, 0, this.width, this.height);
  }

  pop(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.beforeFrameBuffer);
    if (this.beforeViewPort) {
      this.gl.viewport(this.beforeViewPort[0], this.beforeViewPort[1], this.beforeViewPort[2], this.beforeViewPort[3]);
    }
  }

  getTexture(): GLTexture | null {
    if (!this.texture) this.use();
    return this.texture;
  }

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.texture) {
      this.texture.setSize(width, height);
    }
  }

  destroy(): void {
    if (this.frameBuffer) this.gl.deleteFramebuffer(this.frameBuffer);
    if (this.texture) this.texture.destroy();
  }
}
