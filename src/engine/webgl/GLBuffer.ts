export default class GLBuffer {
  gl: WebGL2RenderingContext;
  bufferType: number;
  mode: number;
  buffer: WebGLBuffer | null;
  array: ArrayBufferView | null;
  length: number;

  constructor(gl: WebGL2RenderingContext, bufferType: number, mode: number | null, data: ArrayBufferView | null) {
    this.gl = gl;
    this.bufferType = bufferType;
    this.mode = mode || gl.STATIC_DRAW;
    this.buffer = null;
    this.array = null;
    this.length = 0;
    this.setData(data);
  }

  setData(array: ArrayBufferView | null): this {
    if (!array) {
      this.length = 0;
      return this;
    }
    if (!this.buffer) {
      this.buffer = this.gl.createBuffer();
    }
    this.gl.bindBuffer(this.bufferType, this.buffer);
    this.gl.bufferData(this.bufferType, array, this.mode);
    this.array = array;
    this.length = (array as any).length;
    return this;
  }

  use(): this {
    if (!this.buffer) throw new Error("GLBuffer has no data!");
    this.gl.bindBuffer(this.bufferType, this.buffer);
    return this;
  }

  destroy(): void {
    if (this.buffer) this.gl.deleteBuffer(this.buffer);
  }
}
