export interface GLTextureOptions {
  flipY?: boolean;
  premultiplyAlpha?: boolean;
  internalformat?: number;
  format?: number;
  type?: number;
  filter?: number;
}

export default class GLTexture {
  gl: WebGL2RenderingContext;
  texture: WebGLTexture | null;
  width: number;
  height: number;
  data: HTMLCanvasElement | HTMLImageElement | null;
  options: Required<GLTextureOptions>;
  needUpdate: boolean;
  dataUrl: string | undefined;
  complete: boolean;
  dataPromise: Promise<void> | undefined;

  constructor(gl: WebGL2RenderingContext, data: number[] | HTMLCanvasElement | HTMLImageElement | null, options?: GLTextureOptions) {
    this.gl = gl;
    this.texture = null;
    this.width = 0;
    this.height = 0;
    this.data = null;
    this.complete = false;
    this.dataUrl = undefined;
    this.dataPromise = undefined;
    this.setData(data);

    this.options = Object.assign({
      flipY: false,
      premultiplyAlpha: false,
      internalformat: WebGL2RenderingContext.RGBA,
      format: WebGL2RenderingContext.RGBA,
      type: WebGL2RenderingContext.UNSIGNED_BYTE,
      filter: WebGL2RenderingContext.LINEAR,
    }, options);
    this.needUpdate = true;
  }

  setSize(width: number, height: number): void {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.needUpdate = true;
    }
  }

  setData(data: number[] | HTMLCanvasElement | HTMLImageElement | null): this {
    if (data instanceof Array) {
      this.width = data[0];
      this.height = data[1];
      this.data = null;
    } else if (data instanceof HTMLCanvasElement) {
      this.width = data.width;
      this.height = data.height;
      this.data = data;
    } else if (data instanceof HTMLImageElement) {
      this.width = data.naturalWidth;
      this.height = data.naturalHeight;
      this.data = data;
    } else {
      this.width = 0;
      this.height = 0;
      this.data = null;
    }
    this.needUpdate = true;
    return this;
  }

  use(active: number = 0): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + active);
    const gl = this.gl;
    if (!this.texture) {
      this.needUpdate = false;
      this.texture = gl.createTexture();
      this.refreshContent();
    } else if (this.needUpdate) {
      this.needUpdate = false;
      this.refreshContent();
    } else {
      this.gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
  }

  refreshContent(): void {
    let gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.options.flipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
        this.options.premultiplyAlpha);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.options.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.options.filter);
    if (this.data) {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.options.internalformat, this.options.format,
          this.options.type, this.data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.options.internalformat, this.width,
          this.height, 0, this.options.format, this.options.type, null);
    }
  }

  setDataUrl(url: string): Promise<void> | undefined {
    if (this.dataUrl === url) return this.dataPromise;
    this.dataUrl = url;
    this.complete = false;
    this.dataPromise = new Promise<void>((resolve, reject) => {
      let image = new Image();
      if (url && !url.startsWith("data:") && !url.startsWith("blob:")) {
        if (url.indexOf("?") === -1) {
          url += "?_tm_=" + Date.now();
        } else {
          url += "&_tm_=" + Date.now();
        }
      }
      image.src = url;
      image.setAttribute('crossOrigin', '');
      image.onload = () => {
        this.complete = true;
        this.setData(image);
        resolve();
      };
      image.onerror = reject;
    });
    return this.dataPromise;
  }

  get(): WebGLTexture | null {
    this.use();
    return this.texture;
  }

  destroy(): void {
    if (this.texture) this.gl.deleteTexture(this.texture);
  }
}
